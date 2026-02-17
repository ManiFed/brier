"use client";

import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import type { CohortSummary } from "@/lib/scoring/types";

interface CohortBarProps {
  summary: CohortSummary | null;
  loading: boolean;
  error: string | null;
}

export function CohortBar({ summary, loading, error }: CohortBarProps) {
  if (error) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>Error loading markets: {error}</span>
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
        <span>Loading markets...</span>
      </div>
    );
  }

  const horizonLabel =
    summary.horizon.type === "fixed_horizon"
      ? `${summary.horizon.hours}h before resolution`
      : summary.horizon.type === "close"
        ? `Close (${summary.horizon.safetyOffsetMinutes}min offset)`
        : `Smoothed close (${summary.horizon.windowHours}h window)`;

  const exclusionDetails = Object.entries(summary.excludedByReason)
    .filter(([, count]) => count > 0)
    .map(([reason, count]) => `${count} ${reason}`)
    .join(", ");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
        <span>
          Scoring <strong className="text-foreground">{summary.scored}</strong>{" "}
          markets
        </span>
      </div>

      {summary.excluded > 0 && (
        <div className="flex items-center gap-1.5">
          <span>
            Excluded{" "}
            <strong className="text-foreground">{summary.excluded}</strong>
          </span>
          {exclusionDetails && (
            <span className="text-muted-foreground/70">
              ({exclusionDetails})
            </span>
          )}
        </div>
      )}

      <div className="hidden sm:block">Horizon: {horizonLabel}</div>

      {summary.resolutionWindow && (
        <div className="hidden md:block">
          {summary.resolutionWindow.start.toLocaleDateString()} -{" "}
          {summary.resolutionWindow.end.toLocaleDateString()}
        </div>
      )}

      {summary.topics.length > 0 && summary.topics.length <= 3 && (
        <div className="hidden lg:block">
          Topics: {summary.topics.join(", ")}
        </div>
      )}

      {summary.clipRate > 0 && (
        <div className="hidden lg:block">
          Clip rate: {(summary.clipRate * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
