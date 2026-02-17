"use client";

import { AlertCircle, CheckCircle, Loader2, Triangle } from "lucide-react";
import type { CohortSummary } from "@/lib/scoring/types";

interface CohortBarProps {
  summary: CohortSummary | null;
  loading: boolean;
  error: string | null;
}

export function CohortBar({ summary, loading, error }: CohortBarProps) {
  if (error) {
    return (
      <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-3 text-sm text-destructive glass-card">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>Error loading markets: {error}</span>
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <div className="mt-5 flex items-center gap-2.5 rounded-xl glass-card px-5 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 text-primary/60" />
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
    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl glass-card px-5 py-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
        <span>
          Scoring <strong className="text-foreground font-semibold">{summary.scored}</strong>{" "}
          markets
        </span>
      </div>

      {summary.excluded > 0 && (
        <div className="flex items-center gap-1.5">
          <Triangle className="h-3 w-3 text-amber-500" />
          <span>
            Excluded{" "}
            <strong className="text-foreground font-semibold">{summary.excluded}</strong>
          </span>
          {exclusionDetails && (
            <span className="text-muted-foreground/50">
              ({exclusionDetails})
            </span>
          )}
        </div>
      )}

      <div className="hidden sm:flex items-center gap-1.5">
        <span className="bg-primary/10 text-primary/80 px-2 py-0.5 rounded-full text-[10px] font-medium">
          {horizonLabel}
        </span>
      </div>

      {summary.resolutionWindow && (
        <div className="hidden md:block text-muted-foreground/70">
          {summary.resolutionWindow.start.toLocaleDateString()} &ndash;{" "}
          {summary.resolutionWindow.end.toLocaleDateString()}
        </div>
      )}

      {summary.topics.length > 0 && summary.topics.length <= 3 && (
        <div className="hidden lg:block text-muted-foreground/70">
          Topics: {summary.topics.join(", ")}
        </div>
      )}

      {summary.clipRate > 0 && (
        <div className="hidden lg:block text-muted-foreground/70">
          Clip rate: {(summary.clipRate * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
