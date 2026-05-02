export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  affiliateLink: string;
  provider: string;
  rating?: number;
  reviewCount?: number;
  rawData?: any;
}

export interface SearchParams {
  query?: string;
  destination?: string;
  maxPrice?: number;
  minPrice?: number;
  keywords?: string[];
  category?: string;
}

export interface Provider {
  name: string;
  search(params: SearchParams): Promise<Product[]>;
  getAffiliateLink(productId: string): Promise<string>;
}
