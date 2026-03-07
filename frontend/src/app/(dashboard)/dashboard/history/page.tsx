import { DashboardPageShell } from "@/components/dashboard";

export default function HistoryPage() {
  return (
    <DashboardPageShell
      title="History"
      tabs={[
        { label: "All", value: "all", href: "/dashboard/history" },
        { label: "Recent", value: "recent", href: "/dashboard/history/recent" },
      ]}
      actions={
        <>
          <button
            type="button"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Filter
          </button>
        </>
      }
    >
      <p className="text-muted-foreground">View past analyses and runs.</p>
    </DashboardPageShell>
  );
}
