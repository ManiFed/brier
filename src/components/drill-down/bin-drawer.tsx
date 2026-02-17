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
  return 1 - p; // higher = more surprising
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
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-xl z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-sm capitalize">
                {selectedBin.exchange}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Bin: {(bin.binEdgeLow * 100).toFixed(0)}% -{" "}
              {(bin.binEdgeHigh * 100).toFixed(0)}% | n = {bin.count} |
              Observed: {(bin.observedFrequency * 100).toFixed(1)}%
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1 rounded-md hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sort controls */}
        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
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
              className={`text-xs rounded px-2 py-0.5 transition-colors ${
                sortMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Market list */}
        <div className="divide-y divide-border">
          {sortedMarkets.map((market) => (
            <div key={market.id} className="px-4 py-3">
              <div className="text-sm font-medium leading-snug">
                {market.title}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
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
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {market.outcome === 1 ? "Yes" : "No"}
                  </strong>
                </span>
                <span>
                  Surprise:{" "}
                  <strong className="text-foreground">
                    {(surpriseScore(market) * 100).toFixed(0)}%
                  </strong>
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Resolved:{" "}
                {market.resolvedAt.toLocaleDateString()}
                {market.metadata.volume !== undefined &&
                  ` | Vol: $${market.metadata.volume.toLocaleString()}`}
              </div>
            </div>
          ))}
        </div>

        {sortedMarkets.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No markets in this bin
          </div>
        )}
      </div>
    </>
  );
}
