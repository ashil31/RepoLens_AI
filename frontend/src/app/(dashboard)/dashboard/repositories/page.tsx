"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardPageShell } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store";
import {
  useRepositories,
  useAddRepository,
  useGitHubInstallationStatus,
  useGitHubRepositories,
} from "@/hooks/queries";
import { toast } from "@/lib/toast";
import { queryKeys } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Github, Check, Plus } from "lucide-react";

// Fallback so Connect GitHub works without .env.local (replace repolens-dev with your app slug if different)
const GITHUB_INSTALL_URL =
  process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL ||
  "https://github.com/apps/repolens-dev/installations/new";

export default function RepositoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const selectedWorkspaceId = useAppStore((s) => s.selectedWorkspaceId);
  const setSelectedWorkspaceId = useAppStore((s) => s.setSelectedWorkspaceId);
  const { data: repositories, isLoading, isError } = useRepositories();
  const { data: githubStatus, isLoading: githubStatusLoading } =
    useGitHubInstallationStatus();
  const {
    data: githubReposData,
    isLoading: githubReposLoading,
    refetch: refetchGitHubRepos,
  } = useGitHubRepositories();
  const addRepo = useAddRepository(selectedWorkspaceId ?? "");
  const [githubUrl, setGithubUrl] = useState("");
  const [repoSearch, setRepoSearch] = useState("");
  const [addingFullName, setAddingFullName] = useState<string | null>(null);

  // After GitHub callback: ensure we're on the right workspace and refetch so "connected" + repo list show
  useEffect(() => {
    const fromCallback = searchParams.get("github") === "connected";
    const workspaceFromUrl = searchParams.get("workspace");
    if (fromCallback && workspaceFromUrl) {
      setSelectedWorkspaceId(workspaceFromUrl);
      queryClient.invalidateQueries({
        queryKey: queryKeys.githubInstallation(workspaceFromUrl),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.githubRepositories(workspaceFromUrl),
      });
      router.replace("/dashboard/repositories", { scroll: false });
      toast.success(
        "GitHub connected",
        "You can now import repositories from your account.",
      );
    }
  }, [searchParams, setSelectedWorkspaceId, queryClient, router]);

  // Connected if EITHER status or repos response says so (fixes stale "not connected" after callback)
  const connected =
    (githubStatus?.connected ?? false) || (githubReposData?.connected ?? false);
  const accountLogin =
    githubStatus?.accountLogin ?? githubReposData?.accountLogin ?? null;
  const githubRepos = githubReposData?.data ?? [];

  // Already-added repo full names (for showing "Added" vs "Import")
  const addedFullNames = useMemo(
    () => new Set((repositories ?? []).map((r) => r.fullName).filter(Boolean)),
    [repositories],
  );

  // Filter GitHub repos by search
  const filteredGitHubRepos = useMemo(() => {
    if (!repoSearch.trim()) return githubRepos;
    const q = repoSearch.trim().toLowerCase();
    return githubRepos.filter((repo) => {
      const fullName =
        repo.fullName ??
        (repo.owner && repo.name ? `${repo.owner}/${repo.name}` : "");
      return fullName.toLowerCase().includes(q);
    });
  }, [githubRepos, repoSearch]);

  const handleConnectGitHub = () => {
    if (!selectedWorkspaceId) return;
    const baseUrl = GITHUB_INSTALL_URL;
    if (!baseUrl) return;
    try {
      const url = new URL(baseUrl);
      url.searchParams.set("state", selectedWorkspaceId);
      window.location.href = url.toString();
    } catch {
      console.error("Invalid GITHUB_APP_INSTALL_URL:", baseUrl);
    }
  };

  const handleAddByUrl = () => {
    const url = githubUrl.trim();
    if (!url || !selectedWorkspaceId) return;
    addRepo.mutate(url, {
      onSuccess: () => {
        setGithubUrl("");
        toast.success(
          "Repository added",
          "The repository has been added to your workspace.",
        );
      },
      onError: (err) =>
        toast.error("Failed to add repository", (err as Error).message),
    });
  };

  const handleAddFromGitHub = (fullName: string) => {
    if (!selectedWorkspaceId || !fullName) return;
    setAddingFullName(fullName);
    addRepo.mutate(
      { repositoryFullName: fullName },
      {
        onSuccess: () => {
          refetchGitHubRepos();
          toast.success(
            "Repository added",
            `${fullName} has been added to your workspace.`,
          );
        },
        onError: (err) =>
          toast.error("Failed to add repository", (err as Error).message),
        onSettled: () => setAddingFullName(null),
      },
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-x-hidden">
      <div className="dashboard-content-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <DashboardPageShell
          title="Repositories"
          tabs={[
            { label: "All", value: "all", href: "/dashboard/repositories" },
            {
              label: "Connected",
              value: "connected",
              href: "/dashboard/repositories/connected",
            },
          ]}
          activeTab="all"
        >
          {!selectedWorkspaceId ? (
            <p className="text-muted-foreground">
              Select a workspace from the sidebar to view and add repositories.
            </p>
          ) : isError ? (
            <p className="text-destructive">Failed to load repositories.</p>
          ) : (
            <div className="min-w-0 space-y-8">
              {/* Import from GitHub — Vercel-style: connect then select from list */}
              <section>
                <h2 className="text-lg font-medium text-foreground">
                  Import from GitHub
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Connect your GitHub account and select repositories to import.
                </p>
                <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-border bg-card p-0">
                  {githubStatusLoading && !githubReposData ? (
                    <div className="p-6">
                      <div className="h-10 w-48 animate-pulse rounded bg-muted" />
                    </div>
                  ) : connected ? (
                    <>
                      <div className="flex flex-col gap-2 border-b border-border bg-muted/30 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <Github className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 truncate text-sm font-medium text-foreground">
                            Connected as{" "}
                            <span className="text-foreground">
                              {accountLogin ?? "GitHub"}
                            </span>
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleConnectGitHub}
                          className="shrink-0"
                        >
                          Change account
                        </Button>
                      </div>
                      <div className="min-w-0 p-3 sm:p-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          Select repositories to add to this workspace.
                        </p>
                        <div className="relative mb-4 min-w-0">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                          <Input
                            placeholder="Search repositories…"
                            value={repoSearch}
                            onChange={(e) => setRepoSearch(e.target.value)}
                            className="min-w-0 pl-9 bg-background"
                          />
                        </div>
                        {githubReposLoading ? (
                          <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className="h-14 animate-pulse rounded-lg bg-muted"
                              />
                            ))}
                          </div>
                        ) : filteredGitHubRepos.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4">
                            {repoSearch.trim()
                              ? "No repositories match your search."
                              : "No repositories found for this installation."}
                          </p>
                        ) : (
                          <>
                            <ul className="min-w-0 space-y-1 overflow-y-auto rounded-lg border border-border max-h-[220px]">
                              {filteredGitHubRepos.map((repo) => {
                                const fullName =
                                  repo.fullName ??
                                  (repo.owner && repo.name
                                    ? `${repo.owner}/${repo.name}`
                                    : "");
                                if (!fullName) return null;
                                const isAdded = addedFullNames.has(fullName);
                                const visibility = repo.private
                                  ? "Private"
                                  : "Public";
                                const updatedStr = repo.updatedAt
                                  ? (() => {
                                      const d = new Date(repo.updatedAt);
                                      const now = new Date();
                                      const diffMs =
                                        now.getTime() - d.getTime();
                                      const diffDays = Math.floor(
                                        diffMs / (1000 * 60 * 60 * 24),
                                      );
                                      if (diffDays === 0)
                                        return "Updated today";
                                      if (diffDays === 1)
                                        return "Updated yesterday";
                                      if (diffDays < 7)
                                        return `Updated ${diffDays} days ago`;
                                      if (diffDays < 30)
                                        return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
                                      return d.toLocaleDateString();
                                    })()
                                  : null;
                                return (
                                  <li
                                    key={fullName}
                                    className="flex min-w-0 flex-col gap-2 border-b border-border bg-background px-3 py-3 last:border-b-0 hover:bg-muted/50 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="truncate text-sm font-medium text-foreground">
                                          {fullName}
                                        </span>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                          {visibility}
                                        </span>
                                      </div>
                                      {(repo.description ||
                                        repo.language ||
                                        repo.stars != null ||
                                        updatedStr) && (
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                          {repo.description && (
                                            <span
                                              className="line-clamp-1 max-w-full sm:max-w-md"
                                              title={repo.description}
                                            >
                                              {repo.description}
                                            </span>
                                          )}
                                          {repo.language && (
                                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5">
                                              {repo.language}
                                            </span>
                                          )}
                                          {repo.stars != null &&
                                            repo.stars > 0 && (
                                              <span className="shrink-0">
                                                ★ {repo.stars}
                                              </span>
                                            )}
                                          {updatedStr && (
                                            <span className="shrink-0">
                                              {updatedStr}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="shrink-0 pt-0.5">
                                      {isAdded ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                                          <Check className="h-3.5 w-3.5" />
                                          Added
                                        </span>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleAddFromGitHub(fullName)
                                          }
                                          disabled={addingFullName === fullName}
                                          className="w-full cursor-pointer sm:w-auto"
                                        >
                                          <Plus className="h-3.5 w-3.5 shrink-0 sm:mr-1" />
                                          {addingFullName === fullName
                                            ? "Adding…"
                                            : "Import"}
                                        </Button>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                            {filteredGitHubRepos.length > 4 && (
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                Scroll the list above to see all repos.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="min-w-0 p-4 text-center sm:p-6">
                      <Github className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="mb-4 text-sm text-muted-foreground">
                        Connect GitHub to import repositories from your account.
                      </p>
                      <Button
                        onClick={handleConnectGitHub}
                        disabled={!selectedWorkspaceId}
                        className="cursor-pointer"
                      >
                        Connect GitHub
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              {/* Paste repository URL */}
              <section className="min-w-0">
                <h2 className="text-lg font-medium text-foreground">
                  Paste repository URL
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Add a public repository by its GitHub URL.
                </p>
                <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <Input
                    placeholder="https://github.com/owner/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="min-w-0 flex-1 sm:min-w-[200px]"
                  />
                  <Button
                    onClick={handleAddByUrl}
                    disabled={addRepo.isPending || !githubUrl.trim()}
                    className="w-full shrink-0 cursor-pointer sm:w-auto"
                  >
                    {addRepo.isPending ? "Adding…" : "Add repository"}
                  </Button>
                </div>
                {addRepo.isError && (
                  <p className="mt-2 text-sm text-destructive">
                    {(addRepo.error as Error).message}
                  </p>
                )}
              </section>

              {/* Workspace repo list */}
              <section className="min-w-0">
                <h2 className="text-lg font-medium text-foreground">
                  Repositories in this workspace
                </h2>
                {isLoading ? (
                  <div className="mt-4 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-14 animate-pulse rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                ) : !repositories?.length ? (
                  <p className="mt-4 text-muted-foreground">
                    No repositories yet. Add one above.
                  </p>
                ) : (
                  <ul className="mt-4 min-w-0 space-y-2">
                    {repositories.map((repo) => (
                      <li key={repo.id}>
                        <Link
                          href={`/dashboard/repositories/${repo.id}`}
                          className="flex cursor-pointer flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3 hover:bg-accent sm:gap-2 sm:px-4"
                        >
                          <span className="min-w-0 truncate font-medium text-foreground">
                            {repo.name}
                          </span>
                          {repo.fullName && (
                            <span className="truncate text-sm text-muted-foreground">
                              {repo.fullName}
                            </span>
                          )}
                          {repo.language && (
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {repo.language}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </DashboardPageShell>
      </div>
    </div>
  );
}
