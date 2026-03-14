"use client";

import { create } from "zustand";

const SIDEBAR_MIN = 208;
const SIDEBAR_MAX = 400;
const SIDEBAR_COLLAPSED = 52;
const SIDEBAR_DEFAULT_WIDTH = 224;

interface AppState {
  // Command palette (Find)
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  resetSidebar: () => void;
  sidebarMobileOpen: boolean;
  setSidebarMobileOpen: (open: boolean) => void;

  // Selected workspace (for repos and context)
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;

  // Repo page: command palette actions (e.g. "Open architecture")
  repoCommandAction: "open-architecture" | "open-architecture-notes" | "export-report" | "focus-chat" | "open-docs" | "share-report" | "open-files" | null;
  setRepoCommandAction: (action: AppState["repoCommandAction"]) => void;

  // Repo chat: focus input (trigger from Cmd+K "Ask RepoLens")
  focusChatRequest: number;
  requestFocusChat: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),

  sidebarCollapsed: false,
  sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
  setSidebarCollapsed: (collapsed) =>
    set({
      sidebarCollapsed: collapsed,
      sidebarWidth: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_DEFAULT_WIDTH,
    }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  resetSidebar: () =>
    set({
      sidebarCollapsed: false,
      sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
    }),
  sidebarMobileOpen: false,
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

  selectedWorkspaceId: null,
  setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),

  repoCommandAction: null,
  setRepoCommandAction: (action) => set({ repoCommandAction: action }),

  focusChatRequest: 0,
  requestFocusChat: () => set((s) => ({ focusChatRequest: s.focusChatRequest + 1 })),
}));

export { SIDEBAR_MIN, SIDEBAR_MAX, SIDEBAR_COLLAPSED, SIDEBAR_DEFAULT_WIDTH };
