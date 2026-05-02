import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pick the widest image variant, falling back to the first one */
export function bestImageUrl(
  images?: { variants?: { url?: string; width?: number }[] }[],
): string {
  const variants = images?.[0]?.variants;
  if (!variants || variants.length === 0) return "";
  const best = variants.reduce((a, b) => ((b.width ?? 0) > (a.width ?? 0) ? b : a), variants[0]);
  return best.url ?? "";
}

export function formatDuration(d?: {
  fixedDurationInMinutes?: number;
  variableDurationFromMinutes?: number;
  variableDurationToMinutes?: number;
}): string {
  if (!d) return "—";
  const min =
    d.fixedDurationInMinutes ??
    d.variableDurationFromMinutes;
  if (min == null) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function generateReferralUrl(
  productUrl: string,
  creatorCode: string,
  source: string,
): string {
  try {
    const url = new URL(productUrl);
    url.searchParams.set("ref", creatorCode);
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_campaign", "creator_travel_links");
    return url.toString();
  } catch {
    return `${productUrl}?ref=${encodeURIComponent(creatorCode)}&utm_source=${encodeURIComponent(source)}&utm_campaign=creator_travel_links`;
  }
}

/** Generate a fake short link for demo tracking */
export function generateShortLink(productCode: string): string {
  const hash = productCode.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5).toLowerCase();
  const rand = Math.random().toString(36).slice(2, 6);
  return `crtl.ink/${hash}${rand}`;
}

/** Simulate click count — varies by "age" of the link */
export function simulateClicks(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = Math.max(1, ageMs / 86_400_000);
  return Math.floor(Math.random() * ageDays * 8 + Math.random() * 15);
}

/** Simulate commission: 8% of product price * estimated conversions */
export function simulateCommission(price: number, clicks: number): number {
  const conversionRate = 0.03 + Math.random() * 0.04; // 3-7%
  return Math.round(price * conversionRate * clicks * 0.08 * 100) / 100;
}

export function isHumanUserAgent(userAgent?: string | null): boolean {
  if (!userAgent) return true;
  return !/(bot|crawler)/i.test(userAgent);
}

export function estimateCommission(price: number | undefined, clicks: number): number {
  return Math.round(((price ?? 0) * clicks * 0.08) * 100) / 100;
}

export function dealScore(price: number | undefined, rating: number | undefined, avgPrice: number): number {
  if (!price || !rating || avgPrice <= 0) return 0;
  const priceValue = Math.max(0, 1 - price / avgPrice);
  return Math.max(0, Math.min(1, (rating / 5) * priceValue));
}

/** Map Viator tag IDs to human-readable labels */
const TAG_MAP: Record<number, string> = {
  20226: "Bus Tours",
  20234: "Paragliding",
  20244: "Sports Lessons",
  20246: "Surfing",
  21442: "On the Water",
  21478: "Outdoor Classes",
  21480: "Wine & Spirits",
  21909: "Outdoor Activities",
  21911: "Spa & Wellness",
  21915: "Classes & Workshops",
  21946: "Avoids Crowds",
  21951: "Sightseeing",
  21952: "Walking Tours",
  21953: "City Tours",
  21954: "Cultural Tours",
  21955: "Historical Tours",
  21957: "Hop-on Hop-off",
  21960: "Audio Guides",
  12011: "Attractions",
  12058: "Day Trips",
  12075: "Tours",
  11930: "Cultural",
};

export function resolveTagName(tagId: number): string {
  return TAG_MAP[tagId] ?? `Tag #${tagId}`;
}

export function resolveTagNames(tagIds: number[]): string[] {
  return tagIds.map(resolveTagName);
}

/** Campaign source icon mapping (lucide icon names) */
export const SOURCE_ICONS: Record<string, string> = {
  instagram: "camera",
  tiktok: "music",
  youtube: "play",
  twitter: "message-circle",
  x: "at-sign",
  facebook: "globe",
  pinterest: "pin",
  blog: "pen-tool",
  newsletter: "mail",
  threads: "message-square",
  other: "link",
};

export function getSourceIcon(source: string | undefined | null): string {
  if (!source) return "link";
  return SOURCE_ICONS[source.toLowerCase()] ?? "link";
}

/** Status config */
export const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  draft: { icon: "file-edit", label: "Draft", color: "bg-surface-alt text-muted" },
  shared: { icon: "send", label: "Shared", color: "bg-info/10 text-info" },
  "top-performer": { icon: "flame", label: "Top Performer", color: "bg-warning/10 text-warning" },
  archived: { icon: "archive", label: "Archived", color: "bg-surface-alt text-muted/60" },
};
