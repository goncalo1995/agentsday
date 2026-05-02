"use client";

import { motion } from "framer-motion";
import { MapPin, Tag, CheckCircle2, Loader2, AlertCircle, DollarSign, Users } from "lucide-react";
import type { SearchIntent, SearchStep } from "@/lib/types";

interface Props {
  intent: SearchIntent | null;
  steps: SearchStep[];
}

export function SearchIntentPanel({ intent, steps }: Props) {
  if (steps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="rounded-2xl border border-border bg-surface p-5 space-y-4 overflow-hidden"
    >
      {/* Steps */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 text-xs"
          >
            {step.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
            {step.status === "active" && <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />}
            {step.status === "pending" && <div className="w-3.5 h-3.5 rounded-full border-2 border-border" />}
            {step.status === "error" && <AlertCircle className="w-3.5 h-3.5 text-danger" />}
            <span className={step.status === "done" ? "text-foreground" : "text-muted"}>
              {step.label}
            </span>
            {step.detail && (
              <span className="text-muted/60">— {step.detail}</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Intent details */}
      {intent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-3 pt-2 border-t border-border"
        >
          {intent.destination && intent.destination !== "Unknown" && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              {intent.destination}
              {intent.destinationId && (
                <span className="text-accent/50 font-mono">#{intent.destinationId}</span>
              )}
            </span>
          )}
          {intent.maxPrice && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-success/10 text-success px-2.5 py-1 rounded-full">
              <DollarSign className="w-3 h-3" />
              Under ${intent.maxPrice}
            </span>
          )}
          {intent.groupType && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-info/10 text-info px-2.5 py-1 rounded-full">
              <Users className="w-3 h-3" />
              {intent.groupType}
            </span>
          )}
          {intent.keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 text-xs bg-surface-alt text-muted px-2.5 py-1 rounded-full"
            >
              <Tag className="w-3 h-3" />
              {kw}
            </span>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
