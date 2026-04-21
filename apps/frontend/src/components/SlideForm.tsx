"use client";

import { useState } from "react";
import ThemeSelector from "@/components/ThemeSelector";
import { ThemePreset } from "@/types/api";

interface SlideFormProps {
  onSubmit: (data: {
    topic: string;
    audience: string;
    tone: string;
    slideCount: number;
    themePreset: ThemePreset;
  }) => void;
  isLoading: boolean;
}

export default function SlideForm({ onSubmit, isLoading }: SlideFormProps) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [slideCount, setSlideCount] = useState(5);
  const [themePreset, setThemePreset] = useState<ThemePreset>("Purple Mint");

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (topic.trim() && audience.trim()) {
      onSubmit({ topic, audience, tone, slideCount, themePreset });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 glass-panel glow-border rounded-2xl">
      <h2 className="text-2xl font-bold mb-6 font-(family-name:--font-sora) text-foreground">
        Create Your Presentation
      </h2>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Topic */}
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Presentation Topic *
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Climate Change Solutions"
            className="w-full px-4 py-2.5 bg-background-subtle border border-border rounded-lg
                       text-foreground placeholder:text-muted-foreground/60
                       focus:ring-2 focus:ring-primary/40 focus:border-primary/50
                       outline-none transition-all duration-200"
            disabled={isLoading}
            required
          />
        </div>

        {/* Audience */}
        <div>
          <label
            htmlFor="audience"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Target Audience *
          </label>
          <input
            id="audience"
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., Business executives, Students, General public"
            className="w-full px-4 py-2.5 bg-background-subtle border border-border rounded-lg
                       text-foreground placeholder:text-muted-foreground/60
                       focus:ring-2 focus:ring-primary/40 focus:border-primary/50
                       outline-none transition-all duration-200"
            disabled={isLoading}
            required
          />
        </div>

        {/* Tone + Slide Count row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="tone"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Presentation Tone
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2.5 bg-background-subtle border border-border rounded-lg
                         text-foreground
                         focus:ring-2 focus:ring-primary/40 focus:border-primary/50
                         outline-none transition-all duration-200"
              disabled={isLoading}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="academic">Academic</option>
              <option value="persuasive">Persuasive</option>
              <option value="informative">Informative</option>
              <option value="inspirational">Inspirational</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="slideCount"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Slides:{" "}
              <span className="text-primary font-semibold">{slideCount}</span>
            </label>
            <input
              id="slideCount"
              type="range"
              min="3"
              max="20"
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full h-2 mt-3 bg-background-subtle rounded-lg appearance-none cursor-pointer accent-primary"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>3</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="pt-1">
          <ThemeSelector
            value={themePreset}
            onChange={setThemePreset}
            disabled={isLoading}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !topic.trim() || !audience.trim()}
          className="w-full gradient-button hover:shadow-lg hover:shadow-primary/20
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold py-3 px-6 rounded-lg
                     transition-all duration-200
                     hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
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
              Processing...
            </span>
          ) : (
            "Generate Outline"
          )}
        </button>
      </form>
    </div>
  );
}
