import { api } from "@/lib/api/client";
import type { Repository } from "@/types/user";

export interface AddRepositoryInput {
  githubUrl?: string;
  repositoryFullName?: string;
}

export interface RepositoriesListResponse {
  data: Repository[];
}

export interface RepositoryResponse {
  data: Repository;
}

export async function getWorkspaceRepositories(workspaceId: string): Promise<RepositoriesListResponse> {
  return api.get<RepositoriesListResponse>(`/workspaces/${workspaceId}/repos`);
}

export async function addRepository(workspaceId: string, data: AddRepositoryInput): Promise<RepositoryResponse> {
  return api.post<RepositoryResponse>(`/workspaces/${workspaceId}/repos/add`, data);
}

export async function getRepositoryDetails(workspaceId: string, repoId: string): Promise<RepositoryResponse> {
  return api.get<RepositoryResponse>(`/workspaces/${workspaceId}/repos/${repoId}`);
}

export async function deleteRepository(workspaceId: string, repoId: string): Promise<{ message: string }> {
  return api.delete(`/workspaces/${workspaceId}/repos/${repoId}`);
}

// ── GitHub (workspace connection) ─────────────────────────────────────────────

export interface GitHubInstallationStatusResponse {
  connected: boolean;
  accountLogin: string | null;
}

export interface GitHubRepoItem {
  fullName?: string;
  name?: string;
  private?: boolean;
  defaultBranch?: string;
  updatedAt?: string;
  description?: string;
  language?: string;
  stars?: number;
  owner?: string;
}

export interface GitHubRepositoriesResponse {
  data: GitHubRepoItem[];
  connected: boolean;
  accountLogin: string | null;
}

export async function getGitHubInstallationStatus(workspaceId: string): Promise<GitHubInstallationStatusResponse> {
  return api.get<GitHubInstallationStatusResponse>(`/workspaces/${workspaceId}/repos/github/installation`);
}

export async function getGitHubRepositories(workspaceId: string): Promise<GitHubRepositoriesResponse> {
  return api.get<GitHubRepositoriesResponse>(`/workspaces/${workspaceId}/repos/github/repositories`);
}

export async function installGitHub(workspaceId: string, installationId: number): Promise<{ message: string; data: { accountLogin: string } }> {
  return api.post(`/workspaces/${workspaceId}/repos/github/install`, { installationId });
}

export async function disconnectGitHub(workspaceId: string): Promise<{ message: string }> {
  return api.delete(`/workspaces/${workspaceId}/repos/github/installation`);
}
