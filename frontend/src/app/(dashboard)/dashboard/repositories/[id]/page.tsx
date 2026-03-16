"use client";

import { use, useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, FileText, FileEdit, FolderX } from "lucide-react";
import {
  RepoHeader,
  RepoChat,
  RepoPreviewPanel,
  RepoShareDialog,
  RepoResizableLayout,
  ExpandedPanelOverlay,
  ExpandedDocsView,
  RepoArchitectureGraph,
  RepoFilePreview,
  RepoInsights,
  ArchitectureNotesMarkdown,
  RepoPageSkeleton,
  type ChatMessage,
} from "@/components/repository";
import { AnalysisStepLoader } from "@/components/ui/multi-step-loader";
import { Button } from "@/components/ui/button";
import { useAppStore, useChatStore } from "@/store";
import { useRepository, useAnalysisJob, useChatMutation } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { Repository } from "@/types/user";

const ANALYSIS_STEPS = [
  { text: "Fetching repository metadata" },
  { text: "Downloading files" },
  { text: "Parsing code and extracting symbols" },
  { text: "Building dependency graph" },
  { text: "Processing embeddings" },
  { text: "Generating AI documentation" },
  { text: "Analysis complete" },
] as const;

const STEP_ORDER: (string | null)[] = [
  "FETCHING_REPO",
  "DOWNLOADING_FILES",
  "PARSING_CODE",
  "BUILDING_GRAPH",
  "EMBEDDING",
  "GENERATING_AI",
  "DONE",
];

function stepToIndex(step: string | null): number {
  const i = STEP_ORDER.indexOf(step);
  return i >= 0 ? i : 0;
}

type PageProps = { params: Promise<{ id: string }> };

function buildPlaceholderDoc(repo: Repository): string {
  const fullName = repo.fullName ?? (repo.owner ? `${repo.owner}/${repo.name}` : repo.name);
  const fileCount = repo.files?.length ?? 0;
  const dirs = new Map<string, number>();
  repo.files?.forEach((f) => {
    const top = f.path.split("/")[0];
    if (top) dirs.set(top, (dirs.get(top) ?? 0) + 1);
  });
  const topDirs = Array.from(dirs.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([d]) => d);

  let doc = `# Repository Overview\n\n`;
  doc += `This repository is **${fullName}**`;
  if (repo.language) doc += `, primarily written in **${repo.language}**.`;
  doc += `\n\n`;
  if (repo.description) doc += `${repo.description}\n\n`;
  doc += `## Summary\n\n`;
  doc += `- **Files:** ${fileCount}\n`;
  if (repo.stars != null && repo.stars > 0) doc += `- **Stars:** ${repo.stars}\n`;
  doc += `\n## Key Directories\n\n`;
  topDirs.forEach((d) => {
    doc += `- **${d}/** – module or component group\n`;
  });
  doc += `\n## Architecture\n\n`;
  doc += `\nFrontend and backend structure will be analyzed here. Connect an AI backend to generate detailed architecture.`;
  return doc;
}

export default function RepoPage({ params }: PageProps) {
  const { id: repoId } = use(params);
  const selectedWorkspaceId = useAppStore((s) => s.selectedWorkspaceId);
  const queryClient = useQueryClient();
  const { data: repo, isLoading, isError, refetch: refetchRepo } = useRepository(selectedWorkspaceId, repoId);

  const jobId = repo?.activeJob?.id ?? null;
  const { data: jobData } = useAnalysisJob(jobId);

  const isRepoBeingAnalyzed =
    repo?.status === "PENDING" ||
    repo?.status === "CLONING" ||
    repo?.status === "ANALYZING";
  const hasActiveJob = !!repo?.activeJob;
  const jobStatus = jobData?.data?.status;
  const jobStep = jobData?.data?.currentStep ?? repo?.activeJob?.currentStep ?? null;

  useEffect(() => {
    if (jobStatus === "COMPLETED" && selectedWorkspaceId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.repository(selectedWorkspaceId, repoId),
      });
      refetchRepo();
    }
  }, [jobStatus, selectedWorkspaceId, repoId, queryClient, refetchRepo]);

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const chatConvsMap = useChatStore((s) => s.conversations);
  const chatConvs = useMemo(() => chatConvsMap[repoId] || [], [chatConvsMap, repoId]);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);
  const addConversation = useChatStore((s) => s.addConversation);
  const updateConversation = useChatStore((s) => s.updateConversation);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"docs" | "files" | "architecture" | "architecture-notes" | "insights">("docs");
  const [mobilePanel, setMobilePanel] = useState<"chat" | "docs">("chat");
  const [expandedPanel, setExpandedPanel] = useState<"chat" | "docs" | "architecture" | "architecture-notes" | "files" | "insights" | null>(null);
  const architectureGraphRef = useRef<HTMLDivElement | null>(null);
  const reactFlowInstanceRef = useRef<{
    fitView: (opts?: { padding?: number; duration?: number }) => boolean;
    getNodes: () => { id: string; position: { x: number; y: number }; width?: number; height?: number; data?: { label?: string } }[];
    getEdges: () => { id: string; source: string; target: string }[];
  } | null>(null);
  const handleReactFlowInstance = useCallback(
    (
      instance: {
        fitView: (opts?: { padding?: number; duration?: number }) => boolean;
        getNodes: () => { id: string; position: { x: number; y: number }; width?: number; height?: number; data?: { label?: string } }[];
        getEdges: () => { id: string; source: string; target: string }[];
      } | null
    ) => {
      reactFlowInstanceRef.current = instance;
    },
    []
  );
  const [isAnalyzing] = useState(false);

  const { sendMessage, isPending: isChatPending } = useChatMutation(selectedWorkspaceId, repoId);

  const repoCommandAction = useAppStore((s) => s.repoCommandAction);
  const setRepoCommandAction = useAppStore((s) => s.setRepoCommandAction);
  const requestFocusChat = useAppStore((s) => s.requestFocusChat);

  useEffect(() => {
    if (!repoCommandAction) return;
    const action = repoCommandAction;
    setRepoCommandAction(null);
    queueMicrotask(() => {
      if (action === "open-architecture") setPreviewMode("architecture");
      if (action === "open-architecture-notes") setPreviewMode("architecture-notes");
      if (action === "open-docs") setPreviewMode("docs");
      if (action === "open-files") setPreviewMode("files");
      if (action === "share-report" || action === "export-report") setShareOpen(true);
      if (action === "focus-chat") requestFocusChat();
    });
  }, [repoCommandAction, setRepoCommandAction, requestFocusChat]);

  const activeConversation = chatConvs.find((c) => c.id === activeConversationId);
  const displayMessages = activeConversation ? activeConversation.messages : [];

  const docContent = useMemo(() => (repo ? buildPlaceholderDoc(repo) : ""), [repo]);
  const files = repo?.files ?? [];

  if (!selectedWorkspaceId) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="dashboard-content-scroll min-h-0 flex-1 overflow-y-auto p-4">
          <p className="text-muted-foreground">Select a workspace from the sidebar.</p>
          <Link href="/dashboard/repositories">
            <Button variant="outline" className="mt-4">Back to repositories</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !repo)) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-4 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FolderX className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Repository not found</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              This repository may have been removed, or you don&apos;t have access to it.
            </p>
            <Link href="/dashboard/repositories">
              <Button variant="outline" className="mt-6">
                Back to repositories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !repo) {
    return <RepoPageSkeleton />;
  }

  const repoName = repo.fullName ?? (repo.owner && repo.name ? `${repo.owner}/${repo.name}` : repo.name);
  const showAnalysisLoader = isRepoBeingAnalyzed && hasActiveJob && jobStatus !== "COMPLETED" && jobStatus !== "FAILED";

  if (showAnalysisLoader) {
    const stepIndex = stepToIndex(jobStep);
    return (
      <div className="flex h-full min-h-0 w-full max-w-full flex-col gap-2 overflow-x-hidden overflow-y-hidden p-2 sm:gap-4 sm:p-4">
        <header className="shrink-0">
          <RepoHeader
            repo={repo}
            backHref="/dashboard/repositories"
            onShare={() => setShareOpen(true)}
            onExport={() => {}}
            canShare={false}
            status="analyzing"
          />
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AnalysisStepLoader
            loadingStates={[...ANALYSIS_STEPS]}
            currentStepIndex={stepIndex}
            loading={true}
            repoName={repoName}
            inline
          />
        </div>
      </div>
    );
  }

  if (jobStatus === "FAILED") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="dashboard-content-scroll min-h-0 flex-1 overflow-y-auto p-4">
          <p className="text-muted-foreground">Analysis failed for this repository.</p>
          <Link href="/dashboard/repositories">
            <Button variant="outline" className="mt-4 cursor-pointer">Back to repositories</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleNewChat = () => {
    const id = `conv-${Date.now()}`;
    addConversation(repoId, { id, title: "New chat", messages: [] });
    setActiveConversationId(id);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const messageId = `msg-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const placeholderMsg: ChatMessage = {
      id: messageId,
      role: "assistant",
      content: "",
      status: "streaming",
      steps: [
        { name: "Embedding query", status: "pending" },
        { name: "Searching repository", status: "pending" },
        { name: "Reading code", status: "pending" },
        { name: "Analyzing architecture", status: "pending" },
        { name: "Generating response", status: "pending" },
      ],
    };
    const nextMessages = [...displayMessages, userMsg, placeholderMsg];

    const newConvId = `conv-${Date.now()}`;
    const convInThisRepo = chatConvs.find((c) => c.id === activeConversationId);
    const convIdToUse = convInThisRepo ? activeConversationId! : newConvId;

    if (convInThisRepo) {
      updateConversation(repoId, activeConversationId!, {
        messages: nextMessages,
        title: activeConversation?.title === "New chat" ? text.slice(0, 40) : activeConversation?.title,
      });
    } else {
      addConversation(repoId, { id: newConvId, title: text.slice(0, 40), messages: nextMessages });
    }

    try {
      const history = displayMessages.map((m) => ({ role: m.role, content: m.content })).slice(-5);
      await sendMessage(text, history, { convId: convIdToUse, messageId });
      // Message is updated in-place via SSE events
    } catch (error) {
      console.error("Chat error:", error);
      // Placeholder was already updated with error status via SSE; no need to add another message
    }
  };

  const handleOpenFileInPreview = (path: string, _startLine?: number) => {
    setSelectedFilePath(path);
    setPreviewMode("files");
    // TODO: use _startLine to scroll file preview to line when supported
  };

  const fullName = repo.fullName ?? (repo.owner ? `${repo.owner}/${repo.name}` : repo.name);
  const docsContent = (repo.documentation && repo.documentation.trim() ? repo.documentation : docContent) ?? "";
  const architectureNotes = repo.architecture?.trim() ?? "";
  const isPreviewVisible = true;
  const canShare =
    isPreviewVisible &&
    (previewMode === "docs" || previewMode === "architecture" || previewMode === "architecture-notes");
  const shareContent =
    previewMode === "docs"
      ? docsContent
      : previewMode === "architecture-notes"
        ? architectureNotes
        : "";
  const shareMode: "docs" | "architecture" | "architecture-notes" =
    previewMode === "docs"
      ? "docs"
      : previewMode === "architecture"
        ? "architecture"
        : previewMode === "architecture-notes"
          ? "architecture-notes"
          : "docs";

  return (
    <div className="flex h-full min-h-0 w-full max-w-full flex-col gap-2 overflow-x-hidden overflow-y-hidden p-2 sm:gap-4 sm:p-4">
      <header className="shrink-0">
        <RepoHeader
          repo={repo}
          backHref="/dashboard/repositories"
          onShare={() => setShareOpen(true)}
          onExport={() => {}}
          canShare={canShare}
          status={isAnalyzing ? "analyzing" : undefined}
        />
      </header>
      {/* Mobile & tablet: single column with Chat | Docs tabs */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        <div className="flex shrink-0 flex-col pb-4 pt-3">
          <div className="flex justify-center gap-1 rounded-xl bg-muted/50 p-1.5">
          <button
            type="button"
            onClick={() => setMobilePanel("chat")}
            className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all sm:py-2 ${
              mobilePanel === "chat"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("docs")}
            className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all sm:py-2 ${
              mobilePanel === "docs"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            Docs
          </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {isHydrated && mobilePanel === "chat" && (
            <RepoChat
              messages={displayMessages}
              onSendMessage={handleSendMessage}
              isAnalyzing={isAnalyzing}
              isPending={isChatPending}
              conversations={chatConvs}
              activeConversationId={activeConversationId}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onOpenFileInPreview={handleOpenFileInPreview}
              onExpand={() => setExpandedPanel("chat")}
            />
          )}
          {mobilePanel === "docs" && (
            <div className="h-full min-h-0 min-w-0 overflow-hidden">
              <RepoPreviewPanel
                docContent={docContent}
                documentation={repo.documentation}
                architecture={repo.architecture}
                files={files}
                dependencies={repo.dependencies ?? []}
                selectedFilePath={selectedFilePath}
                onSelectFile={setSelectedFilePath}
                workspaceId={selectedWorkspaceId}
                repoId={repoId}
                mode={previewMode}
                onModeChange={setPreviewMode}
                onExpand={(panel) => setExpandedPanel(panel)}
                architectureGraphRef={architectureGraphRef}
                onReactFlowInstance={handleReactFlowInstance}
              />
            </div>
          )}
        </div>
      </div>
      {/* Desktop: resizable two panels */}
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden md:flex">
        <RepoResizableLayout
          defaultLeftPercent={35}
          left={
            <RepoChat
              messages={displayMessages}
              onSendMessage={handleSendMessage}
              isAnalyzing={isAnalyzing}
              isPending={isChatPending}
              conversations={chatConvs}
              activeConversationId={activeConversationId}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onOpenFileInPreview={handleOpenFileInPreview}
              onExpand={() => setExpandedPanel("chat")}
            />
          }
          right={
            <div className="h-full min-h-0 min-w-0 overflow-hidden">
              <RepoPreviewPanel
                docContent={docContent}
                documentation={repo.documentation}
                architecture={repo.architecture}
                files={files}
                dependencies={repo.dependencies ?? []}
                selectedFilePath={selectedFilePath}
                onSelectFile={setSelectedFilePath}
                workspaceId={selectedWorkspaceId}
                repoId={repoId}
                mode={previewMode}
                onModeChange={setPreviewMode}
                onExpand={(panel) => setExpandedPanel(panel)}
                architectureGraphRef={architectureGraphRef}
                onReactFlowInstance={handleReactFlowInstance}
              />
            </div>
          }
        />
      </div>
      <RepoShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        repoName={fullName}
        shareMode={shareMode}
        shareContent={shareContent}
        architectureGraphRef={previewMode === "architecture" ? architectureGraphRef : undefined}
        reactFlowInstanceRef={reactFlowInstanceRef}
      />

      {/* Expanded panel overlays */}
      <ExpandedPanelOverlay
        open={expandedPanel === "chat"}
        onClose={() => setExpandedPanel(null)}
        title="AI Chat"
      >
        <div className="h-full overflow-hidden">
          <RepoChat
            messages={displayMessages}
            onSendMessage={handleSendMessage}
            isAnalyzing={isAnalyzing}
            isPending={isChatPending}
            conversations={chatConvs}
            activeConversationId={activeConversationId}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            onOpenFileInPreview={handleOpenFileInPreview}
          />
        </div>
      </ExpandedPanelOverlay>

      <ExpandedPanelOverlay
        open={expandedPanel === "docs"}
        onClose={() => setExpandedPanel(null)}
        title="Documentation"
      >
        <ExpandedDocsView content={docsContent} />
      </ExpandedPanelOverlay>

      <ExpandedPanelOverlay
        open={expandedPanel === "architecture"}
        onClose={() => setExpandedPanel(null)}
        title="Architecture"
      >
        <div className="h-full overflow-hidden p-4">
          <RepoArchitectureGraph files={files} dependencies={repo.dependencies ?? []} className="h-full w-full" />
        </div>
      </ExpandedPanelOverlay>

      <ExpandedPanelOverlay
        open={expandedPanel === "architecture-notes"}
        onClose={() => setExpandedPanel(null)}
        title="Architecture Notes"
      >
        <div className="flex h-full flex-col overflow-hidden">
          {repo.architecture && repo.architecture.trim() ? (
            <div className="notion-architecture-notes min-h-0 flex-1 overflow-y-auto dashboard-content-scroll">
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
                  <ArchitectureNotesMarkdown content={repo.architecture} />
                </div>
              </div>
            </div>
          ) : (
            <div className="notion-architecture-notes flex min-h-0 flex-1 flex-col">
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
        </div>
      </ExpandedPanelOverlay>

      <ExpandedPanelOverlay
        open={expandedPanel === "files"}
        onClose={() => setExpandedPanel(null)}
        title="Files"
      >
        <RepoFilePreview
          files={files}
          selectedPath={selectedFilePath}
          onSelectFile={setSelectedFilePath}
          workspaceId={selectedWorkspaceId}
          repoId={repoId}
          className="h-full"
        />
      </ExpandedPanelOverlay>

      <ExpandedPanelOverlay
        open={expandedPanel === "insights"}
        onClose={() => setExpandedPanel(null)}
        title="Insights"
      >
        <RepoInsights files={files} className="h-full" />
      </ExpandedPanelOverlay>
    </div>
  );
}
