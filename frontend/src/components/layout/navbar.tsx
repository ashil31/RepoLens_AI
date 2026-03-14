"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { RepoLensLogo } from "@/components/repolens-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavbarVariant = "default" | "landing";

type NavbarProps = {
  variant?: NavbarVariant;
};

/** Placeholder nav sections for mobile drawer (add real links later) */
const MOBILE_SECTIONS = [
  {
    title: "Product",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Authentication",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/register" },
    ],
  },
] as const;

export function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
  const isLanding = variant === "landing" || pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navLinks = (
    <>
      <Link
        href="/login"
        className={cn(
          "text-sm font-medium transition-colors hover:opacity-90",
          isLanding
            ? "text-zinc-400 hover:text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => setMobileOpen(false)}
      >
        Log in
      </Link>
      <Link href="/register" onClick={() => setMobileOpen(false)}>
        <Button
          size="sm"
          variant={isLanding ? "secondary" : "default"}
          className={cn(
            "text-sm font-semibold",
            isLanding &&
              "bg-white text-black shadow-sm hover:bg-zinc-100 hover:shadow",
          )}
        >
          Sign up
        </Button>
      </Link>
    </>
  );

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 w-full border-b backdrop-blur supports-backdrop-filter:bg-background/60",
        isLanding
          ? "border-white/8 bg-[#0a0a0a]/95 text-white"
          : "border-border bg-background/95",
      )}
    >
      <div className="container mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-14 sm:px-6">
        <Link
          href="/"
          className={cn(
            "flex shrink-0 items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-90",
            isLanding ? "text-white" : "text-foreground",
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden sm:h-12 sm:w-12">
            <RepoLensLogo id="navbar-logo" size="lg" className="h-full w-full" />
          </span>
          <span className="truncate sm:mt-0.5 sm:-ml-1">RepoLens</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden shrink-0 items-center gap-6 md:flex md:gap-8">
          {isLanding && (
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="#features"
                className="text-zinc-400 transition-colors hover:text-white"
              >
                Features
              </Link>
              <Link
                href="/dashboard"
                className="text-zinc-400 transition-colors hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="#"
                className="text-zinc-400 transition-colors hover:text-white"
              >
                Pricing
              </Link>
            </div>
          )}
          <div className="flex items-center gap-3">
            {navLinks}
            {!isLanding && <ThemeToggle />}
          </div>
        </nav>

        {/* Mobile/tablet: menu button (→ X when open) + dropdown below navbar */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className={cn(
              "relative h-9 w-9 shrink-0 overflow-hidden",
              isLanding ? "text-white hover:bg-white/10" : "text-foreground",
            )}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          <AnimatePresence>
            {mobileOpen && (
              <>
                {/* Backdrop starts below navbar only: blur from there down, tap to close */}
                <motion.div
                  role="button"
                  tabIndex={-1}
                  aria-label="Close menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-x-0 bottom-0 top-12 z-40 w-full bg-black/98 backdrop-blur-2xl sm:top-14"
                  style={{
                    WebkitBackdropFilter: "blur(80px)",
                    backdropFilter: "blur(80px)",
                  }}
                  onClick={() => setMobileOpen(false)}
                  onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
                />
                {/* Full-viewport panel: fills entire screen below navbar, no duplicate header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "fixed left-0 right-0 top-12 bottom-0 z-40 h-[calc(100dvh-3rem)] w-full overflow-y-auto border-b shadow-lg sm:top-14 sm:h-[calc(100dvh-3.5rem)]",
                    isLanding
                      ? "border-white/10 bg-[#0c0c0c]/99 backdrop-blur-2xl"
                      : "border-border bg-background",
                  )}
                  aria-label="Navigation menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.nav
                    className="flex flex-col py-4"
                    initial="closed"
                    animate="open"
                    exit="closed"
                    variants={{
                      open: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.02,
                        },
                      },
                      closed: {
                        transition: {
                          staggerChildren: 0.02,
                          staggerDirection: -1,
                        },
                      },
                    }}
                  >
                    {MOBILE_SECTIONS.map((section) => (
                      <div key={section.title} className="px-4 pb-5">
                        <motion.p
                          variants={{
                            closed: { opacity: 0, y: 10 },
                            open: { opacity: 1, y: 0 },
                          }}
                          className={cn(
                            "mb-2 text-xs font-semibold uppercase tracking-wider",
                            isLanding
                              ? "text-zinc-500"
                              : "text-muted-foreground",
                          )}
                        >
                          {section.title}
                        </motion.p>
                        <ul className="flex flex-col gap-0.5">
                          {section.links.map((link) => (
                            <li key={link.label}>
                              <motion.div
                                variants={{
                                  closed: { opacity: 0, y: 10 },
                                  open: { opacity: 1, y: 0 },
                                }}
                              >
                                <Link
                                  href={link.href}
                                  className={cn(
                                    "block rounded-lg px-3 py-2.5 text-lg font-medium transition-colors",
                                    isLanding
                                      ? "text-white hover:bg-white/10"
                                      : "text-foreground hover:bg-accent",
                                  )}
                                  onClick={() => setMobileOpen(false)}
                                >
                                  {link.label}
                                </Link>
                              </motion.div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {!isLanding && (
                      <motion.div
                        variants={{
                          closed: { opacity: 0, y: 10 },
                          open: { opacity: 1, y: 0 },
                        }}
                        className={cn(
                          "mt-4 border-t px-4 pt-4",
                          isLanding ? "border-white/10" : "border-border",
                        )}
                      >
                        <p
                          className={cn(
                            "mb-2 text-xs font-semibold uppercase tracking-wider",
                            isLanding
                              ? "text-zinc-500"
                              : "text-muted-foreground",
                          )}
                        >
                          Preferences
                        </p>
                        <ThemeToggle />
                      </motion.div>
                    )}
                  </motion.nav>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
