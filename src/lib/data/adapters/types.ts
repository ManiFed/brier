// ─── Exchange Adapter Types ──────────────────────────────────────────────────
//
// Shared interfaces for all prediction-market exchange adapters.
// Each adapter normalises exchange-specific data into these common shapes
// so the ingestion layer can treat every source identically.
// ─────────────────────────────────────────────────────────────────────────────

export interface RawMarket {
  externalId: string;
  exchange: string;
  title: string;
  topic: string;
  series: string | null;
  outcome: 0 | 1 | null; // null if unresolved
  resolvedAt: Date | null;
  status: "resolved" | "voided" | "canceled" | "unresolved" | "disputed";
  volume?: number;
  liquidity?: number;
  createdAt: Date;
  tags: string[];
}

export interface ProbabilityPoint {
  probability: number;
  observedAt: Date;
}

export interface ExchangeAdapter {
  readonly exchange: string;
  fetchResolvedMarkets(params: {
    after?: Date;
    limit?: number;
  }): AsyncGenerator<RawMarket>;
  fetchProbabilityHistory(externalId: string): Promise<ProbabilityPoint[]>;
}
