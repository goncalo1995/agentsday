// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
      displayName: i.string().optional(),
      createdAt: i.string().optional(),
    }),
    affiliate_links: i.entity({
      linkId: i.string().unique().indexed(),
      userId: i.string().indexed(),
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
  },
  links: {},
  rooms: {},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
