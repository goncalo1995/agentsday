// ── Search intent extracted by AI ──
export interface SearchIntent {
  destination: string;
  destinationId: string;
  maxPrice?: number;
  groupType?: string;
  keywords: string[];
  searchTerm: string;
  summary: string;
}

// ── Viator v2 product (from /search/freetext) ──
export interface ViatorProduct {
  productCode: string;
  title: string;
  description?: string;
  images?: { variants?: { url?: string; width?: number; height?: number }[] }[];
  reviews?: { combinedAverageRating?: number; totalReviews?: number };
  pricing?: { summary?: { fromPrice?: number }; currency?: string };
  duration?: {
    fixedDurationInMinutes?: number;
    variableDurationFromMinutes?: number;
    variableDurationToMinutes?: number;
  };
  tags?: number[];
  destinations?: { ref?: string; primary?: boolean }[];
  productUrl?: string;
  flags?: string[];
  provider?: string;
  dealScore?: number;
}

// ── Viator v2 attraction ──
export interface ViatorAttraction {
  attractionId?: number;
  name?: string;
  images?: { variants?: { url?: string }[] }[];
  reviews?: { combinedAverageRating?: number; totalReviews?: number };
  productCount?: number;
  attractionUrl?: string;
}

// ── Legacy saved referral link shape from the pre-build UI ──
export interface SavedLink {
  id: string;
  productTitle: string;
  productCode: string;
  destination: string;
  referralUrl: string;
  productUrl: string;
  shortLink: string;
  createdAt: string;
  // Metrics (simulated client-side)
  clickCount: number;
  estimatedCommission: number;
  // Product metadata
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  // Categorization
  viatorTags: number[];
  customTags: string[];
  campaignSource: string;
  creatorCode: string;
  // Status
  status: "draft" | "shared" | "top-performer" | "archived";
  // Provider
  provider: string;
}

export type SavedLinkSortKey =
  | "newest"
  | "oldest"
  | "commission"
  | "clicks"
  | "price-high"
  | "price-low"
  | "rating"
  | "destination"
  | "status";

export type SavedLinkFilter = {
  destination?: string;
  status?: SavedLink["status"];
  campaignSource?: string;
  customTag?: string;
};

// ── Search progress steps ──
export interface SearchStep {
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

// ── Viator search API response (from our proxy) ──
export interface ViatorSearchResponse {
  products: ViatorProduct[];
  attractions: ViatorAttraction[];
  totalProducts: number;
  error?: boolean;
}
