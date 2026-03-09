"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DashboardPageShell,
  type TabItem,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppStore } from "@/store";
import { useRepositories } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { Repository } from "@/types/user";
import {
  Search,
  GitBranch,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronDown,
  Github,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
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

function RepoCardGrid({ repo }: { repo: Repository }) {
  const displayUrl = repo.fullName ?? repo.repoUrl ?? "—";
  return (
    <Link
      href={`/dashboard/repositories/${repo.id}`}
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={(e) => e.preventDefault()}
                aria-label="More options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <Link
                href={`/dashboard/repositories/${repo.id}`}
                className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                Open repository
              </Link>
              {repo.repoUrl && (
                <a
                  href={repo.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  View on GitHub
                </a>
              )}
            </PopoverContent>
          </Popover>
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
    </Link>
  );
}

function RepoRowList({ repo }: { repo: Repository }) {
  const displayUrl = repo.fullName ?? repo.repoUrl ?? "—";
  return (
    <Link
      href={`/dashboard/repositories/${repo.id}`}
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 cursor-pointer"
              onClick={(e) => e.preventDefault()}
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            <Link
              href={`/dashboard/repositories/${repo.id}`}
              className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              Open repository
            </Link>
            {repo.repoUrl && (
              <a
                href={repo.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                View on GitHub
              </a>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </Link>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground cursor-pointer sm:px-2.5"
                    aria-label="Filter"
                  >
                    <SlidersHorizontal className="h-4 w-4 shrink-0" />
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  </Button>
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
                <div className="mt-4 grid grid-cols-1 gap-4 min-w-0 sm:mt-6 sm:grid-cols-2">
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
