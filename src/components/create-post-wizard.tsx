"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { id } from "@instantdb/react";
import { ArrowLeft, Bot, Check, Copy, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/instant";
import { makeShortCode } from "@/lib/affiliate";
import type { SavedDeal } from "@/lib/post-types";
import type { ViatorProduct } from "@/lib/types";
import { cn, generateReferralUrl } from "@/lib/utils";
import { productToSlotInput, savedDealToSlotInput, slugify, usernameFromEmail } from "@/lib/posts";

type WorkingSlot = {
  localId: string;
  label: string;
  source: "saved_deal" | "ai_alternative";
  deal?: SavedDeal;
  product?: ViatorProduct;
};

type CreatePostTx =
  | ReturnType<(typeof db.tx.creator_posts)[string]["update"]>
  | ReturnType<(typeof db.tx.post_slots)[string]["update"]>
  | ReturnType<(typeof db.tx.affiliate_links)[string]["update"]>;

export function CreatePostWizard() {
  const router = useRouter();
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [username, setUsername] = useState(usernameFromEmail(auth.user?.email));
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [slots, setSlots] = useState<WorkingSlot[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [comparison, setComparison] = useState("");

  const profileQuery = db.useQuery(userId ? { $users: {} } : null);
  const dealsQuery = db.useQuery(
    userId
      ? {
          saved_deals: {
            $: { where: { userId }, order: { createdAt: "desc" } },
          },
        }
      : null,
  );
  const profile = profileQuery.data?.$users?.find((user) => user.id === userId);
  const savedDeals = (dealsQuery.data?.saved_deals ?? []) as SavedDeal[];
  const hasUsername = !!profile?.username;
  const canSave = !!title.trim() && slots.length >= 2 && slots.length <= 5 && (!isPublic || hasUsername || !!username.trim());

  const coverOptions = useMemo(
    () => slots.map((slot) => slot.deal?.productImageUrl || slot.product?.images?.[0]?.variants?.[0]?.url || "").filter(Boolean),
    [slots],
  );

  function addSavedDeal(dealId: string) {
    if (slots.length >= 5) return;
    const deal = savedDeals.find((item) => item.id === dealId);
    if (!deal) return;
    setSlots((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        label: `Option ${prev.length + 1}`,
        source: "saved_deal",
        deal,
      },
    ]);
    if (!coverImageUrl && deal.productImageUrl) setCoverImageUrl(deal.productImageUrl);
  }

  async function generateAlternatives(seed: SavedDeal) {
    if (slots.length >= 5) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/posts/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedProduct: seed, context: title || description }),
      });
      const data = await res.json();
      const alternatives = (data.alternatives ?? []) as ViatorProduct[];
      setSlots((prev) => [
        ...prev,
        ...alternatives.slice(0, Math.max(0, 5 - prev.length)).map((product, index) => ({
          localId: crypto.randomUUID(),
          label: `AI alt ${index + 1}`,
          source: "ai_alternative" as const,
          product,
        })),
      ]);
      if (alternatives.length === 0) setMessage("No Viator alternatives found for that seed.");
    } finally {
      setBusy(false);
    }
  }

  async function savePost() {
    if (!userId || !canSave) return;
    setBusy(true);
    try {
      if (isPublic && !hasUsername) {
        await db.transact(db.tx.$users[userId].update({ username: slugify(username).replace(/-/g, "_") }));
      }

      const postId = id();
      const now = new Date().toISOString();
      const postSlug = `${slugify(title)}-${postId.slice(0, 6)}`;
      const creatorCode = profile?.username || username || usernameFromEmail(auth.user?.email);

      const chunks: CreatePostTx[] = [
        db.tx.creator_posts[postId].update({
          userId,
          title,
          slug: postSlug,
          description,
          coverImageUrl: coverImageUrl || coverOptions[0] || "",
          isPublic,
          createdAt: now,
          updatedAt: now,
        }),
      ];

      slots.forEach((slot, index) => {
        const slotId = id();
        const linkId = id();
        const shortCode = makeShortCode(slot.deal?.viatorProductId ?? slot.product?.productCode ?? slotId);
        const slotData = slot.deal
          ? savedDealToSlotInput(slot.deal, {
              userId,
              postId,
              slotIndex: index,
              label: slot.label,
              isPublic,
            })
          : productToSlotInput(slot.product!, {
              userId,
              postId,
              slotIndex: index,
              label: slot.label,
              source: "ai_alternative",
              destination: "",
              isPublic,
            });
        const productUrl = slotData.productUrl;

        chunks.push(
          db.tx.post_slots[slotId].update(slotData),
          db.tx.affiliate_links[linkId].update({
            linkId,
            userId,
            postId,
            slotId,
            slotLabel: slot.label,
            viatorProductId: slotData.viatorProductId,
            shortCode,
            affiliateUrl: generateReferralUrl(productUrl, creatorCode, "post_slot"),
            destinationUrl: productUrl,
            productTitle: slotData.productTitle,
            productImageUrl: slotData.productImageUrl,
            productPrice: slotData.price,
            productCurrency: slotData.currency,
            productRating: slotData.rating,
            reviewCount: slotData.reviewCount,
            campaignSource: "post_slot",
            creatorCode,
            active: true,
            createdAt: now,
          }),
        );
      });

      await db.transact(chunks);
      router.push("/posts");
    } finally {
      setBusy(false);
    }
  }

  async function generateComparison() {
    const products = slots.map((slot) => ({
      label: slot.label,
      productTitle: slot.deal?.productTitle ?? slot.product?.title ?? "",
      price: slot.deal?.price ?? slot.product?.pricing?.summary?.fromPrice,
      currency: slot.deal?.currency ?? slot.product?.pricing?.currency,
      rating: slot.deal?.rating ?? slot.product?.reviews?.combinedAverageRating,
      shortUrl: "Generated after saving",
    }));
    const res = await fetch("/api/posts/comparison", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, products }),
    });
    const data = await res.json();
    setComparison(data.copy ?? "");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/posts" className="p-2 rounded-full hover:bg-surface-alt">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Post</h1>
          <p className="text-sm text-muted">Build a creator post with 2-5 tracked Viator alternatives.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3].map((item) => (
          <button
            key={item}
            onClick={() => setStep(item)}
            className={cn("h-2 flex-1 rounded-full", step >= item ? "bg-accent" : "bg-border")}
            title={`Step ${item}`}
          />
        ))}
      </div>

      {step === 1 && (
        <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Top 3 Snorkeling Spots in Koh Tao Under $50"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short caption or creator context"
            className="w-full min-h-28 rounded-2xl border border-border bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Publish to link-in-bio when saved
          </label>
          {isPublic && !hasUsername && (
            <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 space-y-2">
              <div className="text-sm font-semibold">Choose your public username</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          )}
          <button onClick={() => setStep(2)} disabled={!title.trim()} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="grid lg:grid-cols-[320px_1fr] gap-5">
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
            <h2 className="font-semibold">Saved deals</h2>
            <select onChange={(e) => addSavedDeal(e.target.value)} value="" className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm">
              <option value="">Pick saved deal</option>
              {savedDeals.map((deal) => (
                <option key={deal.id} value={deal.id}>{deal.productTitle}</option>
              ))}
            </select>
            <p className="text-xs text-muted">Need at least 2 slots. Use a saved deal as a seed for AI alternatives.</p>
          </div>
          <div className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.localId} className="rounded-2xl border border-border bg-surface p-4 flex gap-3">
                {(slot.deal?.productImageUrl || slot.product?.images?.[0]?.variants?.[0]?.url) && (
                  <img src={slot.deal?.productImageUrl || slot.product?.images?.[0]?.variants?.[0]?.url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <input
                    value={slot.label}
                    onChange={(e) => setSlots((prev) => prev.map((item) => item.localId === slot.localId ? { ...item, label: e.target.value } : item))}
                    className="mb-1 w-full rounded-lg bg-surface-alt px-2 py-1 text-xs font-semibold"
                  />
                  <div className="font-medium text-sm line-clamp-2">{slot.deal?.productTitle ?? slot.product?.title}</div>
                  <div className="text-xs text-muted">{slot.source === "saved_deal" ? "Saved deal" : "AI alternative"}</div>
                  {slot.deal && (
                    <button onClick={() => generateAlternatives(slot.deal!)} disabled={busy || slots.length >= 5} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1 text-xs font-semibold text-accent disabled:opacity-50">
                      <Bot className="w-3 h-3" />
                      Generate 2 similar
                    </button>
                  )}
                </div>
                <button onClick={() => setSlots((prev) => prev.filter((item) => item.localId !== slot.localId))} className="p-2 text-muted hover:text-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {message && <p className="text-sm text-warning">{message}</p>}
            <button onClick={() => setStep(3)} disabled={slots.length < 2 || slots.length > 5} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              Preview post
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-muted">{description}</p>
            {coverOptions.length > 0 && (
              <select value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
                <option value="">Auto cover image</option>
                {coverOptions.map((url) => <option key={url} value={url}>{url.slice(0, 70)}</option>)}
              </select>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {slots.map((slot) => (
              <div key={slot.localId} className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs font-semibold text-accent">{slot.label}</div>
                <div className="font-semibold">{slot.deal?.productTitle ?? slot.product?.title}</div>
                <div className="text-sm text-muted">{slot.deal?.currency ?? slot.product?.pricing?.currency ?? "USD"} {(slot.deal?.price ?? slot.product?.pricing?.summary?.fromPrice ?? 0).toFixed(0)}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={generateComparison} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-alt">
              <Sparkles className="w-4 h-4" />
              Best vs Budget
            </button>
            <button onClick={savePost} disabled={!canSave || busy} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              <Check className="w-4 h-4" />
              {busy ? "Saving..." : "Save post"}
            </button>
          </div>
          {comparison && (
            <div className="grid lg:grid-cols-[1fr_320px] gap-4">
              <textarea value={comparison} readOnly className="min-h-40 rounded-2xl border border-border bg-surface p-4 text-sm" />
              <div className="rounded-3xl bg-foreground text-background p-5 aspect-square flex flex-col justify-between">
                <div className="text-xs uppercase tracking-wider opacity-70">Best vs Budget</div>
                <div>
                  <div className="text-2xl font-bold leading-tight">{title || "Travel picks"}</div>
                  <p className="mt-3 text-sm opacity-80">Two Viator options for your next post.</p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm"><Copy className="w-4 h-4" />Ready to copy</div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
