import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "./client";
import {
  markets,
  probabilityObservations,
  ingestionRuns,
  type Market,
  type NewMarket,
  type NewProbabilityObservation,
} from "./schema";

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------
export interface MarketFilters {
  exchanges?: string[];
  topics?: string[];
  series?: string[];
  dateRange?: { start: number; end: number }; // epoch ms
  status?: Market["status"];
}

// ---------------------------------------------------------------------------
// Markets
// ---------------------------------------------------------------------------

/** Query markets with optional filters. */
export function getMarkets(filters: MarketFilters = {}) {
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

  if (filters.dateRange) {
    conditions.push(gte(markets.createdAt, filters.dateRange.start));
    conditions.push(lte(markets.createdAt, filters.dateRange.end));
  }

  if (filters.status) {
    conditions.push(eq(markets.status, filters.status));
  }

  return db
    .select()
    .from(markets)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .all();
}

/** Get a single market with all its probability observations ordered by time. */
export function getMarketWithObservations(marketId: string) {
  const market = db
    .select()
    .from(markets)
    .where(eq(markets.id, marketId))
    .get();

  if (!market) return null;

  const observations = db
    .select()
    .from(probabilityObservations)
    .where(eq(probabilityObservations.marketId, marketId))
    .orderBy(asc(probabilityObservations.observedAt))
    .all();

  return { ...market, observations };
}

/** Insert or update a market on conflict (exchange, external_id). */
export function upsertMarket(market: NewMarket) {
  return db
    .insert(markets)
    .values(market)
    .onConflictDoUpdate({
      target: [markets.exchange, markets.externalId],
      set: {
        title: market.title,
        topic: market.topic,
        series: market.series,
        outcome: market.outcome,
        resolvedAt: market.resolvedAt,
        status: market.status,
        volume: market.volume,
        liquidity: market.liquidity,
        tags: market.tags,
      },
    })
    .run();
}

/** Bulk-insert probability observations. */
export function insertObservations(observations: NewProbabilityObservation[]) {
  if (observations.length === 0) return;

  return db.insert(probabilityObservations).values(observations).run();
}

// ---------------------------------------------------------------------------
// Distinct value helpers (for filter dropdowns)
// ---------------------------------------------------------------------------

/** All unique topic values. */
export function getDistinctTopics(): string[] {
  const rows = db
    .selectDistinct({ topic: markets.topic })
    .from(markets)
    .all();
  return rows.map((r) => r.topic);
}

/** All unique series values (excluding null). */
export function getDistinctSeries(): string[] {
  const rows = db
    .selectDistinct({ series: markets.series })
    .from(markets)
    .where(sql`${markets.series} IS NOT NULL`)
    .all();
  return rows.map((r) => r.series!);
}

/** All unique exchange values. */
export function getDistinctExchanges(): string[] {
  const rows = db
    .selectDistinct({ exchange: markets.exchange })
    .from(markets)
    .all();
  return rows.map((r) => r.exchange);
}

// ---------------------------------------------------------------------------
// Ingestion runs
// ---------------------------------------------------------------------------

/** Create a new ingestion run. Returns the generated id. */
export function createIngestionRun(exchange: string): string {
  const id = crypto.randomUUID();
  const now = Date.now();

  db.insert(ingestionRuns)
    .values({
      id,
      exchange,
      startedAt: now,
      status: "running",
    })
    .run();

  return id;
}

/** Mark an ingestion run as completed with the total markets fetched. */
export function completeIngestionRun(id: string, marketsFetched: number) {
  return db
    .update(ingestionRuns)
    .set({
      status: "completed",
      completedAt: Date.now(),
      marketsFetched,
    })
    .where(eq(ingestionRuns.id, id))
    .run();
}

/** Mark an ingestion run as failed with an error message. */
export function failIngestionRun(id: string, error: string) {
  return db
    .update(ingestionRuns)
    .set({
      status: "failed",
      completedAt: Date.now(),
      error,
    })
    .where(eq(ingestionRuns.id, id))
    .run();
}
