import { id } from "@instantdb/admin";
import { adminDb } from "@/lib/instant-admin";
import {
  DEVICE_TYPES,
  EVENT_TYPES,
  EXPERIMENT_VERSION,
  VARIANTS,
  isOneOf,
  isRateLimited,
  normalizeOptionalString,
  normalizeRequiredString,
  rateLimitKey,
} from "@/lib/landing-validation";

export async function POST(req: Request) {
  if (!adminDb) {
    return Response.json({ error: "Instant admin credentials are not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const visitorId = normalizeRequiredString(body.visitorId, 120);
  if (!visitorId || isRateLimited(rateLimitKey(req, visitorId), 40, 10 * 60 * 1000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isOneOf(body.eventType, EVENT_TYPES) || !isOneOf(body.variant, VARIANTS)) {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }

  const deviceType = isOneOf(body.deviceType, DEVICE_TYPES) ? body.deviceType : "unknown";
  const experimentVersion =
    normalizeRequiredString(body.experimentVersion, 80) || EXPERIMENT_VERSION;

  const metadataJson =
    body.metadata && typeof body.metadata === "object"
      ? JSON.stringify(body.metadata).slice(0, 4000)
      : undefined;

  await adminDb.transact(
    adminDb.tx.landing_events[id()].update({
      eventType: body.eventType,
      variant: body.variant,
      experimentVersion,
      isDebugOverride: Boolean(body.isDebugOverride),
      visitorId,
      deviceType,
      utmSource: normalizeOptionalString(body.utmSource, 120),
      utmMedium: normalizeOptionalString(body.utmMedium, 120),
      utmCampaign: normalizeOptionalString(body.utmCampaign, 160),
      utmContent: normalizeOptionalString(body.utmContent, 160),
      referrer: normalizeOptionalString(body.referrer, 500),
      path: normalizeRequiredString(body.path, 300) || "/",
      metadataJson,
      createdAt: new Date().toISOString(),
    }),
  );

  return Response.json({ ok: true });
}
