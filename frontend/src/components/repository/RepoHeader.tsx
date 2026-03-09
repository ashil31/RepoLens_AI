"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Share2, Download, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Repository } from "@/types/user";

type RepoHeaderProps = {
  repo: Repository;
  onShare?: () => void;
  onExport?: () => void;
  backHref?: string;
  /** When set, shows "Analyzing repository..." with progress steps */
  status?: "analyzing";
  className?: string;
};

export function RepoHeader({
  repo,
  onShare,
  onExport,
  backHref = "/dashboard/repositories",
  status,
  className,
}: RepoHeaderProps) {
  const fullName =
    repo.fullName ?? (repo.owner ? `${repo.owner}/${repo.name}` : repo.name);
  const fileCount = repo.files?.length ?? 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 backdrop-blur-sm sm:gap-3 sm:px-4 sm:py-3",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-2 sm:gap-3">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base sm:text-lg">
            {fullName}
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:gap-x-3">
            {status === "analyzing" && (
              <span className="flex items-center gap-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-primary sm:px-2">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Loader2 className="h-3 w-3" />
                </motion.span>
                Analyzing repository…
              </span>
            )}
            {repo.language && (
              <span className="shrink-0 rounded bg-muted/80 px-1.5 py-0.5 font-medium text-muted-foreground">
                {repo.language}
              </span>
            )}
            <span className="shrink-0">{fileCount} files</span>
            {repo.stars != null && repo.stars > 0 && (
              <span className="shrink-0">★ {repo.stars.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {repo.repoUrl && (
          <a href={repo.repoUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 gap-1 px-2 sm:gap-1.5 sm:px-3">
              <Github className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Open GitHub</span>
            </Button>
          </a>
        )}
        {onShare && (
          <Button variant="outline" size="sm" onClick={onShare} className="h-8 gap-1 px-2 sm:gap-1.5 sm:px-3">
            <Share2 className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="h-8 gap-1 px-2 sm:gap-1.5 sm:px-3">
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
      </div>
    </motion.header>
  );
}
