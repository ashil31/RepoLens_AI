"use client";

import { createContext, useContext, useState, useCallback } from "react";

type SidebarMobileContextValue = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  openSidebar: () => void;
};

const SidebarMobileContext = createContext<SidebarMobileContextValue | null>(null);

export function SidebarMobileProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openSidebar = useCallback(() => setMobileOpen(true), []);
  return (
    <SidebarMobileContext.Provider value={{ mobileOpen, setMobileOpen, openSidebar }}>
      {children}
    </SidebarMobileContext.Provider>
  );
}

export function useSidebarMobile(): SidebarMobileContextValue {
  const ctx = useContext(SidebarMobileContext);
  if (!ctx) {
    throw new Error("useSidebarMobile must be used within SidebarMobileProvider");
  }
  return ctx;
}

export function useSidebarMobileOptional(): SidebarMobileContextValue | null {
  return useContext(SidebarMobileContext);
}
