"use client";

import Link from "next/link";
import { useState } from "react";
import { id } from "@instantdb/react";
import { Check, Lightbulb, Loader2, Plus, Sparkles } from "lucide-react";
import { db } from "@/lib/instant";

type Suggestion = {
  niche: string;
  reason: string;
  exampleProduct: string;
};

export function SuggestNichesPage() {
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftNiche, setDraftNiche] = useState("");

  async function loadSuggestions() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/suggest-niches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function createCampaign(suggestion?: Suggestion) {
    if (!userId) return;
    const title = draftTitle || suggestion?.niche;
    const niche = draftNiche || suggestion?.niche;
    if (!title || !niche) return;
    const campaignId = id();
    const now = new Date().toISOString();
    await db.transact(
      db.tx.campaigns[campaignId].update({
        userId,
        title,
        niche,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      }),
    );
    setCreatedCampaignId(campaignId);
    setDraftTitle("");
    setDraftNiche("");
  }

  function applySuggestion(suggestion: Suggestion) {
    setDraftTitle(suggestion.niche);
    setDraftNiche(suggestion.niche);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">What should I post next?</h1>
          <p className="text-sm text-muted">Based on your past clicks, here are 3 niches to try.</p>
        </div>
        <button onClick={loadSuggestions} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {suggestions.length > 0 ? "Generate again" : "Generate niches"}
        </button>
      </div>

      {createdCampaignId && (
        <Link href={`/campaigns/${createdCampaignId}`} className="block rounded-2xl border border-success/20 bg-success/5 p-4 text-sm font-semibold text-success">
          Campaign created. Open it →
        </Link>
      )}

      {(draftTitle || draftNiche) && (
        <div className="grid md:grid-cols-[1fr_240px_auto] gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Campaign title"
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            value={draftNiche}
            onChange={(e) => setDraftNiche(e.target.value)}
            placeholder="Niche"
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
          <button onClick={() => createCampaign()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
            <Plus className="w-4 h-4" />
            Create campaign
          </button>
        </div>
      )}

      {suggestions.length === 0 && !busy && (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 text-muted/40" />
          Generate 3 niche ideas for your next creator campaign.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {suggestions.map((suggestion) => (
          <article key={suggestion.niche} className="rounded-2xl border border-border bg-surface p-4 space-y-4">
            <div>
              <h2 className="font-semibold">{suggestion.niche}</h2>
              <p className="mt-2 text-sm text-muted">{suggestion.reason}</p>
            </div>
            <div className="rounded-xl bg-surface-alt p-3 text-sm">
              <div className="text-xs font-semibold text-muted uppercase">Example product</div>
              {suggestion.exampleProduct}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => applySuggestion(suggestion)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white">
                <Check className="w-4 h-4" />
                Use this niche
              </button>
              <Link
                href={`/campaigns/new?title=${encodeURIComponent(suggestion.niche)}&niche=${encodeURIComponent(suggestion.niche)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-surface-alt"
              >
                <Plus className="w-4 h-4" />
                Create campaign
              </Link>
            </div>
          </article>
        ))}
      </div>

      {suggestions.length > 0 && (
        <button onClick={loadSuggestions} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-alt disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate again
        </button>
      )}
    </div>
  );
}
