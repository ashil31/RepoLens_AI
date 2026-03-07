import { DashboardPageShell } from "@/components/dashboard";

export default function DashboardPage() {
  return (
    <DashboardPageShell title="Workspace">
      <p className="text-muted-foreground">
        Welcome to RepoLens. Use the sidebar to navigate or press ⌘K for commands.
      </p>
    </DashboardPageShell>
  );
}
