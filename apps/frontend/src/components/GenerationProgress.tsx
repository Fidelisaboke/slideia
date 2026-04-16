"use client";

import { motion } from "motion/react";
import { Loader2, XCircle, CheckCircle2, Sparkles } from "lucide-react";

interface GenerationProgressProps {
  progress: number;
  message: string;
  currentStep: "outline" | "slide" | "complete" | "error";
  slideTitle?: string;
  slideIndex?: number;
  totalSlides?: number;
  onCancel?: () => void;
}

export default function GenerationProgress({
  progress,
  message,
  currentStep,
  slideTitle,
  slideIndex,
  totalSlides,
  onCancel,
}: GenerationProgressProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel glow-border p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Header Icon */}
          <div className="mb-6 relative">
            <motion.div
              animate={{
                rotate:
                  currentStep === "complete" || currentStep === "error"
                    ? 0
                    : 360,
                scale:
                  currentStep === "complete" || currentStep === "error"
                    ? [1, 1.2, 1]
                    : 1,
              }}
              transition={{
                rotate: {
                  duration:
                    currentStep === "complete" || currentStep === "error"
                      ? 0.3
                      : 8,
                  repeat:
                    currentStep === "complete" || currentStep === "error"
                      ? 0
                      : Infinity,
                  ease:
                    currentStep === "complete" || currentStep === "error"
                      ? "easeOut"
                      : "linear",
                },
                scale: { duration: 0.5 },
              }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center
                          ${
                            currentStep === "complete"
                              ? "bg-secondary/20 text-secondary"
                              : currentStep === "error"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-primary/10 text-primary"
                          }`}
            >
              {currentStep === "complete" ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : currentStep === "error" ? (
                <XCircle className="w-8 h-8" />
              ) : (
                <Sparkles className="w-8 h-8" />
              )}
            </motion.div>

            {currentStep !== "complete" && currentStep !== "error" && (
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Loader2 className="w-5 h-5 text-secondary animate-spin" />
              </motion.div>
            )}
          </div>

          {/* Main Status */}
          <h3
            className={`text-xl font-bold mb-2 font-(family-name:--font-sora) ${currentStep === "error" ? "text-destructive" : "text-foreground"}`}
          >
            {currentStep === "complete"
              ? "Presentation Ready!"
              : currentStep === "error"
                ? "Generation Failed"
                : "Generating Magic..."}
          </h3>

          <p className="text-sm text-muted-foreground mb-8 min-h-10 flex items-center justify-center">
            {message}
          </p>

          {/* Progress Bar Container */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-4 p-[2px] border border-border/50">
            <motion.div
              className={`h-full rounded-full ${
                currentStep === "complete"
                  ? "bg-secondary"
                  : currentStep === "error"
                    ? "bg-destructive"
                    : "bg-linear-to-r from-primary to-secondary"
              }`}
              initial={{ width: "0%" }}
              animate={{
                width: currentStep === "error" ? "100%" : `${progress}%`,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Details & Percentage */}
          <div className="flex justify-between w-full text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-8">
            <span>
              {currentStep === "slide" && totalSlides
                ? `Slide ${slideIndex} of ${totalSlides}`
                : currentStep === "outline"
                  ? "Structuring"
                  : currentStep === "complete"
                    ? "Done"
                    : currentStep === "error"
                      ? "Error"
                      : "Thinking"}
            </span>
            <span>
              {currentStep === "error" ? "!" : `${Math.round(progress)}%`}
            </span>
          </div>

          {/* Slide Title Preview (if drafting) */}
          {currentStep === "slide" && slideTitle && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-background/50 border border-border/40 rounded-xl p-3 mb-8"
            >
              <span className="text-[10px] text-muted-foreground block mb-1">
                CURRENTLY DRAFTING
              </span>
              <p className="text-sm font-medium text-foreground truncate">
                {slideTitle}
              </p>
            </motion.div>
          )}

          {/* Action Button */}
          {currentStep === "error" ? (
            <button
              onClick={onCancel}
              className="w-full py-3 px-6 rounded-xl bg-destructive/10 text-destructive font-semibold
                         hover:bg-destructive/15 transition-all duration-200 border border-destructive/20"
            >
              Close Overlay
            </button>
          ) : (
            currentStep !== "complete" &&
            onCancel && (
              <button
                onClick={onCancel}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive
                         transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-destructive/5"
              >
                <XCircle className="w-4 h-4" />
                Cancel Generation
              </button>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}
