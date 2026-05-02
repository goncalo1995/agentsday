import { id } from "@instantdb/admin";
import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { adminDb } from "@/lib/instant-admin";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

const contentSchema = z.object({
  script: z.string(),
  caption: z.string(),
  story_text: z.string(),
  image_prompts: z.array(z.string()).length(3),
});

const PLATFORMS = new Set(["instagram", "tiktok", "youtube"]);

export async function POST(req: Request) {
  const { userId, campaignId, platform, productUrl, product } = await req.json();

  if (!adminDb) {
    return Response.json({ error: "Instant admin credentials are not configured." }, { status: 500 });
  }
  if (!userId || !campaignId || !PLATFORMS.has(platform)) {
    return Response.json({ error: "Missing campaignId, userId, or platform" }, { status: 400 });
  }

  const campaigns = await adminDb.query({
    campaigns: {
      $: { where: { id: campaignId, userId }, limit: 1 },
    },
  });
  const campaign = campaigns.campaigns[0];
  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  const generated = await generateCampaignContent({
    campaign,
    platform,
    productUrl,
    product,
  });
  const generatedAt = new Date().toISOString();
  const rows: { contentType: "script" | "caption" | "story_text" | "image_prompt"; contentText: string }[] = [
    { contentType: "script", contentText: generated.script },
    { contentType: "caption", contentText: generated.caption },
    { contentType: "story_text", contentText: generated.story_text },
    ...generated.image_prompts.map((prompt: string) => ({ contentType: "image_prompt" as const, contentText: prompt })),
  ];
  const db = adminDb;

  await db.transact(
    rows.map((row) =>
      db.tx.campaign_content[id()].update({
        userId,
        campaignId,
        platform,
        contentType: row.contentType,
        contentText: row.contentText,
        sourceProductUrl: productUrl ?? product?.productUrl ?? "",
        sourceProductTitle: product?.productTitle ?? product?.title ?? "",
        generatedAt,
      }),
    ),
  );

  return Response.json({ ok: true, generated });
}

async function generateCampaignContent({
  campaign,
  platform,
  productUrl,
  product,
}: {
  campaign: Record<string, unknown>;
  platform: string;
  productUrl?: string;
  product?: Record<string, unknown>;
}) {
  const fallback = {
    script: `Hook: Planning a ${campaign.niche} trip? Here is the deal I would start with.\nBody: Show the experience, why it is worth saving, and who it is best for.\nCTA: Tap the link and compare dates before it sells out.`,
    caption: `${campaign.title}\n\nA quick pick for ${campaign.niche}. Save this for your next trip and check the link for current availability.\n\n#travelcreator #affiliatefinds #traveltips`,
    story_text: "Get the deal",
    image_prompts: [
      `Vertical creator photo showing ${campaign.niche} travel, bright natural light, social media ready`,
      `Instagram carousel cover for ${campaign.title}, clean text space, destination-inspired colors`,
      `POV travel reel scene featuring ${product?.productTitle ?? product?.title ?? "the experience"}, authentic influencer style`,
    ],
  };

  if (!process.env.OPENROUTER_API_KEY) return fallback;

  try {
    const { output } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      output: Output.object({ schema: contentSchema }),
      temperature: 0.45,
      maxRetries: 1,
      prompt: `You are éFacil's influencer campaign content assistant.
Return JSON only with script, caption, story_text, and exactly 3 image_prompts.
The script should be 30-60 seconds with hook, body, CTA.
The caption should include line breaks and hashtags.
The story_text must be max 30 characters.
Do not generate actual images.

Campaign:
${JSON.stringify(campaign)}

Platform:
${platform}

Product URL:
${productUrl ?? ""}

Product context:
${JSON.stringify(product ?? {})}`,
    });
    return output;
  } catch {
    return fallback;
  }
}
