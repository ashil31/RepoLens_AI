"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  Folder,
  GitBranch,
  Sparkles,
  History,
  CreditCard,
  Settings,
  Search,
  ChevronDown,
  MoreHorizontal,
  Bell,
  Check,
  Smile,
  Monitor,
  Sun,
  Moon,
  Home,
  FileEdit,
  HelpCircle,
  BookOpen,
  LogOut,
  Users,
  UserPlus,
  FolderPlus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCurrentUser, useWorkspaces, useCreateWorkspace, useAddMember } from "@/hooks/queries";
import { useAppStore, useAuthStore } from "@/store";

const items = [
  { href: "/dashboard", label: "Workspace", icon: Folder },
  { href: "/dashboard/repositories", label: "Repositories", icon: GitBranch },
  { href: "/dashboard/analysis", label: "Analysis", icon: Sparkles },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

type SidebarProps = {
  collapsed?: boolean;
  style?: React.CSSProperties;
};

const POPOVER_THEMES = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function Sidebar({ collapsed = false, style }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const { user } = useCurrentUser();
  const { data: workspacesRaw } = useWorkspaces();
  const workspaces = useMemo(() => {
    if (!workspacesRaw?.length) return [];
    const byId = new Map(workspacesRaw.map((w) => [w.id, w]));
    return Array.from(byId.values());
  }, [workspacesRaw]);
  const selectedWorkspaceId = useAppStore((s) => s.selectedWorkspaceId);
  const setSelectedWorkspaceId = useAppStore((s) => s.setSelectedWorkspaceId);
  const createWorkspace = useCreateWorkspace();
  const addMember = useAddMember(selectedWorkspaceId ?? "");
  const credits = useAuthStore((s) => s.user?.credits ?? 0);
  const noCredits = credits === 0;
  const openCommandPalette = useAppStore((s) => s.openCommandPalette);
  const selectedWorkspace = workspaces?.find((w) => w.id === selectedWorkspaceId);
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const rawTheme = theme ?? "system";
  const effectiveTheme =
    rawTheme === "pure-light" ? "light" : rawTheme === "classic-dark" ? "dark" : rawTheme;

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-background shrink-0 transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[52px]" : ""
      )}
      style={collapsed ? undefined : { width: style?.width ?? 224 }}
    >
      {/* Top: Workspace selector + Find */}
      {!collapsed && (
        <div className="flex flex-col gap-2 border-b border-border p-2">
          <Popover open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-lg px-2.5 py-2.5 h-auto font-medium text-foreground hover:bg-accent"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Folder className="h-4 w-4" />
                </div>
                <span className="min-w-0 flex-1 truncate text-left text-sm">
                  {selectedWorkspace?.name ?? user.projectsLabel}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {user.workspacePlan}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[380px] min-w-[320px] rounded-2xl border border-border bg-card p-0 text-foreground shadow-lg outline-none"
              align="start"
              sideOffset={8}
            >
              {/* Search + Esc */}
              <div className="flex items-center gap-2 border-b border-border p-3">
                <Input
                  placeholder="Find Team..."
                  className="h-10 flex-1 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                  onClick={() => setWorkspaceOpen(false)}
                >
                  Esc
                </Button>
              </div>

              {/* Selected workspace */}
              <div className="flex items-center gap-3 rounded-xl bg-accent/80 px-4 py-3 mx-3 mt-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Folder className="h-4 w-4" />
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {selectedWorkspace
                    ? selectedWorkspace.name
                    : user.projectsLabel}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {user.workspacePlan}
                </span>
                <Check className="h-4 w-4 shrink-0 text-foreground" />
              </div>

              {/* Workspace list */}
              {workspaces.length > 0 && (
                <div className="max-h-48 overflow-y-auto py-1 px-2">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        selectedWorkspaceId === ws.id
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      onClick={() => {
                        setSelectedWorkspaceId(ws.id);
                        setWorkspaceOpen(false);
                      }}
                    >
                      <Folder className="h-5 w-5 shrink-0" />
                      <span className="min-w-0 truncate">{ws.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Teams info */}
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Teams you create and join appear
                  <br />
                  here for quick context switching.
                </p>
              </div>

              {/* Invite member & Create new workspace */}
              <div className="border-t border-border p-3 space-y-2">
                {noCredits && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 px-1">
                    No credits left. Add credits to invite members or create workspaces.
                  </p>
                )}

                {showInvite ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="email"
                      placeholder="Email to invite"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="h-9"
                      disabled={noCredits}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={noCredits || addMember.isPending || !inviteEmail.trim()}
                        onClick={() => {
                          if (!inviteEmail.trim() || !selectedWorkspaceId) return;
                          addMember.mutate(
                            { email: inviteEmail.trim() },
                            {
                              onSuccess: () => {
                                setInviteEmail("");
                                setShowInvite(false);
                              },
                            }
                          );
                        }}
                      >
                        {addMember.isPending ? "Inviting…" : "Invite"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setShowInvite(false); setInviteEmail(""); }}>
                        Cancel
                      </Button>
                    </div>
                    {addMember.isError && (
                      <p className="text-xs text-destructive">{(addMember.error as Error).message}</p>
                    )}
                  </div>
                ) : showCreate ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Workspace name"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="h-9 flex-1"
                      autoFocus
                      disabled={noCredits}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={noCredits || createWorkspace.isPending || !createName.trim()}
                        onClick={() => {
                          if (!createName.trim()) return;
                          createWorkspace.mutate(createName.trim(), {
                            onSuccess: (data) => {
                              setSelectedWorkspaceId(data.data.id);
                              setCreateName("");
                              setShowCreate(false);
                              setWorkspaceOpen(false);
                            },
                          });
                        }}
                      >
                        {createWorkspace.isPending ? "Creating…" : "Create"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); setCreateName(""); }}>
                        Cancel
                      </Button>
                    </div>
                    {createWorkspace.isError && (
                      <p className="text-xs text-destructive">{(createWorkspace.error as Error).message}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 rounded-xl bg-accent/60 py-2.5 font-medium text-foreground hover:bg-accent disabled:opacity-50"
                      onClick={() => { setShowInvite(true); setShowCreate(false); }}
                      disabled={noCredits || !selectedWorkspaceId}
                    >
                      <UserPlus className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">Invite member</span>
                    </Button>
                    <p className="text-xs text-muted-foreground px-1">
                      Invite someone to the current workspace
                    </p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 rounded-xl bg-accent/60 py-2.5 font-medium text-foreground hover:bg-accent disabled:opacity-50"
                      onClick={() => { setShowCreate(true); setShowInvite(false); }}
                      disabled={noCredits}
                    >
                      <FolderPlus className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">Create new workspace</span>
                    </Button>
                    <p className="text-xs text-muted-foreground px-1">
                      Create a new workspace for your projects
                    </p>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            onClick={openCommandPalette}
            className="w-full justify-start gap-2 rounded-lg border border-border bg-background/50 px-2 py-2 h-9 font-normal text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Find...</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        </div>
      )}

      {collapsed && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={openCommandPalette}
            aria-label="Find"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {items.map(({ href, label, icon: Icon }) => {
          const isExactDashboard = href === "/dashboard";
          const isActive = isExactDashboard
            ? pathname === "/dashboard"
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2 focus-visible:ring-0 focus-visible:ring-offset-0",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: User account */}
      {!collapsed && (
        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
                {user.initial}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {user.displayName}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="More options"
                  className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 rounded-lg border-border bg-card p-0 text-foreground shadow-lg"
                align="end"
                side="right"
                sideOffset={8}
              >
                {/* User identification */}
                <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">
                      {user.displayName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <span>Feedback</span>
                    <Smile className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>

                  {/* Theme toggle */}
                  <div className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent">
                    <span>Theme</span>
                    {mounted && (
                      <div className="flex shrink-0 items-center rounded-md border border-border bg-muted/50 p-0.5">
                        {POPOVER_THEMES.map(({ value, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setTheme(value)}
                            className={cn(
                              "rounded p-1.5 transition-colors",
                              effectiveTheme === value
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            title={value}
                            aria-label={`Set theme to ${value}`}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/"
                    className="flex w-full items-center justify-between gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <span>Home Page</span>
                    <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                  {/* <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <span>Changelog</span>
                    <FileEdit className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button> */}
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <span>Help</span>
                    <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <span>Docs</span>
                    <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-between gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const { logout } = await import("@/services/auth.service");
                        await logout();
                      } catch {
                        /* ignore */
                      }
                      useAuthStore.getState().clearAuth();
                      router.push("/login");
                    }}
                  >
                    <span>Log Out</span>
                    <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </div>

                {/* Upgrade to Pro */}
                <div className="border-t border-border p-3">
                  <Button variant="default" size="cta" className="w-full">
                    Upgrade to Pro
                  </Button>
                </div>

                {/* Platform status */}
                {/* <div className="border-t border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">Platform Status</p>
                  <p className="mt-0.5 flex items-center gap-2 text-sm text-foreground">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-red-500"
                      aria-hidden
                    />
                    <span className="truncate">
                      Dubai region (dxb1) is unavailable an...
                    </span>
                  </p>
                </div> */}
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-muted-foreground" />
            </Button>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="border-t border-border p-2">
          <Avatar className="h-8 w-8 border border-border" title={user.displayName}>
            <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
              {user.initial}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </aside>
  );
}
