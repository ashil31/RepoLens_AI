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

  // Selected workspace (for repos and context)
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;
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

  selectedWorkspaceId: null,
  setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),
}));

export { SIDEBAR_MIN, SIDEBAR_MAX, SIDEBAR_COLLAPSED, SIDEBAR_DEFAULT_WIDTH };
