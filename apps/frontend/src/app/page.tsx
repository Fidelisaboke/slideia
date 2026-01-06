'use client';

import { useState } from 'react';
import SlideForm from '@/components/SlideForm';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Slideia
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered Slide Deck Generator
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}

        {/* Main Content */}
        <div className="flex justify-center">
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
              onReset={handleReset}
            />
          )}
        </div>

        {/* Back Button (shown on outline step) */}
        {step === 'outline' && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleReset}
              disabled={isGeneratingDeck}
              className="text-gray-600 hover:text-gray-800 disabled:text-gray-400 font-medium flex items-center transition"
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
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>Powered by FastAPI and Next.js</p>
      </footer>
    </div>
  );
}
