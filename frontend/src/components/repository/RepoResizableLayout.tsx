"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";

type RepoResizableLayoutProps = {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  className?: string;
};

export function RepoResizableLayout({
  left,
  right,
  defaultLeftPercent = 35,
  className,
}: RepoResizableLayoutProps) {
  return (
    <PanelGroup
      direction="horizontal"
      className={cn("flex min-h-0 flex-1 gap-2", className)}
      autoSaveId="repolens-repo-panels"
    >
      <Panel
        defaultSize={defaultLeftPercent}
        minSize={20}
        maxSize={60}
        order={1}
        className="flex min-h-0 min-w-0 flex-col"
      >
        {left}
      </Panel>
      <PanelResizeHandle className="group relative w-2 shrink-0 bg-transparent transition-colors hover:bg-muted-foreground/20 data-[resize-handle-active]:bg-primary/30">
        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-primary/50 group-data-[resize-handle-active]:bg-primary" />
      </PanelResizeHandle>
      <Panel defaultSize={100 - defaultLeftPercent} minSize={40} order={2} className="flex min-h-0 min-w-0 flex-col">
        {right}
      </Panel>
    </PanelGroup>
  );
}
