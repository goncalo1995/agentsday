"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Filter,
  Link2,
  MapPin,
  Plane,
  Search,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Currency = "EUR" | "USD";
type SortBy = "relevance" | "rating" | "price";

type SearchIntent = {
  intentType: "viator_creator_search";
  creatorGoal: string;
  destination: {
    city: string;
    country: string;
    destinationId: number | null;
  };
  keywords: string[];
  categories: string[];
  dateWindow: {
    startDate: string | null;
    endDate: string | null;
  };
  budget: {
    currency: Currency;
    min: number | null;
    max: number | null;
  };
  contentAngle: string | null;
};

type Filters = {
  destination: string;
  destinationId: number | null;
  keywords: string;
  category: string;
  lowestPrice: string;
  highestPrice: string;
  currency: Currency;
  sortBy: SortBy;
  startDate: string;
  endDate: string;
};

type ViatorProduct = {
  id: string;
  title: string;
  destination: string;
  rating: number | null;
  reviewCount: number | null;
  price: number | null;
  currency: Currency;
  duration: string;
  productCode: string;
  productUrl: string;
  image: string;
  tags: string[];
};

type SavedLink = {
  id: string;
  productTitle: string;
  destination: string;
  generatedUrl: string;
  createdAt: string;
};

type Attraction = {
  id: string;
  name: string;
  destination?: string;
};

const defaultPrompt =
  "Find cool spa and wellness experiences in Lisbon for a Mother's Day post.";

const defaultFilters: Filters = {
  destination: "Lisbon, Portugal",
  destinationId: 538,
  keywords: "spa wellness Lisbon",
  category: "Spa & Wellness",
  lowestPrice: "50",
  highestPrice: "180",
  currency: "EUR",
  sortBy: "rating",
  startDate: "",
  endDate: "",
};

const demoProducts: ViatorProduct[] = [
  {
    id: "demo-1",
    title: "Lisbon Luxury Spa Ritual with Aromatherapy Massage",
    destination: "Lisbon, Portugal",
    rating: 4.9,
    reviewCount: 342,
    price: 129,
    currency: "EUR",
    duration: "2 hours",
    productCode: "LIS-SPA-129",
    productUrl: "https://www.viator.com/tours/Lisbon/Luxury-Spa-Ritual/d538-demo1",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
    tags: ["Spa", "Wellness", "Mother's Day"],
  },
  {
    id: "demo-2",
    title: "Portuguese Wine, Wellness and Sunset Experience",
    destination: "Lisbon, Portugal",
    rating: 4.8,
    reviewCount: 218,
    price: 165,
    currency: "EUR",
    duration: "3 hours",
    productCode: "LIS-WINE-WELL",
    productUrl: "https://www.viator.com/tours/Lisbon/Wine-Wellness/d538-demo2",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
    tags: ["Wine", "Relaxation", "Couples"],
  },
  {
    id: "demo-3",
    title: "Sintra Wellness Escape from Lisbon with Transfers",
    destination: "Sintra from Lisbon",
    rating: 4.7,
    reviewCount: 156,
    price: 178,
    currency: "EUR",
    duration: "7 hours",
    productCode: "LIS-SINTRA-SPA",
    productUrl: "https://www.viator.com/tours/Lisbon/Sintra-Wellness/d538-demo3",
    image:
      "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=900&q=80",
    tags: ["Day Trip", "Wellness", "Sintra"],
  },
  {
    id: "demo-4",
    title: "Lisbon Yoga, Brunch and Riverside Walk",
    destination: "Belem, Lisbon",
    rating: 4.6,
    reviewCount: 91,
    price: 74,
    currency: "EUR",
    duration: "4 hours",
    productCode: "LIS-YOGA-BRUNCH",
    productUrl: "https://www.viator.com/tours/Lisbon/Yoga-Brunch/d538-demo4",
    image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
    tags: ["Yoga", "Brunch", "Lifestyle"],
  },
];

const demoAttractions: Attraction[] = [
  { id: "a1", name: "Belem Tower", destination: "Lisbon" },
  { id: "a2", name: "Alfama", destination: "Lisbon" },
  { id: "a3", name: "Jeronimos Monastery", destination: "Lisbon" },
  { id: "a4", name: "Sintra", destination: "Lisbon area" },
];

function buildReferralUrl(
  productUrl: string,
  creatorCode: string,
  source: string,
) {
  const separator = productUrl.includes("?") ? "&" : "?";
  return `${productUrl}${separator}ref=${encodeURIComponent(
    creatorCode || "creator_demo",
  )}&utm_source=${encodeURIComponent(
    source || "instagram",
  )}&utm_campaign=creator_travel_links`;
}

function createFallbackIntent(prompt: string, filters: Filters): SearchIntent {
  const destinationCity = filters.destination.split(",")[0]?.trim() || "Lisbon";

  return {
    intentType: "viator_creator_search",
    creatorGoal: prompt,
    destination: {
      city: destinationCity,
      country: destinationCity.toLowerCase() === "lisbon" ? "Portugal" : "",
      destinationId:
        filters.destinationId ?? (destinationCity.toLowerCase() === "lisbon" ? 538 : null),
    },
    keywords: filters.keywords.split(/\s|,/).filter(Boolean),
    categories: filters.category ? [filters.category] : [],
    dateWindow: {
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
    },
    budget: {
      currency: filters.currency,
      min: filters.lowestPrice ? Number(filters.lowestPrice) : null,
      max: filters.highestPrice ? Number(filters.highestPrice) : null,
    },
    contentAngle: prompt.toLowerCase().includes("mother")
      ? "Mother's Day wellness post"
      : null,
  };
}

function normalizeProduct(item: Record<string, unknown>, currency: Currency): ViatorProduct {
  const images = item.images as Array<Record<string, unknown>> | undefined;
  const firstImage = images?.[0];
  const variants = firstImage?.variants as Array<Record<string, unknown>> | undefined;
  const pricing = item.pricing as Record<string, unknown> | undefined;
  const summary = pricing?.summary as Record<string, unknown> | undefined;
  const reviews = item.reviews as Record<string, unknown> | undefined;
  const duration = item.duration as Record<string, unknown> | undefined;
  const destinations = item.destinations as Array<Record<string, unknown>> | undefined;
  const tags = [
    ...((item.tags as Array<Record<string, unknown>> | undefined)?.map((tag) =>
      String(tag.name ?? tag.tagId ?? ""),
    ) ?? []),
    ...((item.categories as Array<Record<string, unknown>> | undefined)?.map((category) =>
      String(category.name ?? ""),
    ) ?? []),
  ].filter(Boolean);

  return {
    id: String(item.productCode ?? item.id ?? item.title),
    title: String(item.title ?? "Untitled Viator experience"),
    destination: String(
      destinations?.[0]?.ref ?? item.location ?? item.destinationName ?? "Viator destination",
    ),
    rating:
      Number(item.rating ?? reviews?.combinedAverageRating ?? reviews?.averageRating) || null,
    reviewCount:
      Number(item.reviewCount ?? reviews?.totalReviews ?? reviews?.combinedTotalReviews) ||
      null,
    price:
      Number(item.price ?? summary?.fromPrice ?? summary?.price ?? pricing?.fromPrice) || null,
    currency: String(summary?.currency ?? pricing?.currency ?? currency) as Currency,
    duration: String(
      item.durationLabel ??
        duration?.fixedDurationInMinutes ??
        duration?.variableDurationFromMinutes ??
        "Duration varies",
    ),
    productCode: String(item.productCode ?? "VIATOR"),
    productUrl: String(item.productUrl ?? item.webURL ?? "https://www.viator.com/"),
    image: String(
      variants?.[variants.length - 1]?.url ??
        firstImage?.url ??
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    ),
    tags: tags.slice(0, 4),
  };
}

function sortToViator(sortBy: SortBy) {
  if (sortBy === "rating") return "REVIEW_AVG_RATING";
  if (sortBy === "price") return "PRICE";
  return "RELEVANCE";
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<"discover" | "saved">("discover");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [intent, setIntent] = useState<SearchIntent | null>(null);
  const [products, setProducts] = useState<ViatorProduct[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ViatorProduct | null>(null);
  const [creatorCode, setCreatorCode] = useState("creator_demo");
  const [source, setSource] = useState("instagram");
  const [isSearching, setIsSearching] = useState(false);
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [requestPreview, setRequestPreview] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("creator-travel-links:saved");
    if (stored) setSavedLinks(JSON.parse(stored));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "creator-travel-links:saved",
      JSON.stringify(savedLinks),
    );
  }, [savedLinks]);

  const generatedUrl = useMemo(() => {
    if (!selectedProduct) return "";
    return buildReferralUrl(selectedProduct.productUrl, creatorCode, source);
  }, [creatorCode, selectedProduct, source]);

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1400);
  }

  function applyIntent(nextIntent: SearchIntent) {
    const city = nextIntent.destination.city || "Lisbon";
    const country = nextIntent.destination.country || "Portugal";

    setIntent(nextIntent);
    setFilters((current) => ({
      ...current,
      destination: `${city}${country ? `, ${country}` : ""}`,
      destinationId:
        nextIntent.destination.destinationId ??
        (city.toLowerCase() === "lisbon" ? 538 : current.destinationId),
      keywords: nextIntent.keywords.join(" "),
      category: nextIntent.categories[0] ?? current.category,
      lowestPrice: nextIntent.budget.min?.toString() ?? current.lowestPrice,
      highestPrice: nextIntent.budget.max?.toString() ?? current.highestPrice,
      currency: nextIntent.budget.currency,
      startDate: nextIntent.dateWindow.startDate ?? "",
      endDate: nextIntent.dateWindow.endDate ?? "",
    }));
  }

  async function searchProducts(useDemo = false) {
    setIsSearching(true);
    setError(null);
    setStatus("Destination detected. Extracting creator search intent...");

    try {
      let nextIntent = intent;

      if (!useDemo) {
        const agentResponse = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt }),
        });

        if (agentResponse.ok) {
          const agentData = await agentResponse.json();
          nextIntent = agentData.intent;
          applyIntent(nextIntent);
          setRequestPreview(agentData.viatorRequest ?? agentData.filters ?? null);
          setStatus("Keywords extracted. Viator request prepared...");
        } else {
          nextIntent = createFallbackIntent(prompt, filters);
          applyIntent(nextIntent);
          setStatus("AI helper unavailable. Preparing search from visible filters...");
        }
      } else {
        nextIntent = createFallbackIntent(prompt, filters);
        applyIntent(nextIntent);
      }

      const activeFilters = {
        ...filters,
        destinationId:
          nextIntent?.destination.destinationId ??
          filters.destinationId ??
          (filters.destination.toLowerCase().includes("lisbon") ? 538 : null),
        keywords: nextIntent?.keywords.join(" ") || filters.keywords,
        currency: nextIntent?.budget.currency || filters.currency,
        lowestPrice: nextIntent?.budget.min?.toString() ?? filters.lowestPrice,
        highestPrice: nextIntent?.budget.max?.toString() ?? filters.highestPrice,
        startDate: nextIntent?.dateWindow.startDate ?? filters.startDate,
        endDate: nextIntent?.dateWindow.endDate ?? filters.endDate,
      };

      if (useDemo) {
        setProducts(demoProducts);
        setAttractions(demoAttractions);
        setStatus("Results loaded from demo Viator-style experiences.");
        return;
      }

      const productResponse = await fetch("/api/viator/products/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationId: String(activeFilters.destinationId ?? 538),
          searchTerm: activeFilters.keywords,
          lowestPrice: activeFilters.lowestPrice ? Number(activeFilters.lowestPrice) : undefined,
          highestPrice: activeFilters.highestPrice ? Number(activeFilters.highestPrice) : undefined,
          startDate: activeFilters.startDate || undefined,
          endDate: activeFilters.endDate || undefined,
          sortBy: sortToViator(filters.sortBy),
          sortOrder: filters.sortBy === "price" ? "ASCENDING" : "DESCENDING",
          limit: 12,
          currency: activeFilters.currency,
        }),
      });

      if (!productResponse.ok) {
        throw new Error("Viator sandbox did not return product results.");
      }

      const productData = await productResponse.json();
      setProducts(
        (productData.products as Array<Record<string, unknown>>).map((product) =>
          normalizeProduct(product, activeFilters.currency),
        ),
      );
      setRequestPreview(productData.requestSent ?? null);

      const attractionResponse = await fetch("/api/viator/attractions/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationId: activeFilters.destinationId ?? 538 }),
      });

      if (attractionResponse.ok) {
        const attractionData = await attractionResponse.json();
        setAttractions(
          (attractionData.attractions as Array<Record<string, unknown>>)
            .slice(0, 6)
            .map((attraction) => ({
              id: String(attraction.attractionId ?? attraction.id ?? attraction.name),
              name: String(attraction.name ?? attraction.title ?? "Viator attraction"),
              destination: String(attraction.destinationName ?? ""),
            })),
        );
      }

      setStatus("Results loaded. Choose a product and generate a referral link.");
    } catch (searchError) {
      setProducts([]);
      setAttractions([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Viator sandbox is unavailable right now.",
      );
      setStatus("Use demo results to keep the creator flow moving.");
    } finally {
      setIsSearching(false);
    }
  }

  function saveGeneratedLink(product = selectedProduct, url = generatedUrl) {
    if (!product || !url) return;

    setSavedLinks((current) => [
      {
        id: `${product.productCode}-${Date.now()}`,
        productTitle: product.title,
        destination: product.destination,
        generatedUrl: url,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Plane className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">
                  Creator Travel Links
                </h1>
                <p className="text-sm text-muted-foreground">
                  Discover Viator experiences and turn them into share-ready links.
                </p>
              </div>
            </div>
          </div>

          <div className="flex rounded-md border border-border bg-background p-1">
            <Button
              size="sm"
              variant={activeSection === "discover" ? "default" : "ghost"}
              onClick={() => setActiveSection("discover")}
            >
              <Search className="mr-2 size-4" />
              Discover
            </Button>
            <Button
              size="sm"
              variant={activeSection === "saved" ? "default" : "ghost"}
              onClick={() => setActiveSection("saved")}
            >
              <Link2 className="mr-2 size-4" />
              Saved Links
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          {activeSection === "discover" ? (
            <>
              <section className="rounded-lg border border-border bg-card p-4 md:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">Discover</h2>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="creator-idea">Creator idea</Label>
                  <Textarea
                    id="creator-idea"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="min-h-24 resize-none"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={() => searchProducts(false)} disabled={isSearching}>
                      {isSearching ? "Finding links..." : "Find Viator links"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => searchProducts(true)}
                      disabled={isSearching}
                    >
                      Use demo results
                    </Button>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4 md:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Filter className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">Filters</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Destination">
                    <Input
                      value={filters.destination}
                      onChange={(event) =>
                        setFilters({ ...filters, destination: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Keywords">
                    <Input
                      value={filters.keywords}
                      onChange={(event) =>
                        setFilters({ ...filters, keywords: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Category">
                    <Input
                      value={filters.category}
                      onChange={(event) =>
                        setFilters({ ...filters, category: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Price range">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.lowestPrice}
                        onChange={(event) =>
                          setFilters({ ...filters, lowestPrice: event.target.value })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.highestPrice}
                        onChange={(event) =>
                          setFilters({ ...filters, highestPrice: event.target.value })
                        }
                      />
                    </div>
                  </Field>
                  <Field label="Currency">
                    <Select
                      value={filters.currency}
                      onValueChange={(value: Currency) =>
                        setFilters({ ...filters, currency: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Sort by">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value: SortBy) =>
                        setFilters({ ...filters, sortBy: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="relevance">Relevance</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </section>

              {status ? (
                <section className="rounded-lg border border-border bg-card p-4">
                  <h2 className="mb-3 text-sm font-semibold">Search Summary</h2>
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <SummaryItem text="Destination detected" done={Boolean(intent)} />
                    <SummaryItem text="Keywords extracted" done={Boolean(intent)} />
                    <SummaryItem text="Viator request prepared" done={Boolean(requestPreview)} />
                    <SummaryItem text="Results loaded" done={products.length > 0} />
                  </div>
                  <p className="mt-3 text-sm text-foreground">{status}</p>
                  {error ? (
                    <div className="mt-3 flex flex-col gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span>{error}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => searchProducts(true)}
                      >
                        Use demo results
                      </Button>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {attractions.length > 0 ? (
                <section className="rounded-lg border border-border bg-card p-4">
                  <button
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setIsInspirationOpen((value) => !value)}
                  >
                    <span className="font-semibold">Destination inspiration</span>
                    <ChevronDown
                      className={`size-4 transition-transform ${
                        isInspirationOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isInspirationOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex flex-wrap gap-2">
                          {attractions.map((attraction) => (
                            <Badge key={attraction.id} variant="secondary">
                              {attraction.name}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </section>
              ) : null}

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Viator results</h2>
                  <span className="text-sm text-muted-foreground">
                    {products.length ? `${products.length} products` : "No products yet"}
                  </span>
                </div>
                {isSearching ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-80 animate-pulse rounded-lg border border-border bg-card"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        onGenerate={() => {
                          setSelectedProduct(product);
                          setCreatorCode("creator_demo");
                          setSource("instagram");
                        }}
                        onSave={() =>
                          saveGeneratedLink(
                            product,
                            buildReferralUrl(
                              product.productUrl,
                              "creator_demo",
                              "instagram",
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-lg border border-border bg-card p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Saved Links</h2>
                <Badge variant="secondary">{savedLinks.length} saved</Badge>
              </div>
              {savedLinks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Generate and save a Viator referral link to see it here.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedLinks.map((link) => (
                    <div
                      key={link.id}
                      className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate font-medium">{link.productTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          {link.destination} -{" "}
                          {new Date(link.createdAt).toLocaleDateString()}
                        </p>
                        <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                          {link.generatedUrl}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyText(link.generatedUrl, link.id)}
                          aria-label="Copy saved link"
                        >
                          {copied === link.id ? (
                            <Check className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            setSavedLinks((current) =>
                              current.filter((item) => item.id !== link.id),
                            )
                          }
                          aria-label="Remove saved link"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <h2 className="font-semibold">Extracted Search Intent</h2>
            </div>
            <pre className="max-h-[420px] overflow-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
              {JSON.stringify(intent ?? createFallbackIntent(prompt, filters), null, 2)}
            </pre>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 font-semibold">Architecture</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              {[
                "Creator idea",
                "Search intent JSON",
                "Viator products/search",
                "Product cards",
                "Referral link",
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs text-foreground">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <Dialog open={Boolean(selectedProduct)} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generated referral link</DialogTitle>
            <DialogDescription>
              Add a creator code and source, then copy the share-ready Viator URL.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct ? (
            <div className="space-y-4">
              <Field label="Original productUrl">
                <Input readOnly value={selectedProduct.productUrl} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Creator tracking code">
                  <Input
                    value={creatorCode}
                    onChange={(event) => setCreatorCode(event.target.value)}
                  />
                </Field>
                <Field label="Campaign/source">
                  <Input
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Generated referral URL">
                <Textarea readOnly value={generatedUrl} className="min-h-24 font-mono text-xs" />
              </Field>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => copyText(generatedUrl, "modal-copy")}>
                  {copied === "modal-copy" ? (
                    <Check className="mr-2 size-4" />
                  ) : (
                    <Copy className="mr-2 size-4" />
                  )}
                  Copy
                </Button>
                <Button variant="outline" onClick={() => saveGeneratedLink()}>
                  <Link2 className="mr-2 size-4" />
                  Save link
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs uppercase tracking-normal text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SummaryItem({ text, done }: { text: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex size-5 items-center justify-center rounded-full ${
          done ? "bg-primary text-primary-foreground" : "bg-secondary"
        }`}
      >
        {done ? <Check className="size-3" /> : null}
      </span>
      <span>{text}</span>
    </div>
  );
}

function ProductCard({
  product,
  index,
  onGenerate,
  onSave,
}: {
  product: ViatorProduct;
  index: number;
  onGenerate: () => void;
  onSave: () => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-2 min-h-12 font-semibold">{product.title}</h3>
          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span className="truncate">{product.destination}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Info
            icon={<Star className="size-4 fill-warning text-warning" />}
            text={
              product.rating
                ? `${product.rating} (${product.reviewCount ?? 0})`
                : "No rating yet"
            }
          />
          <Info
            icon={<CalendarDays className="size-4" />}
            text={product.duration}
          />
          <Info
            icon={<Link2 className="size-4" />}
            text={product.productCode}
          />
          <Info
            icon={<Sparkles className="size-4" />}
            text={
              product.price
                ? `${product.currency} ${product.price.toFixed(0)}`
                : product.currency
            }
          />
        </div>

        {product.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <p className="truncate font-mono text-xs text-muted-foreground">
          {product.productUrl}
        </p>

        <div className="grid gap-2">
          <Button onClick={onGenerate}>Generate referral link</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(product.productUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-2 size-4" />
              Open
            </Button>
            <Button variant="outline" onClick={onSave}>
              <Link2 className="mr-2 size-4" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-background px-2 py-1.5 text-muted-foreground">
      {icon}
      <span className="truncate">{text}</span>
    </div>
  );
}
