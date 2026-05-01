"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AgentTraceStreamProps {
  messages: string[];
  isStreaming: boolean;
}

export function AgentTraceStream({ messages, isStreaming }: AgentTraceStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0 && !isStreaming) return null;

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
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Agent Trace</h3>
              <p className="text-xs text-muted-foreground">Execution log & reasoning</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-full">
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                <span className="text-xs text-primary">Processing</span>
              </div>
            ) : messages.length > 0 ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">Complete</span>
              </div>
            ) : null}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Trace Content */}
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
                <div
                  ref={scrollRef}
                  className="bg-background/80 rounded-xl p-4 max-h-64 overflow-y-auto space-y-2"
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-2"
                    >
                      <span className="text-muted-foreground font-mono text-xs mt-0.5 select-none">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-foreground">{message}</span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Streaming indicator */}
                  {isStreaming && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 pt-2"
                    >
                      <span className="text-muted-foreground font-mono text-xs select-none">
                        {String(messages.length + 1).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground">Processing...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
