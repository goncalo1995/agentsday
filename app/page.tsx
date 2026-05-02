import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  DollarSign,
  LineChart,
  Link2,
  MousePointerClick,
  Plane,
  Search,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Plane className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Creator Travel Links</p>
              <p className="text-xs text-muted-foreground">Referral discovery for creators</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              Open dashboard
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_500px] lg:py-20">
        <div className="flex flex-col justify-center">
          <Badge className="mb-5 w-fit" variant="secondary">
            Viator integrated now - multi-provider ready
          </Badge>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-normal md:text-6xl">
            Turn travel inspiration into referral links creators can post today.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Discover bookable experiences, create custom referral URLs, draft short social posts,
            and compare dummy click and earnings performance without logins or a database.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Start finding links
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">View creator workspace</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <MiniFeature
              icon={<Search className="size-4" />}
              title="Discover"
              text="Search Viator by place, vibe, audience angle, and price."
            />
            <MiniFeature
              icon={<Share2 className="size-4" />}
              title="Post"
              text="Generate creator links plus captions for stories and feeds."
            />
            <MiniFeature
              icon={<LineChart className="size-4" />}
              title="Compare"
              text="Use dummy clicks and earnings to see what performs."
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
            alt="Creator travel planning"
            className="h-72 w-full object-cover md:h-96"
          />
          <div className="grid gap-3 p-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
              <div>
                <p className="text-sm text-muted-foreground">Best performing link</p>
                <p className="font-semibold">Lisbon wellness escape</p>
              </div>
              <Badge>+18% clicks</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Metric icon={<Bookmark className="size-4" />} value="12" label="Saved links" />
              <Metric icon={<MousePointerClick className="size-4" />} value="438" label="Clicks" />
              <Metric icon={<DollarSign className="size-4" />} value="EUR 86" label="Dummy earned" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3">
          <FeatureBlock
            icon={<Sparkles className="size-5" />}
            title="From idea to curated products"
            text="Creators can describe a post idea like spa trips in Lisbon and get link-ready Viator experiences."
          />
          <FeatureBlock
            icon={<Link2 className="size-5" />}
            title="Custom links, no setup"
            text="Every result can become a referral-style URL with creator and source tracking parameters."
          />
          <FeatureBlock
            icon={<Star className="size-5" />}
            title="Content included"
            text="Generate a short post draft so creators can move from discovery to publishing faster."
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 text-center">
        <h2 className="text-3xl font-semibold">Built for a fast demo, shaped like a real SaaS.</h2>
        <p className="mt-3 text-muted-foreground">
          The dashboard uses client-side state only. Viator is integrated today, with the product
          framed for additional travel partners later.
        </p>
        <Button className="mt-6" size="lg" asChild>
          <Link href="/dashboard">
            Launch dashboard
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </section>
    </main>
  );
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex size-8 items-center justify-center rounded-md bg-secondary text-primary">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 text-primary">{icon}</div>
      <p className="font-semibold">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function FeatureBlock({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
