"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { id } from "@instantdb/react";
import { ArrowLeft, Plus } from "lucide-react";
import { db } from "@/lib/instant";

export function NewCampaignPage() {
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState(searchParams.get("title") ?? "");
  const [niche, setNiche] = useState(searchParams.get("niche") ?? "");
  const [busy, setBusy] = useState(false);

  async function createCampaign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId || !title.trim()) return;
    setBusy(true);
    const campaignId = id();
    const now = new Date().toISOString();
    await db.transact(
      db.tx.campaigns[campaignId].update({
        userId,
        title: title.trim(),
        niche: niche.trim() || "creator picks",
        status: "draft",
        createdAt: now,
        updatedAt: now,
      }),
    );
    router.push(`/campaigns/${campaignId}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/campaigns" className="p-2 rounded-full hover:bg-surface-alt">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New campaign</h1>
          <p className="text-sm text-muted">Create a draft campaign and connect posts from there.</p>
        </div>
      </div>

      <form onSubmit={createCampaign} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <label className="block text-xs font-semibold text-muted">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Luxury honeymoon picks"
            className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </label>
        <label className="block text-xs font-semibold text-muted">
          Niche
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="luxury honeymoon"
            className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </label>
        <button disabled={!title.trim() || busy} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Plus className="w-4 h-4" />
          {busy ? "Creating..." : "Create campaign"}
        </button>
      </form>
    </div>
  );
}
