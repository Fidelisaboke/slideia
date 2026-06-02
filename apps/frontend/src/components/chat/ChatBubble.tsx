"use client";

/**
 * ChatBubble — floating chat FAB + expandable panel.
 *
 * The panel is mounted via ReactDOM.createPortal directly into document.body.
 * This guarantees `position: fixed` always resolves relative to the viewport,
 * regardless of transforms, filters, or stacking contexts in ancestor elements
 * (a common issue with Framer Motion animated wrappers and next-themes).
 *
 * Layout:
 *   [panel]  ← fixed bottom-24 right-6 — sits right above the FAB
 *   [FAB]    ← fixed bottom-6  right-6
 *
 * Hidden on mobile (<640px) and while deck generation is in progress.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import ChatView from "@/components/chat/ChatView";

interface ChatBubbleProps {
  /** When true (deck generation in progress) the FAB is hidden entirely. */
  isGenerating?: boolean;
}

export default function ChatBubble({ isGenerating = false }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  // Portal requires the DOM to be available — guard against SSR.
  const [mounted, setMounted] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setHasUnread(false);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  // ── Close on Escape ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  // ── Close on click-outside (exclude panel + FAB) ─────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handlePointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        fabRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };
    document.addEventListener("pointerdown", handlePointer, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointer, true);
  }, [isOpen, close]);

  // Hidden on mobile + during generation
  if (!mounted || isGenerating) return null;

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          key="chat-panel"
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          // Standard FAB pattern: panel sits directly above the button
          className="fixed bottom-24 right-6 z-[9999]
                     hidden sm:flex flex-col
                     w-[400px] h-[560px]
                     overflow-hidden rounded-2xl
                     border border-border/60
                     shadow-2xl shadow-primary/10"
          style={{ transformOrigin: "bottom right" }}
        >
          {/* Glass background rendered inside the portal so it's unaffected by
              ancestor backdrop-filter contexts */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl rounded-2xl" />
          <div className="relative z-10 flex flex-col h-full">
            <ChatView compact onClose={close} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const fab = (
    <motion.button
      ref={fabRef}
      id="chat-bubble-fab"
      aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      aria-expanded={isOpen}
      onClick={isOpen ? close : open}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="fixed bottom-6 right-6 z-[9999]
                 hidden sm:flex items-center justify-center
                 w-14 h-14 rounded-full
                 gradient-button
                 shadow-lg shadow-primary/30 text-white
                 hover:shadow-xl hover:shadow-primary/40
                 transition-shadow duration-200
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.svg
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </motion.svg>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            <MessageCircle className="w-6 h-6" />
            {hasUnread && (
              <span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full
                               bg-secondary border-2 border-background animate-pulse"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );

  // Both the panel and FAB are portaled to document.body so that
  // position:fixed is always relative to the viewport.
  return createPortal(
    <>
      {panel}
      {fab}
    </>,
    document.body,
  );
}
