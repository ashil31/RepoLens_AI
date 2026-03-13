"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const CLASS = "scrollbar-hidden-landing";

/** Hides the vertical scrollbar on the landing page only. Content remains scrollable. */
export function ScrollbarHideOnLanding() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (pathname === "/") {
      html.classList.add(CLASS);
      body.classList.add(CLASS);
    } else {
      html.classList.remove(CLASS);
      body.classList.remove(CLASS);
    }

    return () => {
      html.classList.remove(CLASS);
      body.classList.remove(CLASS);
    };
  }, [pathname]);

  return null;
}
