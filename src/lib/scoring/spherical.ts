import type { ScoredMarket, ScoreResult } from "./types";
import { clipProbability } from "./logarithmic";

/**
 * Compute the spherical score for a single prediction.
 * Higher is better. Range: [0, 1].
 *
 * Formula:
 *   (p * outcome + (1-p) * (1-outcome)) / sqrt(p^2 + (1-p)^2)
 *
 * Probabilities are clipped using the same EPSILON as logarithmic scoring
 * to avoid division-by-zero edge cases.
 */
export function sphericalScore(p: number, outcome: 0 | 1): number {
  const { clipped } = clipProbability(p);
  const q = 1 - clipped;
  const numerator = clipped * outcome + q * (1 - outcome);
  const denominator = Math.sqrt(clipped ** 2 + q ** 2);
  return numerator / denominator;
}

/**
 * Compute per-market and aggregate (mean) spherical scores.
 * Markets flagged as `excluded` are filtered out before scoring.
 * Tracks how many probabilities required clipping.
 */
export function computeSphericalScores(markets: ScoredMarket[]): ScoreResult {
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

  let clipCount = 0;

  const perMarket = eligible.map((m) => {
    const { clipped, wasClipped } = clipProbability(m.sampledProbability);
    if (wasClipped) clipCount++;

    const q = 1 - clipped;
    const outcome = m.outcome;
    const numerator = clipped * outcome + q * (1 - outcome);
    const denominator = Math.sqrt(clipped ** 2 + q ** 2);

    return { marketId: m.id, score: numerator / denominator };
  });

  const aggregate =
    perMarket.reduce((sum, entry) => sum + entry.score, 0) / perMarket.length;

  return {
    perMarket,
    aggregate,
    sampleSize: perMarket.length,
    clipCount,
    clipRate: clipCount / perMarket.length,
  };
}
