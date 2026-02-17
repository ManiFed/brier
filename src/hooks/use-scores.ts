"use client";

import { useMemo } from "react";
import type { ScoredMarket, ExchangeScores } from "@/lib/scoring/types";
import { computeBrierScores } from "@/lib/scoring/brier";
import { computeLogScores } from "@/lib/scoring/logarithmic";
import { computeSphericalScores } from "@/lib/scoring/spherical";
import { computeCalibrationBins } from "@/lib/scoring/calibration";
import { computeSharpness } from "@/lib/scoring/sharpness";
import { useDashboardStore } from "@/store/dashboard-store";

export function useScores(markets: ScoredMarket[]): {
  byExchange: ExchangeScores[];
  overall: ExchangeScores | null;
} {
  const binScheme = useDashboardStore((s) => s.binScheme);

  return useMemo(() => {
    const included = markets.filter((m) => !m.excluded);
    if (included.length === 0) {
      return { byExchange: [], overall: null };
    }

    // Group by exchange
    const exchangeGroups = new Map<string, ScoredMarket[]>();
    for (const m of included) {
      const group = exchangeGroups.get(m.exchange) || [];
      group.push(m);
      exchangeGroups.set(m.exchange, group);
    }

    const byExchange: ExchangeScores[] = [];

    for (const [exchange, group] of exchangeGroups) {
      const brier = computeBrierScores(group);
      const log = computeLogScores(group);
      const spherical = computeSphericalScores(group);
      const bins = computeCalibrationBins(group, binScheme);
      const sharpness = computeSharpness(group);

      byExchange.push({
        exchange,
        brier: brier.aggregate,
        logarithmic: log.aggregate,
        spherical: spherical.aggregate,
        sampleSize: group.length,
        clipRate: Math.max(log.clipRate, spherical.clipRate),
        calibrationBins: bins,
        sharpness,
      });
    }

    // Sort by Brier score (lower is better)
    byExchange.sort((a, b) => a.brier - b.brier);

    // Compute overall
    const brier = computeBrierScores(included);
    const log = computeLogScores(included);
    const spherical = computeSphericalScores(included);
    const bins = computeCalibrationBins(included, binScheme);
    const sharpness = computeSharpness(included);

    const overall: ExchangeScores = {
      exchange: "overall",
      brier: brier.aggregate,
      logarithmic: log.aggregate,
      spherical: spherical.aggregate,
      sampleSize: included.length,
      clipRate: Math.max(log.clipRate, spherical.clipRate),
      calibrationBins: bins,
      sharpness,
    };

    return { byExchange, overall };
  }, [markets, binScheme]);
}
