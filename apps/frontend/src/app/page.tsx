'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import SlideForm from '@/components/SlideForm';
import OutlineView from '@/components/OutlineView';
import DeckView from '@/components/DeckView';
import ErrorAlert from '@/components/ErrorAlert';
import ThemeToggle from '@/components/ThemeToggle';
import { apiClient } from '@/lib/apiClient';
import { ProposeOutlineResponse, GenerateDeckResponse } from '@/types/api';
import { fadeInUp, staggerContainer } from '@/lib/motion';

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation bar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-button shadow-md
                          group-hover:-translate-y-0.5 transition-transform duration-300">
            <span className="text-white font-bold text-base font-(family-name:--font-sora)">S</span>
          </div>
          <h1 className="text-lg font-bold font-(family-name:--font-sora) tracking-tight">
            <span className="gradient-text">Slide</span>
            <span className="text-foreground font-semibold">ia</span>
          </h1>
        </Link>
        <ThemeToggle />
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl sm:text-5xl font-bold font-(family-name:--font-sora) mb-4"
          >
            <span className="gradient-text">
              AI-Powered
            </span>{' '}
            <span className="text-foreground">Slide Decks</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-muted-foreground max-w-lg mx-auto"
          >
            Create professional presentations in seconds with the power of AI
          </motion.p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}

        {/* Main Content */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {step === 'form' && (
            <SlideForm
              onSubmit={handleFormSubmit}
              isLoading={isLoadingOutline}
            />
          )}

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

      {/* Footer */}
      <footer className="text-center py-8 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} - Slideia</p>
      </footer>
    </div>
  );
}
