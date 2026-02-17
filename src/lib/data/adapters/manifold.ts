// ─── Manifold Markets Adapter ────────────────────────────────────────────────
//
// Best-effort adapter for the Manifold Markets public API (v0).
// Targets resolved BINARY markets. The actual API shape may differ —
// structured so fields and endpoints can be corrected later.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExchangeAdapter, ProbabilityPoint, RawMarket } from "./types";

const BASE_URL = "https://api.manifold.markets/v0";
const DEFAULT_PAGE_SIZE = 500; // Manifold allows up to 1000

// ─── API response shapes (best-effort) ──────────────────────────────────────

interface ManifoldMarket {
  id: string;
  slug?: string;
  question: string;
  description?: string | object;
  createdTime: number; // millis
  closeTime?: number; // millis
  resolvedTime?: number; // millis
  resolution?: string; // "YES" | "NO" | "CANCEL" | "MKT" etc.
  isResolved?: boolean;
  outcomeType?: string; // "BINARY" | "FREE_RESPONSE" | "MULTIPLE_CHOICE" | "NUMERIC" etc.
  mechanism?: string; // "cpmm-1" | "dpm-2" etc.
  volume?: number;
  totalLiquidity?: number;
  probability?: number;
  tags?: string[];
  groupSlugs?: string[];
  creatorUsername?: string;
}

interface ManifoldBet {
  id: string;
  contractId: string;
  createdTime: number; // millis
  probBefore: number;
  probAfter: number;
  amount: number;
  outcome: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapOutcome(market: ManifoldMarket): 0 | 1 | null {
  if (!market.isResolved) return null;
  const resolution = (market.resolution ?? "").toUpperCase();
  if (resolution === "YES") return 1;
  if (resolution === "NO") return 0;
  // MKT / CANCEL / other ambiguous resolutions
  return null;
}

function mapStatus(market: ManifoldMarket): RawMarket["status"] {
  if (!market.isResolved) return "unresolved";

  const resolution = (market.resolution ?? "").toUpperCase();
  if (resolution === "CANCEL") return "canceled";
  if (resolution === "YES" || resolution === "NO") return "resolved";
  // MKT = resolved to a probability — treat as resolved
  if (resolution === "MKT") return "resolved";
  return "disputed";
}

function toRawMarket(market: ManifoldMarket): RawMarket {
  const status = mapStatus(market);

  // For MKT resolution, use the final probability rounded to 0 or 1
  let outcome = mapOutcome(market);
  if (
    outcome === null &&
    (market.resolution ?? "").toUpperCase() === "MKT" &&
    typeof market.probability === "number"
  ) {
    outcome = market.probability >= 0.5 ? 1 : 0;
  }

  return {
    externalId: market.id,
    exchange: "manifold",
    title: market.question ?? "(untitled)",
    topic:
      market.groupSlugs && market.groupSlugs.length > 0
        ? market.groupSlugs[0]
        : "uncategorized",
    series: null,
    outcome,
    resolvedAt: market.resolvedTime ? new Date(market.resolvedTime) : null,
    status,
    volume: market.volume,
    liquidity: market.totalLiquidity,
    createdAt: new Date(market.createdTime ?? 0),
    tags: market.tags ?? market.groupSlugs ?? [],
  };
}

// ─── Adapter ────────────────────────────────────────────────────────────────

export class ManifoldAdapter implements ExchangeAdapter {
  readonly exchange = "manifold" as const;

  /**
   * Paginate through resolved BINARY markets from the Manifold API.
   * The API uses `before` (a market ID) for cursor-based pagination.
   */
  async *fetchResolvedMarkets(params: {
    after?: Date;
    limit?: number;
  }): AsyncGenerator<RawMarket> {
    const maxMarkets = params.limit ?? Infinity;
    let yielded = 0;
    let beforeId: string | undefined;

    while (yielded < maxMarkets) {
      try {
        const url = new URL("/markets", BASE_URL);
        url.searchParams.set(
          "limit",
          String(Math.min(DEFAULT_PAGE_SIZE, maxMarkets - yielded)),
        );
        // Only request resolved markets when the API supports the filter
        url.searchParams.set("sort", "resolve-date");
        url.searchParams.set("order", "desc");

        if (beforeId) {
          url.searchParams.set("before", beforeId);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
          console.warn(
            `[manifold] /markets responded ${response.status}: ${response.statusText}`,
          );
          break;
        }

        const markets = (await response.json()) as ManifoldMarket[];

        if (!Array.isArray(markets) || markets.length === 0) break;

        for (const apiMarket of markets) {
          if (yielded >= maxMarkets) return;

          try {
            // Only BINARY resolved markets
            if (apiMarket.outcomeType !== "BINARY") continue;
            if (!apiMarket.isResolved) continue;

            const raw = toRawMarket(apiMarket);

            // Filter by `after` date
            if (
              params.after &&
              raw.resolvedAt &&
              raw.resolvedAt < params.after
            ) {
              // Markets are sorted desc by resolve date, so we can stop
              return;
            }

            // Skip markets without a clear outcome
            if (raw.outcome === null && raw.status === "resolved") continue;

            yield raw;
            yielded++;
          } catch (err) {
            console.warn(
              `[manifold] Skipping malformed market ${apiMarket.id ?? "unknown"}:`,
              err,
            );
          }
        }

        // Advance cursor: use the last market's ID
        const lastMarket = markets[markets.length - 1];
        if (lastMarket?.id === beforeId) break; // safety: avoid infinite loop
        beforeId = lastMarket?.id;

        if (!beforeId) break;
      } catch (err) {
        console.warn("[manifold] Error fetching markets page:", err);
        break;
      }
    }
  }

  /**
   * Fetch the bet-implied probability time-series for a Manifold market.
   * Uses the /bets endpoint which returns individual bets with probBefore/probAfter.
   */
  async fetchProbabilityHistory(
    externalId: string,
  ): Promise<ProbabilityPoint[]> {
    try {
      const url = new URL("/bets", BASE_URL);
      url.searchParams.set("contractId", externalId);
      url.searchParams.set("limit", "1000");
      url.searchParams.set("sort", "asc"); // oldest first

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.warn(
          `[manifold] /bets for ${externalId} responded ${response.status}`,
        );
        return [];
      }

      const bets = (await response.json()) as ManifoldBet[];

      if (!Array.isArray(bets) || bets.length === 0) return [];

      // Build probability timeline from probAfter of each bet
      return bets
        .filter(
          (bet) =>
            typeof bet.probAfter === "number" &&
            typeof bet.createdTime === "number" &&
            bet.probAfter >= 0 &&
            bet.probAfter <= 1,
        )
        .map((bet) => ({
          probability: bet.probAfter,
          observedAt: new Date(bet.createdTime),
        }));
    } catch (err) {
      console.warn(
        `[manifold] Error fetching bet history for ${externalId}:`,
        err,
      );
      return [];
    }
  }
}
