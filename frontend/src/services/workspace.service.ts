import { api } from "@/lib/api/client";
import type { Workspace } from "@/types/user";

export interface CreateWorkspaceInput {
  name: string;
}

export interface WorkspaceResponse {
  data: Workspace;
  message?: string;
}

export interface WorkspacesListResponse {
  data: Workspace[];
}

export interface AddMemberInput {
  email: string;
  role?: "OWNER" | "MEMBER";
}

export async function createWorkspace(data: CreateWorkspaceInput): Promise<WorkspaceResponse> {
  return api.post<WorkspaceResponse>("/workspaces", data);
}

export async function getWorkspaces(): Promise<WorkspacesListResponse> {
  return api.get<WorkspacesListResponse>("/workspaces");
}

export async function getWorkspaceById(id: string): Promise<WorkspaceResponse> {
  return api.get<WorkspaceResponse>(`/workspaces/${id}`);
}

export async function updateWorkspace(id: string, data: { name: string }): Promise<WorkspaceResponse> {
  return api.put<WorkspaceResponse>(`/workspaces/${id}`, data);
}

export async function deleteWorkspace(id: string): Promise<{ message: string }> {
  return api.delete(`/workspaces/${id}`);
}

export async function addMember(workspaceId: string, data: AddMemberInput): Promise<{ message: string; data: unknown }> {
  return api.post(`/workspaces/${workspaceId}/members`, data);
}

export async function removeMember(workspaceId: string, userId: string): Promise<{ message: string }> {
  return api.delete(`/workspaces/${workspaceId}/members/${userId}`);
}
