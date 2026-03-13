"use client";

import { use, useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  RepoHeader,
  RepoChat,
  RepoPreviewPanel,
  RepoShareDialog,
  RepoResizableLayout,
  type ChatMessage,
} from "@/components/repository";
import { AnalysisStepLoader } from "@/components/ui/multi-step-loader";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { useRepository, useAnalysisJob } from "@/hooks/queries";
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<{ id: string; title: string; messages: ChatMessage[] }[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"docs" | "files" | "architecture" | "insights">("docs");
  const [mobilePanel, setMobilePanel] = useState<"chat" | "docs">("chat");
  const [isAnalyzing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const replyingToConvIdRef = useRef<string | null>(null);

  const repoCommandAction = useAppStore((s) => s.repoCommandAction);
  const setRepoCommandAction = useAppStore((s) => s.setRepoCommandAction);
  const requestFocusChat = useAppStore((s) => s.requestFocusChat);

  useEffect(() => {
    if (!repoCommandAction) return;
    const action = repoCommandAction;
    setRepoCommandAction(null);
    queueMicrotask(() => {
      if (action === "open-architecture") setPreviewMode("architecture");
      if (action === "open-docs") setPreviewMode("docs");
      if (action === "open-files") setPreviewMode("files");
      if (action === "share-report" || action === "export-report") setShareOpen(true);
      if (action === "focus-chat") requestFocusChat();
    });
  }, [repoCommandAction, setRepoCommandAction, requestFocusChat]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const displayMessages = activeConversation ? activeConversation.messages : messages;

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
        <div className="dashboard-content-scroll min-h-0 flex-1 overflow-y-auto p-4">
          <p className="text-muted-foreground">Repository not found.</p>
          <Link href="/dashboard/repositories">
            <Button variant="outline" className="mt-4">Back to repositories</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !repo) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="h-32 w-full max-w-md animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
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
    setConversations((prev) => [{ id, title: "New chat", messages: [] }, ...prev]);
    setActiveConversationId(id);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv) setMessages(conv.messages);
  };

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const nextMessages = [...displayMessages, userMsg];
    setMessages(nextMessages);

    const newConvId = `conv-${Date.now()}`;
    const convIdToUse = activeConversationId || newConvId;

    if (activeConversationId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, messages: nextMessages, title: c.title === "New chat" ? text.slice(0, 40) : c.title }
            : c
        )
      );
    } else {
      setConversations((prev) => [{ id: newConvId, title: text.slice(0, 40), messages: nextMessages }, ...prev]);
      setActiveConversationId(newConvId);
    }

    replyingToConvIdRef.current = convIdToUse;
    setIsThinking(true);
    const fullReply = "Repository analysis is not connected yet. This will stream AI-generated answers with file references.";
    let i = 0;
    const interval = setInterval(() => {
      i += 1 + Math.floor(Math.random() * 3);
      if (i >= fullReply.length) {
        clearInterval(interval);
        setStreamingContent("");
        setIsThinking(false);
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: fullReply,
          files: ["src/auth/service.ts", "src/auth/controller.ts"],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setConversations((prev) =>
          prev.map((c) => (c.id === replyingToConvIdRef.current ? { ...c, messages: [...c.messages, assistantMsg] } : c))
        );
        replyingToConvIdRef.current = null;
        return;
      }
      setStreamingContent(fullReply.slice(0, i));
    }, 30);
  };

  const handleOpenFileInPreview = (path: string) => {
    setSelectedFilePath(path);
    setPreviewMode("files");
  };

  const fullName = repo.fullName ?? (repo.owner ? `${repo.owner}/${repo.name}` : repo.name);
  const shareContent = docContent;

  return (
    <div className="flex h-full min-h-0 w-full max-w-full flex-col gap-2 overflow-x-hidden overflow-y-hidden p-2 sm:gap-4 sm:p-4">
      <header className="shrink-0">
        <RepoHeader
          repo={repo}
          backHref="/dashboard/repositories"
          onShare={() => setShareOpen(true)}
          onExport={() => {}}
          status={isAnalyzing ? "analyzing" : undefined}
        />
      </header>
      {/* Mobile & tablet: single column with Chat | Docs tabs */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        <div className="flex shrink-0 border-b border-border bg-muted/30 min-w-0">
          <button
            type="button"
            onClick={() => setMobilePanel("chat")}
            className={`min-w-0 flex-1 py-3 text-sm font-medium transition-colors sm:py-2.5 ${
              mobilePanel === "chat" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("docs")}
            className={`min-w-0 flex-1 py-3 text-sm font-medium transition-colors sm:py-2.5 ${
              mobilePanel === "docs" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            Docs
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {mobilePanel === "chat" && (
            <RepoChat
              messages={displayMessages}
              onSendMessage={handleSendMessage}
              isAnalyzing={isAnalyzing}
              isThinking={isThinking}
              streamingContent={streamingContent}
              conversations={conversations}
              activeConversationId={activeConversationId}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onOpenFileInPreview={handleOpenFileInPreview}
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
              isThinking={isThinking}
              streamingContent={streamingContent}
              conversations={conversations}
              activeConversationId={activeConversationId}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onOpenFileInPreview={handleOpenFileInPreview}
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
              />
            </div>
          }
        />
      </div>
      <RepoShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        repoName={fullName}
        shareContent={shareContent}
      />
    </div>
  );
}
