"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, FileCode, Network } from "lucide-react";
import { RepoMarkdownDoc } from "./RepoMarkdownDoc";
import { RepoFilePreview } from "./RepoFilePreview";
import { RepoArchitectureGraph } from "./RepoArchitectureGraph";
import { cn } from "@/lib/utils";

type PreviewMode = "docs" | "files" | "architecture";

type RepoPreviewPanelProps = {
  docContent: string;
  files: { id: string; path: string; language: string | null }[];
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
  mode?: PreviewMode;
  onModeChange?: (mode: PreviewMode) => void;
  className?: string;
};

const TABS: { id: PreviewMode; label: string; icon: typeof FileText }[] = [
  { id: "docs", label: "Docs", icon: FileText },
  { id: "files", label: "Files", icon: FileCode },
  { id: "architecture", label: "Architecture", icon: Network },
];

export function RepoPreviewPanel({
  docContent,
  files,
  selectedFilePath,
  onSelectFile,
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
              <RepoMarkdownDoc content={docContent} className="h-full" />
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
              className="h-full min-h-[320px] overflow-hidden p-4"
            >
              <RepoArchitectureGraph />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
