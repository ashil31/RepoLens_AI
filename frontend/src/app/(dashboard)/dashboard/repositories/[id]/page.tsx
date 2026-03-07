"use client";

import { use } from "react";
import Link from "next/link";
import { DashboardPageShell } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { useRepository, useDeleteRepository } from "@/hooks/queries";

type PageProps = { params: Promise<{ id: string }> };

export default function RepoPage({ params }: PageProps) {
  const { id: repoId } = use(params);
  const selectedWorkspaceId = useAppStore((s) => s.selectedWorkspaceId);
  const { data: repo, isLoading, isError } = useRepository(selectedWorkspaceId, repoId);
  const deleteRepo = useDeleteRepository(selectedWorkspaceId ?? "");

  if (!selectedWorkspaceId) {
    return (
      <DashboardPageShell title="Repository">
        <p className="text-muted-foreground">Select a workspace from the sidebar.</p>
      </DashboardPageShell>
    );
  }

  if (isError || (!isLoading && !repo)) {
    return (
      <DashboardPageShell title="Repository">
        <p className="text-muted-foreground">Repository not found.</p>
        <Link href="/dashboard/repositories">
          <Button variant="outline" className="mt-4">Back to repositories</Button>
        </Link>
      </DashboardPageShell>
    );
  }

  if (isLoading || !repo) {
    return (
      <DashboardPageShell title="Repository">
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </DashboardPageShell>
    );
  }

  const handleDelete = () => {
    if (!confirm("Remove this repository from the workspace?")) return;
    deleteRepo.mutate(repoId, {
      onSuccess: () => window.location.href = "/dashboard/repositories",
    });
  };

  return (
    <DashboardPageShell
      title={repo.name}
      actions={
        <Button
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={deleteRepo.isPending}
        >
          {deleteRepo.isPending ? "Removing…" : "Remove"}
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-muted-foreground">{repo.description || "No description."}</p>
        <div className="flex flex-wrap gap-2">
          {repo.language && (
            <span className="rounded bg-muted px-2 py-1 text-sm text-muted-foreground">
              {repo.language}
            </span>
          )}
          {repo.stars != null && (
            <span className="text-sm text-muted-foreground">★ {repo.stars}</span>
          )}
          {repo.repoUrl && (
            <a
              href={repo.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline"
            >
              Open on GitHub
            </a>
          )}
        </div>
        {repo.files && repo.files.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground">Files</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {repo.files.slice(0, 20).map((f) => (
                <li key={f.id}>{f.path}</li>
              ))}
              {repo.files.length > 20 && (
                <li>… and {repo.files.length - 20} more</li>
              )}
            </ul>
          </div>
        )}
        <Link href="/dashboard/repositories">
          <Button variant="outline">Back to repositories</Button>
        </Link>
      </div>
    </DashboardPageShell>
  );
}
