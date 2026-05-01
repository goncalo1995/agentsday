"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Workflow,
  Mic,
  FileJson,
  Shield,
  Search,
  ThumbsUp,
  CreditCard,
  ShoppingCart,
  ArrowRight
} from "lucide-react";

const steps = [
  { icon: Mic, label: "User Speech", color: "text-blue-400" },
  { icon: FileJson, label: "Intent JSON", color: "text-purple-400" },
  { icon: Shield, label: "Verifiable Signature", color: "text-green-400" },
  { icon: Search, label: "Search API", color: "text-amber-400" },
  { icon: ThumbsUp, label: "Ranked Results", color: "text-pink-400" },
  { icon: CreditCard, label: "User Approval", color: "text-cyan-400" },
  { icon: CreditCard, label: "Single-use Card", color: "text-primary" },
  { icon: ShoppingCart, label: "Merchant Checkout", color: "text-emerald-400" }
];

export function DemoArchitecturePanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="w-full"
    >
      <div className="bg-card/30 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Workflow className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">System Architecture</h3>
              <p className="text-xs text-muted-foreground">Developer pipeline overview</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 space-y-4">
                {/* Pipeline visualization */}
                <div className="bg-background/50 rounded-xl p-4 overflow-x-auto">
                  <div className="flex items-center gap-2 min-w-max">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className={`p-2 bg-secondary/50 rounded-lg ${step.color}`}>
                            <step.icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {step.label}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Integration Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-secondary/20 rounded-lg border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-2">Future Integrations</h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• OpenAI / LLM for intent extraction</li>
                      <li>• Viator Partner API for experiences</li>
                      <li>• EconomyOS Card API for virtual cards</li>
                      <li>• Stripe for merchant checkout</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-secondary/20 rounded-lg border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-2">Mock Functions</h4>
                    <ul className="space-y-1 text-xs font-mono text-muted-foreground">
                      <li>• extractIntent(transcript)</li>
                      <li>• streamAgentTrace(intent)</li>
                      <li>• searchViatorExperiences(intent)</li>
                      <li>• createVerifiableIntent()</li>
                      <li>• issueSingleUseCard(amount)</li>
                    </ul>
                  </div>
                </div>

                {/* Note */}
                <p className="text-xs text-muted-foreground text-center">
                  This is a demo UI. All data is mocked but structured for real API integration.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
