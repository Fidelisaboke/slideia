/**
 * Type definitions for the chat interface.
 *
 * These are the frontend-only types. The backend SSE stream uses a simple
 * JSON protocol: { token: string } | { done: true } | { error: string }.
 */

/** Unique identifier for messages and conversations. */
export type ChatId = string;

/** A file attached to a user message (client-side only, not serialized to localStorage). */
export interface FileAttachment {
  /** Client-generated unique ID. */
  readonly id: ChatId;
  /** Original file name. */
  readonly name: string;
  /** File size in bytes. */
  readonly size: number;
  /** MIME type. */
  readonly type: string;
  /**
   * The raw File object.  Only present during the current session —
   * not persisted to localStorage.
   */
  readonly file: File;
}

/** Serializable file metadata (what gets saved to localStorage). */
export interface FileAttachmentMeta {
  readonly id: ChatId;
  readonly name: string;
  readonly size: number;
  readonly type: string;
}

/** A single chat message. */
export interface ChatMessage {
  readonly id: ChatId;
  readonly role: 'user' | 'assistant';
  content: string;
  /** File metadata for user messages. */
  readonly attachments?: readonly FileAttachmentMeta[];
  readonly timestamp: number;
  /** True while the assistant is still streaming tokens. */
  isStreaming?: boolean;
}

/** A persisted conversation. */
export interface Conversation {
  readonly id: ChatId;
  title: string;
  messages: ChatMessage[];
  readonly createdAt: number;
  updatedAt: number;
}

/** Discriminated union for SSE events from the backend. */
export type StreamEvent =
  | { readonly token: string }
  | { readonly done: true }
  | { readonly error: string };
