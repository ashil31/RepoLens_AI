"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { RepoMessages, type ChatMessage } from "./RepoMessages";
import { RepoInput } from "./RepoInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConversationItem = { id: string; title: string; messages: ChatMessage[] };

type RepoChatProps = {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isAnalyzing?: boolean;
  isPending?: boolean;
  conversations?: ConversationItem[];
  activeConversationId?: string | null;
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  onOpenFileInPreview?: (path: string, startLine?: number) => void;
  onCopyMessage?: (text: string) => void;
  onShareMessage?: (text: string) => void;
  onRegenerateMessage?: (messageId: string) => void;
  onExpand?: () => void;
  className?: string;
};

export function RepoChat({
  messages,
  onSendMessage,
  isAnalyzing = false,
  isPending = false,
  conversations = [],
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onOpenFileInPreview,
  onCopyMessage,
  onShareMessage,
  onRegenerateMessage,
  onExpand,
  className,
}: RepoChatProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const showSidebar = conversations.length > 0 || onNewChat;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (e.key === "c" && mod && e.shiftKey) {
        e.preventDefault();
        onNewChat?.();
        return;
      }
      if (e.key === "b" && mod) {
        e.preventDefault();
        if (showSidebar) setSidebarOpen((prev) => !prev);
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewChat, showSidebar]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full rounded-xl border border-border bg-card/30 overflow-hidden",
        className
      )}
    >
      {/* <AnimatePresence initial={false}>
        {showSidebar && sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 176 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden shrink-0 flex-col border-r border-border bg-muted/20 overflow-hidden md:flex"
          >
            <div className="flex w-44 shrink-0 flex-col">
              <div className="flex shrink-0 items-center justify-between border-b border-border p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start gap-2"
                  onClick={onNewChat}
                >
                  <MessageSquarePlus className="h-4 w-4 shrink-0" />
                  <span className="truncate">New chat</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2 dashboard-content-scroll">
                <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                  Recent conversations
                </p>
                <ul className="space-y-0.5">
                  {conversations.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onSelectConversation?.(c.id)}
                        className={cn(
                          "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                          activeConversationId === c.id
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        <span className="line-clamp-2">{c.title || "New chat"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence> */}
      {showSidebar && !sidebarOpen && (
        <div className="hidden shrink-0 flex-col border-r border-border bg-muted/20 md:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4 sm:py-2.5">
          <div>
            <h2 className="text-sm font-medium text-foreground">AI Chat</h2>
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ask questions about this repository
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onExpand && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onExpand}
                aria-label="Expand chat"
                className="h-8 w-8 shrink-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            {onNewChat && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNewChat}
                className="shrink-0 gap-1.5 md:hidden"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                New chat
              </Button>
            )}
          </div>
        </div>

        {isAnalyzing ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-sm font-medium text-muted-foreground"
            >
              RepoLens is analyzing this repository...
            </motion.div>
            <ul className="space-y-1.5 text-left text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">✔</span> cloning repository
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✔</span> scanning files
              </li>
              <li className="flex items-center gap-2">
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  ●
                </motion.span>{" "}
                generating documentation
              </li>
            </ul>
          </div>
        ) : (
          <>
            <RepoMessages
              messages={messages}
              onFileClick={onOpenFileInPreview}
              onCopy={onCopyMessage}
              onShare={onShareMessage}
              onRegenerate={onRegenerateMessage}
            />
            <RepoInput
              onSubmit={onSendMessage}
              disabled={isPending}
              showSuggestions={messages.length === 0}
            />
          </>
        )}
      </div>
    </div>
  );
}
