"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  StickyNote,
  Image as ImageIcon,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

interface EditableSlideData {
  title: string;
  summary: string;
  bullets: string[];
  notes: string;
  image_prompt: string;
  layout?:
    | "bullets"
    | "statement"
    | "big_number"
    | "two_column"
    | "steps"
    | "quote";
  statement?: string;
  big_number?: string;
  big_number_context?: string;
  column_left_title?: string;
  column_left?: string[];
  column_right_title?: string;
  column_right?: string[];
  steps?: string[];
  quote_text?: string;
  quote_attribution?: string;
}

interface EditableSlideProps {
  index: number;
  data: EditableSlideData;
  isRegenerating: boolean;
  onUpdate: (index: number, updated: Partial<EditableSlideData>) => void;
  onRegenerate: (index: number, instruction?: string) => void;
}

// ── Component ────────────────────────────────────────────────────────

export default function EditableSlide({
  index,
  data,
  isRegenerating,
  onUpdate,
  onRegenerate,
}: EditableSlideProps) {
  const [showInstruction, setShowInstruction] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [expanded, setExpanded] = useState(true);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleTitleChange = useCallback(
    (value: string) => {
      onUpdate(index, { title: value });
    },
    [index, onUpdate],
  );

  const handleBulletChange = useCallback(
    (bulletIdx: number, value: string) => {
      const updated = [...(data.bullets || [])];
      updated[bulletIdx] = value;
      onUpdate(index, { bullets: updated });
    },
    [index, data.bullets, onUpdate],
  );

  const handleAddBullet = useCallback(() => {
    onUpdate(index, { bullets: [...(data.bullets || []), ""] });
  }, [index, data.bullets, onUpdate]);

  const handleRemoveBullet = useCallback(
    (bulletIdx: number) => {
      const updated = (data.bullets || []).filter((_, i) => i !== bulletIdx);
      onUpdate(index, { bullets: updated });
    },
    [index, data.bullets, onUpdate],
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      onUpdate(index, { notes: value });
    },
    [index, onUpdate],
  );

  const handleRegenerate = useCallback(() => {
    const trimmed = instruction.trim();
    onRegenerate(index, trimmed || undefined);
    setInstruction("");
    setShowInstruction(false);
  }, [index, instruction, onRegenerate]);

  const layout = data.layout || "bullets";

  const renderLayoutBadge = () => {
    switch (layout) {
      case "statement":
        return (
          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            Statement
          </span>
        );
      case "big_number":
        return (
          <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            Data Highlight
          </span>
        );
      case "two_column":
        return (
          <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            Comparison
          </span>
        );
      case "steps":
        return (
          <span className="text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            Steps
          </span>
        );
      case "quote":
        return (
          <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            Quote
          </span>
        );
      case "bullets":
      default:
        return (
          <span className="text-[10px] font-semibold bg-primary/10 text-primary-light border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            Standard
          </span>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`
        glass-panel glow-border rounded-2xl overflow-hidden
        transition-all duration-300
        ${isRegenerating ? "opacity-60 pointer-events-none" : ""}
      `}
    >
      {/* ── Slide Header ──────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 pb-0">
        {/* Slide number badge */}
        <div
          className="shrink-0 w-10 h-10 rounded-xl gradient-button
                        flex items-center justify-center font-bold text-white text-sm shadow-md"
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            {/* Editable title */}
            <input
              type="text"
              value={data.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="flex-1 text-lg font-bold font-(family-name:--font-sora) text-foreground
                         bg-transparent border-b border-transparent
                         hover:border-border focus:border-primary focus:outline-none
                         transition-colors duration-200 pb-0.5 min-w-0"
              placeholder="Slide title..."
            />
            {renderLayoutBadge()}
          </div>
          {/* Summary (read-only context) */}
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {data.summary}
          </p>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                     hover:bg-primary/10 transition-colors"
          aria-label={expanded ? "Collapse slide" : "Expand slide"}
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Collapsible Body ──────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-3 space-y-4">
              {/* ── Layout-Specific Inputs ─────────────────────────── */}
              {layout === "bullets" && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Key Points
                  </h4>
                  <div className="space-y-2">
                    {(data.bullets || []).map((bullet, bulletIdx) => (
                      <div
                        key={bulletIdx}
                        className="flex items-center gap-2 group"
                      >
                        <span className="text-primary text-sm shrink-0">▪</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) =>
                            handleBulletChange(bulletIdx, e.target.value)
                          }
                          className="flex-1 text-sm text-foreground bg-transparent
                                     border-b border-transparent hover:border-border
                                     focus:border-primary focus:outline-none
                                     transition-colors duration-200 py-0.5"
                          placeholder="Bullet point..."
                        />
                        {(data.bullets || []).length > 1 && (
                          <button
                            onClick={() => handleRemoveBullet(bulletIdx)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md
                                       text-destructive/60 hover:text-destructive hover:bg-destructive/10
                                       transition-all duration-200"
                            aria-label="Remove bullet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddBullet}
                    className="mt-2 flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary
                               transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add bullet
                  </button>
                </div>
              )}

              {layout === "statement" && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Statement / Takeaway
                  </h4>
                  <textarea
                    value={data.statement || ""}
                    onChange={(e) =>
                      onUpdate(index, { statement: e.target.value })
                    }
                    rows={2}
                    className="w-full text-sm font-medium italic text-foreground bg-background-subtle/50
                               border border-border rounded-lg p-2.5
                               focus:ring-1 focus:ring-primary/40 focus:border-primary/50
                               resize-none outline-none transition-all duration-200
                               placeholder:text-muted-foreground/50"
                    placeholder="A single bold statement or key takeaway..."
                  />
                </div>
              )}

              {layout === "big_number" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      Statistic / Number
                    </h4>
                    <input
                      type="text"
                      value={data.big_number || ""}
                      onChange={(e) =>
                        onUpdate(index, { big_number: e.target.value })
                      }
                      className="w-full text-lg font-bold text-primary bg-background-subtle/50
                                 border border-border rounded-lg px-3 py-2
                                 focus:ring-1 focus:ring-primary/40 focus:border-primary/50
                                 outline-none transition-all duration-200"
                      placeholder="e.g., 73%"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      Context Description
                    </h4>
                    <input
                      type="text"
                      value={data.big_number_context || ""}
                      onChange={(e) =>
                        onUpdate(index, { big_number_context: e.target.value })
                      }
                      className="w-full text-sm text-foreground bg-background-subtle/50
                                 border border-border rounded-lg px-3 py-2.5
                                 focus:ring-1 focus:ring-primary/40 focus:border-primary/50
                                 outline-none transition-all duration-200"
                      placeholder="e.g., of remote employees report burnout"
                    />
                  </div>
                </div>
              )}

              {layout === "two_column" && (
                <div className="grid grid-cols-2 gap-3">
                  {(["left", "right"] as const).map((side) => {
                    const titleKey =
                      side === "left"
                        ? "column_left_title"
                        : "column_right_title";
                    const itemsKey =
                      side === "left" ? "column_left" : "column_right";
                    const items: string[] = data[itemsKey] ?? [];
                    return (
                      <div key={side}>
                        <input
                          type="text"
                          value={data[titleKey] ?? ""}
                          onChange={(e) =>
                            onUpdate(index, { [titleKey]: e.target.value })
                          }
                          className="w-full text-xs font-semibold text-primary bg-transparent
                                     border-b border-border mb-2 pb-0.5
                                     focus:border-primary focus:outline-none transition-colors"
                          placeholder={
                            side === "left"
                              ? "Left column title"
                              : "Right column title"
                          }
                        />
                        <div className="space-y-1.5">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 group"
                            >
                              <span className="text-primary/50 text-sm shrink-0">
                                ▪
                              </span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx] = e.target.value;
                                  onUpdate(index, { [itemsKey]: updated });
                                }}
                                className="flex-1 text-sm text-foreground bg-transparent
                                           border-b border-transparent hover:border-border
                                           focus:border-primary focus:outline-none
                                           transition-colors duration-200 py-0.5"
                                placeholder="Point..."
                              />
                              {items.length > 1 && (
                                <button
                                  onClick={() =>
                                    onUpdate(index, {
                                      [itemsKey]: items.filter(
                                        (_, i) => i !== idx,
                                      ),
                                    })
                                  }
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md
                                             text-destructive/60 hover:text-destructive
                                             hover:bg-destructive/10 transition-all duration-200"
                                  aria-label="Remove point"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() =>
                            onUpdate(index, { [itemsKey]: [...items, ""] })
                          }
                          className="mt-1.5 flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add point
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {layout === "steps" && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Steps
                  </h4>
                  <div className="space-y-2">
                    {(data.steps ?? []).map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <span
                          className="shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400
                                         text-[10px] font-bold flex items-center justify-center"
                        >
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => {
                            const updated = [...(data.steps ?? [])];
                            updated[idx] = e.target.value;
                            onUpdate(index, { steps: updated });
                          }}
                          className="flex-1 text-sm text-foreground bg-transparent
                                     border-b border-transparent hover:border-border
                                     focus:border-primary focus:outline-none
                                     transition-colors duration-200 py-0.5"
                          placeholder={`Step ${idx + 1}...`}
                        />
                        {(data.steps ?? []).length > 1 && (
                          <button
                            onClick={() =>
                              onUpdate(index, {
                                steps: (data.steps ?? []).filter(
                                  (_, i) => i !== idx,
                                ),
                              })
                            }
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md
                                       text-destructive/60 hover:text-destructive
                                       hover:bg-destructive/10 transition-all duration-200"
                            aria-label="Remove step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      onUpdate(index, { steps: [...(data.steps ?? []), ""] })
                    }
                    className="mt-2 flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add step
                  </button>
                </div>
              )}

              {layout === "quote" && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      Quote
                    </h4>
                    <textarea
                      value={data.quote_text || ""}
                      onChange={(e) =>
                        onUpdate(index, { quote_text: e.target.value })
                      }
                      rows={3}
                      className="w-full text-sm italic text-foreground bg-background-subtle/50
                                 border border-border rounded-lg p-2.5
                                 focus:ring-1 focus:ring-primary/40 focus:border-primary/50
                                 resize-none outline-none transition-all duration-200
                                 placeholder:text-muted-foreground/50"
                      placeholder='"The quote text here..."'
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      Attribution
                    </h4>
                    <input
                      type="text"
                      value={data.quote_attribution || ""}
                      onChange={(e) =>
                        onUpdate(index, { quote_attribution: e.target.value })
                      }
                      className="w-full text-sm text-muted-foreground bg-background-subtle/50
                                 border border-border rounded-lg px-3 py-2
                                 focus:ring-1 focus:ring-primary/40 focus:border-primary/50
                                 outline-none transition-all duration-200"
                      placeholder="— Author Name, Title"
                    />
                  </div>
                </div>
              )}
              {data.notes !== undefined && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" />
                    Speaker Notes
                  </h4>
                  <textarea
                    value={data.notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    rows={2}
                    className="w-full text-xs text-foreground bg-background-subtle/50
                               border border-border rounded-lg p-2.5
                               focus:ring-1 focus:ring-primary/40 focus:border-primary/50
                               resize-none outline-none transition-all duration-200
                               placeholder:text-muted-foreground/50"
                    placeholder="Add speaker notes..."
                  />
                </div>
              )}

              {/* ── Image Prompt (read-only) ──────────────────────── */}
              {data.image_prompt && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground/70">
                  <ImageIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="italic">{data.image_prompt}</span>
                </div>
              )}

              {/* ── Regenerate Controls ───────────────────────────── */}
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowInstruction(!showInstruction)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground
                               hover:text-primary transition-colors px-2 py-1 rounded-lg
                               hover:bg-primary/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {showInstruction ? "Hide instructions" : "Add instructions"}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex items-center gap-1.5 text-xs gradient-button text-white
                               px-3 py-1.5 rounded-lg shadow-sm shadow-primary/20
                               hover:shadow-md hover:-translate-y-0.5
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-200"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`}
                    />
                    {isRegenerating ? "Regenerating…" : "Regenerate"}
                  </button>
                </div>

                {/* Instruction input */}
                <AnimatePresence>
                  {showInstruction && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRegenerate();
                        }}
                        placeholder="e.g., Make this more technical, add statistics..."
                        className="mt-2 w-full text-xs text-foreground bg-background-subtle/50
                                   border border-border rounded-lg px-3 py-2
                                   focus:ring-1 focus:ring-primary/40 focus:border-primary/50
                                   outline-none transition-all duration-200
                                   placeholder:text-muted-foreground/50"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
