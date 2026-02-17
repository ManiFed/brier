import type { ScoredMarket, ScoreResult } from "./types";

/**
 * Compute the Brier score for a single prediction.
 * Range: [0, 1] where 0 is perfect and 1 is worst.
 */
export function brierScore(p: number, outcome: 0 | 1): number {
  return (p - outcome) ** 2;
}

/**
 * Compute per-market and aggregate (mean) Brier scores.
 * Markets flagged as `excluded` are filtered out before scoring.
 * Brier scoring never clips probabilities, so clipCount and clipRate are always 0.
 */
export function computeBrierScores(markets: ScoredMarket[]): ScoreResult {
  const eligible = markets.filter((m) => !m.excluded);

  if (eligible.length === 0) {
    return {
      perMarket: [],
      aggregate: NaN,
      sampleSize: 0,
      clipCount: 0,
      clipRate: 0,
    };
  }

  const perMarket = eligible.map((m) => ({
    marketId: m.id,
    score: brierScore(m.sampledProbability, m.outcome),
  }));

  const aggregate =
    perMarket.reduce((sum, entry) => sum + entry.score, 0) / perMarket.length;

  return {
    perMarket,
    aggregate,
    sampleSize: perMarket.length,
    clipCount: 0,
    clipRate: 0,
  };
}
