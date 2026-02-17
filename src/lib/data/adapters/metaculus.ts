// ─── Metaculus Adapter ───────────────────────────────────────────────────────
//
// Best-effort adapter for the Metaculus public API (v2).
// Targets resolved binary questions. The actual API shape may differ —
// structured so fields and endpoints can be corrected later.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExchangeAdapter, ProbabilityPoint, RawMarket } from "./types";

const BASE_URL = "https://www.metaculus.com/api2";
const DEFAULT_PAGE_SIZE = 100;

// ─── API response shapes (best-effort) ──────────────────────────────────────

interface MetaculusQuestion {
  id: number;
  title: string;
  url?: string;
  description?: string;
  created_time?: string;
  publish_time?: string;
  resolve_time?: string;
  close_time?: string;
  status?: string; // "resolved" | "closed" | "open" | "upcoming" etc.
  type?: string; // "binary" | "numeric" | "multiple_choice" etc.
  possibilities?: {
    type?: string;
  };
  resolution?: number | null; // 1 = Yes, 0 = No, -1 = ambiguous/void
  active_state?: string;
  category?: string;
  tags?: Array<{ name: string }>;
  community_prediction?: {
    full?: {
      q2?: number; // median prediction
    };
    history?: Array<{
      t: number; // timestamp
      x1?: { q2?: number }; // community median at time t
      x2?: number; // alternative field
    }>;
  };
  group?: {
    id: number;
    name: string;
  };
  number_of_predictions?: number;
}

interface MetaculusListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MetaculusQuestion[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapOutcome(question: MetaculusQuestion): 0 | 1 | null {
  if (question.resolution === 1) return 1;
  if (question.resolution === 0) return 0;
  return null;
}

function mapStatus(question: MetaculusQuestion): RawMarket["status"] {
  // resolution === -1 typically means ambiguous/voided on Metaculus
  if (question.resolution === -1) return "voided";

  const s = (question.status ?? "").toLowerCase();
  if (s === "resolved" || question.resolution === 0 || question.resolution === 1) {
    return "resolved";
  }
  if (s === "closed") return "canceled";
  return "unresolved";
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isBinaryQuestion(question: MetaculusQuestion): boolean {
  // Check explicit type field
  if (question.type === "binary") return true;
  // Fallback: possibilities.type
  if (question.possibilities?.type === "binary") return true;
  return false;
}

function toRawMarket(question: MetaculusQuestion): RawMarket {
  return {
    externalId: String(question.id),
    exchange: "metaculus",
    title: question.title ?? "(untitled)",
    topic: question.category ?? question.group?.name ?? "uncategorized",
    series: question.group?.name ?? null,
    outcome: mapOutcome(question),
    resolvedAt: parseDate(question.resolve_time),
    status: mapStatus(question),
    volume: question.number_of_predictions,
    liquidity: undefined,
    createdAt: parseDate(question.created_time) ?? new Date(0),
    tags: question.tags?.map((t) => t.name) ?? [],
  };
}

// ─── Adapter ────────────────────────────────────────────────────────────────

export class MetaculusAdapter implements ExchangeAdapter {
  readonly exchange = "metaculus" as const;

  /**
   * Paginate through resolved binary questions from the Metaculus API.
   * Yields one RawMarket at a time.
   */
  async *fetchResolvedMarkets(params: {
    after?: Date;
    limit?: number;
  }): AsyncGenerator<RawMarket> {
    const maxMarkets = params.limit ?? Infinity;
    let yielded = 0;
    let offset = 0;

    while (yielded < maxMarkets) {
      try {
        const url = new URL("/questions/", BASE_URL);
        url.searchParams.set("status", "resolved");
        url.searchParams.set("type", "binary");
        url.searchParams.set("order_by", "-resolve_time");
        url.searchParams.set(
          "limit",
          String(Math.min(DEFAULT_PAGE_SIZE, maxMarkets - yielded)),
        );
        url.searchParams.set("offset", String(offset));

        if (params.after) {
          url.searchParams.set(
            "resolve_time__gt",
            params.after.toISOString(),
          );
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
          console.warn(
            `[metaculus] /questions responded ${response.status}: ${response.statusText}`,
          );
          break;
        }

        const body = (await response.json()) as MetaculusListResponse;
        const questions = body.results ?? [];

        if (questions.length === 0) break;

        for (const question of questions) {
          if (yielded >= maxMarkets) return;

          try {
            if (!isBinaryQuestion(question)) continue;

            const raw = toRawMarket(question);

            // Only yield resolved markets with a definitive outcome
            if (raw.status !== "resolved") continue;
            if (raw.outcome === null) continue;

            yield raw;
            yielded++;
          } catch (err) {
            console.warn(
              `[metaculus] Skipping malformed question ${question.id ?? "unknown"}:`,
              err,
            );
          }
        }

        // If there's no next page, stop
        if (!body.next) break;
        offset += questions.length;
      } catch (err) {
        console.warn("[metaculus] Error fetching questions page:", err);
        break;
      }
    }
  }

  /**
   * Fetch the community prediction history for a single question.
   * Falls back to the question detail endpoint.
   */
  async fetchProbabilityHistory(
    externalId: string,
  ): Promise<ProbabilityPoint[]> {
    try {
      // The question detail endpoint often includes community_prediction.history
      const url = new URL(`/questions/${externalId}/`, BASE_URL);

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.warn(
          `[metaculus] /questions/${externalId} responded ${response.status}`,
        );
        return [];
      }

      const question = (await response.json()) as MetaculusQuestion;

      // Try community prediction history
      const history = question.community_prediction?.history;
      if (Array.isArray(history) && history.length > 0) {
        return history
          .filter((pt) => typeof pt.t === "number")
          .map((pt) => {
            const prob = pt.x1?.q2 ?? pt.x2 ?? 0.5;
            return {
              probability: Math.max(0, Math.min(1, prob)),
              observedAt: new Date(pt.t * 1000),
            };
          });
      }

      // If no history, use the current median as a single-point snapshot
      const median = question.community_prediction?.full?.q2;
      if (typeof median === "number") {
        return [
          {
            probability: Math.max(0, Math.min(1, median)),
            observedAt: parseDate(question.close_time) ?? new Date(),
          },
        ];
      }

      return [];
    } catch (err) {
      console.warn(
        `[metaculus] Error fetching prediction history for ${externalId}:`,
        err,
      );
      return [];
    }
  }
}
