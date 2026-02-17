import type { CohortSummary, EvaluationTime, ExclusionReason, ScoredMarket } from "@/lib/scoring/types";

export interface DemoMarket {
  id: string;
  externalId: string;
  exchange: string;
  title: string;
  topic: string;
  series: string | null;
  outcome: 0 | 1;
  status: "resolved";
  resolvedAt: Date;
  createdAt: Date;
  volume?: number;
  liquidity?: number;
  tags: string[];
  observations: { probability: number; observedAt: Date }[];
}

const HOUR = 60 * 60 * 1000;

function marketDate(iso: string): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

function withOffsets(resolvedAt: Date, values: Array<[number, number]>) {
  return values.map(([hoursBefore, probability]) => ({
    observedAt: new Date(resolvedAt.getTime() - hoursBefore * HOUR),
    probability,
  }));
}

function isDefinedString(value: string | null): value is string {
  return value !== null;
}

export const DEMO_MARKETS: DemoMarket[] = [
  {
    id: "demo-polymarket-us-election-2024",
    externalId: "pm-2024-us-election-winner",
    exchange: "polymarket",
    title: "Will Donald Trump win the 2024 U.S. presidential election?",
    topic: "Politics",
    series: "US Election 2024",
    outcome: 1,
    status: "resolved",
    resolvedAt: marketDate("2024-11-06"),
    createdAt: marketDate("2024-01-15"),
    volume: 125_000_000,
    liquidity: 2_300_000,
    tags: ["election", "usa"],
    observations: withOffsets(marketDate("2024-11-06"), [
      [720, 0.44],
      [336, 0.49],
      [168, 0.54],
      [72, 0.57],
      [24, 0.6],
      [1, 0.64],
    ]),
  },
  {
    id: "demo-polymarket-fed-cut-jul-2024",
    externalId: "pm-fed-cut-july-2024",
    exchange: "polymarket",
    title: "Will the Fed cut rates by July 2024?",
    topic: "Macro",
    series: "FOMC 2024",
    outcome: 0,
    status: "resolved",
    resolvedAt: marketDate("2024-07-31"),
    createdAt: marketDate("2023-12-20"),
    volume: 12_800_000,
    liquidity: 420_000,
    tags: ["fed", "rates"],
    observations: withOffsets(marketDate("2024-07-31"), [
      [720, 0.58],
      [336, 0.55],
      [168, 0.47],
      [72, 0.4],
      [24, 0.33],
      [1, 0.26],
    ]),
  },
  {
    id: "demo-metaculus-us-recession-2024",
    externalId: "mc-us-recession-2024",
    exchange: "metaculus",
    title: "Will the U.S. enter a recession in 2024?",
    topic: "Macro",
    series: "US Economy",
    outcome: 0,
    status: "resolved",
    resolvedAt: marketDate("2024-12-31"),
    createdAt: marketDate("2024-01-05"),
    tags: ["gdp", "recession"],
    observations: withOffsets(marketDate("2024-12-31"), [
      [720, 0.37],
      [336, 0.34],
      [168, 0.31],
      [72, 0.28],
      [24, 0.24],
      [1, 0.22],
    ]),
  },
  {
    id: "demo-metaculus-starship-orbital-2024",
    externalId: "mc-starship-orbital-2024",
    exchange: "metaculus",
    title: "Will SpaceX Starship complete an orbital test in 2024?",
    topic: "Science",
    series: "Spaceflight",
    outcome: 1,
    status: "resolved",
    resolvedAt: marketDate("2024-06-06"),
    createdAt: marketDate("2023-11-10"),
    tags: ["space", "spacex"],
    observations: withOffsets(marketDate("2024-06-06"), [
      [720, 0.62],
      [336, 0.66],
      [168, 0.7],
      [72, 0.73],
      [24, 0.78],
      [1, 0.82],
    ]),
  },
  {
    id: "demo-kalshi-cpi-under-3p5-2024",
    externalId: "ka-cpi-under-3.5-dec-2024",
    exchange: "kalshi",
    title: "Will U.S. CPI be under 3.5% by Dec 2024?",
    topic: "Macro",
    series: "Inflation",
    outcome: 1,
    status: "resolved",
    resolvedAt: marketDate("2024-12-11"),
    createdAt: marketDate("2024-02-02"),
    volume: 9_200_000,
    liquidity: 310_000,
    tags: ["cpi", "inflation"],
    observations: withOffsets(marketDate("2024-12-11"), [
      [720, 0.48],
      [336, 0.54],
      [168, 0.59],
      [72, 0.64],
      [24, 0.69],
      [1, 0.74],
    ]),
  },
  {
    id: "demo-kalshi-nvidia-200-2024",
    externalId: "ka-nvda-200-2024",
    exchange: "kalshi",
    title: "Will NVIDIA close above $200 in 2024?",
    topic: "Finance",
    series: "US Equities",
    outcome: 1,
    status: "resolved",
    resolvedAt: marketDate("2024-06-20"),
    createdAt: marketDate("2024-01-08"),
    volume: 7_400_000,
    liquidity: 265_000,
    tags: ["stocks", "ai"],
    observations: withOffsets(marketDate("2024-06-20"), [
      [720, 0.45],
      [336, 0.57],
      [168, 0.68],
      [72, 0.75],
      [24, 0.79],
      [1, 0.84],
    ]),
  },
  {
    id: "demo-manifold-messi-ballon-dor-2024",
    externalId: "mf-messi-ballon-dor-2024",
    exchange: "manifold",
    title: "Will Lionel Messi win the 2024 Ballon d'Or?",
    topic: "Sports",
    series: "Football Awards",
    outcome: 0,
    status: "resolved",
    resolvedAt: marketDate("2024-10-28"),
    createdAt: marketDate("2024-03-01"),
    tags: ["football", "awards"],
    observations: withOffsets(marketDate("2024-10-28"), [
      [720, 0.29],
      [336, 0.25],
      [168, 0.19],
      [72, 0.14],
      [24, 0.11],
      [1, 0.08],
    ]),
  },
  {
    id: "demo-manifold-openai-gpt5-2024",
    externalId: "mf-openai-gpt5-2024",
    exchange: "manifold",
    title: "Will OpenAI release GPT-5 in 2024?",
    topic: "Technology",
    series: "AI Releases",
    outcome: 0,
    status: "resolved",
    resolvedAt: marketDate("2024-12-31"),
    createdAt: marketDate("2024-02-14"),
    tags: ["ai", "openai"],
    observations: withOffsets(marketDate("2024-12-31"), [
      [720, 0.63],
      [336, 0.56],
      [168, 0.44],
      [72, 0.35],
      [24, 0.27],
      [1, 0.2],
    ]),
  },
];

function sampleFromObservations(
  observations: { probability: number; observedAt: Date }[],
  resolvedAt: Date,
  evalTime: EvaluationTime,
  toleranceHours: number,
): { probability: number; sampledAt: Date } | null {
  const toleranceMs = toleranceHours * HOUR;

  if (evalTime.type === "fixed_horizon") {
    const targetMs = resolvedAt.getTime() - evalTime.hours * HOUR;
    let best: { probability: number; observedAt: Date } | null = null;
    let bestDist = Infinity;

    for (const obs of observations) {
      const dist = Math.abs(obs.observedAt.getTime() - targetMs);
      if (dist < bestDist && dist <= toleranceMs) {
        best = obs;
        bestDist = dist;
      }
    }

    return best
      ? { probability: best.probability, sampledAt: best.observedAt }
      : null;
  }

  if (evalTime.type === "close") {
    const targetMs = resolvedAt.getTime() - evalTime.safetyOffsetMinutes * 60 * 1000;
    const eligible = observations.filter((obs) => obs.observedAt.getTime() <= targetMs);
    if (eligible.length === 0) return null;
    const best = eligible.reduce((latest, obs) =>
      obs.observedAt > latest.observedAt ? obs : latest,
    );
    return { probability: best.probability, sampledAt: best.observedAt };
  }

  const windowMs = evalTime.windowHours * HOUR;
  const windowStart = resolvedAt.getTime() - windowMs;
  const inWindow = observations.filter(
    (obs) => obs.observedAt.getTime() >= windowStart && obs.observedAt.getTime() <= resolvedAt.getTime(),
  );
  if (inWindow.length === 0) return null;

  if (evalTime.timeWeighted) {
    let weighted = 0;
    let total = 0;
    for (const obs of inWindow) {
      const weight = (obs.observedAt.getTime() - windowStart) / windowMs;
      weighted += obs.probability * weight;
      total += weight;
    }
    return { probability: total > 0 ? weighted / total : 0.5, sampledAt: resolvedAt };
  }

  const avg = inWindow.reduce((sum, obs) => sum + obs.probability, 0) / inWindow.length;
  return { probability: avg, sampledAt: resolvedAt };
}

export function queryDemoCohort(filters: {
  exchanges?: string[];
  topics?: string[];
  series?: string[];
  resolutionStart?: Date;
  resolutionEnd?: Date;
  evaluationTime: EvaluationTime;
  horizonToleranceHours: number;
}): { markets: ScoredMarket[]; summary: CohortSummary } {
  let filtered = DEMO_MARKETS;

  if (filters.exchanges?.length) {
    const allowed = new Set(filters.exchanges);
    filtered = filtered.filter((m) => allowed.has(m.exchange));
  }
  if (filters.topics?.length) {
    const allowed = new Set(filters.topics);
    filtered = filtered.filter((m) => allowed.has(m.topic));
  }
  if (filters.series?.length) {
    const allowed = new Set(filters.series);
    filtered = filtered.filter((m) => m.series && allowed.has(m.series));
  }
  if (filters.resolutionStart) {
    filtered = filtered.filter((m) => m.resolvedAt >= filters.resolutionStart!);
  }
  if (filters.resolutionEnd) {
    filtered = filtered.filter((m) => m.resolvedAt <= filters.resolutionEnd!);
  }

  const excludedByReason: Record<ExclusionReason, number> = {
    voided: 0,
    canceled: 0,
    unresolved: 0,
    missing_horizon_observation: 0,
    disputed: 0,
  };

  const markets = filtered.map((m): ScoredMarket => {
    const sampled = sampleFromObservations(
      m.observations,
      m.resolvedAt,
      filters.evaluationTime,
      filters.horizonToleranceHours,
    );

    const excluded = !sampled;

    if (excluded) {
      excludedByReason.missing_horizon_observation += 1;
    }

    return {
      id: m.id,
      externalId: m.externalId,
      exchange: m.exchange,
      title: m.title,
      topic: m.topic,
      series: m.series,
      outcome: m.outcome,
      resolvedAt: m.resolvedAt,
      sampledProbability: sampled?.probability ?? 0.5,
      sampledAt: sampled?.sampledAt ?? m.resolvedAt,
      evaluationHorizon: filters.evaluationTime,
      excluded,
      exclusionReason: excluded ? "missing_horizon_observation" : undefined,
      metadata: {
        volume: m.volume,
        liquidity: m.liquidity,
        createdAt: m.createdAt,
        tags: m.tags,
      },
    };
  });

  const summary: CohortSummary = {
    scored: markets.filter((m) => !m.excluded).length,
    excluded: markets.filter((m) => m.excluded).length,
    excludedByReason,
    horizon: filters.evaluationTime,
    resolutionWindow:
      filters.resolutionStart && filters.resolutionEnd
        ? { start: filters.resolutionStart, end: filters.resolutionEnd }
        : null,
    topics: [...new Set(filtered.map((m) => m.topic))],
    series: [...new Set(filtered.map((m) => m.series).filter(isDefinedString))],
    clipRate: 0,
  };

  return { markets, summary };
}

export function getDemoFilterOptions() {
  return {
    topics: [...new Set(DEMO_MARKETS.map((m) => m.topic))].sort((a, b) => a.localeCompare(b)),
    series: [...new Set(DEMO_MARKETS.map((m) => m.series).filter(isDefinedString))].sort((a, b) => a.localeCompare(b)),
  };
}
