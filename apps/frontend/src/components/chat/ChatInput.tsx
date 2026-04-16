"use client";

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { FileAttachment } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, X, FileText } from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// ── Props ────────────────────────────────────────────────────────────

interface ChatInputProps {
  onSend: (prompt: string, files?: FileAttachment[]) => void;
  disabled?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ────────────────────────────────────────────────────────

export default function ChatInput({
  onSend,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auto-resize textarea ─────────────────────────────────────────
  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  // ── File validation & addition ───────────────────────────────────
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setFileError(null);
      const incoming = Array.from(newFiles);
      const combined = [...files];

      for (const file of incoming) {
        if (combined.length >= MAX_FILES) {
          setFileError(`Maximum ${MAX_FILES} files allowed.`);
          break;
        }
        if (!ALLOWED_TYPES.has(file.type)) {
          setFileError(`"${file.name}" has an unsupported file type.`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setFileError(`"${file.name}" exceeds the 5 MB limit.`);
          continue;
        }
        // Prevent duplicates by name+size
        if (
          combined.some((f) => f.name === file.name && f.size === file.size)
        ) {
          continue;
        }
        combined.push({
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
        });
      }

      setFiles(combined);
    },
    [files],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setFileError(null);
  }, []);

  // ── Drag & drop ──────────────────────────────────────────────────
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed, files.length > 0 ? files : undefined);
    setInput("");
    setFiles([]);
    setFileError(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, files, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <div className="w-full">
      {/* File pills */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {files.map((file) => (
            <span
              key={file.id}
              className="inline-flex items-center gap-1.5 text-xs bg-muted text-muted-foreground rounded-full px-3 py-1.5 border border-border"
            >
              <FileText className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <span className="opacity-60">({formatFileSize(file.size)})</span>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* File error */}
      {fileError && (
        <p className="text-xs text-destructive mb-2 px-1">{fileError}</p>
      )}

      {/* Input area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-lg
          transition-all duration-200
          ${
            isDragging
              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
              : "border-border hover:border-primary/20"
          }
        `}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/5 backdrop-blur-[1px] z-10 pointer-events-none">
            <p className="text-sm font-medium text-primary">Drop files here</p>
          </div>
        )}

        {/* Attach button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach files"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".txt,.md,.csv,.json,.pdf,.docx"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Describe the presentation you want to create…"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed
                     placeholder:text-muted-foreground/60 focus:outline-none
                     max-h-[200px] py-2 px-1 disabled:opacity-50"
        />

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          className={`
            shrink-0 h-9 w-9 rounded-xl transition-all duration-200
            ${
              canSend
                ? "gradient-button text-white shadow-md shadow-primary/20 hover:shadow-lg hover:scale-105"
                : "bg-muted text-muted-foreground"
            }
          `}
          onClick={handleSubmit}
          disabled={!canSend}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
        Enter to send · Shift+Enter for new line · Drag & drop files
      </p>
    </div>
  );
}
