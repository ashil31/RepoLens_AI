"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, RefreshCw, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  files?: string[];
}

type RepoMessagesProps = {
  messages: ChatMessage[];
  isStreaming?: boolean;
  streamingContent?: string;
  onFileClick?: (path: string) => void;
  onCopy?: (text: string) => void;
  onShare?: (text: string) => void;
  onRegenerate?: (messageId: string) => void;
  className?: string;
};

const FILE_PATH_REGEX = /(?:^|[\s(])([a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+(?:\.[a-zA-Z0-9]+)?)(?=[\s),]|$)/g;

function extractFilePaths(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(FILE_PATH_REGEX.source, "g");
  while ((m = re.exec(text)) !== null) {
    const path = m[1].trim();
    if (path && !seen.has(path)) {
      seen.add(path);
      out.push(path);
    }
  }
  return out;
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function MessageContent({
  content,
  role,
  onFileClick,
}: {
  content: string;
  role: MessageRole;
  onFileClick?: (path: string) => void;
}) {
  const renderTextWithFiles = (text: string) => {
    if (!onFileClick) return text;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const re = new RegExp(FILE_PATH_REGEX.source, "g");
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      const before = text.slice(lastIndex, m.index);
      const path = m[1].trim();
      if (before) parts.push(before);
      parts.push(
        <button
          key={`${m.index}-${path}`}
          type="button"
          onClick={() => onFileClick(path)}
          className="inline-flex items-center rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:bg-muted/80 transition-colors border border-border/30 mx-0.5 align-baseline"
        >
          {path}
        </button>
      );
      lastIndex = m.index + m[0].length;
    }

    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length ? parts : text;
  };

  return (
    <div className={cn(
      "markdown-content wrap-break-word",
      role === "user" ? "text-background" : "text-foreground"
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <div className="my-3 overflow-hidden rounded-lg border border-border/50 bg-black/20">
                <div className="flex items-center justify-between bg-muted/40 px-4 py-1.5 text-[10px] font-medium text-muted-foreground border-b border-border/30">
                  <span>{match[1].toUpperCase()}</span>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={match[1]}
                  PreTag="div"
                  className="!m-0 !bg-transparent !p-4 !text-xs dashboard-content-scroll"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={cn("rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs", className)} {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{Array.isArray(children) ? children.map(c => typeof c === 'string' ? renderTextWithFiles(c) : c) : (typeof children === 'string' ? renderTextWithFiles(children) : children)}</p>,
          li: ({ children }) => <li className="mb-1">{Array.isArray(children) ? children.map(c => typeof c === 'string' ? renderTextWithFiles(c) : c) : (typeof children === 'string' ? renderTextWithFiles(children) : children)}</li>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function RepoMessages({
  messages,
  isStreaming,
  streamingContent = "",
  onFileClick,
  onCopy,
  onShare,
  onRegenerate,
  className,
}: RepoMessagesProps) {
  return (
    <div
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
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className="group relative max-w-[85%] rounded-xl border border-border bg-muted/80 px-4 py-3 text-sm text-foreground">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              RepoLens
            </div>
            <div className="relative">
              <MessageContent content={streamingContent} role="assistant" onFileClick={onFileClick} />
              <span className="absolute bottom-0 inline-block h-4 w-1 animate-pulse bg-primary ml-1" aria-hidden />
            </div>
          </div>
        </motion.div>
      )}
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
  onFileClick?: (path: string) => void;
  onCopy?: (text: string) => void;
  onShare?: (text: string) => void;
  onRegenerate?: (messageId: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);

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
        <MessageContent content={msg.content} role={msg.role} onFileClick={onFileClick} />
        {msg.files && msg.files.length > 0 && (
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
        )}
      </div>
    </motion.div>
  );
}
