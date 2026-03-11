"use client";

import {
  Folder,
  GitBranch,
  Sparkles,
  History,
  CreditCard,
  Settings,
  Search,
} from "lucide-react";
import { RepoLensLogo } from "@/components/repolens-logo";
import { cn } from "@/lib/utils";

const items = [
  { label: "Workspace", icon: Folder },
  { label: "Repositories", icon: GitBranch },
  { label: "Analysis", icon: Sparkles },
  { label: "History", icon: History },
  { label: "Billing", icon: CreditCard },
  { label: "Settings", icon: Settings },
] as const;

/** Presentational sidebar for hero: same look as app sidebar, interactive hover but no navigation. */
export function HeroSidebar() {
  return (
    <aside
      className={cn(
        "flex w-[224px] shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200 ease-in-out"
      )}
    >
      {/* Top: Workspace selector + Find */}
      <div className="flex flex-col gap-2 border-b border-border p-2">
        <div className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 font-medium text-foreground">
          <div
            className="relative shrink-0 overflow-hidden rounded-md"
            style={{ width: 40, height: 40 }}
          >
            <RepoLensLogo fillContainer />
          </div>
          <span className="min-w-0 flex-1 truncate text-left text-sm">
            Demo workspace
          </span>
        </div>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background/50 px-2 py-2 h-9 font-normal text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left text-sm">Find...</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {items.map(({ label, icon: Icon }) => {
          const isRepositories = label === "Repositories";
          return (
            <button
              key={label}
              type="button"
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors",
                isRepositories
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-label={label}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: placeholder for user area (visual balance) */}
      <div className="border-t border-border p-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="h-8 w-8 shrink-0 rounded-full border border-border bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            U
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
            Sign in to continue
          </span>
        </div>
      </div>
    </aside>
  );
}
