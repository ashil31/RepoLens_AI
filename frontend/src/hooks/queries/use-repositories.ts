"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
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
    status: r.status,
    activeJob: r.activeJob ?? null,
    files: r.files,
    documentation: r.documentation ?? null,
    architecture: r.architecture ?? null,
    dependencies: r.dependencies ?? [],
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

export function useRepositoryFileContent(
  workspaceId: string | null,
  repoId: string | null,
  fileId: string | null
) {
  return useQuery({
    queryKey: queryKeys.repositoryFileContent(
      workspaceId ?? "",
      repoId ?? "",
      fileId ?? ""
    ),
    queryFn: async () => {
      const res = await repositoryService.getRepositoryFileContent(
        workspaceId!,
        repoId!,
        fileId!
      );
      return res.data;
    },
    enabled: !!workspaceId && !!repoId && !!fileId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddRepository(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: string | { githubUrl: string } | { repositoryFullName: string }) => {
      const data =
        typeof input === "string"
          ? { githubUrl: input }
          : "repositoryFullName" in input
            ? { repositoryFullName: input.repositoryFullName }
            : { githubUrl: input.githubUrl };
      return repositoryService.addRepository(workspaceId, data);
    },
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
    onSuccess: (_, repoId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories(workspaceId) });
      queryClient.removeQueries({ queryKey: queryKeys.repository(workspaceId, repoId) });
      toast.success("Repository removed", "The repository has been disconnected from this workspace.");
    },
    onError: (err: Error) => {
      toast.error("Failed to remove repository", err.message);
    },
  });
}

// ── GitHub (workspace connection) ─────────────────────────────────────────────

export function useGitHubInstallationStatus(workspaceId?: string | null) {
  const selectedFromStore = useAppStore((s) => s.selectedWorkspaceId);
  const effectiveWorkspaceId = workspaceId ?? selectedFromStore;

  return useQuery({
    queryKey: queryKeys.githubInstallation(effectiveWorkspaceId ?? ""),
    queryFn: () => repositoryService.getGitHubInstallationStatus(effectiveWorkspaceId!),
    enabled: !!effectiveWorkspaceId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useGitHubRepositories(workspaceId?: string | null) {
  const selectedFromStore = useAppStore((s) => s.selectedWorkspaceId);
  const effectiveWorkspaceId = workspaceId ?? selectedFromStore;

  return useQuery({
    queryKey: queryKeys.githubRepositories(effectiveWorkspaceId ?? ""),
    queryFn: () => repositoryService.getGitHubRepositories(effectiveWorkspaceId!),
    enabled: !!effectiveWorkspaceId,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useInstallGitHub(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (installationId: number) =>
      repositoryService.installGitHub(workspaceId, installationId),
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.githubInstallation(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.githubRepositories(workspaceId) });
    },
  });
}

export function useDisconnectGitHub(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repositoryService.disconnectGitHub(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.githubInstallation(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.githubRepositories(workspaceId) });
    },
  });
}

export type { Repository };
