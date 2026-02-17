// ─── Evaluation Time ───────────────────────────────────────────────────────────
export type EvaluationTime =
  | { type: "fixed_horizon"; hours: number }
  | { type: "close"; safetyOffsetMinutes: number }
  | { type: "smoothed_close"; windowHours: number; timeWeighted: boolean };

export type ExclusionReason =
  | "voided"
  | "canceled"
  | "unresolved"
  | "missing_horizon_observation"
  | "disputed";

export const EXCLUSION_REASONS: ExclusionReason[] = [
  "voided",
  "canceled",
  "unresolved",
  "missing_horizon_observation",
  "disputed",
];

// ─── Core Market ──────────────────────────────────────────────────────────────
export interface MarketMetadata {
  volume?: number;
  liquidity?: number;
  createdAt: Date;
  tags: string[];
}

/**
 * A resolved binary market with a sampled probability — the fundamental
 * unit the entire scoring/calibration pipeline operates on.
 */
export interface ScoredMarket {
  id: string;
  externalId: string;
  exchange: string;
  title: string;
  topic: string;
  series: string | null;
  outcome: 0 | 1;
  resolvedAt: Date;
  sampledProbability: number;
  sampledAt: Date;
  evaluationHorizon: EvaluationTime;
  excluded: boolean;
  exclusionReason?: ExclusionReason;
  metadata: MarketMetadata;
}

// ─── Cohort ───────────────────────────────────────────────────────────────────
export interface CohortSummary {
  scored: number;
  excluded: number;
  excludedByReason: Record<ExclusionReason, number>;
  horizon: EvaluationTime;
  resolutionWindow: { start: Date; end: Date } | null;
  topics: string[];
  series: string[];
  clipRate: number;
}

// ─── Calibration ──────────────────────────────────────────────────────────────
export interface CalibrationBin {
  binEdgeLow: number;
  binEdgeHigh: number;
  meanPredicted: number;
  observedFrequency: number;
  residual: number;
  count: number;
  confidenceInterval: { low: number; high: number };
  markets: ScoredMarket[];
}

export type BinScheme = "fixed_width" | "equal_count";

// ─── Scoring ──────────────────────────────────────────────────────────────────
export interface ScoreResult {
  perMarket: { marketId: string; score: number }[];
  aggregate: number;
  sampleSize: number;
  clipCount: number;
  clipRate: number;
}

export interface ExchangeScores {
  exchange: string;
  brier: number;
  logarithmic: number;
  spherical: number;
  sampleSize: number;
  clipRate: number;
  calibrationBins: CalibrationBin[];
  sharpness: { meanEntropy: number; probDistribution: number[] };
}

// ─── Dashboard State ──────────────────────────────────────────────────────────
export type Aggregation = "mean" | "median" | "volume_weighted";

export interface DashboardState {
  // Cohort filters
  selectedExchanges: string[];
  selectedTopics: string[];
  selectedSeries: string[];
  resolutionWindow: { start: Date; end: Date } | null;
  outcomeStatus: "resolved_only" | "all";
  // Evaluation
  evaluationTime: EvaluationTime;
  horizonToleranceHours: number;
  aggregation: Aggregation;
  // Scoring
  visibleScores: { brier: boolean; logarithmic: boolean; spherical: boolean };
  // Calibration
  calibrationView: "reliability" | "residuals";
  binScheme: BinScheme;
  // Comparison
  pinnedExchanges: string[];
  // Rolling
  rollingMode: boolean;
  rollingWindowDays: number;
  rollingStepDays: number;
}

// ─── Exchange color palette (colorblind-safe) ─────────────────────────────────
export const EXCHANGE_COLORS: Record<string, string> = {
  polymarket: "#2563eb", // blue
  metaculus: "#dc2626",  // red
  manifold: "#16a34a",   // green
  kalshi: "#9333ea",     // purple
  "benchmark:coin-flip": "#737373", // gray
  "benchmark:base-rate": "#a3a3a3", // lighter gray
  "benchmark:persistence": "#525252", // darker gray
};

export function getExchangeColor(exchange: string): string {
  return EXCHANGE_COLORS[exchange.toLowerCase()] ?? "#6b7280";
}

// ─── Horizon presets ──────────────────────────────────────────────────────────
export const HORIZON_PRESETS: { label: string; value: EvaluationTime }[] = [
  { label: "30d", value: { type: "fixed_horizon", hours: 720 } },
  { label: "14d", value: { type: "fixed_horizon", hours: 336 } },
  { label: "7d", value: { type: "fixed_horizon", hours: 168 } },
  { label: "3d", value: { type: "fixed_horizon", hours: 72 } },
  { label: "1d", value: { type: "fixed_horizon", hours: 24 } },
  { label: "6h", value: { type: "fixed_horizon", hours: 6 } },
  { label: "1h", value: { type: "fixed_horizon", hours: 1 } },
  { label: "Close", value: { type: "close", safetyOffsetMinutes: 5 } },
];

// ─── Probability observation (raw time series) ───────────────────────────────
export interface ProbabilityPoint {
  probability: number;
  observedAt: Date;
}
