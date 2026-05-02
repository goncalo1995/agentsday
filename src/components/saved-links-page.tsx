"use client";

import { FormEvent, useMemo, useState } from "react";
import NextLink from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Link2,
  MapPin,
  MousePointerClick,
  Plus,
  Power,
  Star,
  Trash2,
} from "lucide-react";
import { id } from "@instantdb/react";
import { motion } from "framer-motion";
import { db } from "@/lib/instant";
import { makeShortCode, shortUrlFor } from "@/lib/affiliate";
import { cn, estimateCommission, generateReferralUrl, isHumanUserAgent } from "@/lib/utils";

type SavedDeal = {
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

type AffiliateLink = {
  id: string;
  linkId: string;
  userId: string;
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

type ClickLog = {
  id: string;
  userId: string;
  linkId: string;
  shortCode: string;
  viatorProductId: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
};

export function SavedLinksPage() {
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [copiedId, setCopiedId] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const dealsQuery = db.useQuery(
    userId
      ? {
          saved_deals: {
            $: { where: { userId }, order: { createdAt: "desc" } },
          },
        }
      : null,
  );
  const linksQuery = db.useQuery(
    userId
      ? {
          affiliate_links: {
            $: { where: { userId }, order: { createdAt: "desc" } },
          },
        }
      : null,
  );
  const clicksQuery = db.useQuery(
    userId
      ? {
          click_logs: {
            $: { where: { userId }, order: { timestamp: "desc" } },
          },
        }
      : null,
  );

  const deals = (dealsQuery.data?.saved_deals ?? []) as SavedDeal[];
  const links = (linksQuery.data?.affiliate_links ?? []) as AffiliateLink[];
  const clicks = (clicksQuery.data?.click_logs ?? []) as ClickLog[];

  const linksByProduct = useMemo(() => {
    const map = new Map<string, AffiliateLink>();
    for (const link of links) map.set(link.viatorProductId, link);
    return map;
  }, [links]);

  const clicksByLink = useMemo(() => {
    const map = new Map<string, ClickLog[]>();
    for (const click of clicks) {
      const list = map.get(click.linkId) ?? [];
      list.push(click);
      map.set(click.linkId, list);
    }
    return map;
  }, [clicks]);

  const humanClicks = useMemo(
    () => clicks.filter((click) => isHumanUserAgent(click.userAgent)),
    [clicks],
  );
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86_400_000;
  const totalClicks = humanClicks.length;
  const clicksLast30 = humanClicks.filter((click) => new Date(click.timestamp).getTime() >= thirtyDaysAgo).length;
  const linkedDeals = deals.filter((deal) => linksByProduct.has(deal.viatorProductId)).length;
  const estimatedCommission = deals.reduce((sum, deal) => {
    const link = linksByProduct.get(deal.viatorProductId);
    const linkClicks = link ? humanClicks.filter((click) => click.linkId === link.linkId).length : 0;
    return sum + estimateCommission(deal.price, linkClicks);
  }, 0);

  async function generateLink(deal: SavedDeal) {
    if (!userId || linksByProduct.has(deal.viatorProductId)) return;

    const linkId = id();
    const shortCode = makeShortCode(deal.viatorProductId);
    const creatorCode = auth.user?.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_-]/g, "_") || "efacil_creator";
    await db.transact(
      db.tx.affiliate_links[linkId].update({
        linkId,
        userId,
        viatorProductId: deal.viatorProductId,
        shortCode,
        affiliateUrl: generateReferralUrl(deal.productUrl, creatorCode, "my_deals"),
        destinationUrl: deal.productUrl,
        productTitle: deal.productTitle,
        productImageUrl: deal.productImageUrl,
        productPrice: deal.price,
        productCurrency: deal.currency,
        productRating: deal.rating,
        reviewCount: deal.reviewCount,
        campaignSource: "my_deals",
        creatorCode,
        active: true,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  async function copyShortUrl(link: AffiliateLink) {
    await navigator.clipboard.writeText(shortUrlFor(link.shortCode));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(""), 1800);
  }

  async function removeDeal(deal: SavedDeal) {
    await db.transact(db.tx.saved_deals[deal.id].delete());
  }

  async function toggleActive(link: AffiliateLink) {
    await db.transact(
      db.tx.affiliate_links[link.id].update({
        active: !link.active,
      }),
    );
  }

  async function saveNotes(e: FormEvent<HTMLFormElement>, deal: SavedDeal) {
    e.preventDefault();
    await db.transact(
      db.tx.saved_deals[deal.id].update({
        notes: notesDraft[deal.id] ?? deal.notes ?? "",
      }),
    );
  }

  if (dealsQuery.isLoading || linksQuery.isLoading || clicksQuery.isLoading) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <NextLink href="/discover" className="p-2.5 rounded-full hover:bg-surface-alt transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </NextLink>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Creator Dashboard</h1>
          <p className="text-muted text-sm">Saved Viator deals, generated links, and human click performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Plus} label="Saved deals" value={deals.length} />
        <Stat icon={Link2} label="Generated links" value={linkedDeals} />
        <Stat icon={MousePointerClick} label="All-time clicks" value={totalClicks} highlight />
        <Stat icon={Calendar} label="Last 30 days" value={clicksLast30} />
      </div>

      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-accent">Estimated commission</div>
          <p className="text-xs text-muted">8% of Viator price per filtered human click. Raw logs still include bots/crawlers.</p>
        </div>
        <div className="text-2xl font-bold text-accent">${estimatedCommission.toFixed(2)}</div>
      </div>

      {links.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          <h2 className="font-semibold">Generated links</h2>
          <div className="divide-y divide-border">
            {links.map((link) => {
              const count = humanClicks.filter((click) => click.linkId === link.linkId).length;
              return (
                <div key={link.id} className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{link.productTitle}</div>
                    <div className="text-xs text-muted font-mono truncate">{shortUrlFor(link.shortCode)}</div>
                  </div>
                  <span className="text-xs text-muted">{new Date(link.createdAt).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <MousePointerClick className="w-3.5 h-3.5" />
                    {count}
                  </span>
                  <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", link.active ? "bg-success/10 text-success" : "bg-surface-alt text-muted")}>
                    {link.active ? "Active" : "Inactive"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {deals.length === 0 && (
        <div className="text-center py-20">
          <Link2 className="w-12 h-12 mx-auto mb-4 text-muted/30" />
          <p className="text-muted text-sm mb-2">No saved deals yet.</p>
          <NextLink href="/discover" className="text-accent font-semibold text-sm hover:underline">
            Search Viator experiences
          </NextLink>
        </div>
      )}

      <div className="grid gap-4">
        {deals.map((deal, index) => {
          const link = linksByProduct.get(deal.viatorProductId);
          const rawLinkClicks = link ? clicksByLink.get(link.linkId) ?? [] : [];
          const linkClicks = rawLinkClicks.filter((click) => isHumanUserAgent(click.userAgent));
          const notesValue = notesDraft[deal.id] ?? deal.notes ?? "";
          const commission = estimateCommission(deal.price, linkClicks.length);

          return (
            <motion.article
              key={deal.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <div className="grid md:grid-cols-[180px_1fr] gap-4 p-4">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-alt">
                  {deal.productImageUrl ? (
                    <img src={deal.productImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-muted">No image</div>
                  )}
                </div>

                <div className="space-y-4 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold leading-snug">{deal.productTitle}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                        {deal.destination && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {deal.destination}
                          </span>
                        )}
                        <span className="font-mono">{deal.viatorProductId}</span>
                        {deal.rating ? (
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {deal.rating.toFixed(1)} ({deal.reviewCount ?? 0})
                          </span>
                        ) : null}
                        {deal.price ? (
                          <span>
                            {deal.currency ?? "USD"} {deal.price.toFixed(0)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      onClick={() => removeDeal(deal)}
                      className="p-2 rounded-xl text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer"
                      title="Remove deal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={(e) => saveNotes(e, deal)} className="flex gap-2">
                    <input
                      value={notesValue}
                      onChange={(e) => setNotesDraft((prev) => ({ ...prev, [deal.id]: e.target.value }))}
                      placeholder="Add private notes for this creator campaign"
                      className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                    <button className="rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-surface-alt cursor-pointer">
                      Save
                    </button>
                  </form>

                  {link ? (
                    <div className="rounded-2xl border border-accent/15 bg-accent/5 p-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0 flex-1 font-mono text-xs text-accent truncate">
                          {shortUrlFor(link.shortCode)}
                        </div>
                        <button
                          onClick={() => copyShortUrl(link)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                            copiedId === link.id ? "bg-success/10 text-success" : "bg-surface text-muted hover:bg-border/40",
                          )}
                        >
                          {copiedId === link.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId === link.id ? "Copied" : "Copy"}
                        </button>
                        <a
                          href={link.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-muted hover:bg-border/40"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Full URL
                        </a>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                          <MousePointerClick className="w-3.5 h-3.5" />
                          {linkClicks.length} clicks
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          ${commission.toFixed(2)} est.
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" />
                          Latest {linkClicks[0] ? new Date(linkClicks[0].timestamp).toLocaleString() : "none yet"}
                        </span>
                      </div>
                      <ClickBars clicks={linkClicks} />
                      <button
                        onClick={() => toggleActive(link)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                          link.active ? "bg-success/10 text-success hover:bg-success/15" : "bg-surface-alt text-muted hover:bg-border/50",
                        )}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {link.active ? "Active" : "Inactive"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => generateLink(deal)}
                      className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-4 h-4" />
                      Generate Link
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Plus;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 flex items-center gap-3", highlight ? "border-accent/20 bg-accent/5" : "border-border bg-surface")}>
      <div className={cn("w-10 h-10 rounded-xl grid place-items-center", highlight ? "bg-accent/10 text-accent" : "bg-surface-alt text-muted")}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className={cn("text-lg font-bold", highlight && "text-accent")}>{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}

function ClickBars({ clicks }: { clicks: ClickLog[] }) {
  const days = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - idx));
    return date;
  });
  const counts = days.map((day) => {
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    return clicks.filter((click) => {
      const ts = new Date(click.timestamp).getTime();
      return ts >= day.getTime() && ts < next.getTime();
    }).length;
  });
  const max = Math.max(1, ...counts);

  return (
    <div className="flex items-end gap-1.5 h-16 pt-2">
      {counts.map((count, index) => (
        <div key={days[index].toISOString()} className="flex-1 flex flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t-md bg-accent/70 min-h-1"
            style={{ height: `${Math.max(8, (count / max) * 52)}px` }}
            title={`${count} clicks`}
          />
          <span className="text-[10px] text-muted">{days[index].toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}</span>
        </div>
      ))}
    </div>
  );
}
