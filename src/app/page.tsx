"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clipboard,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  MapPin,
  MessageSquareText,
  MousePointerClick,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import { EXPERIMENT_VERSION, type DeviceType, type LandingEventType, type Variant } from "@/lib/landing-validation";

type FormState = {
  email: string;
  nameOrHandle: string;
  countryOrRegion: string;
  creatorType: string;
  primaryPlatform: string;
  followerRange: string;
  niche: string;
  affiliateExperience: string;
  wouldSaveTime: string;
  wouldSaveTimeDetails: string;
  preferredLinkModel: string;
  fairPricingModel: string;
  firstUseCase: string;
  contentExampleOrNote: string;
  contactConsent: boolean;
  website: string;
};

const initialForm: FormState = {
  email: "",
  nameOrHandle: "",
  countryOrRegion: "",
  creatorType: "",
  primaryPlatform: "",
  followerRange: "",
  niche: "",
  affiliateExperience: "",
  wouldSaveTime: "",
  wouldSaveTimeDetails: "",
  preferredLinkModel: "",
  fairPricingModel: "",
  firstUseCase: "",
  contentExampleOrNote: "",
  contactConsent: false,
  website: "",
};

const variants: Record<Variant, { headline: string; subheadline: string; cta: string; badge: string }> = {
  A: {
    headline: "Turn a travel content idea into affiliate links, captions, hooks, and disclosures in minutes.",
    subheadline:
      "Built for EU travel creators who are tired of hunting for links, writing captions from scratch, and remembering affiliate disclosures.",
    cta: "Join the beta",
    badge: "Workflow test",
  },
  B: {
    headline: "Make every travel post easier to monetize.",
    subheadline:
      "VibeKit helps EU creators turn guides, itineraries, and destination tips into shareable affiliate campaign kits with ready-to-post content.",
    cta: "Get early access",
    badge: "Monetization test",
  },
};

const creatorTypes = [
  ["travel_creator", "Travel creator"],
  ["lifestyle_creator", "Lifestyle creator"],
  ["local_guide", "Local guide"],
  ["blogger", "Blogger"],
  ["ugc_creator", "UGC creator"],
  ["agency_manager", "Agency / manager"],
  ["other_not_creator_yet", "Other / not a creator yet"],
];

const followerRanges = [
  ["none", "No audience yet"],
  ["under_1k", "Under 1k"],
  ["1k_10k", "1k-10k"],
  ["10k_50k", "10k-50k"],
  ["50k_250k", "50k-250k"],
  ["250k_plus", "250k+"],
];

const affiliateExperience = [
  ["yes_consistently", "Yes, consistently"],
  ["yes_occasionally", "Yes, occasionally"],
  ["tried_not_much", "Tried, but not much"],
  ["no_but_i_want_to", "No, but I want to"],
  ["no_not_interested", "No, not interested"],
];

const wouldSaveTime = [
  ["definitely", "Definitely"],
  ["probably", "Probably"],
  ["not_sure", "Not sure"],
  ["probably_not", "Probably not"],
  ["no", "No"],
];

const linkModels = [
  ["", "Optional: choose one"],
  ["use_my_own_affiliate_accounts", "Use my own affiliate accounts"],
  ["vibekit_managed_links_and_payouts", "VibeKit-managed links and payouts"],
  ["both", "Both"],
  ["not_sure", "Not sure"],
];

const pricingModels = [
  ["", "Optional: choose one"],
  ["monthly_subscription", "Monthly subscription"],
  ["small_commission_share", "Small commission share"],
  ["subscription_plus_commission", "Subscription plus commission"],
  ["one_time_campaign_fee", "One-time campaign fee"],
  ["not_sure", "Not sure"],
];

const sampleProducts = [
  {
    title: "Lisbon Spa Ritual and Rooftop Pool Pass",
    meta: "4.8 rating · 218 reviews · From EUR 72",
    fit: "Fits Mother's Day wellness, soft luxury, and city-break content.",
  },
  {
    title: "Sintra Thermal Garden Day Escape",
    meta: "4.7 rating · 146 reviews · From EUR 118",
    fit: "A calmer itinerary anchor for followers who want a giftable experience.",
  },
  {
    title: "Private Lisbon Wellness Walk and Brunch",
    meta: "4.9 rating · 84 reviews · From EUR 96",
    fit: "Easy to frame as a slow weekend guide with a natural affiliate CTA.",
  },
];

const sampleCaption =
  "Lisbon idea for Mother's Day: book one calm morning, one beautiful view, and one experience that feels like an actual reset. I pulled together spa, wellness, and slow-weekend options that are easy to save for later.\n\nAffiliate links - I may earn a commission if you book through these links, at no extra cost to you. #ad";

const sampleLink = "https://www.viator.com/lisbon-spa-example?subId=creator_lisbon_wellness&utm_source=instagram";

function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  const hasTouch = navigator.maxTouchPoints > 0;
  if (width < 768) return "mobile";
  if (width < 1100 && hasTouch) return "tablet";
  return "desktop";
}

function makeVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `visitor_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getAttribution() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmContent: params.get("utm_content") || undefined,
    referrer: document.referrer || undefined,
    sourcePath: `${window.location.pathname}${window.location.search}`,
  };
}

export default function HomePage() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [variant, setVariant] = useState<Variant>("B");
  const [visitorId, setVisitorId] = useState("");
  const [isDebugOverride, setIsDebugOverride] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("unknown");
  const [form, setForm] = useState<FormState>(initialForm);
  const [formStarted, setFormStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = variants[variant];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("variant")?.toLowerCase();
    const debugVariant = override === "a" ? "A" : override === "b" ? "B" : null;
    const storedVariant = localStorage.getItem("vibekit-variant") as Variant | null;
    const nextVariant = debugVariant ?? (storedVariant === "A" || storedVariant === "B" ? storedVariant : Math.random() > 0.5 ? "B" : "A");
    const storedVisitorId = localStorage.getItem("vibekit-visitor-id") || makeVisitorId();

    localStorage.setItem("vibekit-variant", nextVariant);
    localStorage.setItem("vibekit-visitor-id", storedVisitorId);
    setVariant(nextVariant);
    setVisitorId(storedVisitorId);
    setIsDebugOverride(Boolean(debugVariant));
    setDeviceType(getDeviceType());
  }, []);

  useEffect(() => {
    if (!visitorId) return;
    const key = `vibekit-viewed-${visitorId}-${EXPERIMENT_VERSION}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "true");
    trackEvent("view", { source: "homepage" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitorId]);

  async function trackEvent(eventType: LandingEventType, metadata?: Record<string, unknown>) {
    if (!visitorId) return;
    const attribution = getAttribution();
    await fetch("/api/landing-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        variant,
        experimentVersion: EXPERIMENT_VERSION,
        isDebugOverride,
        visitorId,
        deviceType,
        path: attribution.sourcePath,
        ...attribution,
        metadata,
      }),
    }).catch(() => undefined);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (!formStarted) {
      setFormStarted(true);
      trackEvent("form_start", { field: key });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const attribution = getAttribution();
    const res = await fetch("/api/beta-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        variant,
        experimentVersion: EXPERIMENT_VERSION,
        isDebugOverride,
        visitorId,
        deviceType,
        ...attribution,
      }),
    }).catch(() => null);

    setSubmitting(false);

    if (!res || !res.ok) {
      const payload = await res?.json().catch(() => null);
      const validationMessage = payload?.errors ? Object.values(payload.errors)[0] : payload?.error;
      setError(typeof validationMessage === "string" ? validationMessage : "Something went wrong. Try again in a moment.");
      trackEvent("cta_click", { location: "form_error", error: validationMessage || "unknown" });
      return;
    }

    const payload = await res.json();
    setDuplicate(Boolean(payload.duplicate));
    setSubmitted(true);
    trackEvent("demo_reveal", { trigger: "lead_submit" });
  }

  async function handleCtaClick(location: string) {
    await trackEvent("cta_click", { location });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function copyDemo(text: string, label: string) {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(label);
    trackEvent("demo_reveal", { copied: label });
    window.setTimeout(() => setCopied(null), 1800);
  }

  const progressItems = useMemo(
    () => [
      ["Creator idea", form.firstUseCase || "Lisbon wellness weekend guide"],
      ["Products", "3 Viator-style experiences with fit notes"],
      ["Links", "Affiliate-ready URLs with creator tracking"],
      ["Content", "Hook, script, captions, hashtags, disclosure"],
      ["Campaign page", "A mobile-ready page your followers can open"],
    ],
    [form.firstUseCase],
  );

  return (
    <div className="bg-background">
      <section className="overflow-hidden border-b border-border bg-[#FAFAF7]">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[1fr_0.9fr] lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D6E5DD] bg-white px-3 py-1 text-sm font-semibold text-[#2F6B4F] shadow-sm">
              <Sparkles className="h-4 w-4" />
              VibeKit beta · {copy.badge}
            </div>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight text-[#171717] md:text-7xl">
              {copy.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#565656] md:text-xl">{copy.subheadline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleCtaClick("hero")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#2B2B2B]"
              >
                {copy.cta}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#sample"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D7D2C6] bg-white px-6 py-3 text-sm font-bold text-[#222222] transition hover:border-[#BDB6A7]"
              >
                See sample kit
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 text-sm text-[#545454] sm:grid-cols-3">
              {["Viator link builder", "Ready-to-post content", "EU creator focus"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#2F6B4F]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#BFE3D0] opacity-50 blur-3xl" />
            <div className="relative rounded-[28px] border border-[#E1DED6] bg-white p-4 shadow-2xl">
              <div className="rounded-[22px] bg-[#161616] p-4 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8E6C1]">Campaign kit</p>
                    <h2 className="mt-1 text-xl font-bold">Lisbon Mother's Day wellness</h2>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#161616]">Ready</span>
                </div>
                <div className="mt-4 rounded-2xl bg-white p-3 text-[#171717]">
                  <p className="text-xs font-semibold text-[#777]">Creator idea</p>
                  <p className="mt-1 font-semibold">Find wellness experiences in Lisbon for a Mother's Day post.</p>
                </div>
                <div className="mt-3 grid gap-3">
                  {sampleProducts.slice(0, 2).map((product, index) => (
                    <div key={product.title} className="flex gap-3 rounded-2xl bg-white/10 p-3">
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[#F0D9B5] text-[#3C2B16]">
                        {index === 0 ? <Star className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="line-clamp-2 text-sm font-bold">{product.title}</p>
                        <p className="mt-1 text-xs text-white/65">{product.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                  <div className="rounded-xl bg-[#A8E6C1] px-2 py-3 text-[#123524]">Hook</div>
                  <div className="rounded-xl bg-[#F0D9B5] px-2 py-3 text-[#3C2B16]">Caption</div>
                  <div className="rounded-xl bg-[#F4A6B9] px-2 py-3 text-[#3E1020]">#ad</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sample" className="border-b border-border bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2F6B4F]">Product workflow</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Creator idea to campaign kit.</h2>
            </div>
            <button
              type="button"
              onClick={() => handleCtaClick("sample_section")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white shadow-sm"
            >
              {copy.cta}
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {progressItems.map(([label, detail], index) => (
              <div key={label} className="rounded-2xl border border-border bg-[#FAFAF7] p-4">
                <div className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-[#111] text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="font-bold">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={formRef} className="bg-[#F7F7F7] px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Beta access</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Help shape VibeKit before we build more.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              This form is intentionally specific. We are validating whether EU creators actually want a faster path from
              travel idea to monetized campaign kit.
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-white p-5">
              <h3 className="font-bold">Success threshold</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                We are looking for qualified creators who already post travel content, care about saving time, and can tell
                us what they would create first.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-5 shadow-sm md:p-8">
            {submitted ? (
              <DemoReveal duplicate={duplicate} copied={copied} onCopy={copyDemo} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => update("website", event.target.value)}
                  className="hidden"
                  name="website"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Email" required>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) => update("email", event.target.value)}
                      className="input"
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Creator handle/name" required>
                    <input
                      required
                      maxLength={120}
                      value={form.nameOrHandle}
                      onChange={(event) => update("nameOrHandle", event.target.value)}
                      className="input"
                      placeholder="@ana.travels"
                    />
                  </Field>
                  <Field label="Country/region" required>
                    <input
                      required
                      maxLength={120}
                      value={form.countryOrRegion}
                      onChange={(event) => update("countryOrRegion", event.target.value)}
                      className="input"
                      placeholder="Portugal"
                    />
                  </Field>
                  <Field label="Creator type" required>
                    <Select value={form.creatorType} onChange={(value) => update("creatorType", value)} options={[["", "Choose one"], ...creatorTypes]} required />
                  </Field>
                  <Field label="Primary platform" required>
                    <input
                      required
                      maxLength={120}
                      value={form.primaryPlatform}
                      onChange={(event) => update("primaryPlatform", event.target.value)}
                      className="input"
                      placeholder="Instagram, TikTok, blog..."
                    />
                  </Field>
                  <Field label="Follower range" required>
                    <Select value={form.followerRange} onChange={(value) => update("followerRange", value)} options={[["", "Choose one"], ...followerRanges]} required />
                  </Field>
                  <Field label="Niche" required>
                    <input
                      required
                      maxLength={160}
                      value={form.niche}
                      onChange={(event) => update("niche", event.target.value)}
                      className="input"
                      placeholder="EU travel, family trips, wellness..."
                    />
                  </Field>
                  <Field label="Affiliate link experience" required>
                    <Select value={form.affiliateExperience} onChange={(value) => update("affiliateExperience", value)} options={[["", "Choose one"], ...affiliateExperience]} required />
                  </Field>
                </div>

                <Field label="Would this save you time?" required>
                  <div className="grid gap-2 sm:grid-cols-5">
                    {wouldSaveTime.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update("wouldSaveTime", value)}
                        className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                          form.wouldSaveTime === value ? "border-[#111] bg-[#111] text-white" : "border-border bg-white text-foreground hover:border-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="What would you create with VibeKit first?" required>
                  <textarea
                    required
                    maxLength={280}
                    value={form.firstUseCase}
                    onChange={(event) => update("firstUseCase", event.target.value)}
                    className="input min-h-24 resize-none"
                    placeholder='Example: "Lisbon weekend guide", "Madeira hiking itinerary", "Paris hotels + tours", "Santorini outfits and experiences."'
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Preferred link model">
                    <Select value={form.preferredLinkModel} onChange={(value) => update("preferredLinkModel", value)} options={linkModels} />
                  </Field>
                  <Field label="Fair pricing model">
                    <Select value={form.fairPricingModel} onChange={(value) => update("fairPricingModel", value)} options={pricingModels} />
                  </Field>
                </div>

                <Field label="Anything else useful?">
                  <textarea
                    maxLength={1000}
                    value={form.contentExampleOrNote}
                    onChange={(event) => update("contentExampleOrNote", event.target.value)}
                    className="input min-h-24 resize-none"
                    placeholder="Paste a content example, affiliate pain point, or beta request."
                  />
                </Field>

                <Field label="Save-time details">
                  <input
                    maxLength={500}
                    value={form.wouldSaveTimeDetails}
                    onChange={(event) => update("wouldSaveTimeDetails", event.target.value)}
                    className="input"
                    placeholder="Optional: what part would save you the most time?"
                  />
                </Field>

                <label className="flex items-start gap-3 rounded-2xl border border-border bg-[#FAFAF7] p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    required
                    checked={form.contactConsent}
                    onChange={(event) => update("contactConsent", event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#111]"
                  />
                  <span>
                    I agree to be contacted about the VibeKit beta.
                    <span className="block text-muted">We'll only use this to contact you about the beta. No spam.</span>
                  </span>
                </label>

                {error && <p className="rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm font-semibold text-danger">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#2B2B2B] disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MousePointerClick className="h-4 w-4" />}
                  {submitting ? "Joining..." : copy.cta}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[][];
  required?: boolean;
}) {
  return (
    <select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="input">
      {options.map(([optionValue, label]) => (
        <option key={`${optionValue}-${label}`} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

function DemoReveal({
  duplicate,
  copied,
  onCopy,
}: {
  duplicate: boolean;
  copied: string | null;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div className="space-y-7">
      <div className="rounded-3xl bg-[#111] p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A8E6C1]">
          {duplicate ? "Already on the list" : "You are on the list"}
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Your sample campaign kit</h2>
        <p className="mt-3 max-w-2xl text-white/70">
          This is the shape of the product: creator idea, matched experiences, affiliate-ready links, creator content,
          and a mobile campaign page your audience can open.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sampleProducts.map((product, index) => (
          <div key={product.title} className="rounded-2xl border border-border bg-[#FAFAF7] p-4">
            <div className="mb-4 grid h-32 place-items-center rounded-xl bg-[#E7D8BD] text-[#342616]">
              {index === 0 ? <Star className="h-9 w-9" /> : index === 1 ? <MapPin className="h-9 w-9" /> : <Sparkles className="h-9 w-9" />}
            </div>
            <h3 className="font-bold leading-snug">{product.title}</h3>
            <p className="mt-2 text-sm text-muted">{product.meta}</p>
            <p className="mt-3 text-sm leading-6">{product.fit}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-4 rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-accent" />
            <h3 className="font-bold">Ready-to-post content</h3>
          </div>
          <div className="rounded-xl bg-[#FAFAF7] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">TikTok/Reels hook</p>
            <p className="mt-2 font-semibold">"If your mum says she does not want anything, send her this Lisbon reset day."</p>
          </div>
          <div className="rounded-xl bg-[#FAFAF7] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Short script</p>
            <p className="mt-2 text-sm leading-6">
              Start with the problem: gifts that become clutter. Show a calm Lisbon morning, a spa stop, and a slow brunch.
              Close with a clear booking CTA and the disclosure line.
            </p>
          </div>
          <div className="rounded-xl bg-[#FAFAF7] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Instagram caption</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6">{sampleCaption}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["#lisbon", "#wellnesstravel", "#mothersdaygift", "#eucreator", "#ad"].map((tag) => (
              <span key={tag} className="rounded-full bg-[#EAF5EE] px-3 py-1 text-sm font-semibold text-[#2F6B4F]">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onCopy(sampleCaption, "caption")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white"
            >
              <Clipboard className="h-4 w-4" />
              {copied === "caption" ? "Copied caption" : "Copy sample caption"}
            </button>
            <button
              type="button"
              onClick={() => onCopy(sampleLink, "link")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold"
            >
              <Link2 className="h-4 w-4" />
              {copied === "link" ? "Copied link" : "Copy sample link"}
            </button>
          </div>
        </div>

        <div className="rounded-[32px] border border-border bg-[#1B1B1B] p-3 shadow-xl">
          <div className="rounded-[24px] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Mobile page</p>
                <h3 className="font-bold">Lisbon wellness picks</h3>
              </div>
              <ExternalLink className="h-4 w-4 text-muted" />
            </div>
            <div className="space-y-3">
              {sampleProducts.map((product) => (
                <div key={product.title} className="rounded-2xl border border-border p-3">
                  <p className="line-clamp-2 text-sm font-bold">{product.title}</p>
                  <p className="mt-1 text-xs text-muted">{product.meta}</p>
                  <div className="mt-3 rounded-full bg-accent px-3 py-2 text-center text-xs font-bold text-white">
                    Check dates
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-[#FAFAF7] p-3 text-xs leading-5 text-muted">
              Affiliate links - I may earn a commission if you book through these links, at no extra cost to you. #ad
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
