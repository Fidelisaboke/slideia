"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useChat } from "@/hooks/useChat";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { FileAttachment } from "@/types/chat";
import { Sparkles, ArrowDown } from "lucide-react";
import { fadeInUp, staggerFast, scaleIn } from "@/lib/motion";

// ── Suggested prompts for the empty state ────────────────────────────

const SUGGESTIONS = [
  "Create a 5-slide deck on AI in Healthcare for medical professionals",
  "Make a presentation about climate change solutions for students",
  "Design a startup pitch deck for a fintech product",
  "Create a training presentation on cybersecurity best practices",
];

// ── Component ────────────────────────────────────────────────────────

interface ChatViewProps {
  /** When true, renders in compact embedded mode (no fixed height, minimal header). */
  compact?: boolean;
  /** Called when the user clicks the close button in compact mode. */
  onClose?: () => void;
}

export default function ChatView({ compact = false, onClose }: ChatViewProps) {
  const {
    messages,
    isStreaming,
    agentStatus,
    error,
    sendMessage,
    clearChat,
    dismissError,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // ── Auto-scroll to bottom on new messages ────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      scrollToBottom();
      return;
    }

    const threshold = 150;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom < threshold) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // ── Show "scroll to bottom" button when scrolled up ──────────────
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollButton(distanceFromBottom > 200);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Send handler ─────────────────────────────────────────────────
  const handleSend = useCallback(
    (prompt: string, files?: FileAttachment[]) => {
      sendMessage(prompt, files);
    },
    [sendMessage],
  );

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion);
    },
    [sendMessage],
  );

  const hasMessages = messages.length > 0;

  return (
    <div
      className={`flex flex-col ${compact ? "h-full" : "h-[calc(100vh-2rem)] max-w-4xl mx-auto"}`}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      {compact ? (
        /* Compact header — no logo link or theme toggle */
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7">
              <Logo className="w-full h-full" />
            </div>
            <span className="text-sm font-semibold font-(family-name:--font-sora)">
              <span className="gradient-text">Slide</span>
              <span className="text-foreground">ia</span>
              <span className="text-muted-foreground text-[10px] font-normal ml-1">
                Chat
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {hasMessages && (
              <button
                onClick={clearChat}
                className="text-xs text-muted-foreground hover:text-primary
                           transition-colors px-2.5 py-1 rounded-lg hover:bg-primary/10"
              >
                New chat
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close chat"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                           hover:bg-muted/50 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </header>
      ) : (
        /* Full-page header — logo link + theme toggle */
        <header className="flex items-center justify-between px-4 py-3 border-b border-border glass-panel rounded-b-xl">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 group-hover:-translate-y-0.5 transition-transform duration-300">
              <Logo className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-(family-name:--font-sora) tracking-tight">
                <span className="gradient-text">Slide</span>
                <span className="text-foreground font-semibold">ia</span>
                <span className="text-muted-foreground text-[10px] font-normal ml-1.5">
                  Chat
                </span>
              </h1>
              <p className="text-[10px] text-muted-foreground">
                AI-powered presentation creator
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {hasMessages && (
              <button
                onClick={clearChat}
                className="text-xs text-muted-foreground hover:text-primary
                           transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10"
              >
                New chat
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>
      )}

      {/* ── Messages area ───────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 chat-scrollbar"
      >
        {hasMessages ? (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          /* ── Empty state ──────────────────────────────────────── */
          <motion.div
            className="flex flex-col items-center justify-center h-full text-center px-4"
            initial="hidden"
            animate="show"
            variants={fadeInUp}
          >
            <div
              className="flex items-center justify-center w-16 h-16 rounded-2xl
                            bg-primary/10 mb-6 glow-border"
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-(family-name:--font-sora) text-foreground mb-2">
              What would you like to present?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md">
              Describe your presentation idea and I&apos;ll help you create a
              professional slide deck. You can also attach files for context.
            </p>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg"
              variants={staggerFast}
              initial="hidden"
              animate="show"
            >
              {SUGGESTIONS.map((suggestion) => (
                <motion.button
                  key={suggestion}
                  variants={scaleIn}
                  onClick={() => handleSuggestion(suggestion)}
                  disabled={isStreaming}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="text-left text-xs text-muted-foreground p-3 rounded-xl
                             border border-border hover:border-primary/30
                             hover:bg-primary/5 transition-colors duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* ── Scroll-to-bottom FAB ────────────────────────────────── */}
      {showScrollButton && (
        <div className="relative">
          <button
            onClick={() => scrollToBottom()}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-10
                       flex items-center gap-1 text-xs text-muted-foreground
                       glass-panel shadow-md rounded-full
                       px-3 py-1.5 hover:bg-primary/10 transition-all duration-200"
          >
            <ArrowDown className="w-3 h-3" />
            New messages
          </button>
        </div>
      )}

      {/* ── Error banner ────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
          <p className="text-xs text-destructive">{error}</p>
          <button
            onClick={dismissError}
            className="text-destructive/60 hover:text-destructive ml-2"
          >
            <span className="sr-only">Dismiss</span>✕
          </button>
        </div>
      )}

      {/* ── Agent Status indicator ──────────────────────────────── */}
      {isStreaming && agentStatus && (
        <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-primary">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="font-medium animate-pulse">{agentStatus}</span>
        </div>
      )}

      {/* ── Input area ──────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-2">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
