"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import * as repositoryService from "@/services/repository.service";
import type { Repository } from "@/types/user";
import { useAppStore } from "@/store";

function mapRepo(r: repositoryService.RepositoryResponse["data"]): Repository {
  return {
    id: r.id,
    name: r.name,
    owner: r.owner,
    fullName: r.owner && r.name ? `${r.owner}/${r.name}` : r.fullName,
    slug: r.name,
    description: r.description,
    language: r.language,
    stars: r.stars,
    isPrivate: r.isPrivate,
    repoUrl: r.repoUrl,
    analyzedAt: r.analyzedAt,
    workspaceId: r.workspaceId,
    files: r.files,
  };
}

/** If workspaceId is not passed, uses selectedWorkspaceId from app store. */
export function useRepositories(workspaceId?: string | null) {
  const selectedFromStore = useAppStore((s) => s.selectedWorkspaceId);
  const effectiveWorkspaceId = workspaceId ?? selectedFromStore;

  const query = useQuery({
    queryKey: queryKeys.repositories(effectiveWorkspaceId ?? ""),
    queryFn: async () => {
      const res = await repositoryService.getWorkspaceRepositories(effectiveWorkspaceId!);
      return (res.data || []).map(mapRepo);
    },
    enabled: !!effectiveWorkspaceId,
    staleTime: 5 * 60 * 1000,
  });
  return query;
}

export function useRepository(workspaceId: string | null, repoId: string | null) {
  return useQuery({
    queryKey: queryKeys.repository(workspaceId ?? "", repoId ?? ""),
    queryFn: async () => {
      const res = await repositoryService.getRepositoryDetails(workspaceId!, repoId!);
      return mapRepo(res.data);
    },
    enabled: !!workspaceId && !!repoId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddRepository(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (githubUrl: string) =>
      repositoryService.addRepository(workspaceId, { githubUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories(workspaceId) });
    },
  });
}

export function useDeleteRepository(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (repoId: string) =>
      repositoryService.deleteRepository(workspaceId, repoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories(workspaceId) });
    },
  });
}

export type { Repository };
