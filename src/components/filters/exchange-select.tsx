"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import { getExchangeColor } from "@/lib/scoring/types";

const KNOWN_EXCHANGES = ["polymarket", "metaculus", "manifold"];

export function ExchangeSelect() {
  const selectedExchanges = useDashboardStore((s) => s.selectedExchanges);
  const toggleExchange = useDashboardStore((s) => s.toggleExchange);

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">
        Exchanges
      </label>
      <div className="space-y-1">
        {KNOWN_EXCHANGES.map((exchange) => {
          const selected =
            selectedExchanges.length === 0 ||
            selectedExchanges.includes(exchange);
          const color = getExchangeColor(exchange);

          return (
            <button
              key={exchange}
              onClick={() => toggleExchange(exchange)}
              className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors ${
                selected
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <span
                className="h-3 w-3 rounded-full flex-shrink-0 border-2"
                style={{
                  backgroundColor: selected ? color : "transparent",
                  borderColor: color,
                }}
              />
              <span className="capitalize">{exchange}</span>
            </button>
          );
        })}
      </div>
      {selectedExchanges.length > 0 && (
        <button
          onClick={() => useDashboardStore.getState().setSelectedExchanges([])}
          className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Show all
        </button>
      )}
    </div>
  );
}
