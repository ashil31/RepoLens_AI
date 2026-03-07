"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ChevronsUpDown,
  MoreHorizontal,
  Search,
  Folder,
  GitBranch,
  Box,
  FolderGit2,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRepositories } from "@/hooks/queries";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/repositories": "Repositories",
  "/dashboard/analysis": "Analysis",
  "/dashboard/history": "History",
  "/dashboard/billing": "Billing",
  "/dashboard/settings": "Settings",
  "/dashboard/feedback": "Feedback",
};

const REPO_ICONS = [Folder, GitBranch, Box, FolderGit2, ChevronRight] as const;

function getHeaderTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith("/dashboard/repositories/") && pathname !== "/dashboard/repositories")
    return "Repository";
  return "Overview";
}

function getRepoIcon(index: number) {
  return REPO_ICONS[index % REPO_ICONS.length];
}

function RepoSelectorSkeleton() {
  return (
    <>
      <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted align-middle" />
      <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </>
  );
}

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [repoPopoverOpen, setRepoPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: repositories, isLoading, isError } = useRepositories();
  const title = getHeaderTitle(pathname);

  const selectedRepoId = pathname.startsWith("/dashboard/repositories/")
    ? pathname.split("/").filter(Boolean)[3]
    : null;
  const selectedRepo = repositories?.find((r) => r.id === selectedRepoId);
  const displayLabel = selectedRepo ? selectedRepo.name : "All Projects";

  const filteredRepos = useMemo(() => {
    if (!repositories) return [];
    const q = search.trim().toLowerCase();
    if (!q) return repositories;
    return repositories.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.fullName?.toLowerCase().includes(q))
    );
  }, [repositories, search]);

  const handleSelectRepo = (repoId: string | null) => {
    if (repoId === null) router.push("/dashboard/repositories");
    else router.push(`/dashboard/repositories/${repoId}`);
    setRepoPopoverOpen(false);
    setSearch("");
  };

  return (
    <header className="relative flex h-12 shrink-0 items-center justify-between border-b border-border px-6">
      {/* Left: Repository / Project selector */}
      <Popover open={repoPopoverOpen} onOpenChange={setRepoPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {isLoading ? (
              <RepoSelectorSkeleton />
            ) : (
              <>
                <span className="text-sm font-medium">{displayLabel}</span>
                <ChevronsUpDown className="h-4 w-4 shrink-0" />
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 rounded-xl border-border bg-card p-0 shadow-lg"
          align="start"
          sideOffset={8}
        >
          {/* Header: "All Projects" + chevron (visual only; trigger has it) */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-foreground">All Projects</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>

          {/* Search: Find Project... + Esc */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Find Project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 flex-1 border-0 bg-transparent px-2 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setRepoPopoverOpen(false)}
            >
              Esc
            </Button>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto py-1">
            {isLoading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex h-10 items-center gap-3 rounded-lg px-3"
                  >
                    <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Could not load projects.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    !selectedRepoId
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  onClick={() => handleSelectRepo(null)}
                >
                  <Folder className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 truncate">All repositories</span>
                </button>
                {filteredRepos.map((repo, index) => {
                  const Icon = getRepoIcon(index);
                  const isSelected = selectedRepoId === repo.id;
                  return (
                    <button
                      key={repo.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      onClick={() => handleSelectRepo(repo.id)}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="min-w-0 truncate">{repo.name}</span>
                    </button>
                  );
                })}
                {filteredRepos.length === 0 && search.trim() && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No projects match &quot;{search}&quot;
                  </p>
                )}
              </>
            )}
          </div>

          {/* Create Project */}
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setRepoPopoverOpen(false)}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Create Project
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Center: Dynamic title */}
      <span className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-foreground">
        {title}
      </span>

      {/* Right: More menu (Feedback) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="end" sideOffset={8}>
          <Link
            href="/dashboard/feedback"
            className="block rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          >
            Feedback
          </Link>
        </PopoverContent>
      </Popover>
    </header>
  );
}
