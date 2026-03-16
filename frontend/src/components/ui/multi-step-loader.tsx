"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type LoadingState = { text: string };

const CheckFilled = ({ className }: { className?: string }) => (
  <Check className={cn("h-6 w-6", className)} strokeWidth={2.5} />
);

const LoaderCore = ({
  loadingStates,
  value = 0,
  compact = false,
}: {
  loadingStates: LoadingState[];
  value?: number;
  compact?: boolean;
}) => {
  return (
    <div className={cn(
      "flex relative justify-start max-w-xl mx-auto flex-col",
      compact ? "mt-8" : "mt-40"
    )}>
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - value);
        const opacity = Math.max(1 - distance * 0.2, 0);
        const isActive = index === value;
        const isComplete = index < value;

        return (
          <motion.div
            key={index}
            className={cn("text-left flex gap-3 mb-4 items-center")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="shrink-0">
              {isComplete && (
                <CheckFilled className="text-green-500 dark:text-green-400" />
              )}
              {isActive && (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
              {!isComplete && !isActive && (
                <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>
            <span
              className={cn(
                "text-muted-foreground transition-colors",
                isActive && "text-foreground font-medium",
                isComplete && "text-muted-foreground"
              )}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export interface AnalysisStepLoaderProps {
  loadingStates: LoadingState[];
  currentStepIndex: number;
  loading?: boolean;
  repoName?: string;
  backHref?: string;
  /** When true, renders inline within the page (no full-screen overlay) */
  inline?: boolean;
}

export function AnalysisStepLoader({
  loadingStates,
  currentStepIndex,
  loading = true,
  backHref,
  inline = false,
}: AnalysisStepLoaderProps) {
  const content = (
    <>
      {/* {repoName && (
        <p className="text-sm text-muted-foreground mb-4">
          Analyzing <span className="font-medium text-foreground">{repoName}</span>
        </p>
      )} */}
      <div className={inline ? "flex-1 min-h-0 relative" : "h-96 relative"}>
        <LoaderCore
          value={currentStepIndex}
          loadingStates={loadingStates}
          compact={inline}
        />
      </div>
      {!inline && (
        <div className="bg-gradient-to-t from-background via-transparent to-transparent inset-x-0 z-20 bottom-0 h-1/2 absolute pointer-events-none" />
      )}
    </>
  );

  if (!loading) return null;

  if (inline) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto py-8"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-sm bg-background/95"
      >
        {backHref && (
          <a
            href={backHref}
            className="fixed top-4 left-4 z-[110] text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to repositories
          </a>
        )}
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
