"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { useDeck } from "@/contexts/DeckContext";
import {
  Download,
  RotateCcw,
  CheckCircle2,
  FileText,
  Palette,
} from "lucide-react";
import {
  GenerateDeckResponse,
  SlideExportItem,
  ThemePreset,
  THEME_PRESETS,
  SlideLayout,
} from "@/types/api";
import { apiClient } from "@/lib/apiClient";
import EditableSlide from "@/components/EditableSlide";
import { fadeInUp, staggerContainer } from "@/lib/motion";

// ── Types ────────────────────────────────────────────────────────────

interface EditableSlideData {
  title: string;
  summary: string;
  bullets: string[];
  notes: string;
  image_prompt: string;
  theme?: Record<string, string>;
  layout?: SlideLayout;
  // Phase 1
  statement?: string;
  big_number?: string;
  big_number_context?: string;
  // Phase 2
  column_left_title?: string;
  column_left?: string[];
  column_right_title?: string;
  column_right?: string[];
  steps?: string[];
  quote_text?: string;
  quote_attribution?: string;
}

interface DeckViewProps {
  deck: GenerateDeckResponse;
  topic: string;
  audience: string;
  tone: string;
  slideCount: number;
  themePreset: ThemePreset;
  onReset: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Merge outline + slide content into a single editable array.
 */
function buildEditableSlides(deck: GenerateDeckResponse): EditableSlideData[] {
  return deck.slides.map((slide, i) => ({
    title: deck.outline.slides[i]?.title ?? `Slide ${i + 1}`,
    summary: deck.outline.slides[i]?.summary ?? "",
    bullets: slide.bullets ? [...slide.bullets] : [],
    notes: slide.notes ?? "",
    image_prompt: slide.image_prompt ?? "",
    theme: slide.theme,
    layout: slide.layout ?? deck.outline.slides[i]?.layout ?? "bullets",
    statement: slide.statement,
    big_number: slide.big_number,
    big_number_context: slide.big_number_context,
    column_left_title: slide.column_left_title,
    column_left: slide.column_left,
    column_right_title: slide.column_right_title,
    column_right: slide.column_right,
    steps: slide.steps,
    quote_text: slide.quote_text,
    quote_attribution: slide.quote_attribution,
  }));
}

// ── Component ────────────────────────────────────────────────────────

export default function DeckView({
  deck,
  topic,
  audience,
  themePreset,
  onReset,
}: DeckViewProps) {
  const { deck: contextDeck, setDeck } = useDeck();
  const currentDeck = contextDeck || deck;

  const [slides, setSlides] = useState<EditableSlideData[]>(() =>
    buildEditableSlides(currentDeck),
  );
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [exportingType, setExportingType] = useState<"pptx" | "pdf" | null>(
    null,
  );
  const [exportError, setExportError] = useState<string | null>(null);

  // Sync local slides state when the global deck is updated (e.g. from SSE updates)
  useEffect(() => {
    setSlides(buildEditableSlides(currentDeck));
  }, [currentDeck]);

  // ── Update a single slide's fields ───────────────────────────────

  const handleUpdateSlide = useCallback(
    (index: number, updated: Partial<EditableSlideData>) => {
      // 1. Update local state immediately for responsiveness
      setSlides((prev) =>
        prev.map((s, i) => (i === index ? { ...s, ...updated } : s)),
      );

      // 2. Propagate the change to global DeckContext so the AI assistant gets the current state
      if (!currentDeck) return;

      const newOutlineSlides = [...currentDeck.outline.slides];
      if (newOutlineSlides[index]) {
        newOutlineSlides[index] = {
          ...newOutlineSlides[index],
          title: updated.title ?? newOutlineSlides[index].title,
          summary: updated.summary ?? newOutlineSlides[index].summary,
          layout: updated.layout ?? newOutlineSlides[index].layout,
        };
      }

      const newSlides = [...currentDeck.slides];
      if (newSlides[index]) {
        newSlides[index] = {
          ...newSlides[index],
          bullets: updated.bullets ?? newSlides[index].bullets,
          notes: updated.notes ?? newSlides[index].notes,
          image_prompt: updated.image_prompt ?? newSlides[index].image_prompt,
          theme: updated.theme ?? newSlides[index].theme,
          layout: updated.layout ?? newSlides[index].layout,
          statement: updated.statement ?? newSlides[index].statement,
          big_number: updated.big_number ?? newSlides[index].big_number,
          big_number_context:
            updated.big_number_context ?? newSlides[index].big_number_context,
          column_left_title:
            updated.column_left_title ?? newSlides[index].column_left_title,
          column_left: updated.column_left ?? newSlides[index].column_left,
          column_right_title:
            updated.column_right_title ?? newSlides[index].column_right_title,
          column_right: updated.column_right ?? newSlides[index].column_right,
          steps: updated.steps ?? newSlides[index].steps,
          quote_text: updated.quote_text ?? newSlides[index].quote_text,
          quote_attribution:
            updated.quote_attribution ?? newSlides[index].quote_attribution,
        };
      }

      setDeck({
        ...currentDeck,
        outline: {
          ...currentDeck.outline,
          slides: newOutlineSlides,
        },
        slides: newSlides,
      });
    },
    [currentDeck, setDeck],
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
          layout: slide.layout,
        });

        if (!currentDeck) return;

        const newSlides = [...currentDeck.slides];
        if (newSlides[index]) {
          newSlides[index] = {
            ...newSlides[index],
            bullets: result.bullets,
            notes: result.notes ?? newSlides[index].notes,
            image_prompt: result.image_prompt ?? newSlides[index].image_prompt,
            layout: result.layout ?? newSlides[index].layout,
            statement: result.statement ?? newSlides[index].statement,
            big_number: result.big_number ?? newSlides[index].big_number,
            big_number_context:
              result.big_number_context ?? newSlides[index].big_number_context,
            column_left_title:
              result.column_left_title ?? newSlides[index].column_left_title,
            column_left: result.column_left ?? newSlides[index].column_left,
            column_right_title:
              result.column_right_title ?? newSlides[index].column_right_title,
            column_right: result.column_right ?? newSlides[index].column_right,
            steps: result.steps ?? newSlides[index].steps,
            quote_text: result.quote_text ?? newSlides[index].quote_text,
            quote_attribution:
              result.quote_attribution ?? newSlides[index].quote_attribution,
          };
        }

        setDeck({
          ...currentDeck,
          slides: newSlides,
        });
      } catch (err) {
        console.error("Failed to regenerate slide:", err);
      } finally {
        setRegeneratingIdx(null);
      }
    },
    [slides, currentDeck, setDeck],
  );

  // Resolve theme metadata for display
  const themeMeta = THEME_PRESETS[themePreset];

  // ── Export the modified deck ──────────────────────────────────────

  const handleExport = useCallback(
    async (type: "pptx" | "pdf") => {
      setExportingType(type);
      setExportError(null);

      try {
        const exportSlides: SlideExportItem[] = slides.map((s) => ({
          title: s.title,
          summary: s.summary,
          bullets: s.bullets,
          notes: s.notes,
          image_prompt: s.image_prompt,
          theme: s.theme,
          layout: s.layout,
          statement: s.statement,
          big_number: s.big_number,
          big_number_context: s.big_number_context,
          column_left_title: s.column_left_title,
          column_left: s.column_left,
          column_right_title: s.column_right_title,
          column_right: s.column_right,
          steps: s.steps,
          quote_text: s.quote_text,
          quote_attribution: s.quote_attribution,
        }));

        const response =
          type === "pptx"
            ? await apiClient.exportPptx({
                topic,
                audience,
                slides: exportSlides,
                palette: themeMeta.palette,
                font: themeMeta.font,
                title: currentDeck.outline.title,
                subtitle: audience ? `For ${audience}` : undefined,
              })
            : await apiClient.exportPdf({
                topic,
                audience,
                slides: exportSlides,
                palette: themeMeta.palette,
                font: themeMeta.font,
                title: currentDeck.outline.title,
                subtitle: audience ? `For ${audience}` : undefined,
              });

        const downloadUrl = apiClient.getDownloadUrl(response.download_url);
        window.open(downloadUrl, "_blank");
      } catch (err) {
        setExportError(
          err instanceof Error
            ? err.message
            : `Failed to export ${type.toUpperCase()}. Please try again.`,
        );
      } finally {
        setExportingType(null);
      }
    },
    [slides, topic, audience, currentDeck, themeMeta.palette, themeMeta.font],
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────── */}
      <motion.div
        className="text-center mb-8"
        variants={fadeInUp}
        initial="hidden"
        animate="show"
      >
        <div
          className="inline-flex items-center justify-center w-14 h-14
                        rounded-2xl bg-secondary/10 mb-4"
        >
          <CheckCircle2 className="w-7 h-7 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold font-(family-name:--font-sora) text-foreground mb-1">
          {deck.outline.title}
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Review and edit your slides below, then export when ready.
        </p>

        {/* ── Active Theme Badge ──────────────────────────────────── */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs font-medium">
          <Palette
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: themeMeta.palette[0] }}
          />
          <span className="text-muted-foreground">Theme:</span>
          <span className="font-semibold text-foreground">
            {themeMeta.label}
          </span>
          {/* Colour swatches */}
          <span className="flex items-center gap-0.5 ml-0.5">
            {themeMeta.palette.map((c, i) => (
              <span
                key={i}
                className="inline-block w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/20"
                style={{ background: c }}
              />
            ))}
          </span>
          <span className="pl-1 border-l border-border text-muted-foreground">
            {themeMeta.font}
          </span>
        </div>
      </motion.div>

      {/* ── Export Error ───────────────────────────────────────────── */}
      {exportError && (
        <div
          className="mb-6 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl
                        flex items-center justify-between"
        >
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
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <button
          onClick={() => handleExport("pptx")}
          disabled={!!exportingType}
          className="w-full gradient-button text-white font-semibold py-3 px-6 rounded-xl
                     shadow-md shadow-primary/20
                     hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 flex items-center justify-center gap-2"
        >
          {exportingType === "pptx" ? (
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
              PowerPoint
            </>
          )}
        </button>

        <button
          onClick={() => handleExport("pdf")}
          disabled={!!exportingType}
          className="w-full text-secondary font-semibold py-3 px-6 rounded-xl
                     border border-secondary/30 bg-secondary/5
                     hover:bg-secondary/10 hover:border-secondary/50
                     shadow-sm shadow-secondary/10
                     hover:shadow-md hover:-translate-y-0.5 active:translate-y-0
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 flex items-center justify-center gap-2"
        >
          {exportingType === "pdf" ? (
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
              <FileText className="w-5 h-5" />
              PDF Document
            </>
          )}
        </button>
      </motion.div>

      <motion.div
        className="mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
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
          💡 Edit titles and bullet points inline · Click &quot;Regenerate&quot;
          to re-roll a slide · Add instructions for targeted improvements
        </p>
      </motion.div>
    </div>
  );
}
