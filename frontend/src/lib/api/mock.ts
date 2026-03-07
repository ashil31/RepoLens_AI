/**
 * Mock API layer. Replace with real API client when backend is ready.
 * Simulates network delay for realistic loading states.
 */

import type { CurrentUser } from "@/types/user";
import type { Workspace } from "@/types/user";
import type { Repository } from "@/types/user";
import type { Profile } from "@/types/user";
import type { Session } from "@/types/user";

const MOCK_DELAY_MS = 300;

function delay(ms: number = MOCK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  await delay();
  return {
    id: "user-1",
    displayName: "ashil31",
    email: "ashilpatel.aa134@gmail.com",
    avatarUrl: null,
    workspacePlan: "Hobby",
  };
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  await delay();
  return [
    { id: "ws-1", name: "ashil31's projects", plan: "Hobby", slug: "ashil31" },
  ];
}

export async function fetchRepositories(): Promise<Repository[]> {
  await delay();
  return [
    { id: "repo-1", name: "RepoLens", fullName: "ashil31/RepoLens", slug: "repolens" },
    { id: "repo-2", name: "reclip-ai", fullName: "ashil31/reclip-ai", slug: "reclip-ai" },
    { id: "repo-3", name: "portfolio", fullName: "ashil31/portfolio", slug: "portfolio" },
    { id: "repo-4", name: "trendmind", fullName: "ashil31/trendmind", slug: "trendmind" },
    { id: "repo-5", name: "trendmind-frontend", fullName: "ashil31/trendmind-frontend", slug: "trendmind-frontend" },
  ];
}

/** Profile for Settings (mock). Replace with real GET /profile when ready. */
export async function fetchProfile(): Promise<Profile> {
  await delay();
  return {
    email: "ap9045297754@gmail.com",
    fullName: "AP Patel",
    username: "ap9045297754",
    avatarUrl: null,
  };
}

/** Sessions list (mock). Replace with real GET /sessions when ready. */
export async function fetchSessions(): Promise<Session[]> {
  await delay();
  return [
    { id: "sess-1", browser: "Chrome", os: "Windows", isCurrent: true, location: "Ahmedabad, IN", lastActive: "Now" },
    { id: "sess-2", browser: "Firefox", os: "macOS", isCurrent: false, location: "Mumbai, IN", lastActive: "2 hours ago" },
  ];
}

/** Revoke a session (mock). Replace with real DELETE /sessions/:id when ready. */
export async function deleteSession(id: string): Promise<void> {
  await delay();
  // No-op; real API would delete the session
}
