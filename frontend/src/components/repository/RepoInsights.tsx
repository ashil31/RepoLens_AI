"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer as BarResponsive,
} from "recharts";
import { cn } from "@/lib/utils";

const tooltipContentStyle = {
  backgroundColor: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  padding: "8px 12px",
  fontSize: "12px",
} as const;

type FileItem = { id: string; path: string; language: string | null };

type RepoInsightsProps = {
  files: FileItem[];
  className?: string;
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

function getExtension(path: string): string {
  const m = path.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "other";
}

export function RepoInsights({ files, className }: RepoInsightsProps) {
  const languageBreakdown = useMemo(() => {
    const byLang = new Map<string, number>();
    files.forEach((f) => {
      const lang = f.language || getExtension(f.path);
      byLang.set(lang, (byLang.get(lang) || 0) + 1);
    });
    return Array.from(byLang.entries())
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [files]);

  const totalLanguageFiles = languageBreakdown.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const largestFiles = useMemo(() => {
    return [...files]
      .sort((a, b) => b.path.length - a.path.length)
      .slice(0, 5)
      .map((f) => ({ path: f.path.split("/").pop() || f.path }));
  }, [files]);

  const topDirs = useMemo(() => {
    const dirs = new Map<string, number>();
    files.forEach((f) => {
      const top = f.path.split("/")[0];
      if (top) dirs.set(top, (dirs.get(top) || 0) + 1);
    });
    return Array.from(dirs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, files: count }));
  }, [files]);

  return (
    <div
      className={cn(
        "repo-insights h-full min-h-0 overflow-y-auto p-4 dashboard-content-scroll",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">Insights</h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-medium text-foreground/90 mb-2">Language / file type</h4>
          {languageBreakdown.length > 0 ? (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={64}
                      label={false}
                      labelLine={false}
                    >
                      {languageBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      formatter={(value: unknown) => [`${Number(value ?? 0)} files`, "Count"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {languageBreakdown.map((item, index) => {
                  const percent =
                    totalLanguageFiles === 0
                      ? 0
                      : Math.round((item.value / totalLanguageFiles) * 100);
                  return (
                    <div
                      key={item.name}
                      className="inline-flex items-center gap-1 text-foreground/90"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No file data yet.</p>
          )}
        </div>
        <div>
          <h4 className="text-xs font-medium text-foreground/90 mb-2">Top directories</h4>
          {topDirs.length > 0 ? (
            <div className="h-36 w-full">
              <BarResponsive width="100%" height="100%">
                <BarChart data={topDirs} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fontSize: 11}}
                  />
                  <Bar dataKey="files" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(value: unknown) => [`${Number(value ?? 0)} files`, "Files"]}
                  />
                </BarChart>
              </BarResponsive>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No directories yet.</p>
          )}
        </div>
        <div>
          <h4 className="text-xs font-medium text-foreground/90 mb-2">Largest paths</h4>
          <ul className="space-y-1">
            {largestFiles.map((f, i) => (
              <li key={i} className="truncate font-mono text-xs text-foreground">
                {f.path}
              </li>
            ))}
            {largestFiles.length === 0 && (
              <li className="text-xs text-muted-foreground">No files.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
