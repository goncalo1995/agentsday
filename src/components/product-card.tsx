"use client";

import { Star, Clock, Heart, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import type { ViatorProduct } from "@/lib/types";
import { formatDuration, cn, bestImageUrl } from "@/lib/utils";

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  viator: { label: "Viator", color: "bg-[#3B7A57]/10 text-[#3B7A57]" },
  getyourguide: { label: "GetYourGuide", color: "bg-[#FF5533]/10 text-[#FF5533]" },
  klook: { label: "Klook", color: "bg-[#FF5722]/10 text-[#FF5722]" },
};

interface Props {
  product: ViatorProduct;
  index: number;
  onGenerateLink: (p: ViatorProduct) => void;
  onSave: (p: ViatorProduct) => void;
  isSaved: boolean;
}

export function ProductCard({ product, index, onGenerateLink, onSave, isSaved }: Props) {
  const img = bestImageUrl(product.images);
  const price = product.pricing?.summary?.fromPrice;
  const currency = product.pricing?.currency ?? "USD";
  const rating = product.reviews?.combinedAverageRating ?? 0;
  const reviews = product.reviews?.totalReviews ?? 0;
  const provider = product.provider ?? "viator";
  const providerCfg = PROVIDER_LABELS[provider] ?? { label: provider, color: "bg-surface-alt text-muted" };

  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
      className="group flex-shrink-0 w-[300px] md:w-[320px] cursor-pointer"
    >
      {/* Image container — 3:2 aspect */}
      <div className="relative aspect-[3/2] rounded-2xl overflow-hidden bg-surface-alt">
        {img ? (
          <img
            src={img}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">No image</div>
        )}

        {/* Save heart — top right */}
        <button
          onClick={(e) => { e.stopPropagation(); onSave(product); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm transition-all hover:scale-110 cursor-pointer"
          title={isSaved ? "Saved" : "Save"}
        >
          <Heart className={cn("w-4 h-4 transition-colors", isSaved ? "fill-accent text-accent" : "text-foreground/70")} />
        </button>

        {/* Provider badge — top left */}
        <span className={cn("absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm", providerCfg.color)}>
          {providerCfg.label}
        </span>
      </div>

      {/* Content */}
      <div className="pt-3 space-y-1">
        {/* Top row: title + rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 flex-1">{product.title}</h3>
          {rating > 0 && (
            <span className="flex items-center gap-1 text-sm font-medium flex-shrink-0 pt-0.5">
              <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(product.duration)}
          </span>
          {reviews > 0 && (
            <span>·&nbsp;{reviews} reviews</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-1">
          {price != null ? (
            <div className="text-[15px]">
              <span className="font-semibold">From {currencySymbol}{price.toFixed(0)}</span>
              <span className="text-muted font-normal text-sm"> / person</span>
            </div>
          ) : (
            <span className="text-sm text-muted">Price on request</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onGenerateLink(product); }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-white rounded-full px-4 py-2 hover:bg-accent/90 transition-colors shadow-sm hover:shadow cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            Get Link
          </button>
        </div>
      </div>
    </motion.div>
  );
}
