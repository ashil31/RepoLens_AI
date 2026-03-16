"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PREVIEW_WRAPPER = "min-h-0 flex-1 overflow-y-auto dashboard-content-scroll";

type ExpandedDocsViewProps = {
  content: string;
};

export function ExpandedDocsView({ content }: ExpandedDocsViewProps) {
  const previewContent = content || "(No content)";

  return (
    <>
      {/* Mobile: Live preview only */}
      <div className="flex h-full flex-col md:hidden">
        <div className={PREVIEW_WRAPPER}>
          <div className="notion-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Desktop: Markdown source + Live preview */}
      <div className="hidden h-full md:block">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel defaultSize={50} minSize={20} className="flex flex-col">
            <div className="shrink-0 border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
              Markdown source
            </div>
            <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs text-foreground dashboard-content-scroll">
              {previewContent}
            </pre>
          </Panel>
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors data-[resize-handle-active]:bg-primary/30" />
          <Panel defaultSize={50} minSize={20} className="flex flex-col">
            <div className="shrink-0 border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
              Live preview
            </div>
            <div className={PREVIEW_WRAPPER}>
              <div className="notion-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent}</ReactMarkdown>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </>
  );
}
