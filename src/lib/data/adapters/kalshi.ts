import type { ExchangeAdapter, ProbabilityPoint, RawMarket } from "./types";

const BASE_URL = "https://trading-api.kalshi.com/trade-api/v2";
const DEFAULT_PAGE_SIZE = 200;

interface KalshiMarket {
  ticker: string;
  title?: string;
  subtitle?: string;
  event_ticker?: string;
  event_title?: string;
  status?: string;
  result?: "yes" | "no" | string;
  open_time?: string;
  close_time?: string;
  expiration_time?: string;
  last_price?: number;
  volume?: number;
  liquidity?: number;
  category?: string;
}

interface KalshiMarketsResponse {
  markets?: KalshiMarket[];
  cursor?: string;
}

interface KalshiCandle {
  end_period_ts?: number;
  yes_close?: number;
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapOutcome(market: KalshiMarket): 0 | 1 | null {
  const result = (market.result ?? "").toLowerCase();
  if (result === "yes") return 1;
  if (result === "no") return 0;
  return null;
}

export class KalshiAdapter implements ExchangeAdapter {
  readonly exchange = "kalshi" as const;

  async *fetchResolvedMarkets(params: {
    after?: Date;
    limit?: number;
  }): AsyncGenerator<RawMarket> {
    const maxMarkets = params.limit ?? Infinity;
    let yielded = 0;
    let cursor: string | undefined;

    while (yielded < maxMarkets) {
      const url = new URL("/markets", BASE_URL);
      url.searchParams.set("limit", String(Math.min(DEFAULT_PAGE_SIZE, maxMarkets - yielded)));
      url.searchParams.set("status", "settled");
      if (cursor) url.searchParams.set("cursor", cursor);

      const response = await fetch(url.toString());
      if (!response.ok) break;

      const body = (await response.json()) as KalshiMarketsResponse;
      const markets = body.markets ?? [];
      if (markets.length === 0) break;

      for (const market of markets) {
        const outcome = mapOutcome(market);
        const resolvedAt = parseDate(market.expiration_time ?? market.close_time);

        if (params.after && resolvedAt && resolvedAt < params.after) {
          return;
        }

        if (outcome === null || !resolvedAt) continue;

        yield {
          externalId: market.ticker,
          exchange: "kalshi",
          title: market.title ?? market.subtitle ?? "(untitled)",
          topic: market.category ?? market.event_ticker ?? "uncategorized",
          series: market.event_title ?? null,
          outcome,
          resolvedAt,
          status: "resolved",
          volume: market.volume,
          liquidity: market.liquidity,
          createdAt: parseDate(market.open_time) ?? new Date(0),
          tags: [market.category, market.event_ticker].filter(Boolean) as string[],
        };
        yielded++;

        if (yielded >= maxMarkets) return;
      }

      cursor = body.cursor;
      if (!cursor) break;
    }
  }

  async fetchProbabilityHistory(externalId: string): Promise<ProbabilityPoint[]> {
    try {
      const url = new URL(`/markets/${externalId}/candlesticks`, BASE_URL);
      url.searchParams.set("period_interval", "1d");

      const response = await fetch(url.toString());
      if (!response.ok) {
        return [];
      }

      const body = (await response.json()) as { candlesticks?: KalshiCandle[] };
      const candles = body.candlesticks ?? [];

      return candles
        .filter((c) => typeof c.end_period_ts === "number" && typeof c.yes_close === "number")
        .map((c) => ({
          probability: Math.max(0, Math.min(1, (c.yes_close as number) / 100)),
          observedAt: new Date((c.end_period_ts as number) * 1000),
        }));
    } catch {
      return [];
    }
  }
}
