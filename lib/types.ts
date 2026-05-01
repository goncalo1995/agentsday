export interface TravelIntent {
  intentType: 'travel_experience_search'
  rawUserRequest: string
  travelerContext: {
    forSelf: boolean
    recipientRelationship: string | null
    occasion: string | null
  }
  destination: {
    city: string
    country: string
    destinationId: number | null
  }
  dateConstraints: {
    relativeDeadline: string | null
    startDate: string | null
    endDate: string | null
    urgency: 'flexible' | 'soon' | 'last_minute'
  }
  experiencePreferences: {
    categories: string[]
    keywords: string[]
    avoid: string[]
  }
  budget: {
    currency: 'EUR' | 'USD'
    min: number | null
    max: number | null
  }
  searchConstraints: {
    requiresInstantConfirmation: boolean
    requiresProductUrl: boolean
    limit: number
  }
}

export interface ViatorProduct {
  productCode: string
  title: string
  description?: string
  images?: Array<{
    imageSource: string
    caption?: string
  }>
  reviews?: {
    combinedAverageRating?: number
    totalReviews?: number
  }
  pricing?: {
    summary?: {
      fromPrice?: number
      fromPriceBeforeDiscount?: number
    }
    currency?: string
  }
  duration?: {
    fixedDurationInMinutes?: number
    variableDurationFromMinutes?: number
    variableDurationToMinutes?: number
  }
  productUrl?: string
  bookingInfo?: {
    cancellationPolicy?: string
    instantConfirmation?: boolean
  }
  flags?: string[]
}

export interface ViatorAttraction {
  seoId: string
  name: string
  destinationId: number
  primaryDestinationName?: string
  thumbnailUrl?: string
  productCount?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  intent?: TravelIntent
  products?: ViatorProduct[]
  attractions?: ViatorAttraction[]
  viatorRequest?: Record<string, unknown>
  executionLog?: ExecutionStep[]
  error?: string
}

export interface ExecutionStep {
  id: string
  step: number
  message: string
  status: 'pending' | 'in-progress' | 'complete' | 'error'
  timestamp: Date
  data?: unknown
}

// Demo fallback data
export const DEMO_PRODUCTS: ViatorProduct[] = [
  {
    productCode: 'DEMO001',
    title: 'Relaxing Spa Day at Lisbon Wellness Center',
    description: 'Treat yourself or a loved one to a rejuvenating spa experience in the heart of Lisbon. Includes massage, facial, and access to thermal pools.',
    images: [{ imageSource: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop', caption: 'Spa treatment' }],
    reviews: { combinedAverageRating: 4.8, totalReviews: 342 },
    pricing: { summary: { fromPrice: 89 }, currency: 'EUR' },
    duration: { fixedDurationInMinutes: 180 },
    productUrl: 'https://www.viator.com/tours/Lisbon/Spa-Day',
    bookingInfo: { cancellationPolicy: 'Free cancellation up to 24 hours before', instantConfirmation: true },
    flags: ['BEST_SELLER', 'FREE_CANCELLATION'],
  },
  {
    productCode: 'DEMO002',
    title: 'Mother\'s Day Wellness & Wine Tasting Experience',
    description: 'Perfect for Mother\'s Day! Combine a relaxing spa treatment with a guided wine tasting at a historic Lisbon vineyard.',
    images: [{ imageSource: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop', caption: 'Wine tasting' }],
    reviews: { combinedAverageRating: 4.9, totalReviews: 187 },
    pricing: { summary: { fromPrice: 125 }, currency: 'EUR' },
    duration: { fixedDurationInMinutes: 300 },
    productUrl: 'https://www.viator.com/tours/Lisbon/Wellness-Wine',
    bookingInfo: { cancellationPolicy: 'Free cancellation up to 48 hours before', instantConfirmation: true },
    flags: ['LIKELY_TO_SELL_OUT', 'FREE_CANCELLATION'],
  },
  {
    productCode: 'DEMO003',
    title: 'Authentic Portuguese Cooking Class with Market Visit',
    description: 'Learn to cook traditional Portuguese dishes with a local chef. Starts with a guided market tour to select fresh ingredients.',
    images: [{ imageSource: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop', caption: 'Cooking class' }],
    reviews: { combinedAverageRating: 4.7, totalReviews: 523 },
    pricing: { summary: { fromPrice: 75 }, currency: 'EUR' },
    duration: { fixedDurationInMinutes: 240 },
    productUrl: 'https://www.viator.com/tours/Lisbon/Cooking-Class',
    bookingInfo: { cancellationPolicy: 'Free cancellation up to 24 hours before', instantConfirmation: true },
    flags: ['TOP_RATED'],
  },
  {
    productCode: 'DEMO004',
    title: 'Sunset Sailing on the Tagus River',
    description: 'Experience Lisbon from the water with this 2-hour sunset sailing trip. Includes wine, cheese, and stunning views of the city skyline.',
    images: [{ imageSource: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=400&h=300&fit=crop', caption: 'Sunset sailing' }],
    reviews: { combinedAverageRating: 4.9, totalReviews: 892 },
    pricing: { summary: { fromPrice: 45 }, currency: 'EUR' },
    duration: { fixedDurationInMinutes: 120 },
    productUrl: 'https://www.viator.com/tours/Lisbon/Sunset-Sailing',
    bookingInfo: { cancellationPolicy: 'Free cancellation up to 24 hours before', instantConfirmation: true },
    flags: ['BEST_SELLER', 'FREE_CANCELLATION'],
  },
  {
    productCode: 'DEMO005',
    title: 'Private Sintra Palace & Gardens Day Trip',
    description: 'Escape to the fairytale town of Sintra. Visit Pena Palace, explore mystical gardens, and enjoy a gourmet lunch with ocean views.',
    images: [{ imageSource: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400&h=300&fit=crop', caption: 'Sintra Palace' }],
    reviews: { combinedAverageRating: 4.8, totalReviews: 1247 },
    pricing: { summary: { fromPrice: 145 }, currency: 'EUR' },
    duration: { fixedDurationInMinutes: 480 },
    productUrl: 'https://www.viator.com/tours/Lisbon/Sintra-Day-Trip',
    bookingInfo: { cancellationPolicy: 'Free cancellation up to 48 hours before', instantConfirmation: true },
    flags: ['SPECIAL_OFFER', 'FREE_CANCELLATION'],
  },
]

export const DEMO_ATTRACTIONS: ViatorAttraction[] = [
  { seoId: 'belem-tower', name: 'Belem Tower', destinationId: 538, primaryDestinationName: 'Lisbon', productCount: 45 },
  { seoId: 'jeronimos-monastery', name: 'Jeronimos Monastery', destinationId: 538, primaryDestinationName: 'Lisbon', productCount: 38 },
  { seoId: 'alfama-district', name: 'Alfama District', destinationId: 538, primaryDestinationName: 'Lisbon', productCount: 67 },
  { seoId: 'sintra', name: 'Sintra', destinationId: 538, primaryDestinationName: 'Lisbon', productCount: 124 },
  { seoId: 'time-out-market', name: 'Time Out Market', destinationId: 538, primaryDestinationName: 'Lisbon', productCount: 23 },
]
