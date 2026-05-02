"use client";

import type { AffiliateLink, ClickLog, CreatorPost, PostSlot } from "@/lib/post-types";
import { db } from "@/lib/instant";
import { countryFromIp, postStats } from "@/lib/posts";
import { humanClicks } from "@/lib/posts";

export function PostReportPage({ postId, from, to }: { postId: string; from: string; to: string }) {
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const postsQuery = db.useQuery(userId ? { creator_posts: { $: { where: { userId, id: postId }, limit: 1 } } } : null);
  const slotsQuery = db.useQuery(userId ? { post_slots: { $: { where: { userId, postId }, order: { slotIndex: "asc" } } } } : null);
  const linksQuery = db.useQuery(userId ? { affiliate_links: { $: { where: { userId, postId }, order: { createdAt: "asc" } } } } : null);
  const clicksQuery = db.useQuery(userId ? { click_logs: { $: { where: { userId, postId }, order: { timestamp: "desc" } } } } : null);

  const post = postsQuery.data?.creator_posts?.[0] as CreatorPost | undefined;
  const slots = (slotsQuery.data?.post_slots ?? []) as PostSlot[];
  const links = (linksQuery.data?.affiliate_links ?? []) as AffiliateLink[];
  const clicks = (clicksQuery.data?.click_logs ?? []) as ClickLog[];
  const filtered = clicks.filter((click) => {
    const ts = new Date(click.timestamp).getTime();
    const start = from ? new Date(from).getTime() : 0;
    const end = to ? new Date(`${to}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
    return ts >= start && ts <= end;
  });
  const stats = post ? postStats(post, slots, links, filtered) : null;
  const locations = humanClicks(filtered).reduce<Record<string, number>>((acc, click) => {
    const country = countryFromIp(click.ip);
    acc[country] = (acc[country] ?? 0) + 1;
    return acc;
  }, {});

  if (!post || !stats) return <div className="p-10">Loading report...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black print:p-0">
      <div className="flex justify-between gap-4 border-b pb-6">
        <div>
          <div className="text-sm uppercase tracking-wider text-gray-500">éFacil Brand Report</div>
          <h1 className="text-3xl font-bold mt-2">{post.title}</h1>
          <p className="text-gray-600 mt-2">{from || "All time"} - {to || "Today"}</p>
        </div>
        <button onClick={() => window.print()} className="print:hidden rounded-xl bg-black text-white px-4 py-2 h-fit">Print / Save PDF</button>
      </div>

      <div className="grid grid-cols-3 gap-4 py-6">
        <ReportMetric label="Total clicks" value={stats.clicks} />
        <ReportMetric label="Estimated commission" value={`$${stats.commission.toFixed(2)}`} />
        <ReportMetric label="Top slot" value={stats.topSlot?.label ?? "None"} />
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Slot performance</h2>
        {stats.slots.map(({ slot, clicks: slotClicks, commission }) => (
          <div key={slot.id} className="grid grid-cols-[1fr_90px_120px] gap-4 border rounded-xl p-3 text-sm">
            <div>
              <div className="font-semibold">{slot.label}</div>
              <div className="text-gray-600">{slot.productTitle}</div>
            </div>
            <div>{slotClicks} clicks</div>
            <div>${commission.toFixed(2)}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">Audience location</h2>
        {Object.entries(locations).map(([country, count]) => (
          <div key={country} className="flex justify-between border-b py-2 text-sm">
            <span>{country}</span>
            <span>{count}</span>
          </div>
        ))}
        {Object.keys(locations).length === 0 && <p className="text-gray-600 text-sm">No audience location data for this range.</p>}
      </section>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-xl p-4">
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
