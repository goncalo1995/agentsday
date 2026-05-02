// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
      displayName: i.string().optional(),
      username: i.string().unique().indexed().optional(),
      bio: i.string().optional(),
      createdAt: i.string().optional(),
    }),
    creator_posts: i.entity({
      userId: i.string().indexed(),
      campaignId: i.string().indexed().optional(),
      title: i.string(),
      slug: i.string().indexed(),
      description: i.string().optional(),
      coverImageUrl: i.string().optional(),
      isPublic: i.boolean().indexed(),
      copiedFromPostId: i.string().indexed().optional(),
      createdAt: i.string().indexed(),
      updatedAt: i.string().indexed(),
    }),
    campaigns: i.entity({
      userId: i.string().indexed(),
      title: i.string(),
      niche: i.string().indexed(),
      status: i.string<"draft" | "active" | "archived">().indexed(),
      startDate: i.string().indexed().optional(),
      endDate: i.string().indexed().optional(),
      scheduledDate: i.string().indexed().optional(),
      createdAt: i.string().indexed(),
      updatedAt: i.string().indexed(),
    }),
    campaign_content: i.entity({
      userId: i.string().indexed(),
      campaignId: i.string().indexed(),
      platform: i.string<"instagram" | "tiktok" | "youtube">().indexed(),
      contentType: i.string<"script" | "caption" | "story_text" | "image_prompt">().indexed(),
      contentText: i.string(),
      sourceProductUrl: i.string().optional(),
      sourceProductTitle: i.string().optional(),
      generatedAt: i.string().indexed(),
    }),
    external_commitments: i.entity({
      userId: i.string().indexed(),
      campaignId: i.string().indexed().optional(),
      title: i.string(),
      partnerName: i.string(),
      dueDate: i.string().indexed(),
      status: i.string<"planned" | "in_progress" | "delivered" | "paid">().indexed(),
      fee: i.number().optional(),
      notes: i.string().optional(),
      createdAt: i.string().indexed(),
      updatedAt: i.string().indexed(),
    }),
    post_slots: i.entity({
      userId: i.string().indexed(),
      postId: i.string().indexed(),
      slotIndex: i.number().indexed(),
      label: i.string(),
      viatorProductId: i.string().indexed(),
      productTitle: i.string(),
      productUrl: i.string(),
      productImageUrl: i.string().optional(),
      destination: i.string().indexed().optional(),
      price: i.number().optional(),
      currency: i.string().optional(),
      rating: i.number().optional(),
      reviewCount: i.number().optional(),
      durationLabel: i.string().optional(),
      source: i.string<"saved_deal" | "ai_alternative">().indexed(),
      active: i.boolean().indexed(),
      isPublic: i.boolean().indexed(),
      createdAt: i.string().indexed(),
    }),
    affiliate_links: i.entity({
      linkId: i.string().unique().indexed(),
      userId: i.string().indexed(),
      postId: i.string().indexed().optional(),
      slotId: i.string().indexed().optional(),
      slotLabel: i.string().optional(),
      viatorProductId: i.string().indexed(),
      shortCode: i.string().unique().indexed(),
      affiliateUrl: i.string(),
      destinationUrl: i.string(),
      productTitle: i.string(),
      productImageUrl: i.string().optional(),
      productPrice: i.number().optional(),
      productCurrency: i.string().optional(),
      productRating: i.number().optional(),
      reviewCount: i.number().optional(),
      campaignSource: i.string().indexed().optional(),
      creatorCode: i.string().optional(),
      active: i.boolean().indexed(),
      createdAt: i.string().indexed(),
    }),
    click_logs: i.entity({
      userId: i.string().indexed(),
      linkId: i.string().indexed(),
      postId: i.string().indexed().optional(),
      slotId: i.string().indexed().optional(),
      shortCode: i.string().indexed(),
      viatorProductId: i.string().indexed(),
      timestamp: i.string().indexed(),
      ip: i.string().optional(),
      userAgent: i.string().optional(),
    }),
    saved_deals: i.entity({
      userId: i.string().indexed(),
      viatorProductId: i.string().indexed(),
      notes: i.string().optional(),
      productTitle: i.string(),
      productUrl: i.string(),
      productImageUrl: i.string().optional(),
      destination: i.string().indexed().optional(),
      price: i.number().optional(),
      currency: i.string().optional(),
      rating: i.number().optional(),
      reviewCount: i.number().optional(),
      provider: i.string().indexed(),
      createdAt: i.string().indexed(),
    }),
    beta_leads: i.entity({
      email: i.string().indexed(),
      nameOrHandle: i.string(),
      countryOrRegion: i.string(),
      creatorType: i.string().indexed(),
      primaryPlatform: i.string(),
      followerRange: i.string().indexed(),
      niche: i.string(),
      affiliateExperience: i
        .string<
          | "yes_consistently"
          | "yes_occasionally"
          | "tried_not_much"
          | "no_but_i_want_to"
          | "no_not_interested"
        >()
        .indexed(),
      contactConsent: i.boolean(),
      wouldSaveTime: i
        .string<"definitely" | "probably" | "not_sure" | "probably_not" | "no">()
        .indexed(),
      wouldSaveTimeDetails: i.string().optional(),
      preferredLinkModel: i
        .string<
          | "use_my_own_affiliate_accounts"
          | "vibekit_managed_links_and_payouts"
          | "both"
          | "not_sure"
        >()
        .optional(),
      fairPricingModel: i
        .string<
          | "monthly_subscription"
          | "small_commission_share"
          | "subscription_plus_commission"
          | "one_time_campaign_fee"
          | "not_sure"
        >()
        .optional(),
      firstUseCase: i.string(),
      contentExampleOrNote: i.string().optional(),
      variant: i.string<"A" | "B">().indexed(),
      experimentVersion: i.string().indexed(),
      isDebugOverride: i.boolean().indexed(),
      visitorId: i.string().indexed(),
      utmSource: i.string().indexed().optional(),
      utmMedium: i.string().optional(),
      utmCampaign: i.string().optional(),
      utmContent: i.string().optional(),
      referrer: i.string().optional(),
      sourcePath: i.string(),
      deviceType: i.string<"mobile" | "desktop" | "tablet" | "unknown">().indexed(),
      status: i.string<"new" | "reviewed" | "contacted" | "accepted" | "rejected">().indexed(),
      createdAt: i.string().indexed(),
      updatedAt: i.string().indexed(),
    }),
    landing_events: i.entity({
      eventType: i
        .string<"view" | "cta_click" | "form_start" | "lead_submit" | "demo_reveal">()
        .indexed(),
      variant: i.string<"A" | "B">().indexed(),
      experimentVersion: i.string().indexed(),
      isDebugOverride: i.boolean().indexed(),
      visitorId: i.string().indexed(),
      deviceType: i.string<"mobile" | "desktop" | "tablet" | "unknown">().indexed(),
      utmSource: i.string().indexed().optional(),
      utmMedium: i.string().optional(),
      utmCampaign: i.string().optional(),
      utmContent: i.string().optional(),
      referrer: i.string().optional(),
      path: i.string(),
      metadataJson: i.string().optional(),
      createdAt: i.string().indexed(),
    }),
  },
  links: {},
  rooms: {},
});

type AppSchema = typeof _schema;
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
