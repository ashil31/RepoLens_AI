"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, FileCode, Network, BarChart3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RepoMarkdownDoc } from "./RepoMarkdownDoc";
import { RepoFilePreview } from "./RepoFilePreview";
import { RepoArchitectureGraph } from "./RepoArchitectureGraph";
import { RepoInsights } from "./RepoInsights";
import { cn } from "@/lib/utils";
import type { RepositoryFile, RepositoryDependency } from "@/types/user";

type PreviewMode = "docs" | "files" | "architecture" | "insights";

type RepoPreviewPanelProps = {
  docContent: string;
  documentation?: string | null;
  architecture?: string | null;
  files: RepositoryFile[];
  dependencies?: RepositoryDependency[];
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
  workspaceId?: string | null;
  repoId?: string | null;
  mode?: PreviewMode;
  onModeChange?: (mode: PreviewMode) => void;
  className?: string;
};

const TABS: { id: PreviewMode; label: string; icon: typeof FileText }[] = [
  { id: "docs", label: "Docs", icon: FileText },
  { id: "files", label: "Files", icon: FileCode },
  { id: "architecture", label: "Architecture", icon: Network },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

export function RepoPreviewPanel({
  docContent,
  documentation,
  architecture,
  files,
  dependencies = [],
  selectedFilePath,
  onSelectFile,
  workspaceId,
  repoId,
  mode: controlledMode,
  onModeChange,
  className,
}: RepoPreviewPanelProps) {
  const [internalMode, setInternalMode] = useState<PreviewMode>("docs");
  const mode = controlledMode ?? internalMode;
  const setMode = (m: PreviewMode) => {
    if (onModeChange) onModeChange(m);
    else setInternalMode(m);
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <div className="flex shrink-0 border-b border-border bg-muted/30 min-w-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
              mode === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === "docs" && (
            <motion.div
              key="docs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-hidden"
            >
              <RepoMarkdownDoc
                content={documentation && documentation.trim() ? documentation : docContent}
                className="h-full"
              />
            </motion.div>
          )}
          {mode === "files" && (
            <motion.div
              key="files"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-hidden"
            >
              <RepoFilePreview
                files={files}
                selectedPath={selectedFilePath}
                onSelectFile={onSelectFile}
                workspaceId={workspaceId}
                repoId={repoId}
              />
            </motion.div>
          )}
          {mode === "architecture" && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex h-full min-h-[320px] flex-col gap-4 overflow-hidden p-4"
            >
              <div className="min-h-0 flex-[7] overflow-hidden">
                <RepoArchitectureGraph files={files} dependencies={dependencies} className="h-full" />
              </div>
              {architecture && architecture.trim() && (
                <div className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
                  <div className="shrink-0 border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
                    Architecture notes
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm dashboard-content-scroll prose prose-sm dark:prose-invert prose-p:text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{architecture}</ReactMarkdown>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {mode === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-hidden"
            >
              <RepoInsights files={files} className="h-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
