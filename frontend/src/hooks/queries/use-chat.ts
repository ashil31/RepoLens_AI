"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore, useChatStore } from "@/store";
import { sendChatMessage } from "@/services/chat.service";
import { queryKeys } from "@/lib/query-keys";

const STEP_UI_NAMES: Record<string, string> = {
  embedding: "Embedding query",
  searching: "Searching repository",
  retrieving: "Reading code",
  reasoning: "Analyzing architecture",
  generating: "Generating response",
};

export interface SendChatVariables {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  convId: string;
  messageId: string;
}

export interface SendChatResult {
  content: string;
  sources: { file: string; startLine: number; endLine: number; symbolName?: string; contentSnippet?: string }[];
}

export function useChatMutation(workspaceId: string | null, repoId: string | null) {
  const updateMessage = useChatStore((s) => s.updateMessage);

  const mutation = useMutation({
    mutationKey: [...queryKeys.chat(workspaceId ?? "", repoId ?? ""), "send"] as const,
    mutationFn: async (variables: SendChatVariables): Promise<SendChatResult> => {
      if (!workspaceId || !repoId) {
        throw new Error("Workspace and repository are required");
      }

      const token = useAuthStore.getState().accessToken;
      let accumulatedContent = "";
      let finalSources: SendChatResult["sources"] = [];

      await sendChatMessage({
        workspaceId,
        repoId,
        message: variables.message,
        messageId: variables.messageId,
        history: variables.history,
        accessToken: token,
        onEvent: (event) => {
          if (event.id !== variables.messageId) return;

          if (event.type === "step") {
            const name = STEP_UI_NAMES[event.step] ?? event.step;
            const DEFAULT_STEPS = [
              { name: "Embedding query", status: "pending" as const },
              { name: "Searching repository", status: "pending" as const },
              { name: "Reading code", status: "pending" as const },
              { name: "Analyzing architecture", status: "pending" as const },
              { name: "Generating response", status: "pending" as const },
            ];
            const state = useChatStore.getState();
            const convs = state.conversations[repoId] ?? [];
            const conv = convs.find((c) => c.id === variables.convId);
            const msg = conv?.messages.find((m) => m.id === variables.messageId);
            const steps = msg?.steps ?? DEFAULT_STEPS;
            const idx = ["embedding", "searching", "retrieving", "reasoning", "generating"].indexOf(event.step);
            const next = [...steps];
            if (idx >= 0 && idx < next.length) {
              next[idx] = {
                name,
                status: event.status === "done" ? "done" : "active",
                duration: event.duration,
              };
            }
            updateMessage(repoId, variables.convId, variables.messageId, { steps: next });
          } else if (event.type === "metrics") {
            updateMessage(repoId, variables.convId, variables.messageId, {
              metrics: {
                filesExplored: event.filesExplored,
                searches: event.searches,
                chunksRetrieved: event.chunksRetrieved,
              },
            });
          } else if (event.type === "sources") {
            finalSources = event.data;
            updateMessage(repoId, variables.convId, variables.messageId, { sources: event.data });
          } else if (event.type === "content") {
            accumulatedContent += event.data;
            updateMessage(repoId, variables.convId, variables.messageId, { content: accumulatedContent });
          } else if (event.type === "error") {
            const errMsg =
              typeof event.data === "string" && event.data.startsWith("{")
                ? (() => {
                    try {
                      const p = JSON.parse(event.data);
                      return p?.message ?? event.data;
                    } catch {
                      return event.data;
                    }
                  })()
                : event.data;
            updateMessage(repoId, variables.convId, variables.messageId, {
              status: "error",
              errorMessage: errMsg,
            });
            throw new Error(errMsg);
          } else if (event.type === "done") {
            updateMessage(repoId, variables.convId, variables.messageId, {
              status: "done",
            });
          }
        },
      });

      return { content: accumulatedContent, sources: finalSources };
    },
  });

  const sendMessage = useCallback(
    async (
      message: string,
      history: { role: "user" | "assistant"; content: string }[],
      options: { convId: string; messageId: string }
    ) => {
      return mutation.mutateAsync({ message, history, convId: options.convId, messageId: options.messageId });
    },
    [mutation]
  );

  return {
    sendMessage,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
