export const EXPERIMENT_VERSION = "vibekit-landing-v1";

export const VARIANTS = ["A", "B"] as const;
export const DEVICE_TYPES = ["mobile", "desktop", "tablet", "unknown"] as const;
export const EVENT_TYPES = ["view", "cta_click", "form_start", "lead_submit", "demo_reveal"] as const;

export const CREATOR_TYPES = [
  "travel_creator",
  "lifestyle_creator",
  "local_guide",
  "blogger",
  "ugc_creator",
  "agency_manager",
  "other_not_creator_yet",
] as const;

export const FOLLOWER_RANGES = ["none", "under_1k", "1k_10k", "10k_50k", "50k_250k", "250k_plus"] as const;

export const AFFILIATE_EXPERIENCE = [
  "yes_consistently",
  "yes_occasionally",
  "tried_not_much",
  "no_but_i_want_to",
  "no_not_interested",
] as const;

export const WOULD_SAVE_TIME = ["definitely", "probably", "not_sure", "probably_not", "no"] as const;

export const PREFERRED_LINK_MODELS = [
  "use_my_own_affiliate_accounts",
  "vibekit_managed_links_and_payouts",
  "both",
  "not_sure",
] as const;

export const FAIR_PRICING_MODELS = [
  "monthly_subscription",
  "small_commission_share",
  "subscription_plus_commission",
  "one_time_campaign_fee",
  "not_sure",
] as const;

export const LEAD_STATUSES = ["new", "reviewed", "contacted", "accepted", "rejected"] as const;

export type Variant = (typeof VARIANTS)[number];
export type DeviceType = (typeof DEVICE_TYPES)[number];
export type LandingEventType = (typeof EVENT_TYPES)[number];

export function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

export function normalizeOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

export function normalizeRequiredString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function requestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

export function rateLimitKey(req: Request, visitorId?: string) {
  return `${requestIp(req)}:${visitorId || "no-visitor"}`;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit = 12, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}
