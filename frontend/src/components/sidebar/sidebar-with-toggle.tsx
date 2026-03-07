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

const COLLAPSE_THRESHOLD = 100;
const EXPAND_DRAG_THRESHOLD = 40;

export function SidebarWithToggle() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const width = useAppStore((s) => s.sidebarWidth);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(SIDEBAR_DEFAULT_WIDTH);
  const startCollapsed = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startX.current = e.clientX;
    startWidth.current = width;
    startCollapsed.current = collapsed;
  }, [width, collapsed]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;

      if (startCollapsed.current) {
        if (delta > EXPAND_DRAG_THRESHOLD) {
          setSidebarCollapsed(false);
          setSidebarWidth(Math.min(Math.max(startWidth.current + delta, SIDEBAR_MIN), SIDEBAR_MAX));
        }
      } else {
        let next = startWidth.current + delta;
        if (next < COLLAPSE_THRESHOLD) {
          setSidebarCollapsed(true);
          setSidebarWidth(SIDEBAR_COLLAPSED);
        } else {
          setSidebarWidth(Math.min(Math.max(next, SIDEBAR_MIN), SIDEBAR_MAX));
        }
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, setSidebarCollapsed, setSidebarWidth]);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : width;

  return (
    <div className="relative flex">
      <Sidebar
        collapsed={collapsed}
        style={collapsed ? undefined : { width: sidebarWidth }}
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
        style={{ left: sidebarWidth - 4 }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
