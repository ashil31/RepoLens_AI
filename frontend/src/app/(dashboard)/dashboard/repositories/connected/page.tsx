"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DashboardPageShell,
  type TabItem,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store";
import { useRepositories, useDeleteRepository } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { Repository } from "@/types/user";
import {
  Search,
  GitBranch,
  LayoutGrid,
  List,
  Github,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Trash2,
  FolderOpen,
} from "lucide-react";

const TABS: TabItem[] = [
  { label: "All", value: "all", href: "/dashboard/repositories" },
  { label: "Connected", value: "connected", href: "/dashboard/repositories/connected" },
];

type ViewMode = "grid" | "list";

function RepoStatusIcon({ repo }: { repo: Repository }) {
  if (repo.analyzedAt) {
    return (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" aria-hidden />
    );
  }
  return (
    <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
  );
}

function RepoActionsDropdown({
  repo,
  onDeletingChange,
}: {
  repo: Repository;
  onDeletingChange?: (deleting: boolean) => void;
}) {
  const router = useRouter();
  const workspaceId = useAppStore((s) => s.selectedWorkspaceId);
  const deleteRepo = useDeleteRepository(workspaceId ?? "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const href = `/dashboard/repositories/${repo.id}`;
  const repoLabel = repo.name ?? repo.fullName ?? "this repository";

  const isDeleting = deleteDialogOpen || deleteRepo.isPending;
  useEffect(() => {
    onDeletingChange?.(isDeleting);
    return () => onDeletingChange?.(false);
  }, [isDeleting, onDeletingChange]);

  const handleView = () => {
    router.push(href);
  };

  const handleDeleteClick = (e: Event) => {
    e.preventDefault();
    if (!workspaceId) return;
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteRepo.mutate(repo.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onSelect={handleView} className="cursor-pointer gap-2">
          <FolderOpen className="h-4 w-4 shrink-0" />
          View
        </DropdownMenuItem>
        {repo.repoUrl && (
          <DropdownMenuItem asChild>
            <a
              href={repo.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              View on GitHub
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleDeleteClick}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
          disabled={deleteRepo.isPending}
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent title="Remove repository" className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 px-6 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <DialogTitle className="text-base font-semibold leading-tight">
              Remove repository
            </DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Remove &quot;<span className="font-medium text-foreground">{repoLabel}</span>&quot; from this workspace? This will disconnect it from RepoLens but not delete it from GitHub.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 pb-6">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            className="cursor-pointer sm:min-w-[72px]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={deleteRepo.isPending}
            className="cursor-pointer sm:min-w-[72px]"
          >
            {deleteRepo.isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function RepoCardGrid({ repo }: { repo: Repository }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const displayUrl = repo.fullName ?? repo.repoUrl ?? "—";
  const href = `/dashboard/repositories/${repo.id}`;
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => {
        if (isDeleting) return;
        router.push(href);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isDeleting) return;
          router.push(href);
        }
      }}
      className="group flex min-w-0 cursor-pointer flex-col rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-accent hover:border-border"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <GitBranch className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{repo.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {repo.fullName ?? displayUrl}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <RepoStatusIcon repo={repo} />
          <RepoActionsDropdown repo={repo} onDeletingChange={setIsDeleting} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {repo.repoUrl ? (
          <a
            href={repo.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <Github className="h-3.5 w-3.5" />
            <span className="truncate">{repo.fullName ?? repo.name}</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
            <Github className="h-3.5 w-3.5" />
            <span className="truncate">{repo.fullName ?? repo.name}</span>
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <GitBranch className="h-3 w-3 shrink-0" />
        {repo.language && <span>{repo.language}</span>}
        {repo.language && repo.stars != null && repo.stars > 0 && (
          <span className="text-muted-foreground/60">·</span>
        )}
        {repo.stars != null && repo.stars > 0 && (
          <span>★ {repo.stars}</span>
        )}
        {!repo.language && (repo.stars == null || repo.stars === 0) && (
          <span>—</span>
        )}
      </div>
    </div>
  );
}

function RepoRowList({ repo }: { repo: Repository }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const displayUrl = repo.fullName ?? repo.repoUrl ?? "—";
  const href = `/dashboard/repositories/${repo.id}`;
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => {
        if (isDeleting) return;
        router.push(href);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isDeleting) return;
          router.push(href);
        }
      }}
      className="flex cursor-pointer flex-col gap-3 border-b border-border py-4 px-2 last:border-b-0 hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-6 sm:px-4 sm:py-4"
    >
      {/* Left: icon + name + path */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <GitBranch className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{repo.name}</p>
          <p className="truncate text-sm text-muted-foreground">{displayUrl}</p>
        </div>
      </div>
      {/* Right: GitHub pill + status + menu */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {repo.repoUrl ? (
          <a
            href={repo.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <Github className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[100px] truncate sm:max-w-[140px]">
              {repo.fullName ?? repo.name}
            </span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
            <Github className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[100px] truncate sm:max-w-[140px]">
              {repo.fullName ?? repo.name}
            </span>
          </span>
        )}
        <RepoStatusIcon repo={repo} />
        <RepoActionsDropdown repo={repo} onDeletingChange={setIsDeleting} />
      </div>
    </div>
  );
}

/* Skeleton matching the Connected page UI: toolbar + grid cards */
function ConnectedSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-9 w-full min-w-0 max-w-md rounded-lg bg-muted animate-pulse" />
        <div className="flex h-9 w-[140px] shrink-0 items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          <div className="h-6 w-12 rounded bg-muted animate-pulse" />
          <div className="h-4 w-px bg-border" />
          <div className="h-6 w-8 rounded bg-muted animate-pulse" />
          <div className="h-6 w-8 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex min-w-0 flex-col rounded-xl border border-border bg-muted/30 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-muted animate-pulse" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-4 max-w-[180px] rounded bg-muted animate-pulse" />
                  <div className="h-3 max-w-[120px] rounded bg-muted animate-pulse" />
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                <div className="h-8 w-8 rounded bg-muted animate-pulse" />
              </div>
            </div>
            <div className="mt-3 h-6 w-24 rounded-full bg-muted animate-pulse" />
            <div className="mt-2 flex gap-2">
              <div className="h-3 w-12 rounded bg-muted animate-pulse" />
              <div className="h-3 w-8 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function ConnectedRepositoriesPage() {
  const selectedWorkspaceId = useAppStore((s) => s.selectedWorkspaceId);
  const { data: repositories, isLoading, isError } = useRepositories();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredRepos = repositories?.filter((repo) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const name = (repo.name ?? "").toLowerCase();
    const fullName = (repo.fullName ?? "").toLowerCase();
    return name.includes(q) || fullName.includes(q);
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="dashboard-content-scroll min-h-0 flex-1 overflow-y-auto">
        <DashboardPageShell title="Repositories" tabs={TABS} activeTab="connected">
          {!selectedWorkspaceId ? (
            <p className="text-muted-foreground">
              Select a workspace from the sidebar to view connected repositories.
            </p>
          ) : isError ? (
            <p className="text-destructive">Failed to load repositories.</p>
          ) : isLoading ? (
            <ConnectedSkeleton />
          ) : !repositories?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <GitBranch className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">
                No repositories connected
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add repositories to this workspace from the All tab to see them
                here.
              </p>
              <Link
                href="/dashboard/repositories"
                className="mt-4 cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                Go to All repositories →
              </Link>
            </div>
          ) : (
            <>
              {/* Toolbar: search + filter + grid/list */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                  <Input
                    placeholder="Search repositories…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 min-w-0 pl-9 rounded-lg border-border bg-muted/30"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1 self-start rounded-lg border border-border bg-muted/30 p-1 sm:self-center">
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground cursor-pointer sm:px-2.5"
                    aria-label="Filter"
                  >
                    <SlidersHorizontal className="h-4 w-4 shrink-0" />
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  </Button> */}
                  <div className="h-4 w-px shrink-0 bg-border" />
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 shrink-0 cursor-pointer p-0",
                      viewMode === "grid"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 shrink-0 cursor-pointer p-0",
                      viewMode === "list"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {filteredRepos?.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No repositories match &quot;{search}&quot;.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-2 cursor-pointer text-sm font-medium text-primary hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="mt-4 grid grid-cols-1 gap-4 min-w-0 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {(filteredRepos ?? []).map((repo) => (
                    <RepoCardGrid key={repo.id} repo={repo} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 min-w-0 overflow-hidden rounded-lg border border-border divide-y divide-border">
                  {(filteredRepos ?? []).map((repo) => (
                    <RepoRowList key={repo.id} repo={repo} />
                  ))}
                </div>
              )}
            </>
          )}
        </DashboardPageShell>
      </div>
    </div>
  );
}
