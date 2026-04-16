"use client";

import { motion } from "motion/react";
import SlideForm from "@/components/SlideForm";
import { fadeInUp, fadeInRight, staggerContainer } from "@/lib/motion";

interface HeroProps {
  onSubmit: (data: {
    topic: string;
    audience: string;
    tone: string;
    slideCount: number;
  }) => void;
  isLoading: boolean;
}

export default function Hero({ onSubmit, isLoading }: HeroProps) {
  return (
    <section
      id="hero-section"
      className="relative overflow-hidden px-6 pt-12 pb-20 sm:pt-20 sm:pb-28"
    >
      {/* Decorative blobs behind the hero */}
      <div
        className="hero-blob w-[500px] h-[500px] bg-primary opacity-[0.07] -top-40 -left-40"
        aria-hidden="true"
      />
      <div
        className="hero-blob w-[400px] h-[400px] bg-secondary opacity-[0.05] -bottom-32 -right-32"
        aria-hidden="true"
      />

      <motion.div
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Left: Copy */}
        <motion.div variants={fadeInUp} className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs font-medium text-primary mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            AI-Powered Presentation Creator
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-(family-name:--font-sora) leading-tight mb-6">
            From <span className="gradient-text">Idea</span> to Slide Deck{" "}
            <br className="hidden sm:block" />
            in <span className="gradient-text">Seconds</span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
            Describe your topic. Slideia generates structured, professional
            presentations with speaker notes, themes, and PowerPoint export —
            ready in under a minute.
          </p>

          {/* Social proof badges */}
          <div className="flex flex-wrap gap-4">
            {[
              { icon: "⚡", label: "Lightning Fast" },
              { icon: "🎯", label: "Structured Output" },
              { icon: "📥", label: ".pptx Export" },
            ].map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface text-sm text-muted-foreground border border-border"
              >
                <span>{badge.icon}</span>
                {badge.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right: Form */}
        <motion.div variants={fadeInRight}>
          <SlideForm onSubmit={onSubmit} isLoading={isLoading} />
        </motion.div>
      </motion.div>
    </section>
  );
}
