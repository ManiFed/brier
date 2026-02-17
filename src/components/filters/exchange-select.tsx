"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import { getExchangeColor } from "@/lib/scoring/types";

const KNOWN_EXCHANGES = ["polymarket", "metaculus", "manifold", "kalshi"];

export function ExchangeSelect() {
  const selectedExchanges = useDashboardStore((s) => s.selectedExchanges);
  const toggleExchange = useDashboardStore((s) => s.toggleExchange);

  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-2 block tracking-wide">
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
              className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all ${
                selected
                  ? "bg-accent/60 text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/30"
              }`}
            >
              <span
                className="h-3 w-3 rounded-full flex-shrink-0 ring-1 ring-white/30 transition-all"
                style={{
                  backgroundColor: selected ? color : "transparent",
                  borderColor: color,
                  borderWidth: selected ? 0 : 2,
                  borderStyle: "solid",
                }}
              />
              <span className="capitalize font-medium">{exchange}</span>
            </button>
          );
        })}
      </div>
      {selectedExchanges.length > 0 && (
        <button
          onClick={() => useDashboardStore.getState().setSelectedExchanges([])}
          className="mt-1.5 text-[10px] text-primary/60 hover:text-primary font-medium"
        >
          Show all
        </button>
      )}
    </div>
  );
}
