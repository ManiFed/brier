import { and, eq, gte, lte, inArray, isNotNull } from "drizzle-orm";
import { markets, probabilityObservations } from "@/lib/db/schema";
import { db } from "@/lib/db/client";
import type { EvaluationTime, ScoredMarket, CohortSummary, ExclusionReason } from "@/lib/scoring/types";
import { queryDemoCohort } from "@/lib/data/demo-cohort";

export interface CohortFilters {
  exchanges?: string[];
  topics?: string[];
  series?: string[];
  resolutionStart?: Date;
  resolutionEnd?: Date;
  outcomeStatus?: "resolved_only" | "all";
  evaluationTime: EvaluationTime;
  horizonToleranceHours: number;
}

interface MarketRow {
  id: string;
  externalId: string;
  exchange: string;
  title: string;
  topic: string;
  series: string | null;
  outcome: number | null;
  resolvedAt: number | null;
  status: string;
  volume: number | null;
  liquidity: number | null;
  createdAt: number;
  tags: string[] | string | null;
}

interface ObservationRow {
  probability: number;
  observedAt: number;
}

/**
 * Query markets from the database and sample probabilities based on evaluation time.
 * Returns ScoredMarket[] with exclusion metadata + CohortSummary.
 */
export async function queryCohort(
  filters: CohortFilters
): Promise<{ markets: ScoredMarket[]; summary: CohortSummary }> {
  const conditions = [];

  if (filters.exchanges && filters.exchanges.length > 0) {
    conditions.push(inArray(markets.exchange, filters.exchanges));
  }
  if (filters.topics && filters.topics.length > 0) {
    conditions.push(inArray(markets.topic, filters.topics));
  }
  if (filters.series && filters.series.length > 0) {
    conditions.push(inArray(markets.series, filters.series));
  }
  if (filters.resolutionStart) {
    conditions.push(gte(markets.resolvedAt, filters.resolutionStart.getTime()));
  }
  if (filters.resolutionEnd) {
    conditions.push(lte(markets.resolvedAt, filters.resolutionEnd.getTime()));
  }
  if (filters.outcomeStatus === "resolved_only") {
    conditions.push(eq(markets.status, "resolved"));
    conditions.push(isNotNull(markets.outcome));
    conditions.push(isNotNull(markets.resolvedAt));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const marketRows = await db
    .select()
    .from(markets)
    .where(whereClause)
    .all() as MarketRow[];


  if (marketRows.length === 0) {
    return queryDemoCohort({
      exchanges: filters.exchanges,
      topics: filters.topics,
      series: filters.series,
      resolutionStart: filters.resolutionStart,
      resolutionEnd: filters.resolutionEnd,
      evaluationTime: filters.evaluationTime,
      horizonToleranceHours: filters.horizonToleranceHours,
    });
  }

  const scoredMarkets: ScoredMarket[] = [];
  const excludedByReason: Record<string, number> = {};
  let excludedCount = 0;

  for (const row of marketRows) {
    // Check for exclusion
    let excluded = false;
    let exclusionReason: ExclusionReason | undefined;

    if (row.status === "voided") {
      excluded = true;
      exclusionReason = "voided";
    } else if (row.status === "canceled") {
      excluded = true;
      exclusionReason = "canceled";
    } else if (row.status === "disputed") {
      excluded = true;
      exclusionReason = "disputed";
    } else if (row.status === "unresolved" || row.outcome === null) {
      excluded = true;
      exclusionReason = "unresolved";
    }

    if (excluded && exclusionReason) {
      excludedByReason[exclusionReason] =
        (excludedByReason[exclusionReason] || 0) + 1;
      excludedCount++;
    }

    // Get probability observations for this market
    const observations = await db
      .select()
      .from(probabilityObservations)
      .where(eq(probabilityObservations.marketId, row.id))
      .orderBy(probabilityObservations.observedAt)
      .all() as ObservationRow[];

    // Sample probability based on evaluation time
    let sampledProbability = 0.5;
    let sampledAt = new Date();
    if (!excluded && row.resolvedAt && observations.length > 0) {
      const result = sampleFromObservations(
        observations,
        new Date(row.resolvedAt),
        filters.evaluationTime,
        filters.horizonToleranceHours
      );

      if (result) {
        sampledProbability = result.probability;
        sampledAt = result.sampledAt;
      } else {
        excluded = true;
        exclusionReason = "missing_horizon_observation";
        excludedByReason["missing_horizon_observation"] =
          (excludedByReason["missing_horizon_observation"] || 0) + 1;
        excludedCount++;
      }
    }

    let tags: string[] = [];
    if (Array.isArray(row.tags)) {
      tags = row.tags;
    } else {
      try {
        tags = JSON.parse(row.tags || "[]");
      } catch {
        tags = [];
      }
    }

    scoredMarkets.push({
      id: row.id,
      externalId: row.externalId,
      exchange: row.exchange,
      title: row.title,
      topic: row.topic,
      series: row.series,
      outcome: (row.outcome ?? 0) as 0 | 1,
      resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : new Date(),
      sampledProbability,
      sampledAt,
      evaluationHorizon: filters.evaluationTime,
      excluded,
      exclusionReason,
      metadata: {
        volume: row.volume ?? undefined,
        liquidity: row.liquidity ?? undefined,
        createdAt: new Date(row.createdAt),
        tags,
      },
    });
  }

  const allTopics = [...new Set(marketRows.map((m) => m.topic))];
  const allSeries = [
    ...new Set(marketRows.map((m) => m.series).filter(Boolean)),
  ] as string[];

  const summary: CohortSummary = {
    scored: scoredMarkets.filter((m) => !m.excluded).length,
    excluded: excludedCount,
    excludedByReason: excludedByReason as Record<ExclusionReason, number>,
    horizon: filters.evaluationTime,
    resolutionWindow:
      filters.resolutionStart && filters.resolutionEnd
        ? { start: filters.resolutionStart, end: filters.resolutionEnd }
        : null,
    topics: allTopics,
    series: allSeries,
    clipRate: 0,
  };

  return { markets: scoredMarkets, summary };
}

function sampleFromObservations(
  observations: ObservationRow[],
  resolvedAt: Date,
  evalTime: EvaluationTime,
  toleranceHours: number
): { probability: number; sampledAt: Date } | null {
  if (observations.length === 0) return null;

  const toleranceMs = toleranceHours * 3600 * 1000;

  if (evalTime.type === "fixed_horizon") {
    const targetMs = resolvedAt.getTime() - evalTime.hours * 3600 * 1000;
    let best: ObservationRow | null = null;
    let bestDist = Infinity;

    for (const obs of observations) {
      const dist = Math.abs(obs.observedAt - targetMs);
      if (dist < bestDist && dist <= toleranceMs) {
        best = obs;
        bestDist = dist;
      }
    }

    if (!best) return null;
    return {
      probability: best.probability,
      sampledAt: new Date(best.observedAt),
    };
  }

  if (evalTime.type === "close") {
    const targetMs =
      resolvedAt.getTime() - evalTime.safetyOffsetMinutes * 60 * 1000;
    let best: ObservationRow | null = null;

    for (const obs of observations) {
      if (obs.observedAt <= targetMs) {
        if (!best || obs.observedAt > best.observedAt) {
          best = obs;
        }
      }
    }

    if (!best) return null;
    return {
      probability: best.probability,
      sampledAt: new Date(best.observedAt),
    };
  }

  if (evalTime.type === "smoothed_close") {
    const windowMs = evalTime.windowHours * 3600 * 1000;
    const windowStart = resolvedAt.getTime() - windowMs;
    const windowEnd = resolvedAt.getTime();

    const inWindow = observations.filter(
      (obs) => obs.observedAt >= windowStart && obs.observedAt <= windowEnd
    );

    if (inWindow.length === 0) return null;

    if (evalTime.timeWeighted) {
      let weightedSum = 0;
      let totalWeight = 0;
      for (const obs of inWindow) {
        const recency =
          (obs.observedAt - windowStart) / (windowEnd - windowStart);
        const weight = recency;
        weightedSum += obs.probability * weight;
        totalWeight += weight;
      }
      return {
        probability: totalWeight > 0 ? weightedSum / totalWeight : 0.5,
        sampledAt: new Date(windowEnd),
      };
    }

    const avg =
      inWindow.reduce((sum, obs) => sum + obs.probability, 0) / inWindow.length;
    return { probability: avg, sampledAt: new Date(windowEnd) };
  }

  return null;
}
