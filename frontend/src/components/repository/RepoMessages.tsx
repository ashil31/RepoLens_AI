"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, RefreshCw, Share2, FileCode2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageRole = "user" | "assistant";

export interface ChatSourceRef {
  file: string;
  startLine: number;
  endLine: number;
  symbolName?: string;
  contentSnippet?: string;
}

export type ChatStepStatus = "pending" | "active" | "done";

export interface ChatStep {
  name: string;
  status: ChatStepStatus;
  duration?: number;
}

export interface ChatMetrics {
  filesExplored: number;
  searches: number;
  chunksRetrieved: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  files?: string[];
  sources?: ChatSourceRef[];
  steps?: ChatStep[];
  metrics?: ChatMetrics;
  status?: "streaming" | "done" | "error";
  errorMessage?: string;
}

type RepoMessagesProps = {
  messages: ChatMessage[];
  onFileClick?: (path: string, startLine?: number) => void;
  onCopy?: (text: string) => void;
  onShare?: (text: string) => void;
  onRegenerate?: (messageId: string) => void;
  className?: string;
};

// File path regex: matches paths like src/auth.ts, file.ts:23, file.ts:10-40
const FILE_PATH_REGEX =
  /([a-zA-Z0-9_/.-]+\.(ts|js|tsx|jsx|py|go|java|json|css|html|md|yml|yaml|mjs|cjs|vue|svelte))(:\d+(-\d+)?)?|(?:^|[\s(])([a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+(?:\.[a-zA-Z0-9]+)?)(?=[\s),]|$)/g;

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function renderTextWithFileLinks(
  text: string,
  onFileClick?: (path: string, startLine?: number) => void
): React.ReactNode {
  if (!onFileClick) return text;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(FILE_PATH_REGEX.source, "g");
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const before = text.slice(lastIndex, m.index);
    let path: string;
    let startLine: number | undefined;

    // Match file.ts:23 or file.ts:10-40 (group 1) or path without line (group 5)
    if (m[1]) {
      path = m[1];
      if (m[3]) {
        const linePart = m[3].slice(1); // remove leading :
        const dashIdx = linePart.indexOf("-");
        startLine = dashIdx >= 0 ? parseInt(linePart.slice(0, dashIdx), 10) : parseInt(linePart, 10);
      }
    } else if (m[5]) {
      path = m[5].trim();
    } else {
      continue;
    }

    if (before) parts.push(before);
    parts.push(
      <button
        key={`${m.index}-${path}-${startLine ?? ""}`}
        type="button"
        onClick={() => onFileClick(path, startLine)}
        className="inline-flex items-center rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:bg-muted/80 transition-colors border border-border/30 mx-0.5 align-baseline"
      >
        {path}
        {startLine != null && `:${startLine}`}
      </button>
    );
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : text;
}

function mapChildrenWithFileLinks(
  children: React.ReactNode,
  onFileClick?: (path: string, startLine?: number) => void
): React.ReactNode {
  if (typeof children === "string") return renderTextWithFileLinks(children, onFileClick);
  if (Array.isArray(children)) {
    return children.map((c) => mapChildrenWithFileLinks(c, onFileClick));
  }
  return children;
}

function MessageContent({
  content,
  role,
  onFileClick,
}: {
  content: string;
  role: MessageRole;
  onFileClick?: (path: string, startLine?: number) => void;
}) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div
      className={cn(
        "markdown-content wrap-break-word",
        role === "user" ? "text-background" : "text-foreground"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[200px] border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/40 text-left">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/40">{children}</tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-xs font-medium text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs text-muted-foreground">{children}</td>
          ),

          // Code blocks with copy button
          code: ({
            inline,
            className,
            children,
            ...props
          }: {
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
          }) => {
            const match = /language-(\w+)/.exec(className || "");
            const code = String(children ?? "").replace(/\n$/, "");

            if (!inline && match) {
              return (
                <div className="my-3 overflow-hidden rounded-lg border border-border/50 bg-black/20">
                  <div className="flex items-center justify-between bg-muted/40 px-4 py-1.5 text-[10px] font-medium text-muted-foreground border-b border-border/30">
                    <span>{match[1].toUpperCase()}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(code)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedCode === code ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus as React.CSSProperties}
                    language={match[1]}
                    PreTag="div"
                    className="!m-0 !bg-transparent !p-4 !text-xs dashboard-content-scroll"
                    {...props}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code
                className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold mt-3 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-medium mt-2 mb-1">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-xs font-medium mt-2 mb-1">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-medium mt-2 mb-1 text-muted-foreground">{children}</h6>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm">
              {mapChildrenWithFileLinks(children, onFileClick)}
            </li>
          ),

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),

          // Paragraph with file links
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">
              {mapChildrenWithFileLinks(children, onFileClick)}
            </p>
          ),

          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),

          pre: ({ children }) => <div className="my-0">{children}</div>,
          hr: () => <hr className="my-3 border-border" />,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

const SCROLL_NEAR_BOTTOM_THRESHOLD = 120;

export function RepoMessages({
  messages,
  onFileClick,
  onCopy,
  onShare,
  onRegenerate,
  className,
}: RepoMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_NEAR_BOTTOM_THRESHOLD;
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto p-4 dashboard-content-scroll",
        className
      )}
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onFileClick={onFileClick}
            onCopy={onCopy}
            onShare={onShare}
            onRegenerate={onRegenerate}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({
  message: msg,
  onFileClick,
  onCopy,
  onShare,
  onRegenerate,
}: {
  message: ChatMessage;
  onFileClick?: (path: string, startLine?: number) => void;
  onCopy?: (text: string) => void;
  onShare?: (text: string) => void;
  onRegenerate?: (messageId: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const handleCopy = () => {
    if (onCopy) onCopy(msg.content);
    else navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex",
        msg.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "group/bubble relative max-w-[85%] rounded-xl px-4 py-3 text-sm",
          msg.role === "user"
            ? "bg-foreground text-background"
            : "border border-border bg-muted/80 text-foreground"
        )}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {msg.role === "user" ? "You" : "RepoLens"}
          </span>
          {(hover || copied) && (onCopy || onShare || (msg.role === "assistant" && onRegenerate)) && (
            <div className="flex items-center gap-0.5">
              {onCopy && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded p-1 text-muted-foreground hover:bg-black/10 hover:text-foreground"
                  title="Copy"
                >
                  {copied ? (
                    <span className="text-xs">Copied</span>
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
              {msg.role === "assistant" && onRegenerate && (
                <button
                  type="button"
                  onClick={() => onRegenerate(msg.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-black/10 hover:text-foreground"
                  title="Regenerate"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              {onShare && (
                <button
                  type="button"
                  onClick={() => onShare(msg.content)}
                  className="rounded p-1 text-muted-foreground hover:bg-black/10 hover:text-foreground"
                  title="Share"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {msg.role === "assistant" && (
          <>
            {/* Metrics — pill badges */}
            {msg.metrics && (
              <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {msg.metrics.filesExplored} files
                </span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {msg.metrics.searches} searches
                </span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {msg.metrics.chunksRetrieved} chunks
                </span>
              </div>
            )}
            {/* Steps — compact horizontal */}
            {msg.steps && msg.steps.length > 0 && (
              <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                {msg.steps.map((s, i) => (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      s.status === "done" && "text-primary",
                      s.status === "active" && "text-primary font-medium",
                      s.status === "pending" && "text-muted-foreground/50"
                    )}
                  >
                    {s.status === "done" ? (
                      <span className="text-[10px]">✓</span>
                    ) : s.status === "active" ? (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="h-1.5 w-1.5 rounded-full bg-primary"
                      />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/30" />
                    )}
                    {s.name}
                    {s.duration != null && s.duration > 0 && (
                      <span className="text-muted-foreground/60">{s.duration}ms</span>
                    )}
                  </span>
                ))}
              </div>
            )}
            {/* Sources — Cursor-style collapsible cards */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mb-3 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setSourcesOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      Cited sources
                    </span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {msg.sources.length}
                    </span>
                  </div>
                  {sourcesOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {sourcesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/50 p-2">
                        <div className="flex flex-col gap-1.5">
                          {msg.sources.map((s, i) => (
                            <button
                              key={`${s.file}-${s.startLine}-${i}`}
                              type="button"
                              onClick={() => onFileClick?.(s.file, s.startLine)}
                              className="group flex items-start gap-2 rounded-md px-2.5 py-2 text-left transition-all hover:bg-muted/60"
                            >
                              <div className="mt-0.5 shrink-0">
                                <FileCode2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-mono text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                                    {s.file}
                                  </span>
                                  <span className="shrink-0 text-[10px] text-muted-foreground">
                                    L{s.startLine}{s.endLine > s.startLine ? `–${s.endLine}` : ""}
                                  </span>
                                </div>
                                {(s.contentSnippet || s.symbolName) && (
                                  <div className="mt-1 rounded bg-muted/50 px-1.5 py-1 font-mono text-[10px] text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                                    {s.contentSnippet || (s.symbolName ? `${s.symbolName}(...)` : "")}
                                  </div>
                                )}
                              </div>
                              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {msg.status === "error" && msg.errorMessage && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <span className="mt-0.5">⚠</span>
                <div>
                  <p className="font-medium">RepoLens encountered an error generating a response.</p>
                  <p className="mt-1 text-muted-foreground">Please try again.</p>
                  {msg.errorMessage && (
                    <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/80">{msg.errorMessage}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="relative">
          <MessageContent content={msg.content} role={msg.role} onFileClick={onFileClick} />
          {msg.role === "assistant" && msg.status === "streaming" && (
            <span className="inline-block animate-pulse ml-0.5 align-middle text-primary" aria-hidden>
              ▍
            </span>
          )}
        </div>

        {msg.role === "assistant" && msg.files && msg.files.length > 0 && !msg.sources?.length ? (
          <div className="mt-2 border-t border-border/50 pt-2">
            <div className="text-xs text-muted-foreground">Files involved:</div>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {msg.files.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    onClick={() => onFileClick?.(f)}
                    className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground hover:bg-muted/80"
                  >
                    {f}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
