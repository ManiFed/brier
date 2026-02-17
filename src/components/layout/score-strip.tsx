"use client";

import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard-store";
import { getExchangeColor, type ExchangeScores } from "@/lib/scoring/types";

interface ScoreStripProps {
  byExchange: ExchangeScores[];
  overall: ExchangeScores | null;
  loading: boolean;
}

function ScoreCard({
  label,
  value,
  lowerIsBetter,
  byExchange,
  visible,
  clipRate,
}: {
  label: string;
  value: number | null;
  lowerIsBetter: boolean;
  byExchange: { exchange: string; score: number }[];
  visible: boolean;
  clipRate?: number;
}) {
  if (!visible) return null;

  return (
    <div className="flex-1 min-w-[180px] rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </h3>
        {clipRate !== undefined && clipRate > 0 && (
          <span
            className="text-[10px] text-muted-foreground"
            title={`${(clipRate * 100).toFixed(1)}% of probabilities were clipped to avoid log(0)`}
          >
            {(clipRate * 100).toFixed(1)}% clipped
          </span>
        )}
      </div>

      <div className="text-2xl font-semibold tabular-nums">
        {value !== null ? value.toFixed(4) : "—"}
      </div>

      {/* Per-exchange breakdown */}
      {byExchange.length > 0 && (
        <div className="mt-3 space-y-1">
          {byExchange.map(({ exchange, score }) => (
            <div key={exchange} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getExchangeColor(exchange) }}
              />
              <span className="text-muted-foreground truncate flex-1">
                {exchange}
              </span>
              <span className="tabular-nums font-medium">
                {score.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ScoreStrip({ byExchange, overall, loading }: ScoreStripProps) {
  const visibleScores = useDashboardStore((s) => s.visibleScores);

  if (loading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 min-w-[180px] rounded-lg border border-border bg-card p-4 animate-pulse"
          >
            <div className="h-3 w-16 bg-muted rounded mb-3" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const totalSamples = overall?.sampleSize ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">
          n = {totalSamples.toLocaleString()}
        </span>
      </div>
      <div className="flex gap-4 flex-wrap">
        <ScoreCard
          label="Brier Score"
          value={overall?.brier ?? null}
          lowerIsBetter={true}
          byExchange={byExchange.map((e) => ({
            exchange: e.exchange,
            score: e.brier,
          }))}
          visible={visibleScores.brier}
        />
        <ScoreCard
          label="Log Score"
          value={overall?.logarithmic ?? null}
          lowerIsBetter={true}
          byExchange={byExchange.map((e) => ({
            exchange: e.exchange,
            score: e.logarithmic,
          }))}
          visible={visibleScores.logarithmic}
          clipRate={overall?.clipRate}
        />
        <ScoreCard
          label="Spherical Score"
          value={overall?.spherical ?? null}
          lowerIsBetter={false}
          byExchange={byExchange.map((e) => ({
            exchange: e.exchange,
            score: e.spherical,
          }))}
          visible={visibleScores.spherical}
          clipRate={overall?.clipRate}
        />
      </div>
    </div>
  );
}
