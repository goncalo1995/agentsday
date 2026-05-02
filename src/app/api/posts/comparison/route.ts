import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

type ProductLike = {
  label?: string;
  productTitle: string;
  price?: number;
  currency?: string;
  rating?: number;
  shortUrl?: string;
};

export async function POST(req: Request) {
  const { title, products } = (await req.json()) as { title?: string; products?: ProductLike[] };
  const list = products ?? [];

  if (list.length < 2) {
    return Response.json({ error: "Need at least two products" }, { status: 400 });
  }

  const best = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
  const budget = [...list].sort((a, b) => (a.price ?? Number.MAX_VALUE) - (b.price ?? Number.MAX_VALUE))[0];
  const fallback = `Best vs Budget for ${title ?? "this post"}\n\nBest rated: ${best.productTitle} (${best.rating?.toFixed(1) ?? "N/A"} stars)\n${best.shortUrl ?? ""}\n\nBudget pick: ${budget.productTitle} (${budget.currency ?? "USD"} ${budget.price?.toFixed(0) ?? "N/A"})\n${budget.shortUrl ?? ""}`;

  let copy = fallback;
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const result = await generateText({
        model: openrouter("google/gemini-2.0-flash-001"),
        temperature: 0.4,
        maxRetries: 1,
        prompt: `Write concise influencer-ready copy for a Best vs Budget travel product comparison.
Keep it under 120 words. Include both links exactly as provided.

Post title: ${title ?? "Untitled"}
Best rated: ${JSON.stringify(best)}
Budget pick: ${JSON.stringify(budget)}`,
      });
      copy = result.text.trim() || fallback;
    } catch {
      copy = fallback;
    }
  }

  return Response.json({ best, budget, copy });
}
