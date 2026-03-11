"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Footer() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <footer
      className={cn(
        "border-t",
        isLanding
          ? "border-white/10 bg-[#0a0a0a] text-zinc-400"
          : "border-border bg-background"
      )}
    >
      <div className="container flex flex-col items-center justify-between gap-4 px-4 py-5 sm:py-6 md:flex-row">
        <p
          className={cn(
            "text-center text-sm sm:text-left",
            isLanding ? "text-zinc-400" : "text-muted-foreground"
          )}
        >
          © {new Date().getFullYear()} RepoLens. All rights reserved.
        </p>
        <nav
          className={cn(
            "flex gap-6 text-sm",
            isLanding ? "text-zinc-400" : "text-muted-foreground"
          )}
        >
          <a
            href="#"
            className={isLanding ? "hover:text-white" : "transition-colors hover:text-foreground"}
          >
            Privacy
          </a>
          <a
            href="#"
            className={isLanding ? "hover:text-white" : "transition-colors hover:text-foreground"}
          >
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
