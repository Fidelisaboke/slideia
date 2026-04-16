'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import LandingPage from '@/components/landing/LandingPage';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import OutlineView from '@/components/OutlineView';
import DeckView from '@/components/DeckView';
import ErrorAlert from '@/components/ErrorAlert';
import GenerationProgress from '@/components/GenerationProgress';
import { apiClient } from '@/lib/apiClient';
import { ProposeOutlineResponse, GenerateDeckResponse, GenerationProgressEvent } from '@/types/api';

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
  
  // ── Generation Progress State ────────────────────────────────────
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [currentGenStep, setCurrentGenStep] = useState<'outline' | 'slide' | 'complete' | 'error'>('outline');
  const [currentSlideTitle, setCurrentSlideTitle] = useState<string | undefined>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | undefined>();
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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
    
    // Switch to progress overlay immediately
    setIsGeneratingDeck(true);
    setGenerationProgress(5);
    setGenerationMessage('Initiating AI sequence...');
    setCurrentGenStep('outline');

    const controller = new AbortController();
    setAbortController(controller);

    let completed = false;
    try {
      await apiClient.proposeOutlineStream(
        {
          topic: data.topic,
          audience: data.audience,
          tone: data.tone,
          slide_count: data.slideCount,
        },
        (event: GenerationProgressEvent) => {
          if (event.step === 'outline') {
            setGenerationProgress(event.progress);
            setGenerationMessage(event.message);
          } else if (event.step === 'complete') {
            completed = true;
            setGenerationProgress(100);
            setGenerationMessage(event.message);
            
            if (event.data) {
              setOutline(event.data as ProposeOutlineResponse);
              setStep('outline');
            }
            setIsGeneratingDeck(false);
          } else if (event.step === 'error') {
            throw new Error(event.message);
          }
        },
        controller
      );

      if (!completed) {
        throw new Error('Connection closed unexpectedly during outline generation.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      
      setCurrentGenStep('error');
      setGenerationMessage(
        err instanceof Error
          ? err.message
          : 'Failed to generate outline. Please try again.'
      );
      setGenerationProgress(100);
      setIsGeneratingDeck(true); // Keep it true so overlay shows error
    } finally {
      setAbortController(null);
    }
  };

  const handleCancelGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
    setAbortController(null);
    setIsGeneratingDeck(false);
    setGenerationMessage('');
  };

  const handleGenerateDeck = async () => {
    setError(null);
    setIsGeneratingDeck(true);
    setGenerationProgress(5);
    setGenerationMessage('Connecting to AI engine...');
    setCurrentGenStep('outline');

    const controller = new AbortController();
    setAbortController(controller);

    let completed = false;
    try {
      await apiClient.generateDeckStream(
        {
          topic,
          audience,
          tone,
          slide_count: slideCount,
        },
        (event: GenerationProgressEvent) => {
          if (event.step === 'outline') {
            setCurrentGenStep('outline');
            setGenerationProgress(event.progress);
            setGenerationMessage(event.message);
          } else if (event.step === 'slide') {
            setCurrentGenStep('slide');
            setGenerationProgress(event.progress);
            setGenerationMessage(event.message);
            setCurrentSlideTitle(event.title);
            setCurrentSlideIndex(event.index);
          } else if (event.step === 'complete') {
            completed = true;
            setCurrentGenStep('complete');
            setGenerationProgress(100);
            setGenerationMessage(event.message);
            
            if (event.data) {
              // Artificial delay for smooth transition
              const data = event.data as GenerateDeckResponse;
              setTimeout(() => {
                setDeck(data);
                setStep('deck');
                setIsGeneratingDeck(false);
              }, 800);
            } else {
              setIsGeneratingDeck(false);
            }
          } else if (event.step === 'error') {
            throw new Error(event.message);
          }
        },
        controller
      );

      if (!completed) {
        throw new Error('Connection closed unexpectedly during deck generation.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Handled by handleCancelGeneration
      }
      setCurrentGenStep('error');
      setGenerationMessage(
        err instanceof Error
          ? err.message
          : 'Failed to generate deck. Please try again.'
      );
      setGenerationProgress(100);
      setIsGeneratingDeck(true); // Keep it true so overlay shows error
    } finally {
      setAbortController(null);
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

  // ── Unified Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Navbar />
      </header>

      {/* Progress Overlay (Global) */}
      {isGeneratingDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <GenerationProgress
            progress={generationProgress}
            message={generationMessage}
            currentStep={currentGenStep}
            slideTitle={currentSlideTitle}
            slideIndex={currentSlideIndex}
            totalSlides={slideCount}
            onCancel={handleCancelGeneration}
          />
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 w-full">
        {step === 'form' ? (
          <>
            {error && (
              <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
                <ErrorAlert message={error} onDismiss={() => setError(null)} />
              </div>
            )}
            <LandingPage
              onSubmit={handleFormSubmit}
              isLoading={isGeneratingDeck && currentGenStep !== 'error'}
            />
          </>
        ) : (
          <div className="container mx-auto px-4 py-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6">
                <ErrorAlert message={error} onDismiss={() => setError(null)} />
              </div>
            )}

            {/* Main Content */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {step === 'outline' && outline && !isGeneratingDeck && (
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
        )}
      </main>

      <Footer />
    </div>
  );
}
