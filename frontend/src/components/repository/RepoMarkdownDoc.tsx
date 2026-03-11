"use client";

import { useState, useMemo } from "react";
import { Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type RepoMarkdownDocProps = {
  content: string;
  className?: string;
};

type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "code"; text: string; lang?: string };

type TocItem = { id: string; text: string; level: 1 | 2 | 3 };

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function parseMarkdownBlocks(raw: string): Block[] {
  const blocks: Block[] = [];
  const lines = raw.split(/\r?\n/);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#\s/.test(line)) {
      blocks.push({ type: "h1", text: line.replace(/^#\s*/, "").trim() });
      i++;
      continue;
    }
    if (/^##\s/.test(line)) {
      blocks.push({ type: "h2", text: line.replace(/^##\s*/, "").trim() });
      i++;
      continue;
    }
    if (/^###\s/.test(line)) {
      blocks.push({ type: "h3", text: line.replace(/^###\s*/, "").trim() });
      i++;
      continue;
    }
    if (/^-\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s*/, "").trim());
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: "code", text: codeLines.join("\n"), lang });
      continue;
    }
    const trimmed = line.trim();
    if (trimmed) {
      blocks.push({ type: "p", text: trimmed });
    }
    i++;
  }
  return blocks;
}

function HeadingWithCopy({
  id,
  level,
  text,
}: {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}) {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.pathname}#${id}` : `#${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  const classMap = {
    1: "mb-2 mt-6 text-xl font-semibold text-foreground first:mt-0 scroll-mt-4",
    2: "mb-2 mt-5 text-base font-semibold text-foreground scroll-mt-4",
    3: "mb-1.5 mt-4 text-sm font-semibold text-foreground scroll-mt-4",
  };

  return (
    <Tag
      id={id}
      className={cn("group relative flex min-w-0 flex-wrap items-center gap-2 wrap-break-word", classMap[level])}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="min-w-0 wrap-break-word">{text}</span>
      {(hover || copied) && (
        <button
          type="button"
          onClick={copyLink}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Copy link"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        </button>
      )}
    </Tag>
  );
}

function renderBlock(block: Block): React.ReactNode {
  switch (block.type) {
    case "h1": {
      const id = slug(block.text);
      return <HeadingWithCopy id={id} level={1} text={block.text} />;
    }
    case "h2": {
      const id2 = slug(block.text);
      return <HeadingWithCopy id={id2} level={2} text={block.text} />;
    }
    case "h3": {
      const id3 = slug(block.text);
      return <HeadingWithCopy id={id3} level={3} text={block.text} />;
    }
    case "p":
      return (
        <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
          {block.text}
        </p>
      );
    case "ul":
      return (
        <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-muted-foreground">
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-xs font-mono text-foreground">
          <code>{block.text}</code>
        </pre>
      );
    default:
      return null;
  }
}

export function RepoMarkdownDoc({ content, className }: RepoMarkdownDocProps) {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);
  const toc = useMemo(() => {
    const items: TocItem[] = [];
    blocks.forEach((b) => {
      if (b.type === "h1" || b.type === "h2" || b.type === "h3") {
        const id = slug(b.text);
        items.push({ id, text: b.text, level: b.type === "h1" ? 1 : b.type === "h2" ? 2 : 3 });
      }
    });
    return items;
  }, [blocks]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-4 overflow-hidden lg:flex-row lg:gap-8", className)}>
      <article
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-y-auto p-4 dashboard-content-scroll sm:p-6",
          "prose prose-sm max-w-3xl dark:prose-invert",
          "prose-p:text-muted-foreground prose-ul:text-muted-foreground prose-li:marker:text-muted-foreground",
          "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:overflow-x-auto prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-foreground",
          "wrap-break-word overflow-x-hidden"
        )}
      >
        {blocks.map((block, i) => (
          <div key={i}>{renderBlock(block)}</div>
        ))}
      </article>
      {/* {toc.length > 0 && (
        <nav
          className="hidden shrink-0 border-t border-border pt-4 lg:block lg:w-48 lg:border-t-0 lg:pt-6"
          aria-label="Table of contents"
        >
          <div className="sticky top-0">
            <p className="mb-2 font-medium text-muted-foreground">On this page</p>
            <ul className="space-y-1">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={cn(
                      "block rounded-md py-0.5 text-muted-foreground hover:text-foreground wrap-break-word",
                      item.level === 2 && "pl-2",
                      item.level === 3 && "pl-4"
                    )}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )} */}
    </div>
  );
}
