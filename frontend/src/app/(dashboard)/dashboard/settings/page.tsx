"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Pencil, Monitor, Trash2, Github } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardPageShell } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProfile, useUpdateProfile, useSessions, useDeleteSession, useWorkspaces, useUpdateWorkspace, useGitHubInstallationStatus, useDisconnectGitHub } from "@/hooks/queries";
import { useProfileStore, useAppStore } from "@/store";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "system", label: "System preference" },
  { value: "light", label: "Light" },
  { value: "pure-light", label: "Pure Light" },
  { value: "dark", label: "Dark" },
  { value: "classic-dark", label: "Classic Dark" },
] as const;

export type ThemeValue = (typeof THEME_OPTIONS)[number]["value"];

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4 py-4 first:pt-0 last:pb-0 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="mt-2 sm:mt-0 shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const selectedWorkspaceId = useAppStore((s) => s.selectedWorkspaceId);
  const { data: workspaces } = useWorkspaces();
  const selectedWorkspace = workspaces?.find((w) => w.id === selectedWorkspaceId);
  const updateWorkspaceMutation = useUpdateWorkspace(selectedWorkspaceId ?? "");
  const [workspaceNameInput, setWorkspaceNameInput] = React.useState(selectedWorkspace?.name ?? "");
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const updateProfileMutation = useUpdateProfile();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const deleteSession = useDeleteSession();
  const { data: ghStatus, isLoading: ghStatusLoading } = useGitHubInstallationStatus(selectedWorkspaceId ?? null);
  const disconnectGh = useDisconnectGitHub(selectedWorkspaceId ?? "");
  // Fallback so Connect GitHub works without .env.local
  const githubInstallUrl =
    process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL ||
    "https://github.com/apps/repolens-dev/installations/new";

  React.useEffect(() => {
    setWorkspaceNameInput(selectedWorkspace?.name ?? "");
  }, [selectedWorkspace?.id, selectedWorkspace?.name]);

  const displayProfile = profile ?? profileData;
  const isProfileLoading = profileLoading && !displayProfile;

  if (!mounted) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="dashboard-content-scroll min-h-0 flex-1 overflow-y-auto">
          <DashboardPageShell title="Settings">
            <p className="text-muted-foreground">Account and application settings.</p>
            <div className="mt-8 h-24 animate-pulse rounded-lg bg-muted" />
          </DashboardPageShell>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="dashboard-content-scroll min-h-0 flex-1 overflow-y-auto">
    <DashboardPageShell title="Settings">
      <p className="text-muted-foreground">Account and application settings.</p>

      {/* Profile */}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">Profile</h2>
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-0">
          {isProfileLoading ? (
            <div className="space-y-4 py-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-9 flex-1 max-w-xs animate-pulse rounded bg-muted" />
              <div className="h-9 flex-1 max-w-xs animate-pulse rounded bg-muted" />
              <div className="h-9 flex-1 max-w-xs animate-pulse rounded bg-muted" />
            </div>
          ) : displayProfile ? (
            <>
              <SettingRow label="Profile picture">
                <Avatar className="h-14 w-14 border border-border">
                  <AvatarFallback className="text-lg font-medium text-foreground">
                    {displayProfile.fullName
                      ? `${displayProfile.fullName.charAt(0)}${displayProfile.fullName.split(" ")[1]?.charAt(0) ?? ""}`
                      : displayProfile.email?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
              </SettingRow>
              <SettingRow label="Email">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{displayProfile.email}</span>
                  <button
                    type="button"
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Edit email"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </SettingRow>
              <SettingRow label="Full name">
                <Input
                  className="min-w-[200px] bg-background"
                  value={displayProfile.fullName ?? ""}
                  onChange={(e) => updateProfile({ fullName: e.target.value })}
                />
              </SettingRow>
              <SettingRow
                label="Username"
                description="One word, like a nickname or first name"
              >
                <Input
                  className="min-w-[200px] bg-background"
                  value={displayProfile.username ?? ""}
                  onChange={(e) => updateProfile({ username: e.target.value })}
                />
              </SettingRow>
              <SettingRow label="Save profile">
                  <Button
                    onClick={() =>
                      updateProfileMutation.mutate(
                        {
                          fullName: displayProfile.fullName ?? undefined,
                          username: displayProfile.username ?? undefined,
                        },
                        {
                          onSuccess: () => toast.success("Profile updated"),
                          onError: (err) =>
                            toast.error("Failed to update profile", (err as Error).message),
                        }
                      )
                    }
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving…" : "Save"}
                  </Button>
              </SettingRow>
            </>
          ) : null}
        </div>
      </section>

      {/* Workspace access */}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">Workspace access</h2>
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-0">
          {selectedWorkspace ? (
            <>
              <SettingRow
                label="Workspace name"
                description="Rename the current workspace"
              >
                <div className="flex items-center gap-2">
                  <Input
                    className="min-w-[200px] bg-background"
                    value={workspaceNameInput}
                    onChange={(e) => setWorkspaceNameInput(e.target.value)}
                    placeholder="Workspace name"
                  />
                  <Button
                    onClick={() => {
                      const name = workspaceNameInput.trim();
                      if (name && selectedWorkspaceId) {
                        updateWorkspaceMutation.mutate(name, {
                          onSuccess: () => {
                            setWorkspaceNameInput(name);
                            toast.success("Workspace renamed");
                          },
                          onError: (err) =>
                            toast.error("Failed to rename workspace", (err as Error).message),
                        });
                      }
                    }}
                    disabled={updateWorkspaceMutation.isPending || !workspaceNameInput.trim() || workspaceNameInput.trim() === selectedWorkspace.name}
                  >
                    {updateWorkspaceMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </SettingRow>
              {updateWorkspaceMutation.isError && (
                <p className="pt-2 text-sm text-destructive">
                  {(updateWorkspaceMutation.error as Error).message}
                </p>
              )}
              <SettingRow
                label="Delete workspace"
                description="Schedule workspace to be permanently deleted"
              >
                <Button
                  variant="destructive"
                  className="font-medium"
                >
                  Delete
                </Button>
              </SettingRow>
            </>
          ) : (
            <SettingRow
              label="Workspace"
              description="Select a workspace from the sidebar to rename or delete it"
            >
              <span className="text-sm text-muted-foreground">No workspace selected</span>
            </SettingRow>
          )}
        </div>
      </section>

      {/* Connected accounts - GitHub */}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">Connected accounts</h2>
        <h3 className="mt-4 text-sm font-medium text-foreground">GitHub</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Connect the RepoLens GitHub App for this workspace to import repositories.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          {!selectedWorkspaceId ? (
            <p className="text-sm text-muted-foreground">Select a workspace from the sidebar.</p>
          ) : ghStatusLoading ? (
            <div className="h-10 w-48 animate-pulse rounded bg-muted" />
          ) : ghStatus?.connected && ghStatus.accountLogin ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Github className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">GitHub</p>
                  <p className="text-xs text-muted-foreground">Connected as {ghStatus.accountLogin}</p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="font-medium"
                onClick={() =>
                  disconnectGh.mutate(undefined, {
                    onSuccess: () =>
                      toast.success("GitHub disconnected"),
                    onError: (err) =>
                      toast.error("Failed to disconnect GitHub", (err as Error).message),
                  })
                }
                disabled={disconnectGh.isPending}
              >
                {disconnectGh.isPending ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Github className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">GitHub</p>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
              {githubInstallUrl ? (
                <Button
                  size="sm"
                  onClick={() => {
                    if (!selectedWorkspaceId || !githubInstallUrl) return;
                    try {
                      const url = new URL(githubInstallUrl);
                      url.searchParams.set("state", selectedWorkspaceId);
                      window.location.href = url.toString();
                    } catch (e) {
                      console.error("Invalid GitHub install URL:", e);
                    }
                  }}
                >
                  Connect GitHub
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Security & access - Sessions */}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">Security & access</h2>
        <h3 className="mt-4 text-sm font-medium text-foreground">Sessions</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Devices logged into your account
        </p>
        <div className="mt-4 space-y-3">
          {sessionsLoading ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ) : (
            sessions?.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.browser ?? session.device ?? "Unknown"} on {session.os || "Unknown"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {session.isCurrent && (
                        <>
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                          <span className="text-green-600 dark:text-green-400">Current session</span>
                          <span className="text-muted-foreground/60">·</span>
                        </>
                      )}
                      <span>{session.location}</span>
                      {session.lastActive && (
                        <>
                          <span className="text-muted-foreground/60">·</span>
                          <span>{session.lastActive}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "shrink-0 border-destructive/60 text-destructive hover:bg-destructive/15 hover:text-destructive font-medium",
                    session.isCurrent && "pointer-events-none opacity-50"
                  )}
                  onClick={() =>
                    !session.isCurrent &&
                    deleteSession.mutate(session.id, {
                      onSuccess: () => toast.success("Session revoked"),
                      onError: (err) =>
                        toast.error("Failed to revoke session", (err as Error).message),
                    })
                  }
                  disabled={session.isCurrent || deleteSession.isPending}
                  aria-label={`Revoke session ${session.browser} on ${session.os}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Interface and theme */}
      <section className="mt-10 space-y-8">
        <h2 className="text-lg font-medium text-foreground">Interface and theme</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Interface theme</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select or customize your interface color scheme.
            </p>
          </div>
          <div className="mt-2 sm:mt-0">
            <Select
              value={theme ?? "system"}
              onValueChange={(value) => setTheme(value as ThemeValue)}
            >
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder="Choose theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </DashboardPageShell>
      </div>
    </div>
  );
}
