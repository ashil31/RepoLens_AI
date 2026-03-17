"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, FileCode, Network, BarChart3, Maximize2, FileEdit } from "lucide-react";
import type { ReactFlowInstance } from "reactflow";
import { ArchitectureNotesMarkdown } from "./ArchitectureNotesMarkdown";
import { RepoMarkdownDoc } from "./RepoMarkdownDoc";
import { RepoFilePreview } from "./RepoFilePreview";
import { RepoArchitectureGraph } from "./RepoArchitectureGraph";
import { RepoInsights } from "./RepoInsights";
import { cn } from "@/lib/utils";
import type { RepositoryFile, RepositoryDependency } from "@/types/user";

type PreviewMode = "docs" | "files" | "architecture" | "architecture-notes" | "insights";

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
  onExpand?: (panel: PreviewMode) => void;
  /** Ref for architecture graph container (used for PNG export) */
  architectureGraphRef?: React.RefObject<HTMLDivElement | null>;
  /** Callback when ReactFlow instance is ready (for fitView and export) */
  onReactFlowInstance?: (instance: ReactFlowInstance | null) => void;
  className?: string;
};

const TABS: { id: PreviewMode; label: string; icon: typeof FileText }[] = [
  { id: "docs", label: "Docs", icon: FileText },
  { id: "files", label: "Files", icon: FileCode },
  { id: "architecture", label: "Architecture", icon: Network },
  { id: "architecture-notes", label: "Notes", icon: FileEdit },
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
  onExpand,
  architectureGraphRef,
  onReactFlowInstance,
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
      <div className="flex shrink-0 items-center border-b border-border bg-muted/30 min-w-0">
        <div className="flex min-w-0 flex-1">
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
        {onExpand && (
          <button
            type="button"
            onClick={() => onExpand(mode)}
            aria-label={`Expand ${mode}`}
            className="shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden dashboard-content-scroll">
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
              className="flex h-full min-h-[320px] flex-col p-4"
            >
              <div className="h-[280px] w-full shrink-0 sm:h-[360px]">
                <RepoArchitectureGraph
                  files={files}
                  dependencies={dependencies}
                  className="h-full w-full"
                  containerRef={architectureGraphRef}
                  onReactFlowInstance={onReactFlowInstance}
                />
              </div>
            </motion.div>
          )}
          {mode === "architecture-notes" && (
            <motion.div
              key="architecture-notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-hidden"
            >
              {architecture && architecture.trim() ? (
                <div className="notion-architecture-notes h-full overflow-y-auto dashboard-content-scroll">
                  <div className="notion-notes-header">
                    <div className="notion-notes-title">
                      <span className="notion-notes-title-icon">
                        <FileEdit className="h-4 w-4" />
                      </span>
                      Architecture Notes
                    </div>
                  </div>
                  <div className="notion-notes-content">
                    <div className="notion-prose">
                      <ArchitectureNotesMarkdown content={architecture} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="notion-architecture-notes flex h-full flex-col">
                  <div className="notion-notes-header">
                    <div className="notion-notes-title">
                      <span className="notion-notes-title-icon">
                        <FileEdit className="h-4 w-4" />
                      </span>
                      Architecture Notes
                    </div>
                  </div>
                  <div className="notion-empty-state">
                    <div className="notion-empty-state-icon">
                      <FileEdit className="h-6 w-6" />
                    </div>
                    <p className="notion-empty-state-title">No notes yet</p>
                    <p className="notion-empty-state-desc">Run analysis on this repository to generate AI-powered architecture notes.</p>
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
