"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, FileText, Plus, Sparkles } from "lucide-react";
import { db } from "@/lib/instant";
import type { Campaign, CreatorPost } from "@/lib/post-types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: Campaign["status"][] = ["draft", "active", "archived"];

export function CampaignsPage() {
  return (
    <Suspense fallback={null}>
      <CampaignsList />
    </Suspense>
  );
}

function CampaignsList() {
  const searchParams = useSearchParams();
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [filter, setFilter] = useState<Campaign["status"] | "all">("all");
  const nicheFilter = searchParams.get("niche") ?? "";

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

  const campaigns = (campaignsQuery.data?.campaigns ?? []) as Campaign[];
  const posts = (postsQuery.data?.creator_posts ?? []) as CreatorPost[];

  const visible = campaigns.filter((campaign) => {
    const statusMatch = filter === "all" || campaign.status === filter;
    const nicheMatch = !nicheFilter || campaign.niche.toLowerCase() === nicheFilter.toLowerCase();
    return statusMatch && nicheMatch;
  });

  if (campaignsQuery.isLoading || postsQuery.isLoading) {
    return <div className="min-h-[50vh] grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted">{nicheFilter ? `Filtered to ${nicheFilter}.` : "Plan creator work, generate AI content, and connect posts to a niche."}</p>
        </div>
        <Link href="/campaigns/new" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        {nicheFilter && (
          <Link href="/campaigns" className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10">
            Clear niche
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {visible.map((campaign) => {
          const campaignPosts = posts.filter((post) => post.campaignId === campaign.id);
          return (
            <article key={campaign.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-lg">{campaign.title}</h2>
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
                  <Link href={`/campaigns/${campaign.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-alt">
                    Open
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
            No campaigns yet. <Link href="/campaigns/new" className="font-semibold text-accent hover:underline">Create one →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function statusClass(status: Campaign["status"]) {
  if (status === "active") return "bg-success/10 text-success";
  if (status === "archived") return "bg-surface-alt text-muted";
  return "bg-warning/10 text-warning";
}
