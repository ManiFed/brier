import type { ScoredMarket } from "./types";

/**
 * Binary entropy of a probability value (in bits).
 *
 * H(p) = -p * log2(p) - (1-p) * log2(1-p)
 *
 * Returns 0 for p = 0 and p = 1 (by the convention 0 * log(0) = 0).
 * Range: [0, 1] where 1 = maximum uncertainty (p = 0.5).
 */
export function binaryEntropy(p: number): number {
  if (p <= 0 || p >= 1) {
    return 0;
  }
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

/**
 * Compute sharpness metrics from scored markets.
 *
 * @param markets - All scored markets (excluded ones are filtered out internally)
 * @returns meanEntropy — average binary entropy of sampled probabilities (lower = sharper)
 *          probDistribution — histogram of probabilities in 20 equal-width bins
 *                             [0, 0.05), [0.05, 0.10), ..., [0.95, 1.0]
 */
export function computeSharpness(markets: ScoredMarket[]): {
  meanEntropy: number;
  probDistribution: number[];
} {
  const eligible = markets.filter((m) => !m.excluded);

  // 20 bins: each bin width = 0.05
  const NUM_BINS = 20;
  const probDistribution = new Array<number>(NUM_BINS).fill(0);

  if (eligible.length === 0) {
    return { meanEntropy: NaN, probDistribution };
  }

  let entropySum = 0;

  for (const m of eligible) {
    const p = m.sampledProbability;
    entropySum += binaryEntropy(p);

    // Bin index: p in [0, 0.05) -> 0, [0.05, 0.10) -> 1, ..., [0.95, 1.0] -> 19
    let binIndex = Math.floor(p / 0.05);
    // Clamp to last bin for p = 1.0
    if (binIndex >= NUM_BINS) {
      binIndex = NUM_BINS - 1;
    }
    probDistribution[binIndex]++;
  }

  const meanEntropy = entropySum / eligible.length;

  return { meanEntropy, probDistribution };
}
