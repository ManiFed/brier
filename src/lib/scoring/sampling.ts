import type { ProbabilityPoint, EvaluationTime } from "./types";

/**
 * Sample a probability from a time-series of observations according to an
 * evaluation-time strategy.
 *
 * @param observations    - Raw probability observations, need not be sorted
 * @param resolvedAt      - When the market resolved
 * @param evalTime        - The evaluation-time strategy
 * @param toleranceHours  - Allowed deviation from the target time (for fixed_horizon)
 * @returns The sampled probability and the timestamp it was sampled at, or null
 *          if no valid observation is found
 */
export function sampleProbability(
  observations: ProbabilityPoint[],
  resolvedAt: Date,
  evalTime: EvaluationTime,
  toleranceHours: number,
): { probability: number; sampledAt: Date } | null {
  if (observations.length === 0) {
    return null;
  }

  switch (evalTime.type) {
    case "fixed_horizon":
      return sampleFixedHorizon(
        observations,
        resolvedAt,
        evalTime.hours,
        toleranceHours,
      );
    case "close":
      return sampleClose(
        observations,
        resolvedAt,
        evalTime.safetyOffsetMinutes,
      );
    case "smoothed_close":
      return sampleSmoothedClose(
        observations,
        resolvedAt,
        evalTime.windowHours,
        evalTime.timeWeighted,
      );
  }
}

// ─── Fixed Horizon ───────────────────────────────────────────────────────────

function sampleFixedHorizon(
  observations: ProbabilityPoint[],
  resolvedAt: Date,
  hours: number,
  toleranceHours: number,
): { probability: number; sampledAt: Date } | null {
  const targetMs = resolvedAt.getTime() - hours * 3_600_000;
  const toleranceMs = toleranceHours * 3_600_000;

  let bestObs: ProbabilityPoint | null = null;
  let bestDistance = Infinity;

  for (const obs of observations) {
    const distance = Math.abs(obs.observedAt.getTime() - targetMs);
    if (distance <= toleranceMs && distance < bestDistance) {
      bestDistance = distance;
      bestObs = obs;
    }
  }

  if (bestObs === null) {
    return null;
  }

  return { probability: bestObs.probability, sampledAt: bestObs.observedAt };
}

// ─── Close ───────────────────────────────────────────────────────────────────

function sampleClose(
  observations: ProbabilityPoint[],
  resolvedAt: Date,
  safetyOffsetMinutes: number,
): { probability: number; sampledAt: Date } | null {
  const targetMs = resolvedAt.getTime() - safetyOffsetMinutes * 60_000;

  // Find the last observation that is at or before the target time
  let bestObs: ProbabilityPoint | null = null;
  let bestTime = -Infinity;

  for (const obs of observations) {
    const obsTime = obs.observedAt.getTime();
    if (obsTime <= targetMs && obsTime > bestTime) {
      bestTime = obsTime;
      bestObs = obs;
    }
  }

  if (bestObs === null) {
    return null;
  }

  return { probability: bestObs.probability, sampledAt: bestObs.observedAt };
}

// ─── Smoothed Close ──────────────────────────────────────────────────────────

function sampleSmoothedClose(
  observations: ProbabilityPoint[],
  resolvedAt: Date,
  windowHours: number,
  timeWeighted: boolean,
): { probability: number; sampledAt: Date } | null {
  const resolvedMs = resolvedAt.getTime();
  const windowStartMs = resolvedMs - windowHours * 3_600_000;

  // Collect all observations in [windowStart, resolvedAt)
  const inWindow = observations.filter((obs) => {
    const t = obs.observedAt.getTime();
    return t >= windowStartMs && t < resolvedMs;
  });

  if (inWindow.length === 0) {
    return null;
  }

  if (!timeWeighted) {
    // Simple average
    const sumP = inWindow.reduce((s, obs) => s + obs.probability, 0);
    const probability = sumP / inWindow.length;

    // Use the latest observation time as sampledAt
    const latest = inWindow.reduce((best, obs) =>
      obs.observedAt.getTime() > best.observedAt.getTime() ? obs : best,
    );

    return { probability, sampledAt: latest.observedAt };
  }

  // Time-weighted (linear recency weighting)
  // Weight = distance from window start (more recent = higher weight)
  const windowDurationMs = windowHours * 3_600_000;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const obs of inWindow) {
    const elapsed = obs.observedAt.getTime() - windowStartMs;
    // Linear weight: 0 at window start, windowDurationMs at resolvedAt
    const weight = elapsed / windowDurationMs;
    weightedSum += obs.probability * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    // All observations exactly at window start — fall back to simple average
    const sumP = inWindow.reduce((s, obs) => s + obs.probability, 0);
    const probability = sumP / inWindow.length;
    const latest = inWindow.reduce((best, obs) =>
      obs.observedAt.getTime() > best.observedAt.getTime() ? obs : best,
    );
    return { probability, sampledAt: latest.observedAt };
  }

  const probability = weightedSum / totalWeight;

  const latest = inWindow.reduce((best, obs) =>
    obs.observedAt.getTime() > best.observedAt.getTime() ? obs : best,
  );

  return { probability, sampledAt: latest.observedAt };
}
