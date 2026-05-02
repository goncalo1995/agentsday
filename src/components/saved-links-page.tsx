"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Copy, Check, Trash2, ArrowLeft, Link2, MousePointerClick,
  DollarSign, Star, MapPin, Tag, Plus, X, ExternalLink, Filter,
  ArrowUpDown, Sparkles, Clock, ArrowDown, ArrowUp, BarChart3,
  Flame, Send, FileEdit, Archive, Camera, Music, Play,
  MessageCircle, AtSign, Globe, Pin, PenTool, Mail, MessageSquare, Link,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import NextLink from "next/link";
import type { SavedLink, SavedLinkSortKey } from "@/lib/types";
import {
  cn, resolveTagNames, getSourceIcon, STATUS_CONFIG,
  simulateClicks, simulateCommission,
} from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ── Icon resolvers ──

const STATUS_ICONS: Record<string, LucideIcon> = {
  "file-edit": FileEdit,
  send: Send,
  flame: Flame,
  archive: Archive,
};

const SOURCE_ICON_MAP: Record<string, LucideIcon> = {
  camera: Camera,
  music: Music,
  play: Play,
  "message-circle": MessageCircle,
  "at-sign": AtSign,
  globe: Globe,
  pin: Pin,
  "pen-tool": PenTool,
  mail: Mail,
  "message-square": MessageSquare,
  link: Link,
};

function StatusIcon({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = STATUS_ICONS[cfg?.icon ?? ""] ?? FileEdit;
  return <Icon className="w-3.5 h-3.5" />;
}

function SourceIcon({ source }: { source: string | undefined }) {
  const iconName = getSourceIcon(source);
  const Icon = SOURCE_ICON_MAP[iconName] ?? Link;
  return <Icon className="w-3.5 h-3.5" />;
}

// ── Persistence ──

function getSavedLinks(): SavedLink[] {
  try {
    return JSON.parse(localStorage.getItem("creator_saved_links") || "[]");
  } catch {
    return [];
  }
}

function persistSavedLinks(links: SavedLink[]) {
  localStorage.setItem("creator_saved_links", JSON.stringify(links));
}

// ── Sort options ──

const SORT_OPTIONS: { key: SavedLinkSortKey; label: string; icon: LucideIcon }[] = [
  { key: "commission", label: "Top Earners", icon: DollarSign },
  { key: "clicks", label: "Most Clicked", icon: TrendingUp },
  { key: "newest", label: "Newest", icon: Sparkles },
  { key: "oldest", label: "Oldest", icon: Clock },
  { key: "price-high", label: "Price High→Low", icon: ArrowDown },
  { key: "price-low", label: "Price Low→High", icon: ArrowUp },
  { key: "rating", label: "Best Rated", icon: Star },
  { key: "destination", label: "Destination", icon: MapPin },
  { key: "status", label: "Status", icon: BarChart3 },
];

function sortLinks(links: SavedLink[], sortKey: SavedLinkSortKey): SavedLink[] {
  const sorted = [...links];
  switch (sortKey) {
    case "commission": return sorted.sort((a, b) => b.estimatedCommission - a.estimatedCommission);
    case "clicks": return sorted.sort((a, b) => b.clickCount - a.clickCount);
    case "newest": return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "oldest": return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case "price-high": return sorted.sort((a, b) => b.price - a.price);
    case "price-low": return sorted.sort((a, b) => a.price - b.price);
    case "rating": return sorted.sort((a, b) => b.rating - a.rating);
    case "destination": return sorted.sort((a, b) => a.destination.localeCompare(b.destination));
    case "status": return sorted.sort((a, b) => a.status.localeCompare(b.status));
    default: return sorted;
  }
}

// ── Component ──

export function SavedLinksPage() {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [sortKey, setSortKey] = useState<SavedLinkSortKey>("commission");
  const [filterDest, setFilterDest] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [tagInput, setTagInput] = useState<{ linkId: string; value: string } | null>(null);

  useEffect(() => {
    const raw = getSavedLinks();
    const refreshed = raw.map((l) => {
      const migrated: SavedLink = {
        ...l,
        shortLink: l.shortLink || `crtl.ink/${(l.productCode || "x").slice(0, 5).toLowerCase()}${Math.random().toString(36).slice(2, 6)}`,
        clickCount: l.clickCount ?? 0,
        estimatedCommission: l.estimatedCommission ?? 0,
        price: l.price ?? 0,
        currency: l.currency || "USD",
        rating: l.rating ?? 0,
        reviewCount: l.reviewCount ?? 0,
        imageUrl: l.imageUrl || "",
        viatorTags: l.viatorTags ?? [],
        customTags: l.customTags ?? [],
        campaignSource: l.campaignSource || "instagram",
        creatorCode: l.creatorCode || "creator_demo",
        status: l.status || "draft",
        provider: (l as unknown as Record<string, unknown>).provider as string || "viator",
      };
      const clicks = simulateClicks(migrated.createdAt);
      return {
        ...migrated,
        clickCount: clicks,
        estimatedCommission: simulateCommission(migrated.price, clicks),
        status: (migrated.status === "shared" && clicks > 50 ? "top-performer" : migrated.status) as SavedLink["status"],
      };
    });
    setLinks(refreshed);
    persistSavedLinks(refreshed);
  }, []);

  const destinations = useMemo(() => [...new Set(links.map((l) => l.destination).filter(Boolean))], [links]);
  const sources = useMemo(() => [...new Set(links.map((l) => l.campaignSource).filter(Boolean))], [links]);
  const allCustomTags = useMemo(() => [...new Set(links.flatMap((l) => l.customTags))], [links]);

  const filtered = useMemo(() => {
    let result = links;
    if (filterDest) result = result.filter((l) => l.destination === filterDest);
    if (filterSource) result = result.filter((l) => l.campaignSource === filterSource);
    if (filterStatus) result = result.filter((l) => l.status === filterStatus);
    if (filterTag) result = result.filter((l) => l.customTags.includes(filterTag) || l.viatorTags.some((t) => resolveTagNames([t])[0] === filterTag));
    return sortLinks(result, sortKey);
  }, [links, sortKey, filterDest, filterSource, filterStatus, filterTag]);

  const totalCommission = links.reduce((sum, l) => sum + l.estimatedCommission, 0);
  const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
  const topPerformers = links.filter((l) => l.status === "top-performer").length;

  function removeLink(id: string) {
    const updated = links.filter((l) => l.id !== id);
    setLinks(updated);
    persistSavedLinks(updated);
  }

  function cycleStatus(id: string) {
    const order: SavedLink["status"][] = ["draft", "shared", "top-performer", "archived"];
    const updated = links.map((l) => {
      if (l.id !== id) return l;
      const idx = order.indexOf(l.status);
      return { ...l, status: order[(idx + 1) % order.length] };
    });
    setLinks(updated);
    persistSavedLinks(updated);
  }

  function addCustomTag(linkId: string, tag: string) {
    if (!tag.trim()) return;
    const updated = links.map((l) => {
      if (l.id !== linkId || l.customTags.includes(tag.trim())) return l;
      return { ...l, customTags: [...l.customTags, tag.trim()] };
    });
    setLinks(updated);
    persistSavedLinks(updated);
    setTagInput(null);
  }

  function removeCustomTag(linkId: string, tag: string) {
    const updated = links.map((l) => {
      if (l.id !== linkId) return l;
      return { ...l, customTags: l.customTags.filter((t) => t !== tag) };
    });
    setLinks(updated);
    persistSavedLinks(updated);
  }

  async function copyUrl(link: SavedLink, field: "shortLink" | "referralUrl") {
    const text = field === "shortLink" ? `https://${link.shortLink}` : link.referralUrl;
    await navigator.clipboard.writeText(text);
    setCopiedId(`${link.id}-${field}`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function clearFilters() {
    setFilterDest("");
    setFilterSource("");
    setFilterStatus("");
    setFilterTag("");
  }
  const hasFilters = !!(filterDest || filterSource || filterStatus || filterTag);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <NextLink href="/discover" className="p-2.5 rounded-full hover:bg-surface-alt transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </NextLink>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            My Links
            {links.length > 0 && (
              <span className="text-sm font-normal bg-accent/10 text-accent px-2.5 py-0.5 rounded-full">
                {links.length}
              </span>
            )}
          </h1>
          <p className="text-muted text-sm">Track, sort, and manage your referral links</p>
        </div>
      </div>

      {/* Stats */}
      {links.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Link2} label="Total Links" value={links.length} />
          <StatCard icon={MousePointerClick} label="Total Clicks" value={totalClicks} />
          <StatCard icon={DollarSign} label="Est. Commission" value={`$${totalCommission.toFixed(2)}`} highlight />
          <StatCard icon={Flame} label="Top Performers" value={topPerformers} />
        </motion.div>
      )}

      {/* Sort + Filter */}
      {links.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <ArrowUpDown className="w-4 h-4 text-muted flex-shrink-0" />
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer",
                  sortKey === opt.key
                    ? "bg-accent text-white shadow-sm scale-105"
                    : "bg-surface-alt text-muted hover:bg-border/50"
                )}
              >
                <opt.icon className="w-3 h-3" />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer",
                showFilters || hasFilters ? "bg-accent/10 text-accent" : "bg-surface-alt text-muted hover:bg-border/50"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasFilters && <span className="bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">!</span>}
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-muted hover:text-foreground cursor-pointer">Clear all</button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {destinations.length > 0 && (
                  <FilterRow icon={<MapPin className="w-3.5 h-3.5" />} label="Destination">
                    {destinations.map((d) => (
                      <FilterChip key={d} label={d} active={filterDest === d} onClick={() => setFilterDest(filterDest === d ? "" : d)} />
                    ))}
                  </FilterRow>
                )}
                {sources.length > 0 && (
                  <FilterRow icon={<Globe className="w-3.5 h-3.5" />} label="Source">
                    {sources.map((s) => (
                      <FilterChip key={s} label={s} active={filterSource === s} onClick={() => setFilterSource(filterSource === s ? "" : s)} icon={<SourceIcon source={s} />} />
                    ))}
                  </FilterRow>
                )}
                <FilterRow icon={<BarChart3 className="w-3.5 h-3.5" />} label="Status">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <FilterChip key={key} label={cfg.label} active={filterStatus === key} onClick={() => setFilterStatus(filterStatus === key ? "" : key)} icon={<StatusIcon status={key} />} />
                  ))}
                </FilterRow>
                {allCustomTags.length > 0 && (
                  <FilterRow icon={<Tag className="w-3.5 h-3.5" />} label="Tags">
                    {allCustomTags.map((t) => (
                      <FilterChip key={t} label={t} active={filterTag === t} onClick={() => setFilterTag(filterTag === t ? "" : t)} />
                    ))}
                  </FilterRow>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty */}
      {links.length === 0 && (
        <div className="text-center py-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Link2 className="w-12 h-12 mx-auto mb-4 text-muted/30" />
          </motion.div>
          <p className="text-muted text-sm mb-2">No saved links yet — go discover some experiences!</p>
          <NextLink href="/discover" className="text-accent font-semibold text-sm hover:underline">
            Discover experiences →
          </NextLink>
        </div>
      )}

      {links.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-muted text-sm">
          No links match these filters.{" "}
          <button onClick={clearFilters} className="text-accent hover:underline cursor-pointer">Clear filters</button>
        </div>
      )}

      {/* Cards */}
      <LayoutGroup>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((link, i) => (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{ delay: i * 0.02, type: "spring", stiffness: 500, damping: 35 }}
                className={cn(
                  "rounded-2xl border bg-surface overflow-hidden transition-all",
                  link.status === "top-performer" ? "border-accent/30 shadow-lg shadow-accent/5" :
                  link.status === "archived" ? "border-border/50 opacity-70" : "border-border hover:shadow-md"
                )}
              >
                <div className="flex gap-4 p-4">
                  {link.imageUrl && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-alt">
                      <img src={link.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm leading-snug">{link.productTitle}</h3>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                          {link.destination && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{link.destination}</span>
                          )}
                          <span className="font-mono">{link.productCode}</span>
                          <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => cycleStatus(link.id)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all hover:scale-105",
                          STATUS_CONFIG[link.status]?.color ?? "bg-surface-alt text-muted"
                        )}
                        title="Click to change status"
                      >
                        <StatusIcon status={link.status} />
                        {STATUS_CONFIG[link.status]?.label}
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 font-medium text-success">
                        <DollarSign className="w-3.5 h-3.5" />${link.estimatedCommission.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1 text-muted">
                        <MousePointerClick className="w-3.5 h-3.5" />{link.clickCount} clicks
                      </span>
                      {link.rating > 0 && (
                        <span className="flex items-center gap-1 text-muted">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{link.rating.toFixed(1)} ({link.reviewCount})
                        </span>
                      )}
                      {link.price > 0 && (
                        <span className="text-muted">
                          {link.currency === "USD" ? "$" : link.currency === "EUR" ? "€" : link.currency}{link.price.toFixed(0)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted">
                        <SourceIcon source={link.campaignSource} />
                        {link.campaignSource || "unknown"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-accent/5 border border-accent/15 rounded-xl px-3 py-1.5 text-xs font-mono text-accent flex-1 min-w-0">
                        <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{link.shortLink}</span>
                      </div>
                      <button
                        onClick={() => copyUrl(link, "shortLink")}
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium rounded-xl px-2.5 py-1.5 transition-all cursor-pointer",
                          copiedId === `${link.id}-shortLink` ? "bg-success/10 text-success" : "bg-surface-alt hover:bg-border/50 text-muted"
                        )}
                      >
                        {copiedId === `${link.id}-shortLink` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === `${link.id}-shortLink` ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={() => copyUrl(link, "referralUrl")}
                        className="text-xs text-muted hover:text-foreground px-2 py-1.5 rounded-xl hover:bg-surface-alt transition-colors cursor-pointer"
                        title="Copy full referral URL"
                      >
                        Full URL
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {resolveTagNames(link.viatorTags).slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] bg-surface-alt text-muted px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                      {link.customTags.map((t) => (
                        <span key={t} className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1 group">
                          {t}
                          <button onClick={() => removeCustomTag(link.id, t)} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                      {tagInput?.linkId === link.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); addCustomTag(link.id, tagInput.value); }} className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={tagInput.value}
                            onChange={(e) => setTagInput({ linkId: link.id, value: e.target.value })}
                            onBlur={() => { if (tagInput.value.trim()) addCustomTag(link.id, tagInput.value); else setTagInput(null); }}
                            placeholder="tag name"
                            className="text-[10px] w-20 bg-surface-alt rounded-full px-2 py-0.5 outline-none focus:ring-1 focus:ring-accent/40"
                          />
                        </form>
                      ) : (
                        <button
                          onClick={() => setTagInput({ linkId: link.id, value: "" })}
                          className="text-[10px] text-muted hover:text-accent px-1.5 py-0.5 rounded-full hover:bg-surface-alt transition-colors cursor-pointer flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> tag
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {link.productUrl && (
                      <a href={link.productUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-alt transition-colors" title="Open product">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => removeLink(link.id)} className="p-1.5 rounded-xl text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  );
}

// ── Sub-components ──

function StatCard({ icon: Icon, label, value, highlight }: { icon: LucideIcon; label: string; value: string | number; highlight?: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={cn(
        "rounded-2xl border p-4 flex items-center gap-3 transition-colors",
        highlight ? "border-accent/20 bg-accent/5" : "border-border bg-surface"
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", highlight ? "bg-accent/10" : "bg-surface-alt")}>
        <Icon className={cn("w-5 h-5", highlight ? "text-accent" : "text-muted")} />
      </div>
      <div>
        <div className={cn("text-lg font-bold tabular-nums", highlight && "text-accent")}>{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </motion.div>
  );
}

function FilterRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex items-center gap-1 text-muted w-24 flex-shrink-0">{icon} {label}</span>
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
        active ? "bg-accent text-white" : "bg-surface-alt text-muted hover:bg-border/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
