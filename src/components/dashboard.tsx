"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { Search, Sparkles, AlertTriangle, ChevronLeft, ChevronRight, Grid3X3, List, Star, Clock, Link2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { id } from "@instantdb/react";
import type { SearchIntent, SearchStep, ViatorProduct, ViatorAttraction, ViatorSearchResponse } from "@/lib/types";
import { db } from "@/lib/instant";
import { affiliateUrlFor, makeShortCode, productSnapshot } from "@/lib/affiliate";
import { bestImageUrl, cn, dealScore, formatDuration } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { ReferralModal } from "./referral-modal";
import { SearchIntentPanel } from "./search-intent-panel";
import { ArchitecturePanel } from "./architecture-panel";
import { DestinationInspiration } from "./destination-inspiration";

const EXAMPLE_PROMPTS = [
  "Spa and wellness in Lisbon for a Mother's Day post",
  "Sunset tours in Santorini for Instagram reels",
  "Adventure activities in Bali under $50",
  "Food tours in Tokyo for a travel vlog",
  "Wine tasting in Paris for couples content",
];

export function Dashboard() {
  const auth = db.useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<SearchIntent | null>(null);
  const [products, setProducts] = useState<ViatorProduct[]>([]);
  const [attractions, setAttractions] = useState<ViatorAttraction[]>([]);
  const [steps, setSteps] = useState<SearchStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<ViatorProduct | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const userId = auth.user?.id;
  const savedDeals = db.useQuery(
    userId
      ? {
          saved_deals: {
            $: {
              where: { userId },
            },
          },
        }
      : null,
  );
  const affiliateLinks = db.useQuery(
    userId
      ? {
          affiliate_links: {
            $: {
              where: { userId },
            },
          },
        }
      : null,
  );

  const savedIds = useMemo(
    () => new Set((savedDeals.data?.saved_deals ?? []).map((deal) => deal.viatorProductId)),
    [savedDeals.data?.saved_deals],
  );
  const linkedIds = useMemo(
    () => new Set((affiliateLinks.data?.affiliate_links ?? []).map((link) => link.viatorProductId)),
    [affiliateLinks.data?.affiliate_links],
  );
  const scoredProducts = useMemo(() => {
    const prices = products
      .map((product) => product.pricing?.summary?.fromPrice)
      .filter((price): price is number => typeof price === "number" && price > 0);
    const avgPrice = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
    return products
      .map((product) => ({
        ...product,
        dealScore: dealScore(
          product.pricing?.summary?.fromPrice,
          product.reviews?.combinedAverageRating,
          avgPrice,
        ),
      }))
      .sort((a, b) => (b.dealScore ?? 0) - (a.dealScore ?? 0));
  }, [products]);
  const bestDeals = useMemo(() => scoredProducts.slice(0, 5), [scoredProducts]);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setProducts([]);
    setAttractions([]);
    setIntent(null);

    setSteps([
      { label: "Understanding your idea", status: "active" },
      { label: "Extracting search filters", status: "pending" },
      { label: "Searching experiences", status: "pending" },
      { label: "Curating results", status: "pending" },
    ]);

    try {
      const agentRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      const agentData: SearchIntent = await agentRes.json();
      setIntent(agentData);

      setSteps([
        { label: "Destination detected", status: "done", detail: agentData.destination },
        { label: "Keywords extracted", status: "done", detail: agentData.keywords.slice(0, 3).join(", ") },
        { label: "Searching experiences", status: "active" },
        { label: "Curating results", status: "pending" },
      ]);

      const searchRes = await fetch("/api/viator/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerm: agentData.searchTerm,
          destinationId: agentData.destinationId,
          maxPrice: agentData.maxPrice,
          groupType: agentData.groupType,
          currency: "USD",
        }),
      });
      const searchData: ViatorSearchResponse = await searchRes.json();
      const searchProducts = Array.isArray(searchData.products)
        ? searchData.products
        : searchData.products?.results ?? [];

      if (searchData.error || (searchProducts.length === 0 && searchData.attractions.length === 0)) {
        setSteps([
          { label: "Destination detected", status: "done", detail: agentData.destination },
          { label: "Keywords extracted", status: "done", detail: agentData.keywords.slice(0, 3).join(", ") },
          { label: "Search completed", status: "done" },
          { label: searchData.error ? "Provider unavailable" : "No results found", status: "error" },
        ]);
        setError(searchData.error
          ? "The Viator provider returned an error. Please try again in a moment."
          : "No experiences found for this search. Try different keywords.");
      } else {
        const enriched = searchProducts
          .filter((p) => {
            const price = p.pricing?.summary?.fromPrice;
            return !agentData.maxPrice || price == null || price <= agentData.maxPrice;
          })
          .map((p) => ({ ...p, provider: "viator" }));
        setProducts(enriched);
        setAttractions(searchData.attractions);
        setSteps([
          { label: "Destination detected", status: "done", detail: agentData.destination },
          { label: "Keywords extracted", status: "done", detail: agentData.keywords.slice(0, 3).join(", ") },
          { label: "Search completed", status: "done" },
          { label: `${enriched.length} experiences found`, status: "done" },
        ]);
      }
    } catch {
      setSteps((prev) => prev.map((s) => s.status === "active" ? { ...s, status: "error" as const } : s));
      setError("Something went wrong. Try again in a moment.");
    }

    setLoading(false);
  }, [query]);

  async function generateAffiliateLink(product: ViatorProduct, creatorCode: string, campaignSource: string) {
    if (!userId) return;
    const existing = affiliateLinks.data?.affiliate_links.find((link) => link.viatorProductId === product.productCode);
    if (existing) return;

    const linkId = id();
    const shortCode = makeShortCode(product.productCode);
    const snapshot = productSnapshot(product);
    await db.transact(
      db.tx.affiliate_links[linkId].update({
        linkId,
        userId,
        viatorProductId: product.productCode,
        shortCode,
        affiliateUrl: affiliateUrlFor(product, creatorCode, campaignSource),
        destinationUrl: product.productUrl ?? "",
        productTitle: snapshot.productTitle,
        productImageUrl: snapshot.productImageUrl,
        productPrice: snapshot.price,
        productCurrency: snapshot.currency,
        productRating: snapshot.rating,
        reviewCount: snapshot.reviewCount,
        campaignSource,
        creatorCode,
        active: true,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  async function handleSaveFromModal(product: ViatorProduct, creatorCode: string, campaignSource: string) {
    await Promise.all([
      handleQuickSave(product),
      generateAffiliateLink(product, creatorCode, campaignSource),
    ]);
  }

  async function handleQuickSave(product: ViatorProduct) {
    if (!userId || savedIds.has(product.productCode)) return;
    const createdAt = new Date().toISOString();
    const snapshot = productSnapshot(product);
    await db.transact(
      db.tx.saved_deals[id()].update({
        userId,
        viatorProductId: product.productCode,
        notes: "",
        productTitle: snapshot.productTitle,
        productUrl: snapshot.productUrl,
        productImageUrl: snapshot.productImageUrl,
        destination: intent?.destination ?? "",
        price: snapshot.price,
        currency: snapshot.currency,
        rating: snapshot.rating,
        reviewCount: snapshot.reviewCount,
        provider: snapshot.provider,
        createdAt,
      }),
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-5 px-6">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight leading-tight"
        >
          Find experiences,<br />
          <span className="text-accent">share with your audience</span>
        </motion.h1>
        <p className="text-muted text-base max-w-lg mx-auto leading-relaxed">
          Discover travel experiences worldwide, then generate referral-ready links in seconds.
        </p>

        {/* Search bar */}
        <div className="flex max-w-2xl mx-auto gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="What kind of experience are you looking for?"
              className="w-full pl-12 pr-4 py-3.5 rounded-full border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-muted/50 shadow-sm"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 bg-accent text-white font-semibold rounded-full px-6 py-3.5 hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {/* Example prompts */}
        {products.length === 0 && !loading && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => { setQuery(p); handleSearch(p); }}
                className="text-xs bg-surface-alt hover:bg-border/40 text-muted px-4 py-2 rounded-full transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 inline mr-1.5 text-accent" />
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 space-y-6">
        <ArchitecturePanel />
        <SearchIntentPanel intent={intent} steps={steps} />
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-6 rounded-2xl border border-warning/30 bg-warning/5 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {bestDeals.length > 0 && (
        <Carousel label="Best deals">
          {bestDeals.map((p, i) => (
            <ProductCard
              key={p.productCode}
              product={p}
              index={i}
              onGenerateLink={setModalProduct}
              onSave={handleQuickSave}
              isSaved={savedIds.has(p.productCode)}
              hasLink={linkedIds.has(p.productCode)}
            />
          ))}
        </Carousel>
      )}

      {scoredProducts.length > 0 && (
        <section className="space-y-4 px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">All Viator results</h2>
              <p className="text-sm text-muted">
                {scoredProducts.length} experiences
                {intent?.maxPrice ? ` under $${intent.maxPrice}` : ""}
                {intent?.groupType ? ` for ${intent.groupType}` : ""}
              </p>
            </div>
            <div className="flex rounded-full border border-border bg-surface p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-2 rounded-full transition-colors cursor-pointer", viewMode === "grid" ? "bg-accent text-white" : "text-muted hover:bg-surface-alt")}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-full transition-colors cursor-pointer", viewMode === "list" ? "bg-accent text-white" : "text-muted hover:bg-surface-alt")}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {scoredProducts.map((p, i) => (
                <ProductCard
                  key={p.productCode}
                  product={p}
                  index={i}
                  onGenerateLink={setModalProduct}
                  onSave={handleQuickSave}
                  isSaved={savedIds.has(p.productCode)}
                  hasLink={linkedIds.has(p.productCode)}
                  layout="grid"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {scoredProducts.map((p, i) => (
                <ProductListRow
                  key={p.productCode}
                  product={p}
                  index={i}
                  onGenerateLink={setModalProduct}
                  onSave={handleQuickSave}
                  isSaved={savedIds.has(p.productCode)}
                  hasLink={linkedIds.has(p.productCode)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Destination inspiration */}
      {attractions.length > 0 && (
        <div className="px-6">
          <DestinationInspiration attractions={attractions} />
        </div>
      )}

      {/* Modal */}
      <ReferralModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onGenerate={handleSaveFromModal}
      />
    </div>
  );
}

// ── Horizontal scroll carousel ──

function Carousel({ label, children }: { label: string; children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-6">
        <h2 className="text-xl font-semibold">{label}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => scroll("left")} className="p-2 rounded-full border border-border hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="p-2 rounded-full border border-border hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-5 overflow-x-auto scrollbar-hide px-6 pb-2">
        {children}
      </div>
    </div>
  );
}

function ProductListRow({
  product,
  index,
  onGenerateLink,
  onSave,
  isSaved,
  hasLink,
}: {
  product: ViatorProduct;
  index: number;
  onGenerateLink: (p: ViatorProduct) => void;
  onSave: (p: ViatorProduct) => void;
  isSaved: boolean;
  hasLink: boolean;
}) {
  const img = bestImageUrl(product.images);
  const price = product.pricing?.summary?.fromPrice;
  const currency = product.pricing?.currency ?? "USD";
  const rating = product.reviews?.combinedAverageRating ?? 0;
  const reviews = product.reviews?.totalReviews ?? 0;
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="grid md:grid-cols-[180px_1fr_auto] gap-4 rounded-2xl border border-border bg-surface p-3"
    >
      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-alt">
        {img ? (
          <img src={img} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-muted">No image</div>
        )}
      </div>

      <div className="min-w-0 space-y-2 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#3B7A57]/10 text-[#3B7A57]">Viator</span>
          {(product.dealScore ?? 0) > 0 && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-accent/10 text-accent">
              Deal score {Math.round((product.dealScore ?? 0) * 100)}
            </span>
          )}
        </div>
        <h3 className="font-semibold leading-snug">{product.title}</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(product.duration)}
          </span>
          {rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)} ({reviews})
            </span>
          )}
          {price != null && (
            <span className="font-semibold text-foreground">
              From {currencySymbol}{price.toFixed(0)}
            </span>
          )}
        </div>
      </div>

      <div className="flex md:flex-col gap-2 md:items-stretch justify-end">
        <button
          onClick={() => onSave(product)}
          disabled={isSaved}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors cursor-pointer",
            isSaved ? "bg-success/10 text-success cursor-default" : "bg-surface-alt text-muted hover:bg-border/50",
          )}
        >
          <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
          {isSaved ? "Saved" : "Save"}
        </button>
        <button
          onClick={() => onGenerateLink(product)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors cursor-pointer"
        >
          <Link2 className="w-4 h-4" />
          {hasLink ? "View Link" : "Generate"}
        </button>
      </div>
    </motion.div>
  );
}
