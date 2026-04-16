/**
 * localStorage persistence for chat conversations.
 *
 * Each conversation is stored under its own key to avoid serializing the
 * entire history on every keystroke.  A separate index key tracks the list
 * of conversation IDs for enumeration.
 */

import { Conversation } from "@/types/chat";

const STORAGE_PREFIX = "slideia_chat_";
const INDEX_KEY = "slideia_chat_index";

// ── Helpers ──────────────────────────────────────────────────────────

function getIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setIndex(ids: string[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error("[useChatStorage] Failed to write index:", err);
  }
}

// ── Public API ───────────────────────────────────────────────────────

export function saveConversation(conversation: Conversation): void {
  try {
    const key = `${STORAGE_PREFIX}${conversation.id}`;
    localStorage.setItem(key, JSON.stringify(conversation));

    // Ensure the ID is in the index
    const index = getIndex();
    if (!index.includes(conversation.id)) {
      index.unshift(conversation.id); // newest first
      setIndex(index);
    }
  } catch (err) {
    // localStorage quota exceeded or unavailable
    console.error("[useChatStorage] Failed to save conversation:", err);
  }
}

export function loadConversation(id: string): Conversation | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as Conversation;
  } catch {
    return null;
  }
}

export function listConversations(): Pick<
  Conversation,
  "id" | "title" | "updatedAt"
>[] {
  const index = getIndex();
  const summaries: Pick<Conversation, "id" | "title" | "updatedAt">[] = [];

  for (const id of index) {
    const conv = loadConversation(id);
    if (conv) {
      summaries.push({
        id: conv.id,
        title: conv.title,
        updatedAt: conv.updatedAt,
      });
    }
  }

  return summaries;
}

export function deleteConversation(id: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${id}`);

    const index = getIndex().filter((i) => i !== id);
    setIndex(index);
  } catch (err) {
    console.error("[useChatStorage] Failed to delete conversation:", err);
  }
}
