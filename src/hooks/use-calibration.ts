"use client";

import { useMemo } from "react";
import type { ScoredMarket, CalibrationBin, BinScheme } from "@/lib/scoring/types";
import { computeCalibrationBins } from "@/lib/scoring/calibration";

export interface ExchangeCalibration {
  exchange: string;
  bins: CalibrationBin[];
  color: string;
}

export function useCalibration(
  markets: ScoredMarket[],
  binScheme: BinScheme
): ExchangeCalibration[] {
  return useMemo(() => {
    const included = markets.filter((m) => !m.excluded);
    if (included.length === 0) return [];

    const { getExchangeColor } = require("@/lib/scoring/types");

    const exchangeGroups = new Map<string, ScoredMarket[]>();
    for (const m of included) {
      const group = exchangeGroups.get(m.exchange) || [];
      group.push(m);
      exchangeGroups.set(m.exchange, group);
    }

    const result: ExchangeCalibration[] = [];
    for (const [exchange, group] of exchangeGroups) {
      result.push({
        exchange,
        bins: computeCalibrationBins(group, binScheme),
        color: getExchangeColor(exchange),
      });
    }

    return result;
  }, [markets, binScheme]);
}
