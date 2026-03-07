import { DashboardPageShell } from "@/components/dashboard";

export default function AnalysisPage() {
  return (
    <DashboardPageShell
      title="Analysis"
      tabs={[
        { label: "Runs", value: "runs", href: "/dashboard/analysis" },
        { label: "Templates", value: "templates", href: "/dashboard/analysis/templates" },
      ]}
      actions={
        <>
          <button
            type="button"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Filter
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Display
          </button>
        </>
      }
    >
      <p className="text-muted-foreground">Run and view repository analyses.</p>
    </DashboardPageShell>
  );
}
