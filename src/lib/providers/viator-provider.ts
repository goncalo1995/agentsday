import { Provider, Product, SearchParams } from "./base-provider";
import { bestImageUrl } from "../utils";
import type { ViatorProduct, ViatorSearchResponse } from "../types";

export class ViatorProvider implements Provider {
  name = "viator";

  async search(params: SearchParams): Promise<Product[]> {
    const VIATOR_BASE = process.env.VIATOR_API_BASE_URL ?? process.env.VIATOR_BASE_URL ?? "https://api.sandbox.viator.com/partner";
    const VIATOR_KEY = process.env.VIATOR_API_KEY ?? "";

    if (!VIATOR_KEY) {
      console.warn("Viator API key missing.");
      return [];
    }

    const searchTypes: Record<string, unknown>[] = [
      { searchType: "PRODUCTS", pagination: { start: 1, count: 20 } },
    ];

    const body: Record<string, unknown> = {
      searchTerm: params.query || "",
      searchTypes,
      currency: "USD",
    };

    if (params.destination) {
      // Typically destinationId is required by Viator, but freetext search might work without it if searchTerm has the destination
      // Ideally we would map destination to destinationId, but for V4 fallback we just rely on freetext
    }

    try {
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

      if (!res.ok) {
        return [];
      }

      const data: ViatorSearchResponse = await res.json();
      const products: ViatorProduct[] = Array.isArray(data.products)
        ? data.products
        : data.products?.results || [];

      return products
        .filter((p) => {
          const price = p.pricing?.summary?.fromPrice;
          return !params.maxPrice || price == null || price <= params.maxPrice;
        })
        .map((p) => {
          const price = p.pricing?.summary?.fromPrice || 0;
          return {
            id: p.productCode,
            title: p.title,
            description: p.description,
            price,
            currency: p.pricing?.currency || "USD",
            imageUrl: bestImageUrl(p.images),
            affiliateLink: p.productUrl || "", // Placeholder until generated via getAffiliateLink or via generateShortLink
            provider: "viator",
            rating: p.reviews?.combinedAverageRating,
            reviewCount: p.reviews?.totalReviews,
            rawData: p,
          };
        });
    } catch (e) {
      console.error("[viator-provider] search failed:", e);
      return [];
    }
  }

  async getAffiliateLink(productId: string): Promise<string> {
    // In actual implementation, this could call Viator API to get a deep link if needed
    // However, our existing generateReferralUrl utility handles adding tracking params to productUrl
    return "";
  }
}
