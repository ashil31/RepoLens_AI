"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type TabItem = {
  label: string;
  value: string;
  href?: string;
};

type DashboardPageShellProps = {
  /** Page title at top left */
  title: string;
  /** Optional tabs (e.g. Assigned, Created, Subscribed). Use href for links or rely on activeTab. */
  tabs?: TabItem[];
  /** Currently active tab value (if using client-side tab state) */
  activeTab?: string;
  /** Right-side actions (e.g. Filter, Display buttons) */
  actions?: React.ReactNode;
  /** Content inside the rounded card */
  children: React.ReactNode;
  /** Optional className for the inner card */
  cardClassName?: string;
};

/**
 * Dashboard page layout: title + tabs + actions header, then a distinct
 * rounded content card (the "box with curve") so all pages share the same look.
 */
export function DashboardPageShell({
  title,
  tabs,
  activeTab,
  actions,
  children,
  cardClassName,
}: DashboardPageShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header: title, tabs, actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1> */}
          {tabs && tabs.length > 0 && (
            <nav
              className="mt-3 flex gap-1"
              aria-label="Page tabs"
            >
              {tabs.map((tab) => {
                const href = tab.href;
                const isActive = activeTab
                  ? tab.value === activeTab
                  : href ? pathname === href || pathname.startsWith(href + "/") : false;
                const content = (
                  <span
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </span>
                );
                if (href) {
                  return (
                    <Link key={tab.value} href={href}>
                      {content}
                    </Link>
                  );
                }
                return <span key={tab.value}>{content}</span>;
              })}
            </nav>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Rounded content card – the "box with curve" */}
      <div
        className={cn(
          "min-h-[320px] flex-1 rounded-2xl border border-border bg-card p-6 shadow-sm",
          cardClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
