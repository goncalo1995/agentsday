"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { id } from "@instantdb/react";
import { Archive, Calendar, FileText, Lightbulb, Plus, Rocket, Sparkles } from "lucide-react";
import { db } from "@/lib/instant";
import type { Campaign, CampaignContent, CreatorPost } from "@/lib/post-types";
import { cn } from "@/lib/utils";

type CampaignTx =
  | ReturnType<(typeof db.tx.campaigns)[string]["update"]>
  | ReturnType<(typeof db.tx.campaigns)[string]["delete"]>;

const STATUS_OPTIONS: Campaign["status"][] = ["draft", "active", "archived"];

export function CampaignsPage() {
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [filter, setFilter] = useState<Campaign["status"] | "all">("all");

  const campaignsQuery = db.useQuery(
    userId
      ? {
          campaigns: {
            $: { where: { userId }, order: { createdAt: "desc" } },
          },
        }
      : null,
  );
  const postsQuery = db.useQuery(
    userId
      ? {
          creator_posts: {
            $: { where: { userId }, order: { createdAt: "desc" } },
          },
        }
      : null,
  );
  const contentQuery = db.useQuery(
    userId
      ? {
          campaign_content: {
            $: { where: { userId }, order: { generatedAt: "desc" } },
          },
        }
      : null,
  );

  const campaigns = (campaignsQuery.data?.campaigns ?? []) as Campaign[];
  const posts = (postsQuery.data?.creator_posts ?? []) as CreatorPost[];
  const contents = (contentQuery.data?.campaign_content ?? []) as CampaignContent[];

  const visible = campaigns.filter((campaign) => filter === "all" || campaign.status === filter);

  async function createCampaign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId || !title.trim()) return;
    const now = new Date().toISOString();
    await db.transact(
      db.tx.campaigns[id()].update({
        userId,
        title,
        niche: niche || "creator picks",
        status: "draft",
        createdAt: now,
        updatedAt: now,
      }),
    );
    setTitle("");
    setNiche("");
  }

  async function setStatus(campaign: Campaign, status: Campaign["status"]) {
    if (!userId) return;
    const chunks: CampaignTx[] = [
      db.tx.campaigns[campaign.id].update({
        status,
        updatedAt: new Date().toISOString(),
      }),
    ];
    await db.transact(chunks);
  }

  if (campaignsQuery.isLoading || postsQuery.isLoading || contentQuery.isLoading) {
    return <div className="min-h-[50vh] grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted">Plan creator work, generate AI content, and connect posts to a niche.</p>
        </div>
        <Link href="/suggest-niches" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-alt">
          <Lightbulb className="w-4 h-4" />
          What should I post next?
        </Link>
      </div>

      <form onSubmit={createCampaign} className="grid md:grid-cols-[1fr_260px_auto] gap-3 rounded-2xl border border-border bg-surface p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summer budget travel push"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="budget travel"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="w-4 h-4" />
          Create
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", ...STATUS_OPTIONS] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
              filter === status ? "bg-accent text-white" : "bg-surface-alt text-muted hover:bg-border/50",
            )}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {visible.map((campaign) => {
          const campaignPosts = posts.filter((post) => post.campaignId === campaign.id);
          const latestContent = contents.find((content) => content.campaignId === campaign.id);
          return (
            <article key={campaign.id} className="rounded-2xl border border-border bg-surface p-4 space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/campaigns/${campaign.id}`} className="font-semibold text-lg hover:text-accent">{campaign.title}</Link>
                    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold capitalize", statusClass(campaign.status))}>{campaign.status}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />{campaign.niche}</span>
                    {campaign.scheduledDate && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{campaign.scheduledDate}</span>}
                    <span>{campaignPosts.length} posts</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/posts?campaignId=${campaign.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-alt">
                    <FileText className="w-3.5 h-3.5" />
                    View Posts
                  </Link>
                  <button onClick={() => setStatus(campaign, campaign.status === "active" ? "archived" : "active")} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-alt">
                    {campaign.status === "active" ? <Archive className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />}
                    {campaign.status === "active" ? "Archive" : "Activate"}
                  </button>
                </div>
              </div>

              {latestContent ? (
                <div className="rounded-xl bg-surface-alt p-3 text-sm">
                  <div className="mb-1 text-xs font-semibold text-muted uppercase">{latestContent.platform} · {latestContent.contentType.replace("_", " ")}</div>
                  <p className="line-clamp-2">{latestContent.contentText}</p>
                </div>
              ) : (
                <div className="rounded-xl bg-surface-alt p-3 text-sm text-muted">No AI content yet.</div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function statusClass(status: Campaign["status"]) {
  if (status === "active") return "bg-success/10 text-success";
  if (status === "archived") return "bg-surface-alt text-muted";
  return "bg-warning/10 text-warning";
}
