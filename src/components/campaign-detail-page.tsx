"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { id } from "@instantdb/react";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Plus,
  Search,
  Trash2,
  Wand2,
} from "lucide-react";
import { db } from "@/lib/instant";
import { affiliateUrlFor, makeShortCode, shortUrlFor } from "@/lib/affiliate";
import type {
  AffiliateLink,
  Campaign,
  CampaignContent,
  CreatorPost,
  ExternalCommitment,
  PostSlot,
} from "@/lib/post-types";
import type { SearchIntent, ViatorProduct, ViatorSearchResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { productToSlotInput, slugify, usernameFromEmail } from "@/lib/posts";

const TABS = ["plan", "products", "content", "posts", "calendar"] as const;
const PLATFORMS = ["instagram", "tiktok", "youtube"] as const;

type StudioTab = (typeof TABS)[number];
type Platform = (typeof PLATFORMS)[number];
type CampaignTx =
  | ReturnType<(typeof db.tx.creator_posts)[string]["update"]>
  | ReturnType<(typeof db.tx.post_slots)[string]["update"]>
  | ReturnType<(typeof db.tx.affiliate_links)[string]["update"]>;

export function CampaignDetailPage({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const activeTab = normalizeTab(searchParams.get("tab"));
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<ViatorProduct[]>([]);
  const [productError, setProductError] = useState("");
  const [commitmentTitle, setCommitmentTitle] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [fee, setFee] = useState("");
  const [notes, setNotes] = useState("");

  const campaignsQuery = db.useQuery(
    userId ? { campaigns: { $: { where: { userId, id: campaignId }, limit: 1 } } } : null,
  );
  const postsQuery = db.useQuery(
    userId ? { creator_posts: { $: { where: { userId, campaignId }, order: { createdAt: "desc" } } } } : null,
  );
  const contentQuery = db.useQuery(
    userId ? { campaign_content: { $: { where: { userId, campaignId }, order: { generatedAt: "desc" } } } } : null,
  );
  const slotsQuery = db.useQuery(
    userId ? { post_slots: { $: { where: { userId }, order: { slotIndex: "asc" } } } } : null,
  );
  const linksQuery = db.useQuery(
    userId ? { affiliate_links: { $: { where: { userId }, order: { createdAt: "desc" } } } } : null,
  );
  const commitmentsQuery = db.useQuery(
    userId ? { external_commitments: { $: { where: { userId, campaignId }, order: { dueDate: "asc" } } } } : null,
  );

  const campaign = campaignsQuery.data?.campaigns?.[0] as Campaign | undefined;
  const posts = (postsQuery.data?.creator_posts ?? []) as CreatorPost[];
  const contents = (contentQuery.data?.campaign_content ?? []) as CampaignContent[];
  const postIds = new Set(posts.map((post) => post.id));
  const slots = ((slotsQuery.data?.post_slots ?? []) as PostSlot[]).filter((slot) => postIds.has(slot.postId));
  const links = ((linksQuery.data?.affiliate_links ?? []) as AffiliateLink[]).filter((link) => link.postId && postIds.has(link.postId));
  const commitments = (commitmentsQuery.data?.external_commitments ?? []) as ExternalCommitment[];
  const firstProduct = slots[0];
  const contentByPlatform = groupContent(contents);

  if (campaignsQuery.isLoading || !campaign) {
    return <div className="min-h-[50vh] grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  async function patchCampaign(fields: Partial<Campaign>) {
    if (!userId || !campaign) return;
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...fields }),
    });
  }

  async function deleteCampaign() {
    if (!userId || !campaign) return;
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    router.push("/campaigns");
  }

  async function searchProducts() {
    if (!campaign || !productQuery.trim()) return;
    setBusy("search");
    setProductError("");
    try {
      const intentRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${campaign.niche}: ${productQuery}` }),
      });
      const intent: SearchIntent = await intentRes.json();
      const searchRes = await fetch("/api/viator/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerm: intent.searchTerm,
          destinationId: intent.destinationId,
          maxPrice: intent.maxPrice,
          groupType: intent.groupType,
          currency: "USD",
        }),
      });
      const data: ViatorSearchResponse = await searchRes.json();
      setProducts(data.products.map((product) => ({ ...product, provider: "viator" })).slice(0, 8));
      if (data.products.length === 0) setProductError("No products found. Try a broader search.");
    } catch {
      setProductError("Product search failed. Try again in a moment.");
    } finally {
      setBusy("");
    }
  }

  async function addProduct(product: ViatorProduct) {
    if (!userId || !campaign) return;
    setBusy(product.productCode);
    const now = new Date().toISOString();
    const post = posts[0];
    const postId = post?.id ?? id();
    const slotId = id();
    const linkId = id();
    const shortCode = makeShortCode(product.productCode);
    const creatorCode = usernameFromEmail(auth.user?.email);
    const chunks: CampaignTx[] = [];

    if (!post) {
      chunks.push(
        db.tx.creator_posts[postId].update({
          userId,
          campaignId: campaign.id,
          title: `${campaign.title} picks`,
          slug: `${slugify(campaign.title)}-${postId.slice(0, 6)}`,
          description: `Products selected for ${campaign.title}.`,
          coverImageUrl: product.images?.[0]?.variants?.[0]?.url ?? "",
          isPublic: false,
          createdAt: now,
          updatedAt: now,
        }),
      );
    }

    chunks.push(
      db.tx.post_slots[slotId].update(productToSlotInput(product, {
        userId,
        postId,
        slotIndex: slots.length,
        label: `Product ${slots.length + 1}`,
        source: "ai_alternative",
        destination: campaign.niche,
        isPublic: false,
      })),
      db.tx.affiliate_links[linkId].update({
        linkId,
        userId,
        postId,
        slotId,
        slotLabel: `Product ${slots.length + 1}`,
        viatorProductId: product.productCode,
        shortCode,
        affiliateUrl: affiliateUrlFor(product, creatorCode, "campaign_studio"),
        destinationUrl: product.productUrl ?? "",
        productTitle: product.title,
        productImageUrl: product.images?.[0]?.variants?.[0]?.url,
        productPrice: product.pricing?.summary?.fromPrice,
        productCurrency: product.pricing?.currency ?? "USD",
        productRating: product.reviews?.combinedAverageRating,
        reviewCount: product.reviews?.totalReviews,
        campaignSource: "campaign_studio",
        creatorCode,
        active: true,
        createdAt: now,
      }),
    );

    await db.transact(chunks);
    setBusy("");
  }

  async function generateContent(targetPlatform = platform) {
    if (!userId || !firstProduct) return;
    setBusy(`content-${targetPlatform}`);
    setPlatform(targetPlatform);
    try {
      await fetch("/api/campaigns/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          campaignId,
          platform: targetPlatform,
          productUrl: firstProduct.productUrl,
          product: firstProduct,
        }),
      });
    } finally {
      setBusy("");
    }
  }

  async function createCommitment() {
    if (!userId || !commitmentTitle.trim() || !partnerName.trim() || !dueDate) return;
    const now = new Date().toISOString();
    await db.transact(
      db.tx.external_commitments[id()].update({
        userId,
        campaignId,
        title: commitmentTitle.trim(),
        partnerName: partnerName.trim(),
        dueDate,
        status: "planned",
        fee: fee ? Number(fee) : undefined,
        notes,
        createdAt: now,
        updatedAt: now,
      }),
    );
    setCommitmentTitle("");
    setPartnerName("");
    setDueDate("");
    setFee("");
    setNotes("");
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/campaigns" className="p-2 rounded-full hover:bg-surface-alt"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate">{campaign.title}</h1>
          <p className="text-sm text-muted">{campaign.niche} · Campaign Studio</p>
        </div>
        <select
          value={campaign.status}
          onChange={(e) => patchCampaign({ status: e.target.value as Campaign["status"] })}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold capitalize"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={deleteCampaign} className="inline-flex items-center gap-2 rounded-xl border border-danger/20 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/5">
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-border pb-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={`/campaigns/${campaign.id}?tab=${tab}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
              activeTab === tab ? "bg-accent text-white" : "bg-surface-alt text-muted hover:bg-border/50",
            )}
          >
            {tab}
          </Link>
        ))}
      </div>

      {activeTab === "plan" && (
        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <h2 className="font-semibold">Campaign plan</h2>
            <label className="block text-xs font-semibold text-muted">
              Niche
              <input value={campaign.niche} onChange={(e) => patchCampaign({ niche: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
            </label>
            <label id="schedule" className="block text-xs font-semibold text-muted">
              Scheduled date
              <input type="date" value={campaign.scheduledDate ?? ""} onChange={(e) => patchCampaign({ scheduledDate: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
            </label>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <StudioMetric label="Products" value={slots.length} />
              <StudioMetric label="Posts" value={posts.length} />
              <StudioMetric label="Commitments" value={commitments.length} />
            </div>
          </div>
          <CommitmentList commitments={commitments} />
        </section>
      )}

      {activeTab === "products" && (
        <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <h2 className="font-semibold">Find products</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                placeholder={`Search products for ${campaign.niche}`}
                className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <button onClick={searchProducts} disabled={busy === "search" || !productQuery.trim()} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              <Search className="w-4 h-4" />
              {busy === "search" ? "Searching..." : "Search products"}
            </button>
            {productError && <p className="text-sm text-warning">{productError}</p>}
            <SelectedProducts slots={slots} links={links} onCopy={copyText} copied={copied} />
          </div>
          <div className="grid gap-3">
            {products.map((product) => (
              <ProductResult key={product.productCode} product={product} busy={busy === product.productCode} onAdd={() => addProduct(product)} />
            ))}
            {products.length === 0 && <EmptyState label="Search for products to add them to this campaign." />}
          </div>
        </section>
      )}

      {activeTab === "content" && (
        <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">AI content</h2>
              <p className="text-sm text-muted">Generate content from the first selected product.</p>
            </div>
            <button onClick={() => generateContent(platform)} disabled={!firstProduct || busy.startsWith("content")} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" title={firstProduct ? "" : "Add a product first"}>
              <Wand2 className="w-4 h-4" />
              {busy.startsWith("content") ? "Generating..." : "Generate"}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {PLATFORMS.map((item) => (
              <button key={item} onClick={() => setPlatform(item)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold capitalize", platform === item ? "bg-accent text-white" : "bg-surface-alt text-muted hover:bg-border/50")}>
                {item}
              </button>
            ))}
          </div>
          <ContentGroup platform={platform} groups={contentByPlatform} onCopy={copyText} copied={copied} />
          {!firstProduct && <EmptyState label="Add a product in the Products tab before generating content." />}
        </section>
      )}

      {activeTab === "posts" && (
        <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Campaign posts</h2>
            <Link href={`/posts/new?campaignId=${campaign.id}`} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
              <Plus className="w-4 h-4" />
              Create campaign post
            </Link>
          </div>
          {posts.map((post) => (
            <PostRow key={post.id} post={post} links={links.filter((link) => link.postId === post.id)} onCopy={copyText} copied={copied} />
          ))}
          {posts.length === 0 && <EmptyState label="No campaign posts yet." />}
        </section>
      )}

      {activeTab === "calendar" && (
        <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><CalendarClock className="w-4 h-4 text-accent" />Calendar</h2>
            <label className="block text-xs font-semibold text-muted">
              Campaign scheduled date
              <input type="date" value={campaign.scheduledDate ?? ""} onChange={(e) => patchCampaign({ scheduledDate: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
            </label>
            <CommitmentList commitments={commitments} />
          </div>
          <CommitmentForm
            title={commitmentTitle}
            partnerName={partnerName}
            dueDate={dueDate}
            fee={fee}
            notes={notes}
            setTitle={setCommitmentTitle}
            setPartnerName={setPartnerName}
            setDueDate={setDueDate}
            setFee={setFee}
            setNotes={setNotes}
            onCreate={createCommitment}
          />
        </section>
      )}
    </div>
  );
}

function normalizeTab(value: string | null): StudioTab {
  return TABS.includes(value as StudioTab) ? (value as StudioTab) : "plan";
}

function groupContent(contents: CampaignContent[]) {
  const groups = new Map<string, CampaignContent[]>();
  for (const item of contents) {
    const key = `${item.platform}:${item.contentType}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

function StudioMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function SelectedProducts({ slots, links, onCopy, copied }: { slots: PostSlot[]; links: AffiliateLink[]; onCopy: (text: string, key: string) => void; copied: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Selected products</h3>
      {slots.map((slot) => {
        const link = links.find((item) => item.slotId === slot.id);
        const shortUrl = link ? shortUrlFor(link.shortCode) : "";
        return (
          <div key={slot.id} className="rounded-xl bg-surface-alt p-3 text-sm">
            <div className="font-semibold line-clamp-2">{slot.productTitle}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <span className="font-mono truncate">{shortUrl || "No short URL"}</span>
              {shortUrl && (
                <button onClick={() => onCopy(shortUrl, slot.id)} className="font-semibold text-accent">
                  {copied === slot.id ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>
        );
      })}
      {slots.length === 0 && <EmptyState label="No products selected yet." />}
    </div>
  );
}

function ProductResult({ product, busy, onAdd }: { product: ViatorProduct; busy: boolean; onAdd: () => void }) {
  const imageUrl = product.images?.[0]?.variants?.[0]?.url;
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 flex gap-3">
      {imageUrl && <img src={imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold line-clamp-2">{product.title}</h3>
        <div className="mt-1 text-xs text-muted">
          {product.pricing?.currency ?? "USD"} {product.pricing?.summary?.fromPrice?.toFixed(0) ?? "—"}
        </div>
      </div>
      <button onClick={onAdd} disabled={busy} className="self-start inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-alt disabled:opacity-50">
        <Plus className="w-3.5 h-3.5" />
        {busy ? "Adding" : "Add"}
      </button>
    </article>
  );
}

function ContentGroup({
  platform,
  groups,
  onCopy,
  copied,
}: {
  platform: string;
  groups: Map<string, CampaignContent[]>;
  onCopy: (text: string, key: string) => void;
  copied: string;
}) {
  const types: CampaignContent["contentType"][] = ["script", "caption", "story_text", "image_prompt"];
  const hasAny = types.some((type) => (groups.get(`${platform}:${type}`) ?? []).length > 0);
  if (!hasAny) return <EmptyState label={`No ${platform} content yet.`} />;

  return (
    <div className="space-y-4">
      {types.map((type) => {
        const items = groups.get(`${platform}:${type}`) ?? [];
        if (items.length === 0) return null;
        return (
          <div key={type} className={cn(type === "image_prompt" ? "grid md:grid-cols-3 gap-3" : "space-y-3")}>
            {items.map((item, index) => (
              <div key={item.id} className="rounded-xl bg-surface-alt p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase text-muted">{type.replace("_", " ")} {type === "image_prompt" ? index + 1 : ""}</div>
                  <button onClick={() => onCopy(item.contentText, item.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                    {copied === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === item.id ? "Copied" : "Copy"}
                  </button>
                </div>
                {type === "script" ? (
                  <textarea value={item.contentText} readOnly className="min-h-36 w-full resize-y rounded-lg border border-border bg-surface p-3 text-sm" />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{item.contentText}</p>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function PostRow({ post, links, onCopy, copied }: { post: CreatorPost; links: AffiliateLink[]; onCopy: (text: string, key: string) => void; copied: string }) {
  const firstLink = links[0];
  const shortUrl = firstLink ? shortUrlFor(firstLink.shortCode) : "";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-alt p-3">
      <FileText className="w-4 h-4 text-muted" />
      <Link href={`/posts/${post.id}`} className="min-w-0 flex-1 font-semibold hover:text-accent truncate">{post.title}</Link>
      {shortUrl && <span className="font-mono text-xs text-muted">{shortUrl}</span>}
      {shortUrl && (
        <button onClick={() => onCopy(shortUrl, post.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-surface">
          <Copy className="w-3.5 h-3.5" />
          {copied === post.id ? "Copied" : "Copy"}
        </button>
      )}
      <Link href={`/posts/${post.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-surface">
        <ExternalLink className="w-3.5 h-3.5" />
        Open
      </Link>
    </div>
  );
}

function CommitmentList({ commitments }: { commitments: ExternalCommitment[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <h2 className="font-semibold">External commitments</h2>
      {commitments.map((commitment) => (
        <div key={commitment.id} className="rounded-xl bg-surface-alt p-3 text-sm">
          <div className="font-semibold">{commitment.title}</div>
          <div className="text-xs text-muted">{commitment.partnerName} · {commitment.dueDate} · {commitment.status.replace("_", " ")}</div>
          {commitment.fee != null && <div className="mt-1 text-xs text-muted">${commitment.fee.toFixed(2)}</div>}
        </div>
      ))}
      {commitments.length === 0 && <EmptyState label="No external commitments linked yet." />}
    </div>
  );
}

function CommitmentForm({
  title,
  partnerName,
  dueDate,
  fee,
  notes,
  setTitle,
  setPartnerName,
  setDueDate,
  setFee,
  setNotes,
  onCreate,
}: {
  title: string;
  partnerName: string;
  dueDate: string;
  fee: string;
  notes: string;
  setTitle: (value: string) => void;
  setPartnerName: (value: string) => void;
  setDueDate: (value: string) => void;
  setFee: (value: string) => void;
  setNotes: (value: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <h2 className="font-semibold">Add external commitment</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deliver Lisbon hotel reel" className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
      <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Partner or client" className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
      <input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Fee, optional" inputMode="decimal" className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="min-h-20 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
      <button onClick={onCreate} disabled={!title.trim() || !partnerName.trim() || !dueDate} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        <Plus className="w-4 h-4" />
        Add commitment
      </button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-xl bg-surface-alt p-5 text-sm text-muted">{label}</div>;
}
