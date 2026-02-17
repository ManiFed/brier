"use client";

import { useEffect, useRef, useState } from "react";
import { X, ArrowUpDown } from "lucide-react";
import { useDashboardStore } from "@/store/dashboard-store";
import { getExchangeColor, type ExchangeScores, type ScoredMarket } from "@/lib/scoring/types";

interface BinDrawerProps {
  open: boolean;
  byExchange: ExchangeScores[];
}

type SortMode = "surprise" | "probability" | "closest_to_half";

function surpriseScore(m: ScoredMarket): number {
  const p = m.outcome === 1 ? m.sampledProbability : 1 - m.sampledProbability;
  return 1 - p;
}

export function BinDrawer({ open, byExchange }: BinDrawerProps) {
  const selectedBin = useDashboardStore((s) => s.selectedBin);
  const setDrawerOpen = useDashboardStore((s) => s.setDrawerOpen);
  const [sortMode, setSortMode] = useState<SortMode>("surprise");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, setDrawerOpen]);

  if (!open || !selectedBin) return null;

  const exchangeData = byExchange.find(
    (e) => e.exchange === selectedBin.exchange
  );
  if (!exchangeData) return null;

  const bin = exchangeData.calibrationBins[selectedBin.binIndex];
  if (!bin) return null;

  const color = getExchangeColor(selectedBin.exchange);

  let sortedMarkets = [...bin.markets];
  switch (sortMode) {
    case "surprise":
      sortedMarkets.sort((a, b) => surpriseScore(b) - surpriseScore(a));
      break;
    case "probability":
      sortedMarkets.sort(
        (a, b) => b.sampledProbability - a.sampledProbability
      );
      break;
    case "closest_to_half":
      sortedMarkets.sort(
        (a, b) =>
          Math.abs(a.sampledProbability - 0.5) -
          Math.abs(b.sampledProbability - 0.5)
      );
      break;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-card/95 backdrop-blur-xl border-l border-border/60 shadow-2xl z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border/60 px-5 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="h-3.5 w-3.5 rounded-full ring-2 ring-white/50"
                style={{ backgroundColor: color }}
              />
              <span className="font-semibold text-sm capitalize">
                {selectedBin.exchange}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Bin: {(bin.binEdgeLow * 100).toFixed(0)}%\u2013{(bin.binEdgeHigh * 100).toFixed(0)}% | n = {bin.count} |
              Observed: {(bin.observedFrequency * 100).toFixed(1)}%
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sort controls */}
        <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2.5">
          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sort:</span>
          {(
            [
              ["surprise", "Biggest Surprise"],
              ["probability", "Highest Prob"],
              ["closest_to_half", "Closest to 50%"],
            ] as [SortMode, string][]
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`text-xs rounded-full px-2.5 py-0.5 font-medium transition-all ${
                sortMode === mode
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Market list */}
        <div className="divide-y divide-border/40">
          {sortedMarkets.map((market) => (
            <div key={market.id} className="px-5 py-3.5 hover:bg-accent/20 transition-colors">
              <div className="text-sm font-medium leading-snug">
                {market.title}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>
                  Predicted:{" "}
                  <strong className="text-foreground">
                    {(market.sampledProbability * 100).toFixed(1)}%
                  </strong>
                </span>
                <span>
                  Outcome:{" "}
                  <strong
                    className={
                      market.outcome === 1
                        ? "text-emerald-600"
                        : "text-red-500"
                    }
                  >
                    {market.outcome === 1 ? "Yes" : "No"}
                  </strong>
                </span>
                <span>
                  Surprise:{" "}
                  <strong className="text-amber-600">
                    {(surpriseScore(market) * 100).toFixed(0)}%
                  </strong>
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">
                Resolved:{" "}
                {market.resolvedAt.toLocaleDateString()}
                {market.metadata.volume !== undefined &&
                  ` | Vol: $${market.metadata.volume.toLocaleString()}`}
              </div>
            </div>
          ))}
        </div>

        {sortedMarkets.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No markets in this bin
          </div>
        )}
      </div>
    </>
  );
}
