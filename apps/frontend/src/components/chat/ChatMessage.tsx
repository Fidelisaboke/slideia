'use client';

import { useCallback, useState, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { FileText, Copy, Check } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────

interface ChatMessageProps {
  message: ChatMessageType;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Code block with copy button ──────────────────────────────────────

function CodeBlock({
  children,
  className,
}: ComponentPropsWithoutRef<'code'>) {
  const [copied, setCopied] = useState(false);

  // Detect fenced code block: parent is <pre>, content is a string
  const isBlock =
    typeof children === 'string' ||
    (Array.isArray(children) && children.every((c) => typeof c === 'string'));

  const language = className?.replace('language-', '') || '';
  const codeText = Array.isArray(children) ? children.join('') : String(children ?? '');

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeText.replace(/\n$/, '')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [codeText]);

  if (!isBlock) {
    // Inline code
    return (
      <code className="bg-muted/70 text-foreground px-1.5 py-0.5 rounded text-[13px] font-mono">
        {children}
      </code>
    );
  }

  // Fenced code block
  return (
    <div className="relative group my-3">
      {/* Language badge + copy button */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border border-border rounded-t-lg text-[10px] text-muted-foreground">
        <span className="font-mono uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto bg-muted/30 border border-t-0 border-border rounded-b-lg p-3 text-[13px] leading-relaxed">
        <code className={`font-mono ${className || ''}`}>{children}</code>
      </pre>
    </div>
  );
}

// ── Markdown renderer ────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mt-3.5 mb-1.5 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mt-3 mb-1 first:mt-0">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold mt-2.5 mb-1 first:mt-0">{children}</h4>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-0.5 ml-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-0.5 ml-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),

        // Code — delegates to CodeBlock for both inline and fenced
        code: CodeBlock,

        // Pre — passthrough (CodeBlock handles layout)
        pre: ({ children }) => <>{children}</>,

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-500 transition-colors"
          >
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 border-blue-500/40 pl-3 my-2 text-muted-foreground italic">
            {children}
          </blockquote>
        ),

        // Horizontal rule
        hr: () => <hr className="my-3 border-border/60" />,

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 rounded-lg border border-border">
            <table className="min-w-full text-[13px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-1.5 text-left font-semibold border-b border-border">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5 border-b border-border/50">{children}</td>
        ),

        // Strong / emphasis
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Main component ───────────────────────────────────────────────────

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3
          ${
            isUser
              ? 'gradient-button text-white rounded-br-md shadow-md shadow-primary/20'
              : 'glass-panel glow-border text-card-foreground rounded-bl-md'
          }
        `}
      >
        {/* File attachments (user messages only) */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.attachments.map((file) => (
              <span
                key={file.id}
                className="inline-flex items-center gap-1 text-xs bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1"
              >
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{file.name}</span>
                <span className="opacity-70">({formatFileSize(file.size)})</span>
              </span>
            ))}
          </div>
        )}

        {/* Message content */}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="text-sm break-words chat-markdown">
            <MarkdownContent content={message.content} />
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-blink align-text-bottom rounded-sm" />
            )}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-[10px] mt-1.5 ${
            isUser ? 'text-white/60' : 'text-muted-foreground'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

