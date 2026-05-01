// Mock API functions - structured for future real integration

export interface Intent {
  intent_type: string;
  recipient: {
    relationship: string;
    occasion: string;
  };
  location: {
    city: string;
    country: string;
  };
  date_constraints: {
    relative_deadline: string;
    preferred_window: string;
    urgency: string;
  };
  experience_preferences: {
    categories: string[];
    avoid: string[];
  };
  budget: {
    currency: string;
    min: number;
    max: number;
  };
  commerce_constraints: {
    requires_referral_link: boolean;
    requires_real_time_availability: boolean;
    requires_card_limit_equal_to_price: boolean;
  };
  verification: {
    user_approved_intent: boolean;
    overspend_allowed: boolean;
  };
}

export interface ExperienceResult {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  availability: "instant" | "limited" | "request";
  category: string;
  referralUrl: string;
  whyMatch: string;
}

export interface CardMetadata {
  maskedPan: string;
  expiry: string;
  limit: string;
  validFor: string;
  merchant: string;
}

// Extract intent from transcript
export async function extractIntent(transcript: string): Promise<Intent> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    intent_type: "gift_experience_booking",
    recipient: {
      relationship: "mother",
      occasion: "Mother's Day"
    },
    location: {
      city: "Lisbon",
      country: "Portugal"
    },
    date_constraints: {
      relative_deadline: "2 days from now",
      preferred_window: "this weekend",
      urgency: "last_minute"
    },
    experience_preferences: {
      categories: ["spa", "wellness", "relaxation", "premium experience"],
      avoid: ["physical shipping", "long delivery times"]
    },
    budget: {
      currency: "EUR",
      min: 50,
      max: 180
    },
    commerce_constraints: {
      requires_referral_link: true,
      requires_real_time_availability: true,
      requires_card_limit_equal_to_price: true
    },
    verification: {
      user_approved_intent: true,
      overspend_allowed: false
    }
  };
}

// Stream agent trace messages
export async function* streamAgentTrace(): AsyncGenerator<string> {
  const messages = [
    "Listening to user request…",
    "Extracting recipient, occasion, location, and deadline…",
    "Mother's Day is time-sensitive, prioritizing instant-bookable experiences…",
    "Searching Lisbon spa and wellness experiences…",
    "Found 12 matching experiences in the Lisbon area…",
    "Filtering by real-time availability and gift suitability…",
    "Ranking by rating, price match, and instant booking capability…",
    "Preparing verifiable purchase intent…",
    "Ready to issue exact-limit single-use card after user approval."
  ];

  for (const message of messages) {
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
    yield message;
  }
}

// Search for experiences
export async function searchViatorExperiences(intent: Intent): Promise<ExperienceResult[]> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return [
    {
      id: "exp-001",
      title: "Luxury Spa Ritual & Massage in Lisbon",
      description: "A 2-hour rejuvenating spa experience with aromatherapy massage, facial treatment, and access to thermal pools.",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
      location: "Baixa-Chiado, Lisbon",
      rating: 4.9,
      reviewCount: 342,
      price: 129,
      currency: "EUR",
      availability: "instant",
      category: "Spa & Wellness",
      referralUrl: "https://viator.com/demo/luxury-spa-lisbon",
      whyMatch: "Top-rated spa, instant booking, perfect for Mother's Day gift"
    },
    {
      id: "exp-002",
      title: "Couples-style Wellness Day Pass at Lisbon Spa",
      description: "Full-day access to premium spa facilities including sauna, hammam, jacuzzi, and one 60-min massage.",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop",
      location: "Santos, Lisbon",
      rating: 4.7,
      reviewCount: 189,
      price: 95,
      currency: "EUR",
      availability: "instant",
      category: "Day Spa",
      referralUrl: "https://viator.com/demo/wellness-day-pass",
      whyMatch: "Great value, all-day relaxation, highly rated facilities"
    },
    {
      id: "exp-003",
      title: "Private Portuguese Wine & Relaxation Experience",
      description: "A unique combination of wine tasting from local vineyards paired with a relaxing massage session.",
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop",
      location: "Alfama, Lisbon",
      rating: 4.8,
      reviewCount: 127,
      price: 165,
      currency: "EUR",
      availability: "limited",
      category: "Wine & Wellness",
      referralUrl: "https://viator.com/demo/wine-relaxation",
      whyMatch: "Unique experience, combines Portuguese culture with wellness"
    },
    {
      id: "exp-004",
      title: "Sintra Wellness Escape from Lisbon",
      description: "Day trip to Sintra with spa treatment at a historic palace hotel, includes transport and lunch.",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
      location: "Sintra (from Lisbon)",
      rating: 4.6,
      reviewCount: 94,
      price: 175,
      currency: "EUR",
      availability: "limited",
      category: "Day Trip & Spa",
      referralUrl: "https://viator.com/demo/sintra-wellness",
      whyMatch: "Combines sightseeing with relaxation, memorable experience"
    },
    {
      id: "exp-005",
      title: "Lisbon Sunset Cruise Gift Experience",
      description: "2-hour evening cruise along the Tagus River with champagne, tapas, and live fado music.",
      image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop",
      location: "Belém, Lisbon",
      rating: 4.9,
      reviewCount: 456,
      price: 89,
      currency: "EUR",
      availability: "instant",
      category: "Cruise Experience",
      referralUrl: "https://viator.com/demo/sunset-cruise",
      whyMatch: "Romantic, memorable, excellent reviews, instant booking"
    }
  ];
}

// Create verifiable intent signature
export async function createVerifiableIntent(
  intent: Intent, 
  selectedProduct: ExperienceResult
): Promise<{ signature: string; hash: string; timestamp: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const hash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  
  return {
    signature: `sig_${Date.now()}_verified`,
    hash,
    timestamp: new Date().toISOString()
  };
}

// Issue single-use card
export async function issueSingleUseCard(
  amount: number, 
  currency: string
): Promise<CardMetadata> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    maskedPan: "**** **** **** 4242",
    expiry: "12/29",
    limit: `€${amount.toFixed(2)}`,
    validFor: "30 minutes",
    merchant: "Viator / Demo Merchant"
  };
}
