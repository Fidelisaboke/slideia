"use client";

/**
 * Core chat hook — manages messages, SSE streaming, and localStorage sync.
 *
 * This is the single source of truth for the chat page's state.  It owns:
 *   - The message list (with optimistic user messages)
 *   - The streaming lifecycle (abort, error, completion)
 *   - Automatic persistence via useChatStorage helpers
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { saveConversation, loadConversation } from "@/hooks/useChatStorage";
import {
  ChatMessage,
  Conversation,
  FileAttachment,
  FileAttachmentMeta,
  StreamEvent,
} from "@/types/chat";

// ── Constants ────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Hook ─────────────────────────────────────────────────────────────

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  conversationId: string;
  sendMessage: (prompt: string, files?: FileAttachment[]) => Promise<void>;
  clearChat: () => void;
  dismissError: () => void;
}

export function useChat(initialConversationId?: string): UseChatReturn {
  const [conversationId] = useState<string>(
    () => initialConversationId || generateId(),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── Restore from localStorage on mount ───────────────────────────
  useEffect(() => {
    const saved = loadConversation(conversationId);
    if (saved && saved.messages.length > 0) {
      setMessages(saved.messages);
    }
  }, [conversationId]);

  // ── Persist to localStorage on every message change ──────────────
  useEffect(() => {
    if (messages.length === 0) return;

    const conversation: Conversation = {
      id: conversationId,
      title: messages[0]?.content.slice(0, 60) || "New Chat",
      messages,
      createdAt: messages[0]?.timestamp || Date.now(),
      updatedAt: Date.now(),
    };
    saveConversation(conversation);
  }, [messages, conversationId]);

  // ── Abort on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Send a message ───────────────────────────────────────────────
  const sendMessage = useCallback(
    async (prompt: string, files?: FileAttachment[]) => {
      if (!prompt.trim() || isStreaming) return;

      setError(null);

      // 1. Build the optimistic user message
      const fileMeta: FileAttachmentMeta[] = (files || []).map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
      }));

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: prompt,
        attachments: fileMeta.length > 0 ? fileMeta : undefined,
        timestamp: Date.now(),
      };

      // 2. Create the placeholder assistant message
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      // 3. Build the FormData payload
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payload = JSON.stringify({
        prompt,
        conversation_history: conversationHistory,
      });

      const formData = new FormData();
      formData.append("payload", payload);
      for (const file of files || []) {
        formData.append("files", file.file);
      }

      // 4. Stream the response
      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          throw new Error(
            `Server error (${response.status}): ${errorBody || response.statusText}`,
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n");
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const dataStr = trimmed.slice(6);

            let event: StreamEvent;
            try {
              event = JSON.parse(dataStr);
            } catch {
              continue;
            }

            if ("token" in event) {
              // Append token to the assistant message
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant" && last.isStreaming) {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + event.token,
                  };
                }
                return updated;
              });
            } else if ("error" in event) {
              setError(event.error);
            } else if ("done" in event) {
              // Mark streaming complete
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    isStreaming: false,
                  };
                }
                return updated;
              });
            }
          }
        }

        // In case the stream ended without a [DONE] event
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant" && last.isStreaming) {
            updated[updated.length - 1] = { ...last, isStreaming: false };
          }
          return updated;
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User navigated away or explicitly cancelled — not an error
          return;
        }

        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);

        // Mark assistant message as failed
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant" && last.isStreaming) {
            updated[updated.length - 1] = {
              ...last,
              content: last.content || "Failed to get a response.",
              isStreaming: false,
            };
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, messages],
  );

  // ── Clear the chat ───────────────────────────────────────────────
  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    messages,
    isStreaming,
    error,
    conversationId,
    sendMessage,
    clearChat,
    dismissError,
  };
}
