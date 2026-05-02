"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, ExternalLink, FileText, FolderKanban, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { db } from "@/lib/instant";
import type { AffiliateLink, Campaign, ClickLog, CreatorPost, PostSlot } from "@/lib/post-types";
import { cn } from "@/lib/utils";
import { shortUrlFor } from "@/lib/affiliate";
import { postStats, slugify, usernameFromEmail } from "@/lib/posts";

type DeletePostTx =
  | ReturnType<(typeof db.tx.creator_posts)[string]["delete"]>
  | ReturnType<(typeof db.tx.post_slots)[string]["delete"]>
  | ReturnType<(typeof db.tx.affiliate_links)[string]["delete"]>;

export function PostsDashboard() {
  const searchParams = useSearchParams();
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [username, setUsername] = useState(usernameFromEmail(auth.user?.email));
  const [campaignId, setCampaignId] = useState(searchParams.get("campaignId") ?? "");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState("");
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
  const filteredPosts = posts.filter((post) => {
    const campaignMatch = !campaignId || post.campaignId === campaignId;
    const text = `${post.title} ${post.description ?? ""}`.toLowerCase();
    return campaignMatch && text.includes(search.toLowerCase());
  });
  const activeCampaign = campaignId ? campaignById.get(campaignId) : undefined;

  const rows = filteredPosts.map((post) => ({ post, stats: postStats(post, slots, links, clicks) }));
  async function saveUsername() {
    if (!userId || !username.trim()) return;
    await db.transact(db.tx.$users[userId].update({ username: slugify(username).replace(/-/g, "_") }));
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1400);
  }

  async function deletePost(post: CreatorPost) {
    if (!userId) return;
    const chunks: DeletePostTx[] = [
      db.tx.creator_posts[post.id].delete(),
      ...slots.filter((slot) => slot.postId === post.id).map((slot) => db.tx.post_slots[slot.id].delete()),
      ...links.filter((link) => link.postId === post.id).map((link) => db.tx.affiliate_links[link.id].delete()),
    ];
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
            {activeCampaign ? `Filtered to ${activeCampaign.title}.` : "Created posts, campaign posts, and saved-deal collections."}
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

      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-[1fr_260px]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts"
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </label>
        <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
          <option value="">All campaigns</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
          ))}
        </select>
      </div>

      {!profile?.username && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-64">
            <div className="text-sm font-semibold">Set username to publish link-in-bio posts</div>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <button onClick={saveUsername} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">Save username</button>
        </div>
      )}

      <div className="grid gap-4">
        {rows.map(({ post, stats }) => {
          const firstLink = stats.links[0];
          const shortUrl = firstLink ? shortUrlFor(firstLink.shortCode) : "";
          return (
          <article key={post.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start gap-4">
              {post.coverImageUrl && (
                <img src={post.coverImageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
              )}
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
              <div className="flex flex-wrap gap-2">
                {profile?.username && post.isPublic && (
                  <a href={`/@${profile.username}/${post.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-alt" title="Open public post">
                    <ExternalLink className="w-4 h-4" />
                    View
                  </a>
                )}
                <Link href={`/posts/${post.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-alt" title="Post detail">
                  <FileText className="w-4 h-4" />
                  Detail
                </Link>
                <button onClick={() => shortUrl && copyText(shortUrl, post.id)} disabled={!shortUrl} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-alt disabled:opacity-50" title="Copy short URL">
                  <Copy className="w-4 h-4" />
                  {copied === post.id ? "Copied" : "Copy URL"}
                </button>
                <button onClick={() => deletePost(post)} className="inline-flex items-center gap-1.5 rounded-xl border border-danger/20 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/5" title="Delete post">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <Metric label="Short URL" value={shortUrl || "None"} mono />
              <Metric label="Clicks" value={stats.clicks} />
              <Metric label="Est. commission" value={`$${stats.commission.toFixed(2)}`} />
            </div>
          </article>
        );
        })}
        {rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
            No posts yet. <Link href="/posts/new" className="font-semibold text-accent hover:underline">Create one →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className={cn("font-semibold truncate", mono && "font-mono text-xs")}>{value}</div>
    </div>
  );
}
