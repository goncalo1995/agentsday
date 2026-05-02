import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

const querySchema = z.object({
  query: z.string().describe("The search term to send to providers"),
  destination: z.string().describe("The extracted destination, if any").optional(),
  maxPrice: z.number().nullable().optional(),
  keywords: z.array(z.string()).describe("Key topics or tags like 'budget', 'luxury', 'couples', etc."),
  dayNumber: z.number().describe("The day number if this is part of an itinerary").optional(),
  destinationDayLabel: z.string().describe("A label like 'Day 1: Madrid'").optional(),
});

const intentSchema = z.object({
  type: z.enum(["simple", "itinerary"]).describe("Whether this is a simple query/list or a multi-day itinerary"),
  queries: z.array(querySchema).describe("The actual queries to execute against providers"),
  suggestedCampaignTitle: z.string().describe("A catchy title for the content bundle"),
  suggestedNiche: z.string().describe("The target niche, e.g., 'Budget Backpacking'"),
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  const fallback = {
    type: "simple" as const,
    queries: [{ query: prompt, keywords: [] }],
    suggestedCampaignTitle: "My Campaign",
    suggestedNiche: "Travel",
  };

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(fallback);
  }

  try {
    const { object } = await generateObject({
      model: openrouter("google/gemini-2.0-flash-001"),
      schema: intentSchema,
      prompt: `You are an expert travel campaign assistant.
The user wants to create content based on the following prompt: "${prompt}"

Your goal is to extract the user's intent to power a provider search (like Viator or Amazon).
If the user's prompt implies a single idea or a list of items (e.g., "best espresso machines", "top 3 snorkeling spots in Bali"), output type "simple" and provide one or more queries.
If the prompt implies a multi-day or multi-destination trip (e.g., "a week in Spain for a couple"), output type "itinerary" and break it down into an array of queries for each day or destination.

Keep queries simple and keyword-focused.
`,
      temperature: 0.2,
    });

    return Response.json(object);
  } catch (e) {
    console.error("[ai/extract-intent] failed:", e);
    return Response.json(fallback);
  }
}
