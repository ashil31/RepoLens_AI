"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getSessions, revokeSession as revokeSessionApi } from "@/services/auth.service";
import type { Session } from "@/types/user";

function mapSession(
  s: { id: string; device: string | null; ip: string | null; createdAt: string; expiresAt: string },
  currentSessionId: string | null
): Session {
  return {
    id: s.id,
    device: s.device,
    ip: s.ip,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    browser: parseBrowser(s.device),
    os: parseOs(s.device),
    isCurrent: currentSessionId !== null && s.id === currentSessionId,
    location: s.ip ? (s.ip === "::1" ? "Localhost" : s.ip) : "Unknown",
    lastActive: formatRelativeTime(s.createdAt),
  };
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return ua.length > 40 ? ua.slice(0, 40) + "…" : ua;
}

function parseOs(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS") || ua.includes("Macintosh")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
}

function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

export function useSessions() {
  const query = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: async () => {
      const res = await getSessions();
      const currentSessionId = res.currentSessionId ?? null;
      return (res.sessions || []).map((s) => mapSession(s, currentSessionId));
    },
    staleTime: 2 * 60 * 1000,
  });
  return query;
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeSessionApi,
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions });
      const prev = queryClient.getQueryData<Session[]>(queryKeys.sessions);
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) =>
        old ? old.filter((s) => s.id !== sessionId) : []
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(queryKeys.sessions, context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export type { Session };
