"use client";

import { useState, useEffect, useCallback } from "react";
import { useDashboardStore } from "@/store/dashboard-store";
import type { ScoredMarket, CohortSummary } from "@/lib/scoring/types";

interface UseCohortResult {
  markets: ScoredMarket[];
  summary: CohortSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function buildQueryParams(state: {
  selectedExchanges: string[];
  selectedTopics: string[];
  selectedSeries: string[];
  resolutionWindow: { start: Date; end: Date } | null;
  outcomeStatus: string;
  evaluationTime: { type: string; hours?: number; safetyOffsetMinutes?: number; windowHours?: number; timeWeighted?: boolean };
  horizonToleranceHours: number;
}): string {
  const params = new URLSearchParams();

  if (state.selectedExchanges.length > 0) {
    params.set("exchanges", state.selectedExchanges.join(","));
  }
  if (state.selectedTopics.length > 0) {
    params.set("topics", state.selectedTopics.join(","));
  }
  if (state.selectedSeries.length > 0) {
    params.set("series", state.selectedSeries.join(","));
  }
  if (state.resolutionWindow) {
    params.set("resolution_start", state.resolutionWindow.start.toISOString());
    params.set("resolution_end", state.resolutionWindow.end.toISOString());
  }
  params.set("outcome_status", state.outcomeStatus);
  params.set("horizon_type", state.evaluationTime.type);

  if (state.evaluationTime.type === "fixed_horizon" && state.evaluationTime.hours) {
    params.set("horizon_hours", String(state.evaluationTime.hours));
  }
  if (state.evaluationTime.type === "close" && state.evaluationTime.safetyOffsetMinutes) {
    params.set("safety_offset", String(state.evaluationTime.safetyOffsetMinutes));
  }
  if (state.evaluationTime.type === "smoothed_close") {
    if (state.evaluationTime.windowHours) {
      params.set("window_hours", String(state.evaluationTime.windowHours));
    }
    if (state.evaluationTime.timeWeighted) {
      params.set("time_weighted", "true");
    }
  }
  params.set("tolerance_hours", String(state.horizonToleranceHours));

  return params.toString();
}

export function useCohort(): UseCohortResult {
  const [markets, setMarkets] = useState<ScoredMarket[]>([]);
  const [summary, setSummary] = useState<CohortSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedExchanges = useDashboardStore((s) => s.selectedExchanges);
  const selectedTopics = useDashboardStore((s) => s.selectedTopics);
  const selectedSeries = useDashboardStore((s) => s.selectedSeries);
  const resolutionWindow = useDashboardStore((s) => s.resolutionWindow);
  const outcomeStatus = useDashboardStore((s) => s.outcomeStatus);
  const evaluationTime = useDashboardStore((s) => s.evaluationTime);
  const horizonToleranceHours = useDashboardStore(
    (s) => s.horizonToleranceHours
  );

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryString = buildQueryParams({
        selectedExchanges,
        selectedTopics,
        selectedSeries,
        resolutionWindow,
        outcomeStatus,
        evaluationTime,
        horizonToleranceHours,
      });

      const response = await fetch(`/api/markets?${queryString}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const parsed: ScoredMarket[] = data.markets.map(
        (m: Record<string, unknown>) => ({
          ...m,
          resolvedAt: new Date(m.resolvedAt as string),
          sampledAt: new Date(m.sampledAt as string),
          metadata: {
            ...(m.metadata as Record<string, unknown>),
            createdAt: new Date(
              (m.metadata as Record<string, unknown>).createdAt as string
            ),
          },
        })
      );

      setMarkets(parsed);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [
    selectedExchanges,
    selectedTopics,
    selectedSeries,
    resolutionWindow,
    outcomeStatus,
    evaluationTime,
    horizonToleranceHours,
  ]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return { markets, summary, loading, error, refetch: fetchMarkets };
}
