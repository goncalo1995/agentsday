"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Copy, FileText, Link2, Plus, Sparkles, Wand2 } from "lucide-react";
import { db } from "@/lib/instant";
import type { AffiliateLink, Campaign, CampaignContent, CreatorPost, PostSlot } from "@/lib/post-types";
import { cn } from "@/lib/utils";
import { shortUrlFor } from "@/lib/affiliate";

const PLATFORMS = ["instagram", "tiktok", "youtube"] as const;

export function CampaignDetailPage({ campaignId }: { campaignId: string }) {
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("instagram");
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);

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

  const campaign = campaignsQuery.data?.campaigns?.[0] as Campaign | undefined;
  const posts = (postsQuery.data?.creator_posts ?? []) as CreatorPost[];
  const contents = (contentQuery.data?.campaign_content ?? []) as CampaignContent[];
  const slots = ((slotsQuery.data?.post_slots ?? []) as PostSlot[]).filter((slot) => posts.some((post) => post.id === slot.postId));
  const links = ((linksQuery.data?.affiliate_links ?? []) as AffiliateLink[]).filter((link) => posts.some((post) => post.id === link.postId));
  const firstProduct = slots[0];
  const firstLink = links[0];

  const groupedContent = new Map<string, CampaignContent[]>();
  for (const item of contents) {
    const key = `${item.platform}:${item.contentType}`;
    const list = groupedContent.get(key) ?? [];
    list.push(item);
    groupedContent.set(key, list);
  }

  const firstShortUrl = firstLink ? shortUrlFor(firstLink.shortCode) : "";
  const checklist = [
    {
      label: "Add a post",
      done: posts.length > 0,
      body: "Create or link a post for this campaign.",
      action: <Link href={`/posts/new?campaignId=${campaignId}`} className="text-accent font-semibold">Add post</Link>,
    },
    {
      label: "Generate content",
      done: contents.length > 0,
      body: firstProduct ? "Generate captions and scripts from the first linked product." : "Add a post first so AI has a product to work from.",
      action: firstProduct
        ? <button onClick={() => generateContent()} className="text-accent font-semibold">Generate</button>
        : <Link href={`/posts/new?campaignId=${campaignId}`} className="text-accent font-semibold">Add post</Link>,
    },
    {
      label: "Schedule post",
      done: !!campaign?.scheduledDate,
      body: campaign?.scheduledDate ? campaign.scheduledDate : "Pick a date below.",
      action: <a href="#schedule" className="text-accent font-semibold">Schedule</a>,
    },
    {
      label: "Copy short URL",
      done: !!firstLink,
      body: firstShortUrl || "Create a post with a slot to get a short URL.",
      action: firstLink
        ? <button onClick={() => copyText(firstShortUrl, "short")} className="text-accent font-semibold">{copied === "short" ? "Copied" : "Copy"}</button>
        : <span className="text-muted">No link yet</span>,
    },
  ];

  async function patchCampaign(fields: Partial<Campaign>) {
    if (!userId || !campaign) return;
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...fields }),
    });
  }

  async function generateContent() {
    if (!userId || !campaign) return;
    setBusy(true);
    try {
      const res = await fetch("/api/campaigns/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          campaignId,
          platform,
          productUrl: firstProduct?.productUrl,
          product: firstProduct,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1600);
  }

  if (campaignsQuery.isLoading || !campaign) {
    return <div className="min-h-[50vh] grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/campaigns" className="p-2 rounded-full hover:bg-surface-alt"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.title}</h1>
          <p className="text-sm text-muted">{campaign.niche} · {campaign.status}</p>
        </div>
      </div>

      <section className="grid lg:grid-cols-[340px_1fr] gap-5">
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
          <h2 className="font-semibold">Setup checklist</h2>
          <div className="space-y-3">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-surface-alt p-3">
                <span className={cn("w-6 h-6 rounded-full grid place-items-center", item.done ? "bg-success text-white" : "bg-border text-muted")}>
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block truncate text-xs text-muted">{item.body}</span>
                </span>
                <span className="text-xs">{item.action}</span>
              </div>
            ))}
          </div>
          <label id="schedule" className="block text-xs font-semibold text-muted">
            Scheduled date
            <input
              type="date"
              value={campaign.scheduledDate ?? ""}
              onChange={(e) => patchCampaign({ scheduledDate: e.target.value, updatedAt: new Date().toISOString() })}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-surface p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">AI content</h2>
                <p className="text-xs text-muted">Generate scripts, captions, story text, and image prompt ideas.</p>
              </div>
              <div className="flex gap-2">
                <select value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
                  {PLATFORMS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <button onClick={() => generateContent()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  <Wand2 className="w-4 h-4" />
                  {busy ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>

            {PLATFORMS.map((item) => (
              <ContentGroup key={item} platform={item} groups={groupedContent} onCopy={copyText} copied={copied} />
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Linked posts</h2>
              <Link href={`/posts/new?campaignId=${campaignId}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-alt">
                <Plus className="w-3.5 h-3.5" />
                Add post
              </Link>
            </div>
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="flex items-center gap-3 rounded-xl bg-surface-alt p-3 hover:bg-border/50">
                <FileText className="w-4 h-4 text-muted" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{post.title}</div>
                  <div className="text-xs text-muted">{post.isPublic ? "Public" : "Private"}</div>
                </div>
                {links.find((link) => link.postId === post.id) && <Link2 className="w-4 h-4 text-accent" />}
              </Link>
            ))}
            {posts.length === 0 && <div className="rounded-xl bg-surface-alt p-5 text-sm text-muted">No posts linked yet.</div>}
          </section>
        </div>
      </section>
    </div>
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
  if (!hasAny) return null;

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold capitalize flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" />
        {platform}
      </h3>
      {types.map((type) => {
        const items = groups.get(`${platform}:${type}`) ?? [];
        if (items.length === 0) return null;
        return (
          <div key={type} className={cn(type === "image_prompt" && "grid md:grid-cols-3 gap-3")}>
            {items.map((item, index) => (
              <div key={item.id} className="rounded-xl bg-surface-alt p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase text-muted">{type.replace("_", " ")} {type === "image_prompt" ? index + 1 : ""}</div>
                  <button onClick={() => onCopy(item.contentText, item.id)} className="p-1 rounded-lg hover:bg-border/50" title="Copy">
                    {copied === item.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{item.contentText}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
