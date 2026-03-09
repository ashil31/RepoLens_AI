"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import {
  useAppStore,
  SIDEBAR_MIN,
  SIDEBAR_MAX,
  SIDEBAR_COLLAPSED,
  SIDEBAR_DEFAULT_WIDTH,
} from "@/store";
import { useIsSidebarDesktop } from "@/hooks/use-is-sidebar-desktop";
import { useSidebarMobileOptional } from "@/context/sidebar-mobile-context";

const COLLAPSE_THRESHOLD = 100;
const EXPAND_DRAG_THRESHOLD = 40;

function getClientX(e: MouseEvent | TouchEvent): number {
  return "touches" in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0 : e.clientX;
}

export function SidebarWithToggle() {
  const isDesktop = useIsSidebarDesktop();
  const mobileCtx = useSidebarMobileOptional();
  const storeMobileOpen = useAppStore((s) => s.sidebarMobileOpen);
  const setStoreMobileOpen = useAppStore((s) => s.setSidebarMobileOpen);

  const mobileOpen = mobileCtx?.mobileOpen ?? storeMobileOpen;
  const setMobileOpen = mobileCtx?.setMobileOpen ?? setStoreMobileOpen;

  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const width = useAppStore((s) => s.sidebarWidth);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);

  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(SIDEBAR_DEFAULT_WIDTH);
  const startCollapsed = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const clientX = getClientX(e as unknown as MouseEvent);
      startX.current = clientX;
      startWidth.current = width;
      startCollapsed.current = collapsed;
    },
    [width, collapsed]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = getClientX(e);
      const delta = clientX - startX.current;

      if (startCollapsed.current) {
        if (delta > EXPAND_DRAG_THRESHOLD) {
          const w = Math.min(Math.max(startWidth.current + delta, SIDEBAR_MIN), SIDEBAR_MAX);
          setSidebarCollapsed(false);
          setSidebarWidth(w);
        }
      } else {
        const next = startWidth.current + delta;
        if (next < COLLAPSE_THRESHOLD) {
          setSidebarCollapsed(true);
          setSidebarWidth(SIDEBAR_COLLAPSED);
        } else {
          setSidebarWidth(Math.min(Math.max(next, SIDEBAR_MIN), SIDEBAR_MAX));
        }
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseup", handlePointerUp);
    document.addEventListener("touchmove", handlePointerMove, { passive: false });
    document.addEventListener("touchend", handlePointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseup", handlePointerUp);
      document.removeEventListener("touchmove", handlePointerMove);
      document.removeEventListener("touchend", handlePointerUp);
    };
  }, [isDragging, setSidebarCollapsed, setSidebarWidth]);

  const displayWidth = collapsed ? SIDEBAR_COLLAPSED : width;

  return (
    <>
      {/* Mobile/tablet: overlay + drawer (hidden on lg) */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close sidebar"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden touch-none",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(320px,85vw)] max-w-full flex-col border-r border-border bg-background transition-[transform] duration-200 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar collapsed={false} style={{ width: "100%" }} onCloseMobile={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop: inline sidebar + resize handle */}
      {isDesktop && (
        <div className="relative flex">
          <Sidebar
            collapsed={collapsed}
            style={collapsed ? undefined : { width: displayWidth }}
            className={!isDragging ? "transition-[width] duration-150 ease-out" : undefined}
          />
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Resize sidebar"}
            className={cn(
              "absolute top-0 z-20 h-full w-1 cursor-col-resize border-0 bg-transparent transition-colors hover:bg-border",
              "after:absolute after:inset-y-0 after:left-0 after:w-1 after:content-['']",
              isDragging && "bg-border",
              collapsed && "hover:bg-muted-foreground/30"
            )}
            style={{ left: displayWidth - 4 }}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
          />
        </div>
      )}
    </>
  );
}
