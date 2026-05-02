"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  FolderKanban,
  Lightbulb,
  Link2,
  MousePointerClick,
  Plus,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/instant";
import type { AffiliateLink, Campaign, CampaignContent, ClickLog, CreatorPost, PostSlot } from "@/lib/post-types";
import { humanClicks } from "@/lib/posts";
import { cn, estimateCommission } from "@/lib/utils";

type DashboardTask = {
  label: string;
  detail: string;
  href: string;
  tone: "accent" | "warning" | "muted";
};

export function CreatorDashboardHome() {
  const auth = db.useAuth();
  const userId = auth.user?.id;
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

  if (
    campaignsQuery.isLoading ||
    postsQuery.isLoading ||
    slotsQuery.isLoading ||
    linksQuery.isLoading ||
    clicksQuery.isLoading ||
    contentQuery.isLoading
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
  const upcoming = campaigns
    .filter((campaign) => {
      if (!campaign.scheduledDate) return false;
      const scheduled = new Date(campaign.scheduledDate);
      return scheduled >= startOfToday(now) && scheduled <= nextWeek;
    })
    .sort((a, b) => String(a.scheduledDate).localeCompare(String(b.scheduledDate)))
    .slice(0, 6);

  const tasks = campaigns.flatMap((campaign) => {
    const campaignPosts = posts.filter((post) => post.campaignId === campaign.id);
    return [
      !contentCampaignIds.has(campaign.id)
        ? { label: "Generate content", detail: campaign.title, href: `/campaigns/${campaign.id}`, tone: "accent" as const }
        : null,
      !campaign.scheduledDate
        ? { label: "Schedule campaign", detail: campaign.title, href: `/campaigns/${campaign.id}`, tone: "warning" as const }
        : null,
      campaignPosts.length === 0
        ? { label: "Add linked post", detail: campaign.title, href: `/posts/new?campaignId=${campaign.id}`, tone: "muted" as const }
        : null,
    ].filter((task): task is DashboardTask => task !== null);
  }).slice(0, 8);

  const recentClicks = clicks.slice(0, 5).map((click) => {
    const post = click.postId ? postsById.get(click.postId) : undefined;
    const campaign = post?.campaignId ? campaignsById.get(post.campaignId) : undefined;
    const link = links.find((item) => item.linkId === click.linkId || item.shortCode === click.shortCode);
    return {
      click,
      title: post?.title ?? campaign?.title ?? link?.productTitle ?? click.shortCode,
      subtitle: campaign?.title ?? link?.productTitle ?? "Tracked link",
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator dashboard</h1>
          <p className="mt-1 text-sm text-muted">Today&apos;s campaigns, posts, content tasks, and click performance in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionLink href="/campaigns" icon={Plus} label="New campaign" primary />
          <ActionLink href="/posts/new" icon={FileText} label="New post" />
          <ActionLink href="/suggest-niches" icon={Lightbulb} label="Get niche suggestions" />
        </div>
      </div>

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
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="flex items-center gap-3 rounded-xl bg-surface-alt p-3 hover:bg-border/50">
                <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent grid place-items-center text-xs font-bold">
                  {formatDay(campaign.scheduledDate)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{campaign.title}</div>
                  <div className="text-xs text-muted">{campaign.niche}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted" />
              </Link>
            ))}
            {upcoming.length === 0 && <EmptyState label="No scheduled campaigns in the next 7 days." />}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Needs attention
          </h2>
          <div className="space-y-2">
            {tasks.map((task) => (
              <Link key={`${task.detail}-${task.label}`} href={task.href} className="flex items-center gap-3 rounded-xl bg-surface-alt p-3 hover:bg-border/50">
                <span className={cn("w-2.5 h-2.5 rounded-full", task.tone === "accent" && "bg-accent", task.tone === "warning" && "bg-warning", task.tone === "muted" && "bg-muted")} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{task.label}</div>
                  <div className="text-xs text-muted truncate">{task.detail}</div>
                </div>
              </Link>
            ))}
            {tasks.length === 0 && <EmptyState label="Everything has content, dates, and linked posts." />}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4 text-accent" />
            Recent clicks
          </h2>
          <Link href="/posts" className="text-xs font-semibold text-accent hover:underline">View posts</Link>
        </div>
        <div className="grid md:grid-cols-5 gap-2">
          {recentClicks.map(({ click, title, subtitle }) => (
            <div key={click.id} className="rounded-xl bg-surface-alt p-3 text-sm">
              <div className="font-semibold line-clamp-2">{title}</div>
              <div className="mt-1 text-xs text-muted line-clamp-2">{subtitle}</div>
              <div className="mt-3 text-[11px] text-muted">{new Date(click.timestamp).toLocaleString()}</div>
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
