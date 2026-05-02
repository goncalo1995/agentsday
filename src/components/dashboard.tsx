"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Search, Sparkles, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { SearchIntent, SearchStep, ViatorProduct, ViatorAttraction, SavedLink, ViatorSearchResponse } from "@/lib/types";
import { DEMO_PRODUCTS, DEMO_ATTRACTIONS } from "@/lib/demo-data";
import { generateReferralUrl, generateShortLink, simulateClicks, simulateCommission, bestImageUrl } from "@/lib/utils";
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

function getSavedLinks(): SavedLink[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("creator_saved_links") || "[]"); }
  catch { return []; }
}

function persistSavedLinks(links: SavedLink[]) {
  localStorage.setItem("creator_saved_links", JSON.stringify(links));
}

/** Group products by their first known tag for carousel sections */
function groupByCategory(products: ViatorProduct[], tagNames: Record<string, string>): { label: string; items: ViatorProduct[] }[] {
  if (products.length <= 6) return [{ label: "Experiences", items: products }];

  const tagGroups = new Map<string, ViatorProduct[]>();
  const ungrouped: ViatorProduct[] = [];

  for (const p of products) {
    const firstTag = p.tags?.[0];
    if (firstTag) {
      const name = tagNames[String(firstTag)] ?? null;
      if (name) {
        if (!tagGroups.has(name)) tagGroups.set(name, []);
        tagGroups.get(name)!.push(p);
      } else {
        ungrouped.push(p);
      }
    } else {
      ungrouped.push(p);
    }
  }

  const groups: { label: string; items: ViatorProduct[] }[] = [];
  for (const [label, items] of tagGroups) {
    if (items.length >= 2) groups.push({ label, items });
    else ungrouped.push(...items);
  }
  if (ungrouped.length > 0) groups.push({ label: "More experiences", items: ungrouped });
  return groups.length > 0 ? groups : [{ label: "Experiences", items: products }];
}

export function Dashboard() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<SearchIntent | null>(null);
  const [products, setProducts] = useState<ViatorProduct[]>([]);
  const [attractions, setAttractions] = useState<ViatorAttraction[]>([]);
  const [steps, setSteps] = useState<SearchStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<ViatorProduct | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(getSavedLinks().map((l) => l.productCode)));
  const [showDemo, setShowDemo] = useState(false);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});

  // Fetch tag names once on mount
  useEffect(() => {
    fetch("/api/viator/tags")
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === "object") setTagNames(data); })
      .catch(() => {});
  }, []);

  const carouselGroups = useMemo(() => groupByCategory(products, tagNames), [products, tagNames]);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setProducts([]);
    setAttractions([]);
    setIntent(null);
    setShowDemo(false);

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
          currency: "USD",
        }),
      });
      const searchData: ViatorSearchResponse = await searchRes.json();

      if (searchData.error || searchData.products.length === 0) {
        setSteps([
          { label: "Destination detected", status: "done", detail: agentData.destination },
          { label: "Keywords extracted", status: "done", detail: agentData.keywords.slice(0, 3).join(", ") },
          { label: "Search completed", status: "done" },
          { label: searchData.error ? "Provider unavailable" : "No results found", status: "error" },
        ]);
        setError(searchData.error
          ? "The experience provider returned an error. Try demo results to explore the interface."
          : "No experiences found for this search. Try different keywords.");
      } else {
        // Attach provider to each product
        const enriched = searchData.products.map((p) => ({ ...p, provider: "viator" }));
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
      setError("Something went wrong. Try again or explore demo results.");
    }

    setLoading(false);
  }, [query]);

  function loadDemoResults() {
    setProducts(DEMO_PRODUCTS);
    setAttractions(DEMO_ATTRACTIONS);
    setShowDemo(true);
    setError(null);
    setSteps((prev) =>
      prev.map((s, i) =>
        i === prev.length - 1 ? { label: `${DEMO_PRODUCTS.length} demo experiences loaded`, status: "done" as const } : s
      )
    );
  }

  function handleSaveFromModal(product: ViatorProduct, referralUrl: string, creatorCode?: string, campaignSource?: string) {
    const links = getSavedLinks();
    if (links.some((l) => l.productCode === product.productCode)) return;
    const price = product.pricing?.summary?.fromPrice ?? 0;
    const createdAt = new Date().toISOString();
    const clicks = simulateClicks(createdAt);
    const newLink: SavedLink = {
      id: crypto.randomUUID(),
      productTitle: product.title,
      productCode: product.productCode,
      destination: intent?.destination ?? "",
      referralUrl,
      productUrl: product.productUrl ?? "",
      shortLink: generateShortLink(product.productCode),
      createdAt,
      clickCount: clicks,
      estimatedCommission: simulateCommission(price, clicks),
      price,
      currency: product.pricing?.currency ?? "USD",
      rating: product.reviews?.combinedAverageRating ?? 0,
      reviewCount: product.reviews?.totalReviews ?? 0,
      imageUrl: bestImageUrl(product.images),
      viatorTags: product.tags ?? [],
      customTags: [],
      campaignSource: campaignSource ?? "instagram",
      creatorCode: creatorCode ?? "creator_demo",
      status: "draft",
      provider: product.provider ?? "viator",
    };
    persistSavedLinks([newLink, ...links]);
    setSavedIds((prev) => new Set(prev).add(product.productCode));
  }

  function handleQuickSave(product: ViatorProduct) {
    const referralUrl = generateReferralUrl(product.productUrl ?? "", "creator_demo", "instagram");
    handleSaveFromModal(product, referralUrl, "creator_demo", "instagram");
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
            <button onClick={loadDemoResults} className="mt-2 text-sm font-semibold text-accent hover:underline cursor-pointer">
              Explore demo results →
            </button>
          </div>
        </motion.div>
      )}

      {/* Demo badge */}
      {showDemo && (
        <div className="text-center text-xs text-muted bg-surface-alt rounded-full py-2 mx-6">
          Showing demo results — connect your API key for live data
        </div>
      )}

      {/* Carousels */}
      {carouselGroups.map((group) => (
        <Carousel key={group.label} label={group.label}>
          {group.items.map((p, i) => (
            <ProductCard
              key={p.productCode}
              product={p}
              index={i}
              onGenerateLink={setModalProduct}
              onSave={handleQuickSave}
              isSaved={savedIds.has(p.productCode)}
            />
          ))}
        </Carousel>
      ))}

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
        onSave={handleSaveFromModal}
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
