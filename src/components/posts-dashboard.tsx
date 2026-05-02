"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { id } from "@instantdb/react";
import { Copy, ExternalLink, FileText, FolderKanban, Link2, MousePointerClick, Plus, Sparkles } from "lucide-react";
import { db } from "@/lib/instant";
import type { AffiliateLink, Campaign, ClickLog, CreatorPost, PostSlot } from "@/lib/post-types";
import { cn, generateReferralUrl } from "@/lib/utils";
import { makeShortCode, shortUrlFor } from "@/lib/affiliate";
import { postStats, slugify, usernameFromEmail } from "@/lib/posts";

type CopyPostTx =
  | ReturnType<(typeof db.tx.creator_posts)[string]["update"]>
  | ReturnType<(typeof db.tx.post_slots)[string]["update"]>
  | ReturnType<(typeof db.tx.affiliate_links)[string]["update"]>;

export function PostsDashboard() {
  const searchParams = useSearchParams();
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [username, setUsername] = useState(usernameFromEmail(auth.user?.email));
  const campaignId = searchParams.get("campaignId") ?? "";
  const createdCampaignId = searchParams.get("createdCampaignId") ?? "";

  const profileQuery = db.useQuery(userId ? { $users: {} } : null);
  const postsQuery = db.useQuery(
    userId ? { creator_posts: { $: { where: { userId }, order: { createdAt: "desc" } } } } : null,
  );
  const slotsQuery = db.useQuery(
    userId ? { post_slots: { $: { where: { userId }, order: { slotIndex: "asc" } } } } : null,
  );
  const linksQuery = db.useQuery(
    userId ? { affiliate_links: { $: { where: { userId }, order: { createdAt: "desc" } } } } : null,
  );
  const clicksQuery = db.useQuery(
    userId ? { click_logs: { $: { where: { userId }, order: { timestamp: "desc" } } } } : null,
  );
  const campaignsQuery = db.useQuery(
    userId ? { campaigns: { $: { where: { userId }, order: { createdAt: "desc" } } } } : null,
  );

  const profile = profileQuery.data?.$users?.find((user) => user.id === userId);
  const posts = (postsQuery.data?.creator_posts ?? []) as CreatorPost[];
  const slots = (slotsQuery.data?.post_slots ?? []) as PostSlot[];
  const links = (linksQuery.data?.affiliate_links ?? []) as AffiliateLink[];
  const clicks = (clicksQuery.data?.click_logs ?? []) as ClickLog[];
  const campaigns = (campaignsQuery.data?.campaigns ?? []) as Campaign[];
  const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const filteredPosts = campaignId ? posts.filter((post) => post.campaignId === campaignId) : posts;
  const activeCampaign = campaignId ? campaignById.get(campaignId) : undefined;

  const rows = filteredPosts.map((post) => ({ post, stats: postStats(post, slots, links, clicks) }));
  const totalClicks = rows.reduce((sum, row) => sum + row.stats.clicks, 0);
  const totalCommission = rows.reduce((sum, row) => sum + row.stats.commission, 0);

  async function saveUsername() {
    if (!userId || !username.trim()) return;
    await db.transact(db.tx.$users[userId].update({ username: slugify(username).replace(/-/g, "_") }));
  }

  async function copyPost(post: CreatorPost) {
    if (!userId) return;
    const sourceSlots = slots.filter((slot) => slot.postId === post.id);
    const newPostId = id();
    const now = new Date().toISOString();
    const creatorCode = profile?.username || usernameFromEmail(auth.user?.email);
    const chunks: CopyPostTx[] = [
      db.tx.creator_posts[newPostId].update({
        userId,
        title: `${post.title} (Copy)`,
        slug: `${post.slug}-copy-${newPostId.slice(0, 5)}`,
        description: post.description,
        coverImageUrl: post.coverImageUrl,
        isPublic: false,
        copiedFromPostId: post.id,
        createdAt: now,
        updatedAt: now,
      }),
    ];

    sourceSlots.forEach((slot, index) => {
      const slotId = id();
      const linkId = id();
      const shortCode = makeShortCode(slot.viatorProductId);
      chunks.push(
        db.tx.post_slots[slotId].update({
          userId,
          postId: newPostId,
          slotIndex: index,
          label: slot.label,
          viatorProductId: slot.viatorProductId,
          productTitle: slot.productTitle,
          productUrl: slot.productUrl,
          productImageUrl: slot.productImageUrl,
          destination: slot.destination,
          price: slot.price,
          currency: slot.currency,
          rating: slot.rating,
          reviewCount: slot.reviewCount,
          durationLabel: slot.durationLabel,
          source: slot.source,
          active: slot.active,
          isPublic: false,
          createdAt: now,
        }),
        db.tx.affiliate_links[linkId].update({
          linkId,
          userId,
          postId: newPostId,
          slotId,
          slotLabel: slot.label,
          viatorProductId: slot.viatorProductId,
          shortCode,
          affiliateUrl: generateReferralUrl(slot.productUrl, creatorCode, "post_slot_copy"),
          destinationUrl: slot.productUrl,
          productTitle: slot.productTitle,
          productImageUrl: slot.productImageUrl,
          productPrice: slot.price,
          productCurrency: slot.currency,
          productRating: slot.rating,
          reviewCount: slot.reviewCount,
          campaignSource: "post_slot_copy",
          creatorCode,
          active: true,
          createdAt: now,
        }),
      );
    });

    await db.transact(chunks);
  }

  if (postsQuery.isLoading || slotsQuery.isLoading || linksQuery.isLoading || clicksQuery.isLoading || campaignsQuery.isLoading) {
    return <div className="min-h-[50vh] grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-sm text-muted">
            {activeCampaign ? `Filtered to ${activeCampaign.title}.` : "Grouped short links for creator content alternatives."}
          </p>
        </div>
        <Link href="/posts/new" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="w-4 h-4" />
          Create Post
        </Link>
      </div>

      {createdCampaignId && (
        <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-sm flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-success">Post created! Generate content for this campaign?</span>
          <Link href={`/campaigns/${createdCampaignId}`} className="inline-flex items-center gap-2 rounded-xl bg-success px-3 py-2 text-xs font-semibold text-white">
            <Sparkles className="w-3.5 h-3.5" />
            Open campaign
          </Link>
        </div>
      )}

      {activeCampaign && (
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-accent">Showing posts linked to {activeCampaign.title}</span>
          <Link href="/posts" className="text-xs font-semibold text-accent hover:underline">Clear filter</Link>
        </div>
      )}

      {!profile?.username && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-64">
            <div className="text-sm font-semibold">Set username to publish link-in-bio posts</div>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <button onClick={saveUsername} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">Save username</button>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat icon={FileText} label="Posts" value={posts.length} />
        <Stat icon={MousePointerClick} label="Human clicks" value={totalClicks} highlight />
        <Stat icon={Link2} label="Est. commission" value={`$${totalCommission.toFixed(2)}`} />
      </div>

      <div className="grid gap-4">
        {rows.map(({ post, stats }) => (
          <article key={post.id} className="rounded-2xl border border-border bg-surface p-4 space-y-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg">{post.title}</h2>
                  <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", post.isPublic ? "bg-success/10 text-success" : "bg-surface-alt text-muted")}>{post.isPublic ? "Public" : "Private"}</span>
                </div>
                <p className="text-sm text-muted">{post.description}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  {post.campaignId && campaignById.has(post.campaignId) && (
                    <Link href={`/campaigns/${post.campaignId}`} className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
                      <FolderKanban className="w-3.5 h-3.5" />
                      {campaignById.get(post.campaignId)?.title}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {profile?.username && post.isPublic && (
                  <a href={`/@${profile.username}/${post.slug}`} target="_blank" className="p-2 rounded-xl hover:bg-surface-alt" title="Open public post">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <Link href={`/posts/${post.id}`} className="p-2 rounded-xl hover:bg-surface-alt" title="Post detail">
                  <FileText className="w-4 h-4" />
                </Link>
                <button onClick={() => copyPost(post)} className="p-2 rounded-xl hover:bg-surface-alt" title="Copy post">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <Metric label="Total clicks" value={stats.clicks} />
              <Metric label="Est. commission" value={`$${stats.commission.toFixed(2)}`} />
              <Metric label="Top slot" value={stats.topSlot?.label ?? "None"} />
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              {stats.slots.map(({ slot, clicks: slotClicks, commission }) => {
                const link = stats.links.find((item) => item.slotId === slot.id);
                return (
                  <div key={slot.id} className="rounded-xl bg-surface-alt p-3 text-sm">
                    <div className="font-semibold">{slot.label}</div>
                    <div className="text-muted line-clamp-1">{slot.productTitle}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                      <span>{slotClicks} clicks</span>
                      <span>${commission.toFixed(2)} est.</span>
                      {link && <span className="font-mono">{shortUrlFor(link.shortCode)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight }: { icon: typeof FileText; label: string; value: string | number; highlight?: boolean }) {
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
