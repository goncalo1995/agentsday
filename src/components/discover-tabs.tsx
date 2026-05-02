"use client";

import { useState } from "react";
import { Dashboard } from "./dashboard";
import { DiscoverSmartSearch } from "./discover-smart-search";

export function DiscoverTabs() {
  const [activeTab, setActiveTab] = useState<"smart" | "manual">("smart");

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-center">
        <div className="bg-surface border border-border rounded-full p-1 inline-flex">
          <button
            onClick={() => setActiveTab("smart")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "smart"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Smart Search
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "manual"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Manual Search
          </button>
        </div>
      </div>

      <div>
        {activeTab === "smart" && <DiscoverSmartSearch />}
        {activeTab === "manual" && <Dashboard />}
      </div>
    </div>
  );
}
