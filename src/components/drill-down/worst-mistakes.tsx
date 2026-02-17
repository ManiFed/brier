"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getExchangeColor, type ScoredMarket } from "@/lib/scoring/types";

interface WorstMistakesProps {
  markets: ScoredMarket[];
  loading: boolean;
}

function surpriseScore(m: ScoredMarket): number {
  const p = m.outcome === 1 ? m.sampledProbability : 1 - m.sampledProbability;
  return 1 - p;
}

export function WorstMistakes({ markets, loading }: WorstMistakesProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);

  const worstByExchange = useMemo(() => {
    const included = markets.filter((m) => !m.excluded);
    const groups = new Map<string, ScoredMarket[]>();

    for (const m of included) {
      const group = groups.get(m.exchange) || [];
      group.push(m);
      groups.set(m.exchange, group);
    }

    const result: { exchange: string; worst: ScoredMarket[] }[] = [];
    for (const [exchange, group] of groups) {
      const sorted = [...group].sort(
        (a, b) => surpriseScore(b) - surpriseScore(a)
      );
      result.push({ exchange, worst: sorted.slice(0, 20) });
    }

    return result;
  }, [markets]);

  if (loading || worstByExchange.length === 0) return null;

  const displayed = selectedExchange
    ? worstByExchange.filter((g) => g.exchange === selectedExchange)
    : worstByExchange;

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        <span>Worst Mistakes (Top Surprises)</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
          {/* Exchange filter tabs */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setSelectedExchange(null)}
              className={`text-xs rounded px-2 py-0.5 transition-colors ${
                selectedExchange === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              All
            </button>
            {worstByExchange.map(({ exchange }) => (
              <button
                key={exchange}
                onClick={() => setSelectedExchange(exchange)}
                className={`flex items-center gap-1 text-xs rounded px-2 py-0.5 transition-colors ${
                  selectedExchange === exchange
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: getExchangeColor(exchange),
                  }}
                />
                <span className="capitalize">{exchange}</span>
              </button>
            ))}
          </div>

          {/* Market list */}
          {displayed.map(({ exchange, worst }) => (
            <div key={exchange} className="mb-4 last:mb-0">
              {!selectedExchange && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: getExchangeColor(exchange),
                    }}
                  />
                  <span className="text-xs font-medium capitalize">
                    {exchange}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {worst.slice(0, 10).map((market, i) => (
                  <div
                    key={market.id}
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent/50"
                  >
                    <span className="text-muted-foreground w-4 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{market.title}</div>
                      <div className="text-muted-foreground flex gap-2 mt-0.5">
                        <span>
                          P={" "}
                          {(market.sampledProbability * 100).toFixed(0)}%
                        </span>
                        <span
                          className={
                            market.outcome === 1
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {market.outcome === 1 ? "Yes" : "No"}
                        </span>
                        <span>
                          Surprise:{" "}
                          {(surpriseScore(market) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
