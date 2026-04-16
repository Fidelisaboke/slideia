'use client';

import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';

interface LandingPageProps {
  onSubmit: (data: {
    topic: string;
    audience: string;
    tone: string;
    slideCount: number;
  }) => void;
  isLoading: boolean;
}

export default function LandingPage({ onSubmit, isLoading }: LandingPageProps) {
  return (
    <div className="bg-background">
      <Hero onSubmit={onSubmit} isLoading={isLoading} />

      {/* Gradient divider */}
      <div className="gradient-line mx-auto max-w-4xl" aria-hidden="true" />

      <Features />
      <HowItWorks />
    </div>
  );
}
