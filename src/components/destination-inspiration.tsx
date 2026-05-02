"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ViatorAttraction } from "@/lib/types";

interface Props {
  attractions: ViatorAttraction[];
}

export function DestinationInspiration({ attractions }: Props) {
  const [open, setOpen] = useState(false);

  if (attractions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-muted hover:bg-surface-alt transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Destination Inspiration ({attractions.length})
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {attractions.map((a, i) => (
                <motion.div
                  key={a.attractionId ?? i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    {a.productCount != null && (
                      <div className="text-xs text-muted">{a.productCount} experiences</div>
                    )}
                  </div>
                  {(a.reviews?.combinedAverageRating ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {a.reviews!.combinedAverageRating!.toFixed(1)}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
