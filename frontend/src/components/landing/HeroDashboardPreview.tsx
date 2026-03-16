"use client";

import { Folder, GitBranch, FileText, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
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

        {/* Content preview – only AI Chat, full height */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col sm:mt-4">
          <motion.div
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-muted/10 p-2.5 text-left sm:p-3"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5 text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="text-xs font-medium text-foreground sm:text-sm">
                  AI Chat
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300/90">
                Live
              </span>
            </div>
            <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
              <div className="self-end max-w-[80%] rounded-lg bg-white/10 px-2 py-1">
                Summarize this repo like you would for a new hire.
              </div>
              <div className="flex max-w-[90%] gap-1.5 mt-1">
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded-md border border-border bg-muted/60" />
                <div className="flex-1 rounded-lg border border-border/60 bg-background/70 px-2 py-2">
                  <div className="h-2 w-24 rounded-full bg-white/15" />
                  <div className="mt-1 h-2 w-32 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="mt-auto flex items-center gap-1.5 rounded-md border border-border/70 bg-background/80 px-2 py-1.5 text-[10px] text-muted-foreground">
                <span className="truncate">
                  Ask about files, symbols, or architecture…
                </span>
                <button
                  type="button"
                  className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border border-border/70 bg-white/5 text-[0px] text-white/70"
                  aria-label="Send"
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0"
                  >
                    <path
                      d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
