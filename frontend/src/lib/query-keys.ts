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
  repositoryFileContent: (workspaceId: string, repoId: string, fileId: string) =>
    ["workspaces", workspaceId, "repositories", repoId, "files", fileId] as const,
  githubInstallation: (workspaceId: string) =>
    ["workspaces", workspaceId, "github", "installation"] as const,
  githubRepositories: (workspaceId: string) =>
    ["workspaces", workspaceId, "github", "repositories"] as const,
  profile: ["profile"] as const,
  sessions: ["sessions"] as const,
  analysisJob: (jobId: string) => ["analysis", "jobs", jobId] as const,
  chat: (workspaceId: string, repoId: string) =>
    ["chat", workspaceId, repoId] as const,
};
