/**
 * Chat service: SSE streaming chat with repository context.
 * On 401, attempts token refresh and retries once (same as api client).
 */

import { tryRefreshToken } from "@/lib/api";

export interface ChatSource {
  file: string;
  startLine: number;
  endLine: number;
  symbolName?: string;
  contentSnippet?: string;
}

export type ChatEvent =
  | { id: string; type: "step"; step: string; status: "active" | "done"; duration?: number }
  | { id: string; type: "metrics"; filesExplored: number; searches: number; chunksRetrieved: number }
  | { id: string; type: "sources"; data: ChatSource[] }
  | { id: string; type: "content"; data: string }
  | { id: string; type: "error"; data: string }
  | { id: string; type: "done" };

export interface SendChatOptions {
  workspaceId: string;
  repoId: string;
  message: string;
  messageId?: string;
  history: { role: "user" | "assistant"; content: string }[];
  accessToken: string | null;
  onEvent: (event: ChatEvent) => void;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
}

/**
 * Sends a chat message and streams the response via SSE.
 * Calls onEvent for each parsed event (step, metrics, sources, content, error, done).
 */
function parseErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return parsed?.message ?? raw;
  } catch {
    return raw;
  }
}

export async function sendChatMessage(options: SendChatOptions): Promise<void> {
  const { workspaceId, repoId, message, messageId: clientMessageId, history, accessToken, onEvent } = options;
  const url = `${getBaseUrl()}/workspaces/${workspaceId}/repos/${repoId}/chat`;

  const doFetch = (token: string | null) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history, messageId: clientMessageId }),
    });

  let res = await doFetch(accessToken);

  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  if (!res.ok) {
    const errRaw = await res.text().catch(() => "Chat request failed");
    const errMsg = parseErrorMessage(errRaw);
    onEvent({ id: clientMessageId ?? "", type: "error", data: errMsg });
    throw new Error(errMsg);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onEvent({ id: clientMessageId ?? "", type: "error", data: "No response body" });
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const dataStr = trimmed.slice(6).trim();
      if (dataStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(dataStr);
        const id = parsed.id ?? clientMessageId ?? "";

        if (parsed.type === "step") {
          onEvent({
            id,
            type: "step",
            step: parsed.step ?? "",
            status: parsed.status ?? "active",
            duration: parsed.duration,
          });
        } else if (parsed.type === "metrics") {
          onEvent({
            id,
            type: "metrics",
            filesExplored: parsed.filesExplored ?? 0,
            searches: parsed.searches ?? 0,
            chunksRetrieved: parsed.chunksRetrieved ?? 0,
          });
        } else if (parsed.type === "sources") {
          onEvent({ id, type: "sources", data: parsed.data ?? [] });
        } else if (parsed.type === "content") {
          onEvent({ id, type: "content", data: parsed.data ?? "" });
        } else if (parsed.type === "error") {
          onEvent({ id, type: "error", data: parsed.data ?? "Unknown error" });
        } else if (parsed.type === "done") {
          onEvent({ id, type: "done" });
        }
      } catch {
        // Ignore partial JSON
      }
    }
  }
}
