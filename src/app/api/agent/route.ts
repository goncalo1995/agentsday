import { generateObject, generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { resolveDestinationId } from "@/lib/destinations";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

const intentSchema = z.object({
  destination: z.string().describe("City or region name"),
  keywords: z.array(z.string()).describe("Search keywords for Viator"),
  searchTerm: z.string().describe("Concise search query for Viator freetext search"),
  summary: z.string().describe("One-sentence summary of what the creator is looking for"),
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  // If no OpenRouter key, fall back to simple keyword extraction
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(fallbackExtract(prompt));
  }

  try {
    const { output } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      // schema: intentSchema,
      output: Output.array({ element: intentSchema }),
      temperature: 0.1,
      maxRetries: 1,
      prompt: `You are a travel search assistant for content creators.
Extract the destination, search keywords, and a short search term from this creator's request.
Be concise. Return only the structured data.

Creator request: "${prompt}"`,
    });

    if (output.length !== 1) {
      console.error(`[agent] AI extraction failed, expected 1 item, got ${output.length}`);
      return Response.json(fallbackExtract(prompt));
    }

    const data = output[0];

    const destinationId = resolveDestinationId(data.destination) ?? "";

    return Response.json({
      destination: data.destination,
      destinationId,
      keywords: data.keywords,
      searchTerm: data.searchTerm,
      summary: data.summary,
    });
  } catch (e) {
    console.error("[agent] AI extraction failed, using fallback:", e);
    return Response.json(fallbackExtract(prompt));
  }
}

/** Simple fallback when no AI is available */
function fallbackExtract(prompt: string) {
  const words = prompt.toLowerCase().split(/\s+/);
  const stopWords = new Set(["find", "cool", "for", "a", "an", "the", "in", "and", "my", "post", "me", "i", "need", "want", "show", "get", "best", "top", "some"]);
  const keywords = words.filter((w) => w.length > 2 && !stopWords.has(w));

  let destination = "";
  let destinationId = "";
  // Try to find a known destination in the prompt
  const { DESTINATIONS } = require("@/lib/destinations");
  for (const [name, id] of Object.entries(DESTINATIONS)) {
    if (prompt.toLowerCase().includes(name)) {
      destination = name.charAt(0).toUpperCase() + name.slice(1);
      destinationId = id as string;
      break;
    }
  }

  return {
    destination: destination || "Unknown",
    destinationId,
    keywords: keywords.slice(0, 5),
    searchTerm: keywords.join(" "),
    summary: `Searching for ${keywords.slice(0, 3).join(", ")}${destination ? ` in ${destination}` : ""}`,
  };
}
