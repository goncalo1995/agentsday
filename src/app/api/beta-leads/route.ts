import { id } from "@instantdb/admin";
import { adminDb } from "@/lib/instant-admin";
import {
  AFFILIATE_EXPERIENCE,
  CREATOR_TYPES,
  DEVICE_TYPES,
  EXPERIMENT_VERSION,
  FAIR_PRICING_MODELS,
  FOLLOWER_RANGES,
  PREFERRED_LINK_MODELS,
  VARIANTS,
  WOULD_SAVE_TIME,
  isOneOf,
  isRateLimited,
  isValidEmail,
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

  const honeypot = normalizeOptionalString(body.website, 200);
  if (honeypot) {
    return Response.json({ ok: true, duplicate: false, spam: true });
  }

  const visitorId = normalizeRequiredString(body.visitorId, 120);
  if (!visitorId || isRateLimited(rateLimitKey(req, visitorId), 6, 10 * 60 * 1000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const email = normalizeRequiredString(body.email, 180).toLowerCase();
  const nameOrHandle = normalizeRequiredString(body.nameOrHandle, 120);
  const countryOrRegion = normalizeRequiredString(body.countryOrRegion, 120);
  const primaryPlatform = normalizeRequiredString(body.primaryPlatform, 120);
  const niche = normalizeRequiredString(body.niche, 160);
  const firstUseCase = normalizeRequiredString(body.firstUseCase, 280);
  const experimentVersion =
    normalizeRequiredString(body.experimentVersion, 80) || EXPERIMENT_VERSION;

  const errors: Record<string, string> = {};

  if (!email || !isValidEmail(email)) errors.email = "Enter a valid email.";
  if (!nameOrHandle) errors.nameOrHandle = "Add your creator name or handle.";
  if (!countryOrRegion) errors.countryOrRegion = "Add your country or region.";
  if (!primaryPlatform) errors.primaryPlatform = "Add your primary platform.";
  if (!niche) errors.niche = "Add your niche.";
  if (!firstUseCase) errors.firstUseCase = "Tell us what you would create first.";
  if (body.contactConsent !== true) errors.contactConsent = "Consent is required.";
  if (!isOneOf(body.variant, VARIANTS)) errors.variant = "Invalid variant.";
  if (!isOneOf(body.creatorType, CREATOR_TYPES)) errors.creatorType = "Choose a creator type.";
  if (!isOneOf(body.followerRange, FOLLOWER_RANGES)) errors.followerRange = "Choose a follower range.";
  if (!isOneOf(body.affiliateExperience, AFFILIATE_EXPERIENCE)) {
    errors.affiliateExperience = "Choose an affiliate experience.";
  }
  if (!isOneOf(body.wouldSaveTime, WOULD_SAVE_TIME)) errors.wouldSaveTime = "Choose an answer.";

  const preferredLinkModel = isOneOf(body.preferredLinkModel, PREFERRED_LINK_MODELS)
    ? body.preferredLinkModel
    : undefined;
  const fairPricingModel = isOneOf(body.fairPricingModel, FAIR_PRICING_MODELS)
    ? body.fairPricingModel
    : undefined;
  const deviceType = isOneOf(body.deviceType, DEVICE_TYPES) ? body.deviceType : "unknown";

  if (Object.keys(errors).length > 0) {
    return Response.json({ error: "Validation failed", errors }, { status: 400 });
  }

  const now = new Date().toISOString();
  const existing = await adminDb.query({
    beta_leads: {
      $: {
        where: {
          and: [{ email }, { experimentVersion }],
        },
        limit: 1,
      },
    },
  });
  const existingLead = existing.beta_leads[0];
  const leadId = existingLead?.id ?? id();

  await adminDb.transact([
    adminDb.tx.beta_leads[leadId].update({
      email,
      nameOrHandle,
      countryOrRegion,
      creatorType: body.creatorType,
      primaryPlatform,
      followerRange: body.followerRange,
      niche,
      affiliateExperience: body.affiliateExperience,
      contactConsent: true,
      wouldSaveTime: body.wouldSaveTime,
      wouldSaveTimeDetails: normalizeOptionalString(body.wouldSaveTimeDetails, 500),
      preferredLinkModel,
      fairPricingModel,
      firstUseCase,
      contentExampleOrNote: normalizeOptionalString(body.contentExampleOrNote, 1000),
      variant: body.variant,
      experimentVersion,
      isDebugOverride: Boolean(body.isDebugOverride),
      visitorId,
      utmSource: normalizeOptionalString(body.utmSource, 120),
      utmMedium: normalizeOptionalString(body.utmMedium, 120),
      utmCampaign: normalizeOptionalString(body.utmCampaign, 160),
      utmContent: normalizeOptionalString(body.utmContent, 160),
      referrer: normalizeOptionalString(body.referrer, 500),
      sourcePath: normalizeRequiredString(body.sourcePath, 300) || "/",
      deviceType,
      status: existingLead?.status ?? "new",
      createdAt: existingLead?.createdAt ?? now,
      updatedAt: now,
    }),
    adminDb.tx.landing_events[id()].update({
      eventType: "lead_submit",
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
      path: normalizeRequiredString(body.sourcePath, 300) || "/",
      metadataJson: JSON.stringify({ duplicate: Boolean(existingLead) }),
      createdAt: now,
    }),
  ]);

  return Response.json({ ok: true, duplicate: Boolean(existingLead) });
}
