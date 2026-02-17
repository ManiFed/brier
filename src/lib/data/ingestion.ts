// ─── Ingestion Orchestrator ──────────────────────────────────────────────────
//
// Coordinates data ingestion from all exchange adapters into the local
// database. Each exchange is processed independently so that a failure in
// one adapter does not block the others.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExchangeAdapter, RawMarket } from "./adapters/types";
import type { ProbabilityPoint } from "./adapters/types";
import { ManifoldAdapter } from "./adapters/manifold";
import { MetaculusAdapter } from "./adapters/metaculus";
import { PolymarketAdapter } from "./adapters/polymarket";
import { KalshiAdapter } from "./adapters/kalshi";

import {
  createIngestionRun,
  completeIngestionRun,
  failIngestionRun,
  upsertMarket,
  insertObservations,
} from "@/lib/db/queries";

import type { NewMarket, NewProbabilityObservation } from "@/lib/db/schema";

// ─── Adapter registry ───────────────────────────────────────────────────────

const ADAPTERS: Record<string, () => ExchangeAdapter> = {
  polymarket: () => new PolymarketAdapter(),
  metaculus: () => new MetaculusAdapter(),
  manifold: () => new ManifoldAdapter(),
  kalshi: () => new KalshiAdapter(),
};

/**
 * Factory: return the adapter for a given exchange name.
 * Throws if the exchange is not recognised.
 */
export function getAdapter(exchange: string): ExchangeAdapter {
  const factory = ADAPTERS[exchange.toLowerCase()];
  if (!factory) {
    throw new Error(
      `Unknown exchange "${exchange}". Available: ${Object.keys(ADAPTERS).join(", ")}`,
    );
  }
  return factory();
}

/**
 * All registered exchange names.
 */
export function listExchanges(): string[] {
  return Object.keys(ADAPTERS);
}

// ─── Ingestion result ───────────────────────────────────────────────────────

export interface IngestionResult {
  marketsIngested: number;
  errors: string[];
}

// ─── Conversion helpers ─────────────────────────────────────────────────────

/**
 * Convert a RawMarket (from an adapter) into the shape the DB expects.
 * Dates become epoch milliseconds; a UUID id is generated.
 */
function rawMarketToNewMarket(raw: RawMarket): NewMarket {
  return {
    id: crypto.randomUUID(),
    externalId: raw.externalId,
    exchange: raw.exchange,
    title: raw.title,
    topic: raw.topic,
    series: raw.series,
    outcome: raw.outcome,
    resolvedAt: raw.resolvedAt ? raw.resolvedAt.getTime() : null,
    status: raw.status,
    volume: raw.volume ?? null,
    liquidity: raw.liquidity ?? null,
    createdAt: raw.createdAt.getTime(),
    tags: raw.tags,
  };
}

/**
 * Convert adapter ProbabilityPoints into NewProbabilityObservation rows.
 * Each observation gets its own UUID and is linked to the given marketId.
 */
function historyToObservations(
  marketId: string,
  history: ProbabilityPoint[],
): NewProbabilityObservation[] {
  return history.map((pt) => ({
    id: crypto.randomUUID(),
    marketId,
    probability: pt.probability,
    observedAt: pt.observedAt.getTime(),
  }));
}

// ─── Single-exchange ingestion ──────────────────────────────────────────────

/**
 * Run a full ingestion cycle for one exchange:
 *   1. Create an ingestion-run record in the DB.
 *   2. Stream resolved markets from the adapter.
 *   3. For each market: upsert into the DB, fetch its probability history,
 *      and insert the observations.
 *   4. Mark the ingestion run as complete (or failed).
 *   5. Return a summary.
 */
export async function ingestExchange(
  exchange: string,
): Promise<IngestionResult> {
  const errors: string[] = [];
  let marketsIngested = 0;

  const adapter = getAdapter(exchange);

  // 1. Start ingestion run (synchronous — better-sqlite3)
  let runId: string;
  try {
    runId = createIngestionRun(exchange);
  } catch (err) {
    const msg = `Failed to create ingestion run for ${exchange}: ${String(err)}`;
    console.warn(`[ingestion] ${msg}`);
    return { marketsIngested: 0, errors: [msg] };
  }

  try {
    // 2. Iterate through resolved markets
    for await (const rawMarket of adapter.fetchResolvedMarkets({})) {
      try {
        // 3a. Convert and upsert the market
        const newMarket = rawMarketToNewMarket(rawMarket);
        upsertMarket(newMarket);

        // 3b. Fetch probability history and insert observations
        const history = await adapter.fetchProbabilityHistory(
          rawMarket.externalId,
        );

        if (history.length > 0) {
          const observations = historyToObservations(newMarket.id, history);
          insertObservations(observations);
        }

        marketsIngested++;
      } catch (err) {
        const msg = `Error processing market ${rawMarket.externalId} from ${exchange}: ${String(err)}`;
        console.warn(`[ingestion] ${msg}`);
        errors.push(msg);
        // Continue to next market — don't let one failure stop the run
      }
    }

    // 4. Complete the ingestion run
    completeIngestionRun(runId, marketsIngested);
  } catch (err) {
    const msg = `Ingestion run for ${exchange} failed: ${String(err)}`;
    console.warn(`[ingestion] ${msg}`);
    errors.push(msg);

    try {
      failIngestionRun(runId, msg);
    } catch (failErr) {
      console.warn(
        `[ingestion] Could not mark run ${runId} as failed:`,
        failErr,
      );
    }
  }

  return { marketsIngested, errors };
}

// ─── All-exchange ingestion ─────────────────────────────────────────────────

/**
 * Run ingestion for every registered exchange.
 * Each exchange runs independently — failures in one do not block others.
 * Returns a summary keyed by exchange name.
 */
export async function ingestAll(): Promise<Record<string, IngestionResult>> {
  const exchanges = listExchanges();
  const results: Record<string, IngestionResult> = {};

  // Run all exchanges concurrently
  const entries = await Promise.allSettled(
    exchanges.map(async (exchange) => {
      const result = await ingestExchange(exchange);
      return [exchange, result] as const;
    }),
  );

  for (const entry of entries) {
    if (entry.status === "fulfilled") {
      const [exchange, result] = entry.value;
      results[exchange] = result;
    } else {
      // This shouldn't happen since ingestExchange catches its own errors,
      // but handle it defensively.
      const errorMsg = String(entry.reason);
      console.warn(`[ingestion] Unexpected failure:`, errorMsg);
    }
  }

  // Fill in any exchanges that somehow didn't produce a result
  for (const exchange of exchanges) {
    if (!results[exchange]) {
      results[exchange] = {
        marketsIngested: 0,
        errors: ["Ingestion produced no result — possible unhandled error"],
      };
    }
  }

  return results;
}
