"use client";

import { ProposeOutlineResponse } from "@/types/api";
import { GraduationCap, Users, Sparkles } from "lucide-react";

interface OutlineViewProps {
  outline: ProposeOutlineResponse;
  topic: string;
  audience: string;
  tone: string;
  slideCount: number;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function OutlineView({
  outline,
  topic,
  audience,
  tone,
  slideCount,
  onGenerate,
  isGenerating,
}: OutlineViewProps) {
  return (
    <div className="w-full max-w-3xl mx-auto p-6 glass-panel glow-border rounded-2xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold font-(family-name:--font-sora) text-foreground mb-2">
          {outline.title}
        </h2>
        <span className="text-sm text-muted-foreground">
          {slideCount} slides
        </span>
      </div>

      {/* Metadata bar */}
      <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/15 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Topic
              </span>
              <div
                className="text-sm text-foreground font-semibold truncate max-w-xs"
                title={topic}
              >
                {topic}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary/15 text-secondary">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Audience
              </span>
              <div
                className="text-sm text-foreground font-semibold truncate max-w-xs"
                title={audience}
              >
                {audience}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Tone
              </span>
              <div
                className="text-sm text-foreground font-semibold capitalize truncate max-w-xs"
                title={tone}
              >
                {tone}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide list */}
      <div className="space-y-3 mb-6">
        {outline.slides.map((slide, index) => (
          <div
            key={index}
            className="p-4 bg-surface/50 rounded-xl border border-border hover:border-primary/30 transition-colors duration-200"
          >
            <div className="flex items-start">
              <div className="shrink-0 w-8 h-8 gradient-button text-white rounded-lg flex items-center justify-center font-semibold text-sm mr-3 shadow-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {slide.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {slide.summary}
                </p>
                {slide.citations && slide.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Sources:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {slide.citations.map((citation, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-primary mr-1">•</span>
                          <span>{citation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full gradient-mint text-white font-semibold py-3 px-6 rounded-xl
                   shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating Full Deck...
          </span>
        ) : (
          "✨ Generate Complete Deck"
        )}
      </button>
    </div>
  );
}
