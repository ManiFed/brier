// ─── Polymarket Adapter ──────────────────────────────────────────────────────
//
// Best-effort adapter for Polymarket's CLOB API.
// The actual API shape may differ — this is structured so fields and endpoints
// can be corrected without changing the overall adapter architecture.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExchangeAdapter, ProbabilityPoint, RawMarket } from "./types";

const BASE_URL = "https://clob.polymarket.com";
const DEFAULT_PAGE_SIZE = 100;

// ─── API response shapes (best-effort, may need correction) ─────────────────

interface PolymarketApiMarket {
  condition_id: string;
  question: string;
  description?: string;
  category?: string;
  tags?: string[];
  end_date_iso?: string;
  game_start_time?: string;
  active: boolean;
  closed: boolean;
  resolved?: boolean;
  outcome?: string; // "Yes" | "No" | etc.
  volume?: number;
  liquidity?: number;
  created_at?: string;
  accepting_orders?: boolean;
  market_slug?: string;
  tokens?: Array<{
    token_id: string;
    outcome: string;
    price: number;
    winner?: boolean;
  }>;
}

interface PolymarketMarketsResponse {
  data?: PolymarketApiMarket[];
  next_cursor?: string;
}

interface PolymarketPricePoint {
  t: number; // unix timestamp (seconds)
  p: number; // price / probability
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapOutcome(market: PolymarketApiMarket): 0 | 1 | null {
  if (!market.resolved) return null;

  // Check tokens for a declared winner
  if (market.tokens && market.tokens.length > 0) {
    const yesToken = market.tokens.find(
      (t) => t.outcome.toLowerCase() === "yes",
    );
    if (yesToken?.winner === true) return 1;
    if (yesToken?.winner === false) return 0;
  }

  // Fallback to outcome string
  if (typeof market.outcome === "string") {
    const lower = market.outcome.toLowerCase();
    if (lower === "yes" || lower === "1" || lower === "true") return 1;
    if (lower === "no" || lower === "0" || lower === "false") return 0;
  }

  return null;
}

function mapStatus(
  market: PolymarketApiMarket,
): RawMarket["status"] {
  if (market.resolved) return "resolved";
  if (market.closed && !market.resolved) return "canceled";
  return "unresolved";
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toRawMarket(market: PolymarketApiMarket): RawMarket {
  const status = mapStatus(market);

  return {
    externalId: market.condition_id,
    exchange: "polymarket",
    title: market.question ?? "(untitled)",
    topic: market.category ?? "uncategorized",
    series: null,
    outcome: mapOutcome(market),
    resolvedAt: parseDate(market.end_date_iso),
    status,
    volume: market.volume,
    liquidity: market.liquidity,
    createdAt: parseDate(market.created_at) ?? new Date(0),
    tags: market.tags ?? [],
  };
}

// ─── Adapter ────────────────────────────────────────────────────────────────

export class PolymarketAdapter implements ExchangeAdapter {
  readonly exchange = "polymarket" as const;

  /**
   * Paginate through resolved markets from the CLOB API.
   * Yields one RawMarket at a time so callers can stream results.
   */
  async *fetchResolvedMarkets(params: {
    after?: Date;
    limit?: number;
  }): AsyncGenerator<RawMarket> {
    const maxMarkets = params.limit ?? Infinity;
    let cursor: string | undefined;
    let yielded = 0;

    while (yielded < maxMarkets) {
      try {
        const url = new URL("/markets", BASE_URL);
        url.searchParams.set("closed", "true");
        url.searchParams.set(
          "limit",
          String(Math.min(DEFAULT_PAGE_SIZE, maxMarkets - yielded)),
        );
        if (cursor) {
          url.searchParams.set("next_cursor", cursor);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
          console.warn(
            `[polymarket] /markets responded ${response.status}: ${response.statusText}`,
          );
          break;
        }

        const body = (await response.json()) as PolymarketMarketsResponse;
        const markets = body.data ?? (Array.isArray(body) ? body : []);

        if (markets.length === 0) break;

        for (const apiMarket of markets) {
          if (yielded >= maxMarkets) return;

          try {
            // Only yield resolved markets
            if (!apiMarket.resolved) continue;

            const raw = toRawMarket(apiMarket);

            // If an `after` date was specified, skip older markets
            if (
              params.after &&
              raw.resolvedAt &&
              raw.resolvedAt < params.after
            ) {
              continue;
            }

            yield raw;
            yielded++;
          } catch (err) {
            console.warn(
              `[polymarket] Skipping malformed market ${apiMarket.condition_id ?? "unknown"}:`,
              err,
            );
          }
        }

        // Advance pagination
        cursor = body.next_cursor ?? undefined;
        if (!cursor) break;
      } catch (err) {
        console.warn("[polymarket] Error fetching markets page:", err);
        break;
      }
    }
  }

  /**
   * Fetch the probability (price) time-series for a given market.
   * Uses the /prices-history endpoint with the market's condition ID.
   */
  async fetchProbabilityHistory(
    externalId: string,
  ): Promise<ProbabilityPoint[]> {
    try {
      const url = new URL("/prices-history", BASE_URL);
      url.searchParams.set("market", externalId);
      // Request full history — the API may also accept interval / fidelity params
      url.searchParams.set("interval", "all");

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.warn(
          `[polymarket] /prices-history for ${externalId} responded ${response.status}`,
        );
        return [];
      }

      const body = (await response.json()) as {
        history?: PolymarketPricePoint[];
      };
      const history: PolymarketPricePoint[] =
        body.history ?? (Array.isArray(body) ? body : []);

      return history
        .filter(
          (pt) =>
            typeof pt.t === "number" &&
            typeof pt.p === "number" &&
            pt.p >= 0 &&
            pt.p <= 1,
        )
        .map((pt) => ({
          probability: pt.p,
          observedAt: new Date(pt.t * 1000),
        }));
    } catch (err) {
      console.warn(
        `[polymarket] Error fetching price history for ${externalId}:`,
        err,
      );
      return [];
    }
  }
}
