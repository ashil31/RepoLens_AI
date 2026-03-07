/**
 * TanStack Query key factory. Use for cache keys and invalidation.
 */

export const queryKeys = {
  currentUser: ["currentUser"] as const,
  workspaces: ["workspaces"] as const,
  workspace: (id: string) => ["workspaces", id] as const,
  repositories: (workspaceId: string) => ["workspaces", workspaceId, "repositories"] as const,
  repository: (workspaceId: string, repoId: string) =>
    ["workspaces", workspaceId, "repositories", repoId] as const,
  profile: ["profile"] as const,
  sessions: ["sessions"] as const,
};
