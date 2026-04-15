'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Download, RotateCcw, CheckCircle2 } from 'lucide-react';
import { GenerateDeckResponse, SlideExportItem } from '@/types/api';
import { apiClient } from '@/lib/apiClient';
import EditableSlide from '@/components/EditableSlide';
import { fadeInUp, staggerContainer } from '@/lib/motion';

// ── Types ────────────────────────────────────────────────────────────

interface EditableSlideData {
  title: string;
  summary: string;
  bullets: string[];
  notes: string;
  image_prompt: string;
  theme?: Record<string, string>;
}

interface DeckViewProps {
  deck: GenerateDeckResponse;
  topic: string;
  audience: string;
  tone: string;
  slideCount: number;
  onReset: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Merge outline + slide content into a single editable array.
 */
function buildEditableSlides(deck: GenerateDeckResponse): EditableSlideData[] {
  return deck.slides.map((slide, i) => ({
    title: deck.outline.slides[i]?.title ?? `Slide ${i + 1}`,
    summary: deck.outline.slides[i]?.summary ?? '',
    bullets: [...slide.bullets],
    notes: slide.notes ?? '',
    image_prompt: slide.image_prompt ?? '',
    theme: slide.theme,
  }));
}

// ── Component ────────────────────────────────────────────────────────

export default function DeckView({
  deck,
  topic,
  audience,
  onReset,
}: DeckViewProps) {
  const [slides, setSlides] = useState<EditableSlideData[]>(() =>
    buildEditableSlides(deck)
  );
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ── Update a single slide's fields ───────────────────────────────

  const handleUpdateSlide = useCallback(
    (index: number, updated: Partial<EditableSlideData>) => {
      setSlides((prev) =>
        prev.map((s, i) => (i === index ? { ...s, ...updated } : s))
      );
    },
    []
  );

  // ── Regenerate a single slide via the API ────────────────────────

  const handleRegenerate = useCallback(
    async (index: number, instruction?: string) => {
      const slide = slides[index];
      if (!slide) return;

      setRegeneratingIdx(index);
      try {
        const result = await apiClient.regenerateSlide({
          title: slide.title,
          summary: slide.summary,
          instruction,
        });

        setSlides((prev) =>
          prev.map((s, i) =>
            i === index
              ? {
                  ...s,
                  bullets: result.bullets,
                  notes: result.notes ?? s.notes,
                  image_prompt: result.image_prompt ?? s.image_prompt,
                }
              : s
          )
        );
      } catch (err) {
        console.error('Failed to regenerate slide:', err);
        // Optionally surface error — for now just log
      } finally {
        setRegeneratingIdx(null);
      }
    },
    [slides]
  );

  // ── Export the modified deck ──────────────────────────────────────

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const exportSlides: SlideExportItem[] = slides.map((s) => ({
        title: s.title,
        summary: s.summary,
        bullets: s.bullets,
        notes: s.notes,
        image_prompt: s.image_prompt,
        theme: s.theme,
      }));

      const response = await apiClient.exportPptx({
        topic,
        audience,
        slides: exportSlides,
      });

      const downloadUrl = apiClient.getDownloadUrl(response.download_url);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : 'Failed to export PowerPoint. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  }, [slides, topic, audience]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────── */}
      <motion.div
        className="text-center mb-8"
        variants={fadeInUp}
        initial="hidden"
        animate="show"
      >
        <div className="inline-flex items-center justify-center w-14 h-14
                        rounded-2xl bg-secondary/10 mb-4">
          <CheckCircle2 className="w-7 h-7 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold font-(family-name:--font-sora) text-foreground mb-1">
          {deck.outline.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          Review and edit your slides below, then export when ready.
        </p>
      </motion.div>

      {/* ── Export Error ───────────────────────────────────────────── */}
      {exportError && (
        <div className="mb-6 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl
                        flex items-center justify-between">
          <p className="text-xs text-destructive">{exportError}</p>
          <button
            onClick={() => setExportError(null)}
            className="text-destructive/60 hover:text-destructive ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Editable Slides ───────────────────────────────────────── */}
      <motion.div
        className="space-y-4 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {slides.map((slide, index) => (
          <EditableSlide
            key={index}
            index={index}
            data={slide}
            isRegenerating={regeneratingIdx === index}
            onUpdate={handleUpdateSlide}
            onRegenerate={handleRegenerate}
          />
        ))}
      </motion.div>

      {/* ── Action Buttons ────────────────────────────────────────── */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full gradient-button text-white font-semibold py-3 px-6 rounded-xl
                     shadow-md shadow-primary/20
                     hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
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
              Exporting…
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export to PowerPoint
            </>
          )}
        </button>

        <button
          onClick={onReset}
          className="w-full text-muted-foreground hover:text-primary font-medium
                     py-3 px-6 rounded-xl border border-border
                     hover:border-primary/30 hover:bg-primary/5
                     transition-all duration-200 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Create Another Presentation
        </button>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
          💡 Edit titles and bullet points inline · Click &quot;Regenerate&quot; to re-roll a slide · Add instructions for targeted improvements
        </p>
      </motion.div>
    </div>
  );
}
