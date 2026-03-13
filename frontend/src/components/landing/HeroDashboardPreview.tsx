"use client";

import { Folder, GitBranch, FileText, MessageSquare } from "lucide-react";
import { RepoLensLogo } from "@/components/repolens-logo";
import { cn } from "@/lib/utils";

/**
 * Compact dashboard preview for mobile and tablet. Shows a simplified
 * mock of the app (sidebar strip + repo header + content blocks) so the
 * hero still looks like the product without the full 3-column layout.
 */
export function HeroDashboardPreview() {
  return (
    <div
      className={cn(
        "flex w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl",
        "h-[280px] sm:h-[320px] md:h-[360px]"
      )}
    >
      {/* Narrow sidebar strip */}
      <div className="relative flex w-12 shrink-0 flex-col items-center gap-2 border-r border-border bg-card/80 py-3 sm:w-14">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md sm:h-9 sm:w-9">
          <RepoLensLogo id="hero-dashboard-logo" fillContainer />
        </div>
        <div className="flex flex-col gap-1">
          {[Folder, GitBranch].map((Icon, i) => (
            <div
              key={i}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9",
                i === 1 ? "bg-accent text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
        {/* Repo header row */}
        <div className="shrink-0 space-y-1">
          <p className="truncate text-sm font-semibold text-foreground sm:text-base">
            acme/RepoLens_AI
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <span>TypeScript</span>
            <span>·</span>
            <span>3 files</span>
            <span>·</span>
            <span>★ 128</span>
          </p>
        </div>

        {/* Content blocks preview */}
        <div className="mt-3 flex min-h-0 flex-1 gap-2 sm:mt-4 sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-border bg-muted/20 p-2.5 sm:p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="text-xs font-medium sm:text-sm">AI Chat</span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground sm:line-clamp-3 sm:text-sm">
              Ask questions about this repository…
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-border bg-muted/20 p-2.5 sm:p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="text-xs font-medium sm:text-sm">Docs</span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground sm:line-clamp-3 sm:text-sm">
              Repository overview, dependencies, architecture…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
