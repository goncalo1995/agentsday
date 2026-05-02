"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, ExternalLink, FileText, Sparkles } from "lucide-react";
import { db } from "@/lib/instant";
import type { AffiliateLink, ClickLog, CreatorPost, PostSlot } from "@/lib/post-types";
import { cn } from "@/lib/utils";
import { postStats } from "@/lib/posts";
import { shortUrlFor } from "@/lib/affiliate";

export function PostDetailPage({ postId }: { postId: string }) {
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [comparison, setComparison] = useState("");

  const postsQuery = db.useQuery(userId ? { creator_posts: { $: { where: { userId, id: postId }, limit: 1 } } } : null);
  const slotsQuery = db.useQuery(userId ? { post_slots: { $: { where: { userId, postId }, order: { slotIndex: "asc" } } } } : null);
  const linksQuery = db.useQuery(userId ? { affiliate_links: { $: { where: { userId, postId }, order: { createdAt: "asc" } } } } : null);
  const clicksQuery = db.useQuery(userId ? { click_logs: { $: { where: { userId, postId }, order: { timestamp: "desc" } } } } : null);

  const post = postsQuery.data?.creator_posts?.[0] as CreatorPost | undefined;
  const slots = (slotsQuery.data?.post_slots ?? []) as PostSlot[];
  const links = (linksQuery.data?.affiliate_links ?? []) as AffiliateLink[];
  const clicks = (clicksQuery.data?.click_logs ?? []) as ClickLog[];
  const filteredClicks = useMemo(() => {
    const start = from ? new Date(from).getTime() : 0;
    const end = to ? new Date(`${to}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
    return clicks.filter((click) => {
      const ts = new Date(click.timestamp).getTime();
      return ts >= start && ts <= end;
    });
  }, [clicks, from, to]);
  const stats = post ? postStats(post, slots, links, filteredClicks) : null;

  async function generateComparison() {
    const products = slots.map((slot) => {
      const link = links.find((item) => item.slotId === slot.id);
      return {
        label: slot.label,
        productTitle: slot.productTitle,
        price: slot.price,
        currency: slot.currency,
        rating: slot.rating,
        shortUrl: link ? shortUrlFor(link.shortCode) : "",
      };
    });
    const res = await fetch("/api/posts/comparison", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: post?.title, products }),
    });
    const data = await res.json();
    setComparison(data.copy ?? "");
  }

  if (postsQuery.isLoading || !post || !stats) {
    return <div className="min-h-[50vh] grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/posts" className="p-2 rounded-full hover:bg-surface-alt"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <p className="text-sm text-muted">{post.description}</p>
        </div>
        <Link
          href={`/posts/${post.id}/report?from=${from}&to=${to}`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-alt"
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 flex flex-wrap gap-3 items-end">
        <label className="text-xs font-semibold text-muted">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="block mt-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-muted">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="block mt-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Metric label="Human clicks" value={stats.clicks} highlight />
        <Metric label="Est. commission" value={`$${stats.commission.toFixed(2)}`} />
        <Metric label="Top slot" value={stats.topSlot?.label ?? "None"} />
      </div>

      <section className="grid gap-3">
        {stats.slots.map(({ slot, clicks, commission }) => {
          const link = links.find((item) => item.slotId === slot.id);
          return (
            <article key={slot.id} className="rounded-2xl border border-border bg-surface p-4 grid md:grid-cols-[120px_1fr_auto] gap-4">
              <div className="aspect-[4/3] rounded-xl bg-surface-alt overflow-hidden">
                {slot.productImageUrl && <img src={slot.productImageUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-accent">{slot.label}</div>
                <h2 className="font-semibold">{slot.productTitle}</h2>
                <p className="text-sm text-muted">{clicks} clicks · ${commission.toFixed(2)} est.</p>
                {link && <p className="mt-2 text-xs font-mono text-accent">{shortUrlFor(link.shortCode)}</p>}
              </div>
              {link && (
                <a href={shortUrlFor(link.shortCode)} target="_blank" className="p-2 rounded-xl hover:bg-surface-alt" title="Open link">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <button onClick={generateComparison} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
          <Sparkles className="w-4 h-4" />
          Best vs Budget
        </button>
        {comparison && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-4">
            <textarea value={comparison} readOnly className="min-h-40 rounded-2xl border border-border bg-surface p-4 text-sm" />
            <div className="rounded-3xl bg-foreground text-background p-5 aspect-square flex flex-col justify-between">
              <div className="text-xs uppercase tracking-wider opacity-70">Best vs Budget</div>
              <div className="text-2xl font-bold leading-tight">{post.title}</div>
              <div className="inline-flex items-center gap-2 text-sm"><Copy className="w-4 h-4" />Ready to copy</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", highlight ? "border-accent/20 bg-accent/5" : "border-border bg-surface")}>
      <div className="text-xs text-muted">{label}</div>
      <div className={cn("text-xl font-bold", highlight && "text-accent")}>{value}</div>
    </div>
  );
}
