"use client";

import { SidebarWithToggle } from "@/components/sidebar/sidebar-with-toggle";
import { CommandPalette } from "@/components/command/command-palette";
import { DashboardHeader } from "@/components/dashboard";
import { useAppStore } from "@/store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useWorkspaces } from "@/hooks/queries";
import { useEffect } from "react";
import { SidebarMobileProvider } from "@/context/sidebar-mobile-context";

function DashboardAuthSync() {
  useRequireAuth();
  const { data: workspaces } = useWorkspaces();
  const selectedWorkspaceId = useAppStore((s) => s.selectedWorkspaceId);
  const setSelectedWorkspaceId = useAppStore((s) => s.setSelectedWorkspaceId);

  useEffect(() => {
    if (workspaces?.length && selectedWorkspaceId === null) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId, setSelectedWorkspaceId]);

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);

  return (
    <SidebarMobileProvider>
      <div className="flex h-screen min-h-0 overflow-hidden bg-background">
        <DashboardAuthSync />
        <SidebarWithToggle />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col transition-[padding] duration-200 overflow-hidden">
          <DashboardHeader />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </main>
        </div>
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      </div>
    </SidebarMobileProvider>
  );
}