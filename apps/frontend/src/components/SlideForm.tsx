"use client";

import { useState, useRef, DragEvent } from "react";
import ThemeSelector from "@/components/ThemeSelector";
import { ThemePreset } from "@/types/api";
import {
  Paperclip,
  X,
  FileText,
  Upload,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SlideFormProps {
  onSubmit: (data: {
    topic: string;
    audience: string;
    tone: string;
    slideCount: number;
    themePreset: ThemePreset;
    files?: File[];
  }) => void;
  isLoading: boolean;
}

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SlideForm({ onSubmit, isLoading }: SlideFormProps) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [slideCount, setSlideCount] = useState(5);
  const [themePreset, setThemePreset] = useState<ThemePreset>("Purple Mint");

  // File Upload State
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
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
      if (combined.some((f) => f.name === file.name && f.size === file.size)) {
        continue;
      }
      combined.push(file);
    }
    setFiles(combined);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (topic.trim() && audience.trim()) {
      onSubmit({ topic, audience, tone, slideCount, themePreset, files });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 glass-panel glow-border rounded-2xl">
      <h2 className="text-2xl font-bold mb-6 font-(family-name:--font-sora) text-foreground">
        Create Your Presentation
      </h2>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Topic */}
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Presentation Topic *
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Climate Change Solutions"
            className="w-full px-4 py-2.5 bg-background-subtle border border-border rounded-lg
                       text-foreground placeholder:text-muted-foreground/60
                       focus:ring-2 focus:ring-primary/40 focus:border-primary/50
                       outline-none transition-all duration-200"
            disabled={isLoading}
            required
          />
        </div>

        {/* Audience */}
        <div>
          <label
            htmlFor="audience"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Target Audience *
          </label>
          <input
            id="audience"
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., Business executives, Students, General public"
            className="w-full px-4 py-2.5 bg-background-subtle border border-border rounded-lg
                       text-foreground placeholder:text-muted-foreground/60
                       focus:ring-2 focus:ring-primary/40 focus:border-primary/50
                       outline-none transition-all duration-200"
            disabled={isLoading}
            required
          />
        </div>

        {/* Tone + Slide Count row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="tone"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Presentation Tone
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2.5 bg-background-subtle border border-border rounded-lg
                         text-foreground
                         focus:ring-2 focus:ring-primary/40 focus:border-primary/50
                         outline-none transition-all duration-200"
              disabled={isLoading}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="academic">Academic</option>
              <option value="persuasive">Persuasive</option>
              <option value="informative">Informative</option>
              <option value="inspirational">Inspirational</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="slideCount"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Slides:{" "}
              <span className="text-primary font-semibold">{slideCount}</span>
            </label>
            <input
              id="slideCount"
              type="range"
              min="3"
              max="20"
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full h-2 mt-3 bg-background-subtle rounded-lg appearance-none cursor-pointer accent-primary"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>3</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="pt-1">
          <ThemeSelector
            value={themePreset}
            onChange={setThemePreset}
            disabled={isLoading}
          />
        </div>

        {/* File Upload Accordion */}
        <div className="border border-border/60 rounded-lg overflow-hidden bg-background-subtle">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
            disabled={isLoading}
          >
            <span className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-primary" />
              Upload Reference Documents (Optional)
              {files.length > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">
                  {files.length}
                </span>
              )}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {isOpen && (
            <div className="p-4 pt-0 border-t border-border/40 space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files.length > 0) {
                    addFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-all duration-200 flex flex-col items-center justify-center gap-2
                  ${
                    isDragging
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-muted/10"
                  }
                  ${isLoading ? "opacity-50 pointer-events-none" : ""}
                `}
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Drag and drop files here, or{" "}
                  <span className="text-primary hover:underline">browse</span>
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Accepted formats: .txt, .md, .csv, .json, .pdf, .docx (Max 5
                  files, 5 MB each)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".txt,.md,.csv,.json,.pdf,.docx"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
                disabled={isLoading}
              />

              {fileError && (
                <p className="text-xs text-destructive">{fileError}</p>
              )}

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {files.map((file, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs bg-background border border-border rounded-full px-3 py-1.5 text-foreground animate-in fade-in zoom-in duration-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({formatFileSize(file.size)})
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="p-0.5 rounded-full hover:bg-border transition-colors text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !topic.trim() || !audience.trim()}
          className="w-full gradient-button hover:shadow-lg hover:shadow-primary/20
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold py-3 px-6 rounded-lg
                     transition-all duration-200
                     hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-3"
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
              Processing...
            </span>
          ) : (
            "Generate Outline"
          )}
        </button>
      </form>
    </div>
  );
}
