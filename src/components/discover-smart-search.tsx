"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, AlertTriangle, ArrowRight, Loader2, List, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bestImageUrl } from "@/lib/utils";
import { db } from "@/lib/instant";

export function DiscoverSmartSearch() {
  const router = useRouter();
  const auth = db.useAuth();
  const userId = auth.user?.id;

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>("");

  const [bundle, setBundle] = useState<{
    type: "simple" | "itinerary";
    title: string;
    niche: string;
    products: any[];
  } | null>(null);

  const [creating, setCreating] = useState(false);

  async function handleSearch() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setBundle(null);

    try {
      setStep("Understanding your request...");
      const intentRes = await fetch("/api/ai/extract-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      if (!intentRes.ok) throw new Error("Failed to extract intent");
      const intent = await intentRes.json();

      setStep("Searching for the best experiences...");
      
      const allProducts: any[] = [];
      
      // We can search all queries in parallel
      const searchPromises = intent.queries.map(async (q: any) => {
        try {
          const res = await fetch("/api/providers/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: q.query,
              destination: q.destination,
              maxPrice: q.maxPrice,
              keywords: q.keywords,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            // Take the top 3 best matching products per query for the bundle
            const topProducts = (data.products || []).slice(0, 3);
            return topProducts.map((p: any) => ({ product: p, query: q }));
          }
        } catch (e) {
          console.error("Provider search error for query", q, e);
        }
        return [];
      });

      const results = await Promise.all(searchPromises);
      results.forEach((r) => allProducts.push(...r));

      if (allProducts.length === 0) {
        setError("No products found for this search. Try modifying your prompt.");
        setLoading(false);
        return;
      }

      setBundle({
        type: intent.type || "simple",
        title: intent.suggestedCampaignTitle || "New Content Bundle",
        niche: intent.suggestedNiche || "Travel",
        products: allProducts,
      });

    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  async function handleCreateContent() {
    if (!bundle) return;
    setCreating(true);
    setError(null);

    try {
      // In a real app we would get userId from auth, but here we'll assume it's handled in a wrapper or passed down
      // Alternatively, we get userId on the server. Actually wait, we should pass userId if possible.
      // But we can get it from db.useAuth()
      // Let's assume we can fetch it or the API will handle if missing. The API needs userId.
      // Let's pass a dummy for now or better, get it from Instant Auth.
      
      const { db } = await import("@/lib/instant");
      // Better: we can require userId as prop if we want, but for now we'll rely on the API to check or pass what we can.
      // We will pass an empty userId string and let the server complain if needed, but it should be fixed.
      // Wait, let's just do a fetch and see.
      
      const res = await fetch("/api/campaigns/from-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || localStorage.getItem("temp_user_id"), // fallback
          title: bundle.title,
          niche: bundle.niche,
          products: bundle.products,
          grouping: bundle.type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create content");
      }

      const result = await res.json();
      
      if (result.type === "itinerary") {
        router.push(`/campaigns/${result.campaignId}?tab=content`);
      } else {
        router.push(`/posts/${result.postId}`);
      }
      
    } catch (e: any) {
      setError(e.message || "Failed to create content");
      setCreating(false);
    }
  }

  // Group products for display
  const groupedProducts = bundle?.products.reduce((acc: any, item: any) => {
    const label = bundle.type === "itinerary" ? (item.query?.destinationDayLabel || item.query?.destination || "General") : "Products";
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Smart Discover</h1>
        <p className="text-muted text-lg max-w-xl mx-auto">
          Describe the content you want to create, and our AI will build a complete campaign or post bundle for you.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'A romantic weekend in Paris under $500' or 'Best budget espresso machines'"
          className="w-full min-h-[120px] p-4 rounded-xl bg-surface-alt border border-border resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground"
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            AI-powered search
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !prompt.trim()}
            className="bg-accent text-white px-6 py-2.5 rounded-full font-semibold hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? step : "Find & Create Bundle"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-warning/10 border border-warning/20 text-warning p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <AnimatePresence>
        {bundle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-2xl font-bold">{bundle.title}</h2>
                <div className="flex items-center gap-3 text-sm text-muted mt-1">
                  <span className="flex items-center gap-1">
                    {bundle.type === "itinerary" ? <Calendar className="w-4 h-4" /> : <List className="w-4 h-4" />}
                    {bundle.type === "itinerary" ? "Campaign Itinerary" : "Simple Post List"}
                  </span>
                  <span>•</span>
                  <span>Niche: {bundle.niche}</span>
                  <span>•</span>
                  <span>{bundle.products.length} products found</span>
                </div>
              </div>
              <button
                onClick={handleCreateContent}
                disabled={creating}
                className="bg-foreground text-background px-6 py-3 rounded-full font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Content"}
                {!creating && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-8">
              {Object.entries(groupedProducts || {}).map(([label, items]: [string, any]) => (
                <div key={label} className="space-y-4">
                  <h3 className="text-lg font-semibold border-l-2 border-accent pl-3">{label}</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(({ product }: any, idx: number) => (
                      <div key={`${product.id}-${idx}`} className="bg-surface border border-border rounded-xl p-3 flex gap-3 hover:border-accent/50 transition-colors">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-alt flex-shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-xs text-muted">No img</div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 leading-tight">{product.title}</h4>
                          <div className="text-xs text-muted mt-1 flex items-center gap-2">
                            <span className="font-semibold text-foreground">${product.price}</span>
                            <span className="px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent font-medium text-[10px] capitalize">
                              {product.provider}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function useAuth(): { user: any; } {
  throw new Error("Function not implemented.");
}

