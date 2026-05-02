"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, Link2, BarChart3, Globe, ArrowRight,
  Compass, Zap, Heart, Share2, TrendingUp, Shield,
} from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "AI-powered search",
    description: "Describe the vibe you want — our AI extracts destinations, keywords, and filters to find the perfect experiences.",
  },
  {
    icon: Globe,
    title: "Multi-provider catalog",
    description: "Browse experiences from top travel platforms, all in one place. Starting with Viator, more coming soon.",
  },
  {
    icon: Link2,
    title: "Instant referral links",
    description: "Generate trackable, referral-ready links in one click. Customize your creator code and campaign source.",
  },
  {
    icon: BarChart3,
    title: "Performance tracking",
    description: "Monitor clicks, estimated commissions, and top performers. Sort and filter to find what's working.",
  },
  {
    icon: Heart,
    title: "Save & organize",
    description: "Build your link library with custom tags, status tracking, and powerful sorting across all your campaigns.",
  },
  {
    icon: Shield,
    title: "Your data, your device",
    description: "Everything runs client-side. No accounts, no databases, no tracking. Your links stay on your device.",
  },
];

const STEPS = [
  { step: "1", icon: Compass, title: "Describe your content idea", description: "Tell us what kind of experience you're looking for, and where." },
  { step: "2", icon: Zap, title: "AI finds the best matches", description: "Our agent extracts intent and searches travel experience providers." },
  { step: "3", icon: Share2, title: "Generate & share your links", description: "Create referral links, copy short URLs, and post to your platforms." },
  { step: "4", icon: TrendingUp, title: "Track what performs", description: "See which links get clicks and drive the most estimated commission." },
];

const EXAMPLE_SEARCHES = [
  "Sunset sailing in Santorini",
  "Street food tour in Bangkok",
  "Spa day in Lisbon for Mother's Day",
  "Wine tasting in Tuscany",
  "Snorkeling in Bali under $40",
  "Museum pass in Paris",
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-sm font-medium px-4 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            Built for travel creators
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Turn travel ideas into
            <span className="text-accent block mt-1">shareable links</span>
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Discover amazing travel experiences, generate referral links, and share them with your audience — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/discover"
              className="flex items-center gap-2 bg-accent text-white font-semibold rounded-full px-8 py-4 text-base hover:bg-accent/90 transition-all shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5"
            >
              Start discovering
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/saved"
              className="flex items-center gap-2 border border-border rounded-full px-8 py-4 text-base font-semibold hover:bg-surface-alt transition-colors"
            >
              My Links
            </Link>
          </div>
        </motion.div>

        {/* Floating search examples */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-xl p-2">
            <div className="flex items-center gap-3 bg-surface-alt rounded-xl px-4 py-3.5">
              <Search className="w-5 h-5 text-muted" />
              <span className="text-muted text-sm">Try: &quot;sunset sailing in Santorini for Instagram&quot;</span>
            </div>
            <div className="flex flex-wrap gap-2 px-3 py-3">
              {EXAMPLE_SEARCHES.map((s) => (
                <Link
                  key={s}
                  href={`/discover?q=${encodeURIComponent(s)}`}
                  className="text-xs bg-surface-alt text-muted px-3 py-1.5 rounded-full hover:bg-border/50 transition-colors"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="bg-surface-alt py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-muted text-base max-w-md mx-auto">From idea to shareable link in under a minute.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center space-y-3"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-surface border border-border flex items-center justify-center shadow-sm">
                  <step.icon className="w-6 h-6 text-accent" />
                </div>
                <div className="text-xs font-bold text-accent uppercase tracking-wider">Step {step.step}</div>
                <h3 className="font-semibold text-base">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.description}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-7 w-4 h-4 text-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
            <p className="text-muted text-base max-w-md mx-auto">A complete toolkit for travel content creators.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-surface p-6 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-accent text-white text-center p-12 md:p-16 space-y-5 shadow-xl shadow-accent/20"
          >
            <h2 className="text-3xl md:text-4xl font-bold">Ready to grow your audience?</h2>
            <p className="text-white/80 text-lg max-w-md mx-auto">
              Start discovering experiences and creating links your followers will love.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 bg-white text-accent font-semibold rounded-full px-8 py-4 text-base hover:bg-white/90 transition-colors shadow-lg"
            >
              Get started — it&apos;s free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium text-foreground">CreatorLinks</span>
          </div>
          <span>Built for creators, by creators.</span>
        </div>
      </footer>
    </div>
  );
}
