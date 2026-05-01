"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileJson, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { Intent } from "@/lib/mock-api";

interface IntentJsonPanelProps {
  intent: Intent | null;
  isAnimating: boolean;
}

export function IntentJsonPanel({ intent, isAnimating }: IntentJsonPanelProps) {
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const allKeys = [
    "intent_type",
    "recipient",
    "location",
    "date_constraints",
    "experience_preferences",
    "budget",
    "commerce_constraints",
    "verification"
  ];

  useEffect(() => {
    if (isAnimating && intent) {
      setVisibleKeys([]);
      allKeys.forEach((key, index) => {
        setTimeout(() => {
          setVisibleKeys(prev => [...prev, key]);
        }, (index + 1) * 300);
      });
    } else if (intent) {
      setVisibleKeys(allKeys);
    }
  }, [isAnimating, intent]);

  if (!intent) return null;

  const formatValue = (value: unknown, depth = 0): React.ReactNode => {
    if (typeof value === "boolean") {
      return (
        <span className={value ? "text-green-400" : "text-red-400"}>
          {value.toString()}
        </span>
      );
    }
    if (typeof value === "number") {
      return <span className="text-amber-400">{value}</span>;
    }
    if (typeof value === "string") {
      return <span className="text-primary">{`"${value}"`}</span>;
    }
    if (Array.isArray(value)) {
      return (
        <span>
          [
          {value.map((item, i) => (
            <span key={i}>
              {formatValue(item)}
              {i < value.length - 1 && ", "}
            </span>
          ))}
          ]
        </span>
      );
    }
    if (typeof value === "object" && value !== null) {
      const entries = Object.entries(value);
      return (
        <span className="block">
          {"{"}
          <span className="block pl-4">
            {entries.map(([k, v], i) => (
              <span key={k} className="block">
                <span className="text-blue-400">{`"${k}"`}</span>
                <span className="text-muted-foreground">: </span>
                {formatValue(v, depth + 1)}
                {i < entries.length - 1 && ","}
              </span>
            ))}
          </span>
          {"}"}
        </span>
      );
    }
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileJson className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Extracted Verifiable Intent</h3>
              <p className="text-xs text-muted-foreground">Structured purchase intent from voice</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {visibleKeys.length === allKeys.length && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full"
              >
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">Complete</span>
              </motion.div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* JSON Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                <div className="bg-background/80 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-muted-foreground">{"{"}</div>
                  <div className="pl-4 space-y-1">
                    {allKeys.map((key, index) => (
                      <AnimatePresence key={key}>
                        {visibleKeys.includes(key) && (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="block"
                          >
                            <span className="text-blue-400">{`"${key}"`}</span>
                            <span className="text-muted-foreground">: </span>
                            {formatValue((intent as Record<string, unknown>)[key])}
                            {index < allKeys.length - 1 && <span className="text-muted-foreground">,</span>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ))}
                  </div>
                  <div className="text-muted-foreground">{"}"}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
