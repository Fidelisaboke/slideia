'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  StickyNote,
  Image as ImageIcon,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────

interface EditableSlideData {
  title: string;
  summary: string;
  bullets: string[];
  notes: string;
  image_prompt: string;
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
  const [instruction, setInstruction] = useState('');
  const [expanded, setExpanded] = useState(true);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleTitleChange = useCallback(
    (value: string) => {
      onUpdate(index, { title: value });
    },
    [index, onUpdate]
  );

  const handleBulletChange = useCallback(
    (bulletIdx: number, value: string) => {
      const updated = [...data.bullets];
      updated[bulletIdx] = value;
      onUpdate(index, { bullets: updated });
    },
    [index, data.bullets, onUpdate]
  );

  const handleAddBullet = useCallback(() => {
    onUpdate(index, { bullets: [...data.bullets, ''] });
  }, [index, data.bullets, onUpdate]);

  const handleRemoveBullet = useCallback(
    (bulletIdx: number) => {
      const updated = data.bullets.filter((_, i) => i !== bulletIdx);
      onUpdate(index, { bullets: updated });
    },
    [index, data.bullets, onUpdate]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      onUpdate(index, { notes: value });
    },
    [index, onUpdate]
  );

  const handleRegenerate = useCallback(() => {
    const trimmed = instruction.trim();
    onRegenerate(index, trimmed || undefined);
    setInstruction('');
    setShowInstruction(false);
  }, [index, instruction, onRegenerate]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`
        glass-panel glow-border rounded-2xl overflow-hidden
        transition-all duration-300
        ${isRegenerating ? 'opacity-60 pointer-events-none' : ''}
      `}
    >
      {/* ── Slide Header ──────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 pb-0">
        {/* Slide number badge */}
        <div className="shrink-0 w-10 h-10 rounded-xl gradient-button
                        flex items-center justify-center font-bold text-white text-sm shadow-md">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Editable title */}
          <input
            type="text"
            value={data.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-lg font-bold font-(family-name:--font-sora) text-foreground
                       bg-transparent border-b border-transparent
                       hover:border-border focus:border-primary focus:outline-none
                       transition-colors duration-200 pb-0.5"
            placeholder="Slide title..."
          />
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
          aria-label={expanded ? 'Collapse slide' : 'Expand slide'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Collapsible Body ──────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-3 space-y-4">
              {/* ── Bullet Points ─────────────────────────────────── */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  Key Points
                </h4>
                <div className="space-y-2">
                  {data.bullets.map((bullet, bulletIdx) => (
                    <div key={bulletIdx} className="flex items-center gap-2 group">
                      <span className="text-primary text-sm shrink-0">▪</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => handleBulletChange(bulletIdx, e.target.value)}
                        className="flex-1 text-sm text-foreground bg-transparent
                                   border-b border-transparent hover:border-border
                                   focus:border-primary focus:outline-none
                                   transition-colors duration-200 py-0.5"
                        placeholder="Bullet point..."
                      />
                      {data.bullets.length > 1 && (
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

              {/* ── Speaker Notes ─────────────────────────────────── */}
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
                    {showInstruction ? 'Hide instructions' : 'Add instructions'}
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
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    {isRegenerating ? 'Regenerating…' : 'Regenerate'}
                  </button>
                </div>

                {/* Instruction input */}
                <AnimatePresence>
                  {showInstruction && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRegenerate();
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
