import type { ScoredMarket, CalibrationBin, BinScheme } from "./types";

/**
 * Wilson score confidence interval for a binomial proportion.
 *
 * @param successes - Number of successes (outcomes = 1)
 * @param trials    - Total number of trials
 * @param z         - Z-score for desired confidence level (default 1.96 = 95%)
 * @returns         - Lower and upper bounds of the confidence interval
 */
export function wilsonInterval(
  successes: number,
  trials: number,
  z: number = 1.96,
): { low: number; high: number } {
  if (trials === 0) {
    return { low: 0, high: 0 };
  }

  const pHat = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;

  const centre = pHat + z2 / (2 * trials);
  const margin = z * Math.sqrt((pHat * (1 - pHat) + z2 / (4 * trials)) / trials);

  const low = Math.max(0, (centre - margin) / denominator);
  const high = Math.min(1, (centre + margin) / denominator);

  return { low, high };
}

/**
 * Build calibration bins from scored markets.
 *
 * @param markets  - All scored markets (excluded ones are filtered out internally)
 * @param scheme   - 'fixed_width' for equal-width bins, 'equal_count' for quantile bins
 * @param numBins  - Number of bins (default 10)
 * @returns        - Array of non-empty CalibrationBin objects
 */
export function computeCalibrationBins(
  markets: ScoredMarket[],
  scheme: BinScheme,
  numBins: number = 10,
): CalibrationBin[] {
  const eligible = markets.filter((m) => !m.excluded);

  if (eligible.length === 0) {
    return [];
  }

  if (scheme === "fixed_width") {
    return fixedWidthBins(eligible, numBins);
  }

  return equalCountBins(eligible, numBins);
}

// ─── Fixed-width binning ─────────────────────────────────────────────────────

function fixedWidthBins(
  markets: ScoredMarket[],
  numBins: number,
): CalibrationBin[] {
  const width = 1 / numBins;
  const bins: CalibrationBin[] = [];

  for (let i = 0; i < numBins; i++) {
    const low = i * width;
    const high = (i + 1) * width;
    const isLastBin = i === numBins - 1;

    // Last bin is inclusive of 1.0: [low, 1.0]
    // All others are half-open: [low, high)
    const binMarkets = markets.filter((m) => {
      const p = m.sampledProbability;
      if (isLastBin) {
        return p >= low && p <= high;
      }
      return p >= low && p < high;
    });

    if (binMarkets.length === 0) continue;

    bins.push(buildBin(low, high, binMarkets));
  }

  return bins;
}

// ─── Equal-count (quantile) binning ──────────────────────────────────────────

function equalCountBins(
  markets: ScoredMarket[],
  numBins: number,
): CalibrationBin[] {
  const sorted = [...markets].sort(
    (a, b) => a.sampledProbability - b.sampledProbability,
  );

  const bins: CalibrationBin[] = [];
  const baseSize = Math.floor(sorted.length / numBins);
  const remainder = sorted.length % numBins;

  let offset = 0;

  for (let i = 0; i < numBins; i++) {
    // Distribute remainder across the first `remainder` bins
    const size = baseSize + (i < remainder ? 1 : 0);
    if (size === 0) continue;

    const binMarkets = sorted.slice(offset, offset + size);
    const low = binMarkets[0].sampledProbability;
    const high = binMarkets[binMarkets.length - 1].sampledProbability;

    bins.push(buildBin(low, high, binMarkets));
    offset += size;
  }

  return bins;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildBin(
  binEdgeLow: number,
  binEdgeHigh: number,
  markets: ScoredMarket[],
): CalibrationBin {
  const count = markets.length;

  const meanPredicted =
    markets.reduce((sum, m) => sum + m.sampledProbability, 0) / count;

  const successes = markets.filter((m) => m.outcome === 1).length;
  const observedFrequency = successes / count;

  const residual = observedFrequency - meanPredicted;

  const confidenceInterval = wilsonInterval(successes, count);

  return {
    binEdgeLow,
    binEdgeHigh,
    meanPredicted,
    observedFrequency,
    residual,
    count,
    confidenceInterval,
    markets,
  };
}
