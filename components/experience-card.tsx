"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Clock, ExternalLink, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExperienceResult } from "@/lib/mock-api";
import Image from "next/image";

interface ExperienceCardProps {
  experience: ExperienceResult;
  index: number;
  onSelect: (experience: ExperienceResult) => void;
  isSelected: boolean;
}

export function ExperienceCard({ experience, index, onSelect, isSelected }: ExperienceCardProps) {
  const availabilityColors = {
    instant: "bg-green-500/20 text-green-400 border-green-500/30",
    limited: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    request: "bg-blue-500/20 text-blue-400 border-blue-500/30"
  };

  const availabilityLabels = {
    instant: "Instant Booking",
    limited: "Limited Availability",
    request: "Request Required"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`
        bg-card/50 backdrop-blur-sm border rounded-2xl overflow-hidden
        transition-all duration-300 hover:border-primary/50
        ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"}
      `}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={experience.image}
          alt={experience.title}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`${availabilityColors[experience.availability]} border`}>
            <Clock className="w-3 h-3 mr-1" />
            {availabilityLabels[experience.availability]}
          </Badge>
        </div>
        
        {/* Category */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {experience.category}
          </Badge>
        </div>
        
        {/* Price */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <span className="text-xl font-bold text-primary">
              €{experience.price}
            </span>
            <span className="text-xs text-muted-foreground ml-1">per person</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground line-clamp-2">
            {experience.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{experience.location}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{experience.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({experience.reviewCount.toLocaleString()} reviews)
          </span>
        </div>

        {/* Why it matches */}
        <div className="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg border border-primary/10">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">{experience.whyMatch}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border hover:bg-secondary"
            onClick={() => window.open(experience.referralUrl, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Viator
          </Button>
          <Button
            size="sm"
            className={`flex-1 ${
              isSelected 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-primary hover:bg-primary/90"
            }`}
            onClick={() => onSelect(experience)}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Selected
              </>
            ) : (
              "Select for Intent"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
