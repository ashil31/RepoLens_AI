"use client";

import { useState, useEffect } from "react";

const SIDEBAR_DESKTOP_BREAKPOINT_PX = 1024;

/**
 * True when viewport width is >= breakpoint (desktop: sidebar inline + resize).
 * False when mobile/tablet: sidebar as overlay drawer.
 */
export function useIsSidebarDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${SIDEBAR_DESKTOP_BREAKPOINT_PX}px)`);
    const handler = () => setIsDesktop(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}
