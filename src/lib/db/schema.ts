import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  unique,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Markets
// ---------------------------------------------------------------------------
export const markets = sqliteTable(
  "markets",
  {
    id: text("id").primaryKey(), // UUID
    externalId: text("external_id").notNull(),
    exchange: text("exchange").notNull(),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    series: text("series"),
    /** 0 = No, 1 = Yes, null = unresolved */
    outcome: integer("outcome", { mode: "number" }),
    /** Epoch milliseconds */
    resolvedAt: integer("resolved_at", { mode: "number" }),
    status: text("status", {
      enum: ["resolved", "voided", "canceled", "unresolved", "disputed"],
    }).notNull(),
    volume: real("volume"),
    liquidity: real("liquidity"),
    /** Epoch milliseconds */
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    /** JSON-serialised string[] */
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
  },
  (t) => [
    index("idx_markets_exchange").on(t.exchange),
    index("idx_markets_topic").on(t.topic),
    unique("uq_markets_exchange_external_id").on(t.exchange, t.externalId),
  ],
);

// ---------------------------------------------------------------------------
// Probability observations (time-series)
// ---------------------------------------------------------------------------
export const probabilityObservations = sqliteTable(
  "probability_observations",
  {
    id: text("id").primaryKey(),
    marketId: text("market_id")
      .notNull()
      .references(() => markets.id),
    probability: real("probability").notNull(),
    /** Epoch milliseconds */
    observedAt: integer("observed_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("idx_observations_market_observed").on(t.marketId, t.observedAt),
  ],
);

// ---------------------------------------------------------------------------
// Ingestion runs (ETL tracking)
// ---------------------------------------------------------------------------
export const ingestionRuns = sqliteTable("ingestion_runs", {
  id: text("id").primaryKey(),
  exchange: text("exchange").notNull(),
  /** Epoch milliseconds */
  startedAt: integer("started_at", { mode: "number" }).notNull(),
  /** Epoch milliseconds */
  completedAt: integer("completed_at", { mode: "number" }),
  marketsFetched: integer("markets_fetched").notNull().default(0),
  status: text("status", {
    enum: ["running", "completed", "failed"],
  }).notNull(),
  error: text("error"),
});

// ---------------------------------------------------------------------------
// Benchmarks (synthetic baselines)
// ---------------------------------------------------------------------------
export const benchmarks = sqliteTable("benchmarks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  marketId: text("market_id")
    .notNull()
    .references(() => markets.id),
  probability: real("probability").notNull(),
  /** Epoch milliseconds */
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type Market = typeof markets.$inferSelect;
export type NewMarket = typeof markets.$inferInsert;

export type ProbabilityObservation =
  typeof probabilityObservations.$inferSelect;
export type NewProbabilityObservation =
  typeof probabilityObservations.$inferInsert;

export type IngestionRun = typeof ingestionRuns.$inferSelect;
export type NewIngestionRun = typeof ingestionRuns.$inferInsert;

export type Benchmark = typeof benchmarks.$inferSelect;
export type NewBenchmark = typeof benchmarks.$inferInsert;
