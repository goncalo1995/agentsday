"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VoiceIntentInputProps {
  onSubmit: (transcript: string) => void;
  isProcessing: boolean;
}

export function VoiceIntentInput({ onSubmit, isProcessing }: VoiceIntentInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);

  const handleMicClick = () => {
    if (isProcessing) return;
    
    if (isListening) {
      setIsListening(false);
      // Simulate voice recognition completing
      setTimeout(() => {
        onSubmit("I need a Mother's Day gift two days from now. Find a cool experience, maybe a spa day in Lisbon.");
      }, 300);
    } else {
      setIsListening(true);
      // Simulate listening for 3 seconds
      setTimeout(() => {
        setIsListening(false);
        onSubmit("I need a Mother's Day gift two days from now. Find a cool experience, maybe a spa day in Lisbon.");
      }, 3000);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      onSubmit(textInput.trim());
      setTextInput("");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Microphone Button */}
      <motion.div
        className="relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Pulsing rings when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ 
                    scale: 1 + ring * 0.3, 
                    opacity: 0 
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: ring * 0.3,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleMicClick}
          disabled={isProcessing}
          className={`
            relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${isListening 
              ? "bg-primary shadow-[0_0_60px_rgba(0,200,150,0.4)]" 
              : "bg-secondary hover:bg-secondary/80 shadow-xl hover:shadow-2xl"
            }
            ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            border border-border
          `}
          whileHover={!isProcessing ? { scale: 1.05 } : {}}
          whileTap={!isProcessing ? { scale: 0.95 } : {}}
        >
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground animate-spin" />
              </motion.div>
            ) : isListening ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <MicOff className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Mic className="w-12 h-12 md:w-16 md:h-16 text-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Status Text */}
      <motion.p 
        className="text-lg md:text-xl font-medium text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isProcessing ? (
          <span className="text-primary">Processing your request...</span>
        ) : isListening ? (
          <span className="text-primary">Listening... tap to stop</span>
        ) : (
          <span className="text-muted-foreground">Press to speak</span>
        )}
      </motion.p>

      {/* Text Fallback Toggle */}
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {!showTextInput ? (
          <button
            onClick={() => setShowTextInput(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Or type your request instead
          </button>
        ) : (
          <motion.form
            onSubmit={handleTextSubmit}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your gift request..."
              className="flex-1 bg-input border-border"
              disabled={isProcessing}
            />
            <Button 
              type="submit" 
              disabled={!textInput.trim() || isProcessing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </motion.form>
        )}
      </motion.div>

      {/* Example Prompt */}
      <motion.div
        className="max-w-lg text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-xs text-muted-foreground mb-2">Example prompt:</p>
        <p className="text-sm text-muted-foreground/80 italic">
          {'"Find a Mother\'s Day gift in Lisbon, ideally a spa or wellness experience, for this weekend."'}
        </p>
      </motion.div>
    </div>
  );
}
