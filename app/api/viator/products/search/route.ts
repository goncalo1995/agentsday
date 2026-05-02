import { NextRequest } from "next/server";

export const maxDuration = 30;

interface ViatorFreetextRequest {
  destination?: string;
  searchTerm?: string;
  category?: string;
  lowestPrice?: number;
  highestPrice?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  currency?: string;
}

function resultList(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>;

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (Array.isArray(object.results)) return object.results as Array<Record<string, unknown>>;
    if (Array.isArray(object.items)) return object.items as Array<Record<string, unknown>>;
  }

  return [];
}

function totalCount(value: unknown) {
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return Number(object.totalCount ?? object.total ?? 0) || 0;
  }

  return 0;
}

function partnerBaseUrl(value?: string) {
  const baseUrl = (value || "https://api.sandbox.viator.com/partner").replace(/\/$/, "");
  return baseUrl.endsWith("/partner") ? baseUrl : `${baseUrl}/partner`;
}

export async function POST(req: NextRequest) {
  try {
    const body: ViatorFreetextRequest = await req.json();

    const apiKey = process.env.VIATOR_API_KEY;
    const baseUrl = partnerBaseUrl(process.env.VIATOR_API_BASE_URL);

    if (!apiKey) {
      return Response.json(
        { error: "VIATOR_API_KEY not configured", code: "MISSING_API_KEY" },
        { status: 500 },
      );
    }

    const productFiltering: Record<string, unknown> = {};
    if (body.lowestPrice !== undefined && body.lowestPrice !== null) {
      productFiltering.lowestPrice = body.lowestPrice;
    }
    if (body.highestPrice !== undefined && body.highestPrice !== null) {
      productFiltering.highestPrice = body.highestPrice;
    }
    if (body.startDate) productFiltering.startDate = body.startDate;
    if (body.endDate) productFiltering.endDate = body.endDate;

    const viatorRequest: Record<string, unknown> = {
      searchTerm: [body.searchTerm, body.category, body.destination]
        .filter(Boolean)
        .join(" ")
        .trim(),
      searchTypes: [
        {
          searchType: "PRODUCTS",
          pagination: {
            start: 1,
            count: body.limit || 12,
          },
        },
        {
          searchType: "ATTRACTIONS",
          pagination: {
            start: 1,
            count: 6,
          },
        },
        {
          searchType: "DESTINATIONS",
          pagination: {
            start: 1,
            count: 6,
          },
        },
      ],
      currency: body.currency || "EUR",
    };

    if (Object.keys(productFiltering).length > 0) {
      viatorRequest.productFiltering = productFiltering;
    }

    if (body.sortBy && body.sortBy !== "RELEVANCE") {
      viatorRequest.productSorting = {
        sort: body.sortBy,
        order: body.sortOrder || "DESCENDING",
      };
    }

    if (!viatorRequest.searchTerm) {
      return Response.json({ error: "Missing searchTerm" }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/search/freetext`, {
      method: "POST",
      headers: {
        "exp-api-key": apiKey,
        Accept: "application/json;version=2.0",
        "Content-Type": "application/json;version=2.0",
        "Accept-Language": "en-US",
      },
      body: JSON.stringify(viatorRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 401 || response.status === 403) {
        return Response.json(
          { error: "Invalid or expired VIATOR_API_KEY", code: "AUTH_ERROR" },
          { status: 401 },
        );
      }

      return Response.json(
        {
          error: "Viator free-text search error",
          status: response.status,
          details: errorText,
          requestSent: viatorRequest,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    const products = resultList(data.products);
    const attractions = resultList(data.attractions);
    const destinations = resultList(data.destinations);

    return Response.json({
      products,
      attractions,
      destinations,
      totalCount: totalCount(data.products) || products.length,
      requestSent: viatorRequest,
      raw: data,
    });
  } catch (error) {
    console.error("Viator free-text search error:", error);
    return Response.json(
      { error: "Failed to search Viator", details: String(error) },
      { status: 500 },
    );
  }
}
