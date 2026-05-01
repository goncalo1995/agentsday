export const maxDuration = 30;

type CreatorIntent = {
  intentType: "viator_creator_search";
  creatorGoal: string;
  destination: {
    city: string;
    country: string;
    destinationId: number | null;
  };
  keywords: string[];
  categories: string[];
  dateWindow: {
    startDate: string | null;
    endDate: string | null;
  };
  budget: {
    currency: "EUR" | "USD";
    min: number | null;
    max: number | null;
  };
  contentAngle: string | null;
};

function destinationIdFor(city: string) {
  return city.toLowerCase().trim() === "lisbon" ? 538 : null;
}

function normalizeIntent(input: Partial<CreatorIntent>, message: string): CreatorIntent {
  const city = input.destination?.city || "Lisbon";
  const country = input.destination?.country || (city.toLowerCase() === "lisbon" ? "Portugal" : "");
  const destinationId = input.destination?.destinationId ?? destinationIdFor(city);

  return {
    intentType: "viator_creator_search",
    creatorGoal: input.creatorGoal || message,
    destination: {
      city,
      country,
      destinationId,
    },
    keywords: Array.isArray(input.keywords) ? input.keywords : ["spa", "wellness"],
    categories: Array.isArray(input.categories) ? input.categories : ["Spa & Wellness"],
    dateWindow: {
      startDate: input.dateWindow?.startDate ?? null,
      endDate: input.dateWindow?.endDate ?? null,
    },
    budget: {
      currency: input.budget?.currency === "USD" ? "USD" : "EUR",
      min: typeof input.budget?.min === "number" ? input.budget.min : null,
      max: typeof input.budget?.max === "number" ? input.budget.max : null,
    },
    contentAngle: input.contentAngle ?? null,
  };
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced ?? text.match(/\{[\s\S]*\}/)?.[0] ?? text;
  return JSON.parse(raw);
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
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Extract a compact Viator creator search intent as JSON only.
Today's date is ${today}.
Return exactly this shape:
{
  "intentType": "viator_creator_search",
  "creatorGoal": string,
  "destination": { "city": string, "country": string, "destinationId": number | null },
  "keywords": string[],
  "categories": string[],
  "dateWindow": { "startDate": string | null, "endDate": string | null },
  "budget": { "currency": "EUR" | "USD", "min": number | null, "max": number | null },
  "contentAngle": string | null
}
For Lisbon, Portugal, destinationId must be 538.
Keep keywords useful for Viator products/search.
Use null when dates or budget are not stated.
Do not include reasoning.`,
          },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      return Response.json(
        { error: "OpenRouter request failed", status: response.status },
        { status: response.status },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("OpenRouter returned an empty response");
    }

    const intent = normalizeIntent(extractJson(content), message);
    const destinationId = intent.destination.destinationId;
    const searchTerm = [
      ...intent.keywords,
      intent.destination.city,
      ...intent.categories,
    ]
      .filter(Boolean)
      .join(" ");

    const filtering: Record<string, unknown> = {
      destination: String(destinationId ?? ""),
    };

    if (searchTerm) filtering.searchTerm = searchTerm;
    if (intent.budget.min !== null) filtering.lowestPrice = intent.budget.min;
    if (intent.budget.max !== null) filtering.highestPrice = intent.budget.max;
    if (intent.dateWindow.startDate) filtering.startDate = intent.dateWindow.startDate;
    if (intent.dateWindow.endDate) filtering.endDate = intent.dateWindow.endDate;

    const viatorRequest = {
      filtering,
      sorting: {
        sort: "REVIEW_AVG_RATING",
        order: "DESCENDING",
      },
      pagination: {
        start: 1,
        count: 12,
      },
      currency: intent.budget.currency,
    };

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
