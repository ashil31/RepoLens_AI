"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardPageShell } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store";
import { useRepositories, useAddRepository } from "@/hooks/queries";

export default function RepositoriesPage() {
  const selectedWorkspaceId = useAppStore((s) => s.selectedWorkspaceId);
  const { data: repositories, isLoading, isError } = useRepositories();
  const addRepo = useAddRepository(selectedWorkspaceId ?? "");
  const [githubUrl, setGithubUrl] = useState("");

  const handleAdd = () => {
    const url = githubUrl.trim();
    if (!url || !selectedWorkspaceId) return;
    addRepo.mutate(url, {
      onSuccess: () => setGithubUrl(""),
    });
  };

  return (
    <DashboardPageShell
      title="Repositories"
      tabs={[
        { label: "All", value: "all", href: "/dashboard/repositories" },
        { label: "Connected", value: "connected", href: "/dashboard/repositories/connected" },
      ]}
      actions={
        selectedWorkspaceId ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="min-w-[280px]"
            />
            <Button
              onClick={handleAdd}
              disabled={addRepo.isPending || !githubUrl.trim()}
            >
              {addRepo.isPending ? "Adding…" : "Add repository"}
            </Button>
          </div>
        ) : null
      }
    >
      {!selectedWorkspaceId ? (
        <p className="text-muted-foreground">Select a workspace from the sidebar to view and add repositories.</p>
      ) : isError ? (
        <p className="text-destructive">Failed to load repositories.</p>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {addRepo.isError && (
            <p className="text-sm text-destructive">{(addRepo.error as Error).message}</p>
          )}
          {repositories?.length === 0 ? (
            <p className="text-muted-foreground">No repositories yet. Add one with the GitHub URL above.</p>
          ) : (
            <ul className="space-y-2">
              {repositories?.map((repo) => (
                <li key={repo.id}>
                  <Link
                    href={`/dashboard/repositories/${repo.id}`}
                    className="block rounded-lg border border-border bg-muted/30 px-4 py-3 hover:bg-accent"
                  >
                    <span className="font-medium text-foreground">{repo.name}</span>
                    {repo.fullName && (
                      <span className="ml-2 text-sm text-muted-foreground">{repo.fullName}</span>
                    )}
                    {repo.language && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {repo.language}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
