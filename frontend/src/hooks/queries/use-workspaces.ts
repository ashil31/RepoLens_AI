"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import * as workspaceService from "@/services/workspace.service";
import type { Workspace } from "@/types/user";

function mapWorkspace(w: workspaceService.WorkspaceResponse["data"]): Workspace {
  return {
    id: w.id,
    name: w.name,
    plan: "Hobby",
    slug: w.name?.toLowerCase().replace(/\s+/g, "-"),
    members: (w as Workspace).members,
    createdAt: (w as Workspace).createdAt,
    updatedAt: (w as Workspace).updatedAt,
  };
}

export function useWorkspaces() {
  const query = useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: async () => {
      const res = await workspaceService.getWorkspaces();
      return (res.data || []).map(mapWorkspace);
    },
    staleTime: 5 * 60 * 1000,
  });
  return query;
}

export function useWorkspace(id: string | null) {
  return useQuery({
    queryKey: queryKeys.workspace(id!),
    queryFn: () => workspaceService.getWorkspaceById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => workspaceService.createWorkspace({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}

export function useUpdateWorkspace(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => workspaceService.updateWorkspace(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(id) });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceService.deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}

export function useAddMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role?: "OWNER" | "MEMBER" }) =>
      workspaceService.addMember(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    },
  });
}

export type { Workspace };
