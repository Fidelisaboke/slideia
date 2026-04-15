'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import LandingPage from '@/components/landing/LandingPage';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import OutlineView from '@/components/OutlineView';
import DeckView from '@/components/DeckView';
import ErrorAlert from '@/components/ErrorAlert';
import { apiClient } from '@/lib/apiClient';
import { ProposeOutlineResponse, GenerateDeckResponse } from '@/types/api';

type Step = 'form' | 'outline' | 'deck';

export default function Home() {
  const [step, setStep] = useState<Step>('form');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [slideCount, setSlideCount] = useState(5);
  const [outline, setOutline] = useState<ProposeOutlineResponse | null>(null);
  const [deck, setDeck] = useState<GenerateDeckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingOutline, setIsLoadingOutline] = useState(false);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);

  const handleFormSubmit = async (
    data: {
      topic: string;
      audience: string;
      tone: string;
      slideCount: number;
    }
  ) => {
    setTopic(data.topic);
    setAudience(data.audience);
    setTone(data.tone);
    setSlideCount(data.slideCount);
    setError(null);
    setIsLoadingOutline(true);

    try {
      const response = await apiClient.proposeOutline({
        topic: data.topic,
        audience: data.audience,
        tone: data.tone,
        slide_count: data.slideCount,
      });
      
      setOutline(response);
      setStep('outline');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate outline. Please try again.'
      );
    } finally {
      setIsLoadingOutline(false);
    }
  };

  const handleGenerateDeck = async () => {
    setError(null);
    setIsGeneratingDeck(true);

    try {
      const response = await apiClient.generateDeck({
        topic,
        audience,
        tone,
        slide_count: slideCount,
      });
      
      setDeck(response);
      setStep('deck');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate deck. Please try again.'
      );
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setTopic('');
    setAudience('');
    setTone('professional');
    setSlideCount(5);
    setOutline(null);
    setDeck(null);
    setError(null);
  };

  // ── Landing page (form step) ──────────────────────────────────────
  if (step === 'form') {
    return (
      <>
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}
        <LandingPage
          onSubmit={handleFormSubmit}
          isLoading={isLoadingOutline}
        />
      </>
    );
  }

  // ── Editor views (outline / deck steps) ───────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}

        {/* Main Content */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {step === 'outline' && outline && (
            <OutlineView
              outline={outline}
              topic={topic}
              audience={audience}
              tone={tone}
              slideCount={slideCount}
              onGenerate={handleGenerateDeck}
              isGenerating={isGeneratingDeck}
            />
          )}

          {step === 'deck' && deck && (
            <DeckView
              deck={deck}
              topic={topic}
              audience={audience}
              tone={tone}
              slideCount={slideCount}
              onReset={handleReset}
            />
          )}
        </motion.div>

        {/* Back Button (shown on outline step) */}
        {step === 'outline' && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleReset}
              disabled={isGeneratingDeck}
              className="text-muted-foreground hover:text-primary disabled:text-muted-foreground/50
                         font-medium flex items-center transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Start Over
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
