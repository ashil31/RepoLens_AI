"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type RepoMarkdownDocProps = {
  content: string;
  className?: string;
};

export function RepoMarkdownDoc({ content, className }: RepoMarkdownDocProps) {
  const docContent = content || "(No content)";

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <article
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-y-auto dashboard-content-scroll wrap-break-word overflow-x-hidden notion-prose"
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{docContent}</ReactMarkdown>
      </article>
    </div>
  );
}
