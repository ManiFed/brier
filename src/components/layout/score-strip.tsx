"use client";

import type { CohortSummary, ExchangeScores } from "@/lib/scoring/types";
import { useDashboardStore } from "@/store/dashboard-store";

interface ScoreStripProps {
  overall: ExchangeScores | null;
  summary: CohortSummary | null;
  loading: boolean;
  error: string | null;
}

function ScoreItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/45 px-2.5 py-1 text-[11px] backdrop-blur-md border border-white/50">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function ScoreStrip({ overall, summary, loading, error }: ScoreStripProps) {
  const selectedExchanges = useDashboardStore((s) => s.selectedExchanges);
  const selectedTopics = useDashboardStore((s) => s.selectedTopics);
  const selectedSeries = useDashboardStore((s) => s.selectedSeries);

  const activeFilters = selectedExchanges.length + selectedTopics.length + selectedSeries.length;

  if (loading) {
    return <div className="h-9 rounded-full glass-card prism-loading" />;
  }

  if (error) {
    return (
      <div className="rounded-full glass-card px-4 py-2 text-xs text-destructive">
        Error loading metrics: {error}
      </div>
    );
  }

  return (
    <div className="sticky top-4 z-20 mb-5 rounded-full glass-card px-2 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <ScoreItem label="Brier" value={overall ? overall.brier.toFixed(4) : "—"} />
        <ScoreItem label="Log" value={overall ? overall.logarithmic.toFixed(4) : "—"} />
        <ScoreItem label="Spherical" value={overall ? overall.spherical.toFixed(4) : "—"} />
        <ScoreItem label="Markets" value={String(summary?.scored ?? 0)} />
        <ScoreItem label="Excluded" value={String(summary?.excluded ?? 0)} />
        <ScoreItem label="Filters" value={String(activeFilters)} />
      </div>
    </div>
  );
}
