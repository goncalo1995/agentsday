"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb, ArrowRight, Search, Globe, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FLOW_STEPS = [
  { icon: Lightbulb, label: "Creator idea", color: "text-accent" },
  { icon: Search, label: "Search intent", color: "text-info" },
  { icon: Globe, label: "Provider search", color: "text-success" },
  { icon: Globe, label: "Experience cards", color: "text-warning" },
  { icon: Link2, label: "Referral link", color: "text-accent" },
];

export function ArchitecturePanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-medium text-muted hover:bg-surface-alt transition-colors cursor-pointer"
      >
        <span>How it works</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5">
              <div className="flex items-center justify-center gap-1 flex-wrap py-3">
                {FLOW_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="flex items-center gap-1.5 bg-surface-alt rounded-full px-3.5 py-2">
                      <step.icon className={`w-3.5 h-3.5 ${step.color}`} />
                      <span className="text-xs font-medium">{step.label}</span>
                    </div>
                    {i < FLOW_STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted/30" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
