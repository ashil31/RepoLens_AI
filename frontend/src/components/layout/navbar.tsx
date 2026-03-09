"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { RepoLensLogo } from "@/components/repolens-logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between gap-4 px-4 sm:h-14 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold text-foreground tracking-tight transition-opacity hover:opacity-90"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center sm:h-12 sm:w-12">
            <RepoLensLogo size="lg" className="h-full w-full" />
          </span>
          <span className="truncate sm:mt-0.5 sm:-ml-1">RepoLens</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-foreground transition-colors hover:text-foreground hover:opacity-90"
          >
            Sign up
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
