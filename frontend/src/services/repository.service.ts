import { api } from "@/lib/api/client";
import type { Repository } from "@/types/user";

export interface AddRepositoryInput {
  githubUrl: string;
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
