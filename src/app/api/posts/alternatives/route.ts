import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { resolveDestinationId } from "@/lib/destinations";
import type { ViatorProduct } from "@/lib/types";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

const VIATOR_BASE =
  process.env.VIATOR_API_BASE_URL ??
  process.env.VIATOR_BASE_URL ??
  "https://api.sandbox.viator.com/partner";

const VIATOR_KEY = process.env.VIATOR_API_KEY ?? "";

const intentSchema = z.object({
  destination: z.string().optional(),
  searchTerm: z.string(),
  keywords: z.array(z.string()),
  maxPrice: z.number().optional(),
});

export async function POST(req: Request) {
  const { seedProduct, context } = await req.json();

  if (!seedProduct?.title) {
    return Response.json({ alternatives: [], error: "Missing seed product" }, { status: 400 });
  }

  const intent = await getIntent(seedProduct, context);
  const destinationId = intent.destination ? resolveDestinationId(intent.destination) : "";
  const products = await searchViator(intent.searchTerm, destinationId ?? "");
  const seedId = String(seedProduct.viatorProductId ?? seedProduct.productCode ?? "");

  const alternatives = products
    .filter((product) => product.productCode !== seedId)
    .filter((product) => !intent.maxPrice || !product.pricing?.summary?.fromPrice || product.pricing.summary.fromPrice <= intent.maxPrice)
    .slice(0, 2)
    .map((product) => ({ ...product, provider: "viator" }));

  return Response.json({ alternatives, intent });
}

async function getIntent(seedProduct: Record<string, unknown>, context?: string) {
  const fallback = {
    destination: String(seedProduct.destination ?? ""),
    searchTerm: `${seedProduct.productTitle ?? seedProduct.title ?? ""} ${context ?? ""}`.trim(),
    keywords: [String(seedProduct.productTitle ?? seedProduct.title ?? "")],
    maxPrice: typeof seedProduct.price === "number" ? seedProduct.price + 25 : undefined,
  };

  if (!process.env.OPENROUTER_API_KEY) return fallback;

  try {
    const { output } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      output: Output.object({ schema: intentSchema }),
      temperature: 0.2,
      maxRetries: 1,
      prompt: `Extract a Viator search intent for finding two similar but distinct travel products.
Prefer alternatives that differ by price, location, or duration.

Seed product:
${JSON.stringify(seedProduct)}

Creator context:
${context ?? ""}`,
    });
    return output;
  } catch {
    return fallback;
  }
}

async function searchViator(searchTerm: string, destinationId: string): Promise<ViatorProduct[]> {
  if (!VIATOR_KEY) return [];

  const body: Record<string, unknown> = {
    searchTerm,
    searchTypes: [{ searchType: "PRODUCTS", pagination: { start: 1, count: 10 } }],
    currency: "USD",
  };
  if (destinationId) body.productFiltering = { destination: destinationId };

  const res = await fetch(`${VIATOR_BASE}/search/freetext`, {
    method: "POST",
    headers: {
      "exp-api-key": VIATOR_KEY,
      Accept: "application/json;version=2.0",
      "Content-Type": "application/json;version=2.0",
      "Accept-Language": "en-US",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.products?.results ?? [];
}
