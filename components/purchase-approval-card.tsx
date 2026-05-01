"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Lock,
  BadgeCheck,
  AlertCircle,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ExperienceResult, CardMetadata } from "@/lib/mock-api";

interface PurchaseApprovalCardProps {
  experience: ExperienceResult;
  onApprove: () => Promise<void>;
  onIssueCard: () => Promise<CardMetadata>;
  onReset: () => void;
}

type Stage = "approval" | "approving" | "approved" | "issuing" | "ready";

export function PurchaseApprovalCard({ 
  experience, 
  onApprove, 
  onIssueCard,
  onReset
}: PurchaseApprovalCardProps) {
  const [stage, setStage] = useState<Stage>("approval");
  const [cardData, setCardData] = useState<CardMetadata | null>(null);

  const handleApprove = async () => {
    setStage("approving");
    await onApprove();
    setStage("approved");
  };

  const handleIssueCard = async () => {
    setStage("issuing");
    const card = await onIssueCard();
    setCardData(card);
    setStage("ready");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {stage === "ready" ? "Payment Ready" : "Purchase Approval"}
              </h3>
              <p className="text-xs text-muted-foreground">Verifiable intent workflow</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Selected Experience Summary */}
          <div className="flex items-start gap-4 p-4 bg-background/50 rounded-xl border border-border">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={experience.image}
                alt={experience.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground line-clamp-2">{experience.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{experience.location}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-bold text-primary">€{experience.price}</span>
                <span className="text-sm text-muted-foreground">per person</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { icon: Shield, label: "Overspend impossible" },
              { icon: BadgeCheck, label: "User-approved intent" },
              { icon: CreditCard, label: "Exact-limit card" },
              { icon: ExternalLink, label: "Referral-ready" }
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 p-2 bg-green-500/5 border border-green-500/20 rounded-lg"
              >
                <Icon className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Card Details / Approval */}
          <AnimatePresence mode="wait">
            {(stage === "approval" || stage === "approving") && (
              <motion.div
                key="approval"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-muted-foreground">Card Limit</p>
                    <p className="font-semibold text-foreground">€{experience.price}.00</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-muted-foreground">Validity</p>
                    <p className="font-semibold text-foreground">30 minutes</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg col-span-2">
                    <p className="text-muted-foreground">Merchant</p>
                    <p className="font-semibold text-foreground">Viator / Demo Merchant</p>
                  </div>
                </div>

                <Button
                  onClick={handleApprove}
                  disabled={stage === "approving"}
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                >
                  {stage === "approving" ? (
                    <>
                      <Spinner className="mr-2" />
                      Verifying intent...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Approve Verifiable Intent
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {(stage === "approved" || stage === "issuing") && (
              <motion.div
                key="issue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Intent verified successfully</span>
                </div>

                <Button
                  onClick={handleIssueCard}
                  disabled={stage === "issuing"}
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                >
                  {stage === "issuing" ? (
                    <>
                      <Spinner className="mr-2" />
                      Issuing single-use card...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Issue Single-Use Card
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {stage === "ready" && cardData && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Success Banner */}
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Ready for merchant checkout</p>
                    <p className="text-xs text-green-400/70">Single-use card prepared and verified</p>
                  </div>
                </div>

                {/* Virtual Card */}
                <div className="relative bg-gradient-to-br from-primary/20 via-secondary to-primary/10 rounded-2xl p-5 border border-primary/30 overflow-hidden">
                  {/* Card chip decoration */}
                  <div className="absolute top-4 right-4 w-10 h-8 bg-amber-500/30 rounded-md" />
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Verifiable Card</span>
                    </div>
                    
                    <div className="font-mono text-xl md:text-2xl tracking-widest text-foreground">
                      {cardData.maskedPan}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Expiry</p>
                        <p className="font-mono text-foreground">{cardData.expiry}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Limit</p>
                        <p className="font-mono text-primary font-semibold">{cardData.limit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valid for</p>
                        <p className="font-mono text-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cardData.validFor}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    This is a demo card. In production, this would be a real single-use virtual card 
                    with an exact limit matching the purchase price.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onReset}
                  >
                    Start New Search
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => window.open(experience.referralUrl, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
