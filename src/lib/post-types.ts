export type CreatorProfile = {
  id: string;
  email?: string;
  username?: string;
  bio?: string;
  displayName?: string;
  imageURL?: string;
};

export type CreatorPost = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  copiedFromPostId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PostSlot = {
  id: string;
  userId: string;
  postId: string;
  slotIndex: number;
  label: string;
  viatorProductId: string;
  productTitle: string;
  productUrl: string;
  productImageUrl?: string;
  destination?: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  durationLabel?: string;
  source: "saved_deal" | "ai_alternative";
  active: boolean;
  isPublic: boolean;
  createdAt: string;
};

export type AffiliateLink = {
  id: string;
  linkId: string;
  userId: string;
  postId?: string;
  slotId?: string;
  slotLabel?: string;
  viatorProductId: string;
  shortCode: string;
  affiliateUrl: string;
  destinationUrl: string;
  productTitle: string;
  productImageUrl?: string;
  productPrice?: number;
  productCurrency?: string;
  productRating?: number;
  reviewCount?: number;
  campaignSource?: string;
  creatorCode?: string;
  active: boolean;
  createdAt: string;
};

export type ClickLog = {
  id: string;
  userId: string;
  linkId: string;
  postId?: string;
  slotId?: string;
  shortCode: string;
  viatorProductId: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
};

export type SavedDeal = {
  id: string;
  userId: string;
  viatorProductId: string;
  notes?: string;
  productTitle: string;
  productUrl: string;
  productImageUrl?: string;
  destination?: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  provider: string;
  createdAt: string;
};
