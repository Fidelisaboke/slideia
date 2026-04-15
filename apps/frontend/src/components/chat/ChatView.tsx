'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { FileAttachment } from '@/types/chat';
import { MessageSquare, Sparkles, ArrowDown } from 'lucide-react';
import { useState } from 'react';

// ── Suggested prompts for the empty state ────────────────────────────

const SUGGESTIONS = [
  'Create a 5-slide deck on AI in Healthcare for medical professionals',
  'Make a presentation about climate change solutions for students',
  'Design a startup pitch deck for a fintech product',
  'Create a training presentation on cybersecurity best practices',
];

// ── Component ────────────────────────────────────────────────────────

export default function ChatView() {
  const { messages, isStreaming, error, sendMessage, clearChat, dismissError } =
    useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // ── Auto-scroll to bottom on new messages ────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    // Only auto-scroll if user is near the bottom
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

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Send handler ─────────────────────────────────────────────────
  const handleSend = useCallback(
    (prompt: string, files?: FileAttachment[]) => {
      sendMessage(prompt, files);
    },
    [sendMessage]
  );

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion);
    },
    [sendMessage]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Slideia Chat</h1>
            <p className="text-[10px] text-muted-foreground">
              AI-powered presentation creator
            </p>
          </div>
        </div>

        {hasMessages && (
          <button
            onClick={clearChat}
            className="text-xs text-muted-foreground hover:text-foreground
                       transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            New chat
          </button>
        )}
      </header>

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
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 mb-6">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              What would you like to present?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md">
              Describe your presentation idea and I&apos;ll help you create a
              professional slide deck. You can also attach files for context.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  disabled={isStreaming}
                  className="text-left text-xs text-muted-foreground p-3 rounded-xl
                             border border-border/60 hover:border-foreground/20
                             hover:bg-muted/50 transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Scroll-to-bottom FAB ────────────────────────────────── */}
      {showScrollButton && (
        <div className="relative">
          <button
            onClick={() => scrollToBottom()}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-10
                       flex items-center gap-1 text-xs text-muted-foreground
                       bg-card border border-border shadow-md rounded-full
                       px-3 py-1.5 hover:bg-muted transition-all duration-200"
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
            <span className="sr-only">Dismiss</span>
            ✕
          </button>
        </div>
      )}

      {/* ── Input area ──────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-2">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
