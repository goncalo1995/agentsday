"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  FolderKanban,
  Link2,
  MousePointerClick,
  Plus,
  Sparkles,
} from "lucide-react";
import { id } from "@instantdb/react";
import { db } from "@/lib/instant";
import type { AffiliateLink, Campaign, CampaignContent, ClickLog, CreatorPost, ExternalCommitment, PostSlot } from "@/lib/post-types";
import { humanClicks } from "@/lib/posts";
import { cn, estimateCommission } from "@/lib/utils";

type DashboardTask = {
  kind: "products" | "content" | "schedule" | "post";
  detail: string;
  campaign: Campaign;
};

export function CreatorDashboardHome() {
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [commitmentTitle, setCommitmentTitle] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [fee, setFee] = useState("");
  const since = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }, []);

  const campaignsQuery = db.useQuery(
    userId ? { campaigns: { $: { where: { userId }, order: { createdAt: "desc" } } } } : null,
  );
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
    userId
      ? {
          click_logs: {
            $: {
              where: { userId, timestamp: { $gte: since } },
              order: { timestamp: "desc" },
            },
          },
        }
      : null,
  );
  const contentQuery = db.useQuery(
    userId ? { campaign_content: { $: { where: { userId }, order: { generatedAt: "desc" } } } } : null,
  );
  const commitmentsQuery = db.useQuery(
    userId ? { external_commitments: { $: { where: { userId }, order: { dueDate: "asc" } } } } : null,
  );

  if (
    campaignsQuery.isLoading ||
    postsQuery.isLoading ||
    slotsQuery.isLoading ||
    linksQuery.isLoading ||
    clicksQuery.isLoading ||
    contentQuery.isLoading ||
    commitmentsQuery.isLoading
  ) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const campaigns = (campaignsQuery.data?.campaigns ?? []) as Campaign[];
  const posts = (postsQuery.data?.creator_posts ?? []) as CreatorPost[];
  const slots = (slotsQuery.data?.post_slots ?? []) as PostSlot[];
  const links = (linksQuery.data?.affiliate_links ?? []) as AffiliateLink[];
  const clicks = humanClicks((clicksQuery.data?.click_logs ?? []) as ClickLog[]);
  const contents = (contentQuery.data?.campaign_content ?? []) as CampaignContent[];
  const commitments = (commitmentsQuery.data?.external_commitments ?? []) as ExternalCommitment[];

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const contentCampaignIds = new Set(contents.map((content) => content.campaignId));

  const commission = clicks.reduce((sum, click) => {
    const slot = click.slotId ? slotsById.get(click.slotId) : undefined;
    return sum + estimateCommission(slot?.price, 1);
  }, 0);

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  const upcomingCampaigns = campaigns
    .filter((campaign) => {
      if (!campaign.scheduledDate) return false;
      const scheduled = new Date(campaign.scheduledDate);
      return scheduled >= startOfToday(now) && scheduled <= nextWeek;
    })
    .map((campaign) => ({
      id: `campaign-${campaign.id}`,
      title: campaign.title,
      detail: campaign.niche,
      date: campaign.scheduledDate ?? "",
      href: `/campaigns/${campaign.id}?tab=calendar`,
      type: "Campaign",
    }));
  const upcomingCommitments = commitments
    .filter((commitment) => {
      const due = new Date(commitment.dueDate);
      return due >= startOfToday(now) && due <= nextWeek;
    })
    .map((commitment) => ({
      id: `commitment-${commitment.id}`,
      title: commitment.title,
      detail: commitment.partnerName,
      date: commitment.dueDate,
      href: commitment.campaignId ? `/campaigns/${commitment.campaignId}?tab=calendar` : "/dashboard",
      type: "Commitment",
    }));
  const upcoming = [...upcomingCampaigns, ...upcomingCommitments]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const tasks = campaigns.flatMap((campaign) => {
    const campaignPosts = posts.filter((post) => post.campaignId === campaign.id);
    const hasProducts = slots.some((slot) => campaignPosts.some((post) => post.id === slot.postId));
    return [
      !hasProducts
        ? { kind: "products" as const, detail: "No products selected", campaign }
        : null,
      !contentCampaignIds.has(campaign.id)
        ? { kind: "content" as const, detail: "No content generated", campaign }
        : null,
      !campaign.scheduledDate
        ? { kind: "schedule" as const, detail: "No scheduled date", campaign }
        : null,
      campaignPosts.length === 0
        ? { kind: "post" as const, detail: "No linked post", campaign }
        : null,
    ].filter((task): task is DashboardTask => task !== null);
  }).slice(0, 8);

  const topNiches = [...clicks.reduce((map, click) => {
    const post = click.postId ? postsById.get(click.postId) : undefined;
    const campaign = post?.campaignId ? campaignsById.get(post.campaignId) : undefined;
    const niche = campaign?.niche;
    if (!niche) return map;
    map.set(niche, (map.get(niche) ?? 0) + 1);
    return map;
  }, new Map<string, number>())]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentClicks = clicks.slice(0, 5).map((click) => {
    const post = click.postId ? postsById.get(click.postId) : undefined;
    const campaign = post?.campaignId ? campaignsById.get(post.campaignId) : undefined;
    const link = links.find((item) => item.linkId === click.linkId || item.shortCode === click.shortCode);
    return {
      click,
      title: campaign?.title ?? post?.title ?? link?.productTitle ?? "Tracked link",
      shortUrl: link?.shortCode ? shortUrlPath(link.shortCode) : shortUrlPath(click.shortCode),
    };
  });

  async function createCommitment() {
    if (!userId || !commitmentTitle.trim() || !partnerName.trim() || !dueDate) return;
    const now = new Date().toISOString();
    await db.transact(
      db.tx.external_commitments[id()].update({
        userId,
        title: commitmentTitle.trim(),
        partnerName: partnerName.trim(),
        dueDate,
        status: "planned",
        fee: fee ? Number(fee) : undefined,
        createdAt: now,
        updatedAt: now,
      }),
    );
    setCommitmentTitle("");
    setPartnerName("");
    setDueDate("");
    setFee("");
    setShowCommitmentForm(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator workspace</h1>
          <p className="mt-1 text-sm text-muted">Start a campaign studio flow, make a quick referral post, or track outside commitments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionLink href="/campaigns/new" icon={Plus} label="Start campaign" primary />
          <ActionLink href="/posts/new" icon={FileText} label="Quick referral post" />
          <button onClick={() => setShowCommitmentForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-alt">
            <CalendarClock className="w-4 h-4" />
            Add external commitment
          </button>
        </div>
      </div>

      {showCommitmentForm && (
        <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-[1fr_220px_170px_120px_auto]">
          <input value={commitmentTitle} onChange={(e) => setCommitmentTitle(e.target.value)} placeholder="Deliver hotel reel" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Partner" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          <input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Fee" inputMode="decimal" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          <button onClick={createCommitment} disabled={!commitmentTitle.trim() || !partnerName.trim() || !dueDate} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            Add
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={FolderKanban} label="Campaigns" value={campaigns.length} />
        <Metric icon={FileText} label="Posts" value={posts.length} />
        <Metric icon={MousePointerClick} label="Clicks, 30 days" value={clicks.length} highlight />
        <Metric icon={Sparkles} label="Est. commission" value={`$${commission.toFixed(2)}`} />
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-5">
        <section className="rounded-2xl border border-border bg-surface p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-accent" />
              Next 7 days
            </h2>
            <Link href="/campaigns" className="text-xs font-semibold text-accent hover:underline">All campaigns</Link>
          </div>
          <div className="space-y-2">
            {upcoming.map((campaign) => (
              <Link key={campaign.id} href={campaign.href} className="flex items-center gap-3 rounded-xl bg-surface-alt p-3 hover:bg-border/50">
                <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent grid place-items-center text-xs font-bold">
                  {formatDay(campaign.date)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{campaign.title}</div>
                  <div className="text-xs text-muted">{campaign.type} · {campaign.detail}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted" />
              </Link>
            ))}
            {upcoming.length === 0 && <EmptyState label="No upcoming posts" />}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Needs attention
          </h2>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={`${task.campaign.id}-${task.kind}`} className="flex items-center gap-3 rounded-xl bg-surface-alt p-3">
                <span className={cn("w-2.5 h-2.5 rounded-full", task.kind === "products" && "bg-info", task.kind === "content" && "bg-accent", task.kind === "schedule" && "bg-warning", task.kind === "post" && "bg-muted")} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{task.detail}</div>
                  <div className="text-xs text-muted truncate">{task.campaign.title}</div>
                </div>
                {task.kind === "products" && (
                  <Link href={`/campaigns/${task.campaign.id}?tab=products`} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-surface">
                    Products
                  </Link>
                )}
                {task.kind === "content" && (
                  <Link href={`/campaigns/${task.campaign.id}?tab=content`} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-surface">
                    Content
                  </Link>
                )}
                {task.kind === "schedule" && (
                  <Link href={`/campaigns/${task.campaign.id}?tab=calendar`} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-surface">
                    Calendar
                  </Link>
                )}
                {task.kind === "post" && (
                  <Link href={`/campaigns/${task.campaign.id}?tab=posts`} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-surface">
                    Posts
                  </Link>
                )}
              </div>
            ))}
            {tasks.length === 0 && <EmptyState label="Everything has content, dates, and linked posts." />}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Top niches
        </h2>
        <div className="flex flex-wrap gap-2">
          {topNiches.map(([niche, count]) => (
            <Link key={niche} href={`/campaigns?niche=${encodeURIComponent(niche)}`} className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/15">
              {niche} · {count}
            </Link>
          ))}
          {topNiches.length === 0 && <EmptyState label="No niche clicks in the last 30 days." />}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4 text-accent" />
            Recent clicks
          </h2>
          <Link href="/posts" className="text-xs font-semibold text-accent hover:underline">View posts</Link>
        </div>
        <div className="space-y-2">
          {recentClicks.map(({ click, title, shortUrl }) => (
            <div key={click.id} className="grid gap-2 rounded-xl bg-surface-alt p-3 text-sm md:grid-cols-[1fr_160px_110px] md:items-center">
              <div className="font-semibold truncate">{title}</div>
              <div className="font-mono text-xs text-muted">{shortUrl}</div>
              <div className="text-xs text-muted md:text-right">{timeAgo(click.timestamp)}</div>
            </div>
          ))}
          {recentClicks.length === 0 && <EmptyState label="No human clicks in the last 30 days." />}
        </div>
      </section>
    </div>
  );
}

function startOfToday(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDay(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function shortUrlPath(shortCode?: string) {
  return shortCode ? `/l/${shortCode}` : "No short URL";
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ActionLink({ href, icon: Icon, label, primary }: { href: string; icon: typeof Plus; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
        primary ? "bg-accent text-white hover:bg-accent/90" : "border border-border hover:bg-surface-alt",
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

function Metric({ icon: Icon, label, value, highlight }: { icon: typeof FolderKanban; label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4 flex items-center gap-3", highlight ? "border-accent/20 bg-accent/5" : "border-border bg-surface")}>
      <div className={cn("w-10 h-10 rounded-xl grid place-items-center", highlight ? "bg-accent/10 text-accent" : "bg-surface-alt text-muted")}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className={cn("text-xl font-bold", highlight && "text-accent")}>{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-xl bg-surface-alt p-5 text-sm text-muted">{label}</div>;
}
