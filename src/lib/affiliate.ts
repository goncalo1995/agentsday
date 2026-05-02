import type { ViatorProduct } from "@/lib/types";
import { bestImageUrl, generateReferralUrl } from "@/lib/utils";

export const SHORT_LINK_PREFIX = "/l";

export function makeShortCode(productCode: string) {
  const stem = productCode.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5).toLowerCase() || "deal";
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 7);
  return `${stem}${suffix}`;
}

export function shortUrlFor(shortCode: string) {
  if (typeof window === "undefined") return `${SHORT_LINK_PREFIX}/${shortCode}`;
  return `${window.location.origin}${SHORT_LINK_PREFIX}/${shortCode}`;
}

export function productSnapshot(product: ViatorProduct) {
  return {
    productTitle: product.title,
    productUrl: product.productUrl ?? "",
    productImageUrl: bestImageUrl(product.images),
    price: product.pricing?.summary?.fromPrice,
    currency: product.pricing?.currency ?? "USD",
    rating: product.reviews?.combinedAverageRating,
    reviewCount: product.reviews?.totalReviews,
    provider: product.provider ?? "viator",
  };
}

export function affiliateUrlFor(product: ViatorProduct, creatorCode: string, source: string) {
  return generateReferralUrl(product.productUrl ?? "", creatorCode, source);
}
