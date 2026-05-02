import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const intentSchema = z.object({
  intentType: z.literal("viator_creator_search"),
  creatorGoal: z.string(),
  destination: z.object({
    city: z.string(),
    country: z.string(),
    destinationId: z.number().nullable(),
  }),
  keywords: z.array(z.string()),
  categories: z.array(z.string()),
  dateWindow: z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
  }),
  budget: z.object({
    currency: z.enum(["EUR", "USD"]),
    min: z.number().nullable(),
    max: z.number().nullable(),
  }),
  contentAngle: z.string().nullable(),
});

function destinationIdFor(city: string) {
  return city.toLowerCase().trim() === "lisbon" ? 538 : null;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "OPENROUTER_API_KEY not configured", code: "MISSING_API_KEY" },
        { status: 500 },
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const openrouter = createOpenRouter({ apiKey });

    const { object } = await generateObject({
      model: openrouter("openai/gpt-4o-mini"),
      schema: intentSchema,
      system: `Extract a compact Viator creator search intent as JSON only.
Today's date is ${today}.
Use intentType "viator_creator_search".
For Lisbon, Portugal, set destinationId to 538. If the city is Lisbon and the ID is unknown, still use 538.
Keep keywords short and useful for Viator products/search.
Map creator ideas into categories like Spa & Wellness, Food & Drink, Tours, Outdoor Activities, Cruises, Culture, or Day Trips.
Use EUR for European destinations unless USD is clearly requested.
Use null for dates and budget values that are not stated.
Do not include reasoning.`,
      prompt: message,
    });

    const destinationId =
      object.destination.destinationId ?? destinationIdFor(object.destination.city);

    const intent = {
      ...object,
      destination: {
        ...object.destination,
        destinationId,
      },
    };

    const searchTerm = [
      ...intent.keywords,
      intent.destination.city,
      ...intent.categories,
    ]
      .filter(Boolean)
      .join(" ");

    const productFiltering: Record<string, unknown> = {};
    if (intent.budget.min !== null) productFiltering.lowestPrice = intent.budget.min;
    if (intent.budget.max !== null) productFiltering.highestPrice = intent.budget.max;
    if (intent.dateWindow.startDate) productFiltering.startDate = intent.dateWindow.startDate;
    if (intent.dateWindow.endDate) productFiltering.endDate = intent.dateWindow.endDate;

    const viatorRequest: Record<string, unknown> = {
      searchTerm,
      searchTypes: [
        { searchType: "PRODUCTS", pagination: { start: 1, count: 12 } },
        { searchType: "ATTRACTIONS", pagination: { start: 1, count: 6 } },
        { searchType: "DESTINATIONS", pagination: { start: 1, count: 6 } },
      ],
      productSorting: {
        sort: "REVIEW_AVG_RATING",
        order: "DESCENDING",
      },
      currency: intent.budget.currency,
    };

    if (Object.keys(productFiltering).length > 0) {
      viatorRequest.productFiltering = productFiltering;
    }

    return Response.json({
      intent,
      filters: {
        destinationId,
        destination: `${intent.destination.city}, ${intent.destination.country}`,
        keywords: intent.keywords,
        categories: intent.categories,
        currency: intent.budget.currency,
        budget: intent.budget,
        dateWindow: intent.dateWindow,
      },
      viatorRequest,
      searchSummary: [
        "Destination detected",
        "Keywords extracted",
        "Viator request prepared",
      ],
    });
  } catch (error) {
    console.error("Agent API error:", error);
    return Response.json(
      { error: "Failed to extract creator search intent", details: String(error) },
      { status: 500 },
    );
  }
}
