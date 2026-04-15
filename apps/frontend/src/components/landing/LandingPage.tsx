'use client';

import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Footer from '@/components/landing/Footer';

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero onSubmit={onSubmit} isLoading={isLoading} />

      {/* Gradient divider */}
      <div className="gradient-line mx-auto max-w-4xl" aria-hidden="true" />

      <Features />
      <HowItWorks />
      <Footer />
    </div>
  );
}
