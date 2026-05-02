"use client";

import { X, Copy, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { ViatorProduct } from "@/lib/types";
import { generateReferralUrl, bestImageUrl } from "@/lib/utils";

interface Props {
  product: ViatorProduct | null;
  onClose: () => void;
  onSave: (product: ViatorProduct, referralUrl: string, creatorCode: string, campaignSource: string) => void;
}

export function ReferralModal({ product, onClose, onSave }: Props) {
  const [creatorCode, setCreatorCode] = useState("creator_demo");
  const [source, setSource] = useState("instagram");
  const [copied, setCopied] = useState(false);

  const referralUrl = product?.productUrl
    ? generateReferralUrl(product.productUrl, creatorCode, source)
    : "";

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
  }

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg sm:mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (mobile feel) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="font-semibold text-lg">Create referral link</h2>
              <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-surface-alt transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-5">
              {/* Product info */}
              <div className="flex items-start gap-3">
                {bestImageUrl(product.images) && (
                  <img src={bestImageUrl(product.images)} alt="" className="w-16 h-12 rounded-xl object-cover flex-shrink-0" />
                )}
                <div>
                  <div className="font-medium text-sm leading-snug">{product.title}</div>
                  <div className="text-muted text-xs mt-0.5 font-mono">{product.productCode}</div>
                </div>
              </div>

              {/* Original URL */}
              <div>
                <label className="text-xs font-medium text-muted">Original URL</label>
                <div className="mt-1.5 text-xs bg-surface-alt rounded-xl p-3 break-all text-muted font-mono">
                  {product.productUrl || "No URL available"}
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted">Creator code</label>
                  <input
                    type="text"
                    value={creatorCode}
                    onChange={(e) => setCreatorCode(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Campaign source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>
              </div>

              {/* Generated URL */}
              <div>
                <label className="text-xs font-medium text-muted">Your referral URL</label>
                <div className="mt-1.5 bg-accent/5 border border-accent/15 rounded-xl p-3 text-xs break-all font-mono text-accent">
                  {referralUrl}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-semibold rounded-xl py-3 hover:bg-accent/90 transition-colors cursor-pointer shadow-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button
                  onClick={() => { onSave(product, referralUrl, creatorCode, source); onClose(); }}
                  className="flex items-center justify-center gap-2 border border-border rounded-xl px-5 py-3 font-semibold hover:bg-surface-alt transition-colors cursor-pointer text-sm"
                >
                  Save
                </button>
                {product.productUrl && (
                  <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center border border-border rounded-xl px-3 py-3 hover:bg-surface-alt transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
