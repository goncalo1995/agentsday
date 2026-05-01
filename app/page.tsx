"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Shield, Zap } from "lucide-react";
import { VoiceIntentInput } from "@/components/voice-intent-input";
import { IntentJsonPanel } from "@/components/intent-json-panel";
import { AgentTraceStream } from "@/components/agent-trace-stream";
import { ExperienceResultsGrid } from "@/components/experience-results-grid";
import { PurchaseApprovalCard } from "@/components/purchase-approval-card";
import { DemoArchitecturePanel } from "@/components/demo-architecture-panel";
import {
  extractIntent,
  streamAgentTrace,
  searchViatorExperiences,
  createVerifiableIntent,
  issueSingleUseCard,
  type Intent,
  type ExperienceResult
} from "@/lib/mock-api";

type AppState = "idle" | "processing" | "results" | "approval";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [isIntentAnimating, setIsIntentAnimating] = useState(false);
  const [traceMessages, setTraceMessages] = useState<string[]>([]);
  const [isTraceStreaming, setIsTraceStreaming] = useState(false);
  const [experiences, setExperiences] = useState<ExperienceResult[]>([]);
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceResult | null>(null);

  const handleVoiceSubmit = useCallback(async (text: string) => {
    setState("processing");
    setTranscript(text);
    setTraceMessages([]);
    setIsTraceStreaming(true);
    setExperiences([]);
    setSelectedExperience(null);

    // Start streaming agent trace
    const traceGenerator = streamAgentTrace();
    
    // Process intent extraction in parallel
    const intentPromise = extractIntent(text);

    // Stream trace messages
    let messageIndex = 0;
    for await (const message of traceGenerator) {
      setTraceMessages(prev => [...prev, message]);
      
      // After 3 messages, show intent
      if (messageIndex === 2) {
        const extractedIntent = await intentPromise;
        setIntent(extractedIntent);
        setIsIntentAnimating(true);
      }
      
      // After 4 messages, start loading experiences
      if (messageIndex === 3) {
        setIsLoadingExperiences(true);
        const intent = await intentPromise;
        const results = await searchViatorExperiences(intent);
        setExperiences(results);
        setIsLoadingExperiences(false);
      }
      
      messageIndex++;
    }

    setIsTraceStreaming(false);
    setIsIntentAnimating(false);
    setState("results");
  }, []);

  const handleSelectExperience = useCallback((experience: ExperienceResult) => {
    setSelectedExperience(experience);
    setState("approval");
  }, []);

  const handleApproveIntent = useCallback(async () => {
    if (!intent || !selectedExperience) return;
    await createVerifiableIntent(intent, selectedExperience);
  }, [intent, selectedExperience]);

  const handleIssueCard = useCallback(async () => {
    if (!selectedExperience) throw new Error("No experience selected");
    return issueSingleUseCard(selectedExperience.price, selectedExperience.currency);
  }, [selectedExperience]);

  const handleReset = useCallback(() => {
    setState("idle");
    setTranscript(null);
    setIntent(null);
    setTraceMessages([]);
    setExperiences([]);
    setSelectedExperience(null);
  }, []);

  return (
    <main className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
        
        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-8 md:pt-20 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Hackathon Demo</span>
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              <span className="text-foreground">Find a last-minute gift with a</span>
              <br />
              <span className="text-primary">verifiable AI shopping agent</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Voice-powered gift discovery with verifiable intent, exact-limit cards, and secure checkout.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {[
                { icon: Gift, label: "Gift Experience Search" },
                { icon: Shield, label: "Verifiable Intent" },
                { icon: Zap, label: "Instant Single-Use Cards" }
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-full"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Voice Input - Always visible in idle/processing state */}
        <AnimatePresence mode="wait">
          {(state === "idle" || state === "processing") && (
            <motion.div
              key="voice-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8"
            >
              <VoiceIntentInput
                onSubmit={handleVoiceSubmit}
                isProcessing={state === "processing"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript Bubble */}
        <AnimatePresence>
          {transcript && state !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Your request:</p>
                <p className="text-foreground">{`"${transcript}"`}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing Panels */}
        {state !== "idle" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AgentTraceStream
              messages={traceMessages}
              isStreaming={isTraceStreaming}
            />
            <IntentJsonPanel
              intent={intent}
              isAnimating={isIntentAnimating}
            />
          </div>
        )}

        {/* Experience Results */}
        {(state === "results" || state === "approval") && (
          <ExperienceResultsGrid
            experiences={experiences}
            isLoading={isLoadingExperiences}
            selectedExperience={selectedExperience}
            onSelect={handleSelectExperience}
          />
        )}

        {/* Purchase Approval */}
        <AnimatePresence>
          {state === "approval" && selectedExperience && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-4"
            >
              <PurchaseApprovalCard
                experience={selectedExperience}
                onApprove={handleApproveIntent}
                onIssueCard={handleIssueCard}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Architecture Panel - Always at bottom */}
        <div className="pt-8">
          <DemoArchitecturePanel />
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Verifiable Intent Gift Agent — Hackathon Demo</p>
          <p>Built with Next.js, Tailwind CSS, and Framer Motion</p>
        </div>
      </footer>
    </main>
  );
}
