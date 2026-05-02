import type { AffiliateLink, ClickLog, CreatorPost, PostSlot, SavedDeal } from "@/lib/post-types";
import type { ViatorProduct } from "@/lib/types";
import { bestImageUrl, estimateCommission, formatDuration, isHumanUserAgent } from "@/lib/utils";

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "post";
}

export function usernameFromEmail(email?: string | null) {
  return (email?.split("@")[0] ?? "creator")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function productToSlotInput(
  product: ViatorProduct,
  opts: {
    userId: string;
    postId: string;
    slotIndex: number;
    label: string;
    source: PostSlot["source"];
    destination?: string;
    isPublic: boolean;
  },
) {
  return {
    userId: opts.userId,
    postId: opts.postId,
    slotIndex: opts.slotIndex,
    label: opts.label,
    viatorProductId: product.productCode,
    productTitle: product.title,
    productUrl: product.productUrl ?? "",
    productImageUrl: bestImageUrl(product.images),
    destination: opts.destination,
    price: product.pricing?.summary?.fromPrice,
    currency: product.pricing?.currency ?? "USD",
    rating: product.reviews?.combinedAverageRating,
    reviewCount: product.reviews?.totalReviews,
    durationLabel: formatDuration(product.duration),
    source: opts.source,
    active: true,
    isPublic: opts.isPublic,
    createdAt: new Date().toISOString(),
  };
}

export function savedDealToSlotInput(
  deal: SavedDeal,
  opts: {
    userId: string;
    postId: string;
    slotIndex: number;
    label: string;
    isPublic: boolean;
  },
) {
  return {
    userId: opts.userId,
    postId: opts.postId,
    slotIndex: opts.slotIndex,
    label: opts.label,
    viatorProductId: deal.viatorProductId,
    productTitle: deal.productTitle,
    productUrl: deal.productUrl,
    productImageUrl: deal.productImageUrl,
    destination: deal.destination,
    price: deal.price,
    currency: deal.currency,
    rating: deal.rating,
    reviewCount: deal.reviewCount,
    durationLabel: "",
    source: "saved_deal" as const,
    active: true,
    isPublic: opts.isPublic,
    createdAt: new Date().toISOString(),
  };
}

export function humanClicks(clicks: ClickLog[]) {
  return clicks.filter((click) => isHumanUserAgent(click.userAgent));
}

export function postStats(post: CreatorPost, slots: PostSlot[], links: AffiliateLink[], clicks: ClickLog[]) {
  const filtered = humanClicks(clicks).filter((click) => click.postId === post.id);
  const slotStats = slots
    .filter((slot) => slot.postId === post.id)
    .map((slot) => {
      const slotClicks = filtered.filter((click) => click.slotId === slot.id);
      return {
        slot,
        clicks: slotClicks.length,
        commission: estimateCommission(slot.price, slotClicks.length),
      };
    });
  const topSlot = [...slotStats].sort((a, b) => b.clicks - a.clicks)[0]?.slot;
  return {
    clicks: filtered.length,
    commission: slotStats.reduce((sum, item) => sum + item.commission, 0),
    slots: slotStats,
    topSlot,
    links: links.filter((link) => link.postId === post.id),
  };
}

export function countryFromIp(ip?: string) {
  if (!ip) return "Unknown";
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("127.")) return "Local";
  return "Unknown";
}
