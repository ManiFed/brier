import type { ScoredMarket, ScoreResult } from "./types";

/** Smallest probability value allowed (avoids -Infinity from Math.log). */
export const EPSILON = 1e-7;

/**
 * Clamp a probability to [EPSILON, 1 - EPSILON].
 * Returns the clamped value and whether clamping occurred.
 */
export function clipProbability(p: number): {
  clipped: number;
  wasClipped: boolean;
} {
  if (p < EPSILON) {
    return { clipped: EPSILON, wasClipped: true };
  }
  if (p > 1 - EPSILON) {
    return { clipped: 1 - EPSILON, wasClipped: true };
  }
  return { clipped: p, wasClipped: false };
}

/**
 * Compute the logarithmic score for a single prediction.
 * Lower is better (like Brier). Range: [0, +Infinity).
 * Probabilities are clipped to avoid log(0).
 */
export function logScore(p: number, outcome: 0 | 1): number {
  const { clipped } = clipProbability(p);
  return outcome === 1 ? -Math.log(clipped) : -Math.log(1 - clipped);
}

/**
 * Compute per-market and aggregate (mean) logarithmic scores.
 * Markets flagged as `excluded` are filtered out before scoring.
 * Tracks how many probabilities required clipping.
 */
export function computeLogScores(markets: ScoredMarket[]): ScoreResult {
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

    const outcome = m.outcome;
    const score =
      outcome === 1 ? -Math.log(clipped) : -Math.log(1 - clipped);

    return { marketId: m.id, score };
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
