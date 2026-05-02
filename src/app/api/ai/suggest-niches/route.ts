import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { adminDb } from "@/lib/instant-admin";
import { isHumanUserAgent } from "@/lib/utils";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

const suggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      niche: z.string(),
      reason: z.string(),
      exampleProduct: z.string(),
    }),
  ).length(3),
});

export async function POST(req: Request) {
  const { userId } = await req.json();
  const performance = userId && adminDb ? await summarizePerformance(userId) : [];
  const suggestions = await suggestNiches(performance);
  return Response.json({ suggestions, performance });
}

async function summarizePerformance(userId: string) {
  const [posts, slots, clicks] = await Promise.all([
    adminDb!.query({ creator_posts: { $: { where: { userId }, order: { createdAt: "desc" } } } }),
    adminDb!.query({ post_slots: { $: { where: { userId }, order: { createdAt: "desc" } } } }),
    adminDb!.query({ click_logs: { $: { where: { userId }, order: { timestamp: "desc" } } } }),
  ]);

  const humanClicks = clicks.click_logs.filter((click) => isHumanUserAgent(click.userAgent));
  return slots.post_slots
    .map((slot) => {
      const post = posts.creator_posts.find((item) => item.id === slot.postId);
      const count = humanClicks.filter((click) => click.slotId === slot.id).length;
      return {
        title: post?.title ?? slot.productTitle,
        niche: slot.destination || slot.label,
        product: slot.productTitle,
        clicks: count,
      };
    })
    .filter((item) => item.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);
}

async function suggestNiches(performance: unknown[]) {
  const fallback = [
    {
      niche: "Budget island escapes",
      reason: "Clear price framing gives creators an easy hook and works well for saveable travel content.",
      exampleProduct: "Under-$50 snorkeling or boat tour",
    },
    {
      niche: "Couples micro-adventures",
      reason: "Romantic short experiences are easy to package for Reels and weekend planning.",
      exampleProduct: "Sunset sailing or food walk",
    },
    {
      niche: "Soft adventure for beginners",
      reason: "Approachable adventure content widens the audience beyond expert travelers.",
      exampleProduct: "Beginner surf lesson or guided hike",
    },
  ];

  if (!process.env.OPENROUTER_API_KEY) return fallback;

  try {
    const { output } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      output: Output.object({ schema: suggestionSchema }),
      temperature: 0.5,
      maxRetries: 1,
      prompt: `Suggest 3 profitable travel niches for an Instagram/TikTok creator in 2026.
Return JSON only with suggestions: [{ niche, reason, exampleProduct }].
If performance data is present, use it to explain what to double down on.

Performance data:
${JSON.stringify(performance)}`,
    });
    return output.suggestions;
  } catch {
    return fallback;
  }
}
