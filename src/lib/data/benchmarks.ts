// ─── Benchmark Generators ────────────────────────────────────────────────────
//
// Produce synthetic "exchange" entries that serve as naive baselines.
// Comparing real exchanges against these benchmarks makes it easy to see
// whether a market is adding forecasting value.
//
// Every generator takes an array of ScoredMarkets and returns a new array
// with the same structure but with sampledProbability replaced by the
// benchmark value and exchange set to a "benchmark:*" label.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScoredMarket } from "@/lib/scoring/types";

// ─── Coin-flip benchmark ────────────────────────────────────────────────────

/**
 * "What if every forecast were 50 %?"
 * This is the most uninformative benchmark — equivalent to coin-flipping.
 */
export function generateCoinFlipBenchmark(
  markets: ScoredMarket[],
): ScoredMarket[] {
  return markets.map((m) => ({
    ...m,
    id: `benchmark:coin-flip:${m.id}`,
    exchange: "benchmark:coin-flip",
    sampledProbability: 0.5,
  }));
}

// ─── Base-rate benchmark ────────────────────────────────────────────────────

/**
 * "What if every forecast were the historical base rate?"
 * Computes the overall fraction of YES outcomes in the cohort and assigns
 * that single value to every market's sampledProbability.
 *
 * This baseline is surprisingly hard to beat in domains where outcomes
 * are heavily skewed (e.g. 90 % of questions resolve YES).
 */
export function generateBaseRateBenchmark(
  markets: ScoredMarket[],
): ScoredMarket[] {
  if (markets.length === 0) return [];

  // Compute the mean outcome across the cohort
  const baseRate =
    markets.reduce((sum, m) => sum + m.outcome, 0) / markets.length;

  return markets.map((m) => ({
    ...m,
    id: `benchmark:base-rate:${m.id}`,
    exchange: "benchmark:base-rate",
    sampledProbability: baseRate,
  }));
}

// ─── Persistence (lagged) benchmark ─────────────────────────────────────────

/**
 * "What if we just used the probability from N hours ago?"
 *
 * A proper implementation would look up the probability time-series for
 * each market, find the observation at (sampledAt - lagHours), and use
 * that as the benchmark prediction. This requires access to the full
 * observation history.
 *
 * For now this returns a simplified placeholder: the existing
 * sampledProbability is carried through unchanged, and the exchange label
 * indicates the lag that *should* be applied. This lets the rest of the
 * pipeline (scoring, calibration, UI) handle the benchmark shape correctly
 * while the real time-series lookup is wired up later.
 *
 * TODO: Accept a probability-history lookup function and compute the
 * actual lagged probability for each market.
 */
export function generatePersistenceBenchmark(
  markets: ScoredMarket[],
  lagHours: number,
): ScoredMarket[] {
  return markets.map((m) => {
    // Compute what the sampledAt would be if we shifted by lagHours
    const laggedSampledAt = new Date(
      m.sampledAt.getTime() - lagHours * 60 * 60 * 1000,
    );

    return {
      ...m,
      id: `benchmark:persistence:${m.id}`,
      exchange: "benchmark:persistence",
      // NOTE: This uses the original sampledProbability as a placeholder.
      // A real implementation would look up the probability at laggedSampledAt
      // from the observation time-series.
      sampledProbability: m.sampledProbability,
      sampledAt: laggedSampledAt,
    };
  });
}

// ─── Convenience: generate all benchmarks at once ───────────────────────────

export interface BenchmarkSuite {
  coinFlip: ScoredMarket[];
  baseRate: ScoredMarket[];
  persistence: ScoredMarket[];
}

/**
 * Generate all standard benchmarks for a set of scored markets.
 * Default persistence lag is 24 hours.
 */
export function generateAllBenchmarks(
  markets: ScoredMarket[],
  persistenceLagHours = 24,
): BenchmarkSuite {
  return {
    coinFlip: generateCoinFlipBenchmark(markets),
    baseRate: generateBaseRateBenchmark(markets),
    persistence: generatePersistenceBenchmark(markets, persistenceLagHours),
  };
}
