"use client";

import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { ExperienceCard } from "./experience-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExperienceResult } from "@/lib/mock-api";

interface ExperienceResultsGridProps {
  experiences: ExperienceResult[];
  isLoading: boolean;
  selectedExperience: ExperienceResult | null;
  onSelect: (experience: ExperienceResult) => void;
}

export function ExperienceResultsGrid({
  experiences,
  isLoading,
  selectedExperience,
  onSelect
}: ExperienceResultsGridProps) {
  if (!isLoading && experiences.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Search className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            Experience Results
            {!isLoading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({experiences.length} found)
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            Ranked by availability, rating, and gift suitability
          </p>
        </div>
      </div>

      {/* AI Match Banner */}
      {!isLoading && experiences.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <p className="text-sm text-foreground">
            <span className="font-medium text-primary">AI-matched experiences</span>
            {" "}— filtered for instant booking, gift suitability, and your budget
          </p>
        </motion.div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card/50 border border-border rounded-2xl overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </div>
              </div>
            ))
          : experiences.map((experience, index) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                index={index}
                isSelected={selectedExperience?.id === experience.id}
                onSelect={onSelect}
              />
            ))}
      </div>
    </motion.div>
  );
}
