"use client";

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
  accentColor,
}: {
  label: string;
  value: number | null;
  lowerIsBetter: boolean;
  byExchange: { exchange: string; score: number }[];
  visible: boolean;
  clipRate?: number;
  accentColor: string;
}) {
  if (!visible) return null;

  return (
    <div className="flex-1 min-w-[200px] rounded-xl glass-card score-card p-5 gradient-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </h3>
        </div>
        {clipRate !== undefined && clipRate > 0 && (
          <span
            className="text-[10px] text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded-full"
            title={`${(clipRate * 100).toFixed(1)}% of probabilities were clipped to avoid log(0)`}
          >
            {(clipRate * 100).toFixed(1)}% clipped
          </span>
        )}
      </div>

      <div className="text-3xl font-bold tabular-nums tracking-tight">
        {value !== null ? value.toFixed(4) : "\u2014"}
      </div>

      {/* Per-exchange breakdown */}
      {byExchange.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {byExchange.map(({ exchange, score }) => (
            <div key={exchange} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0 ring-1 ring-white/50"
                style={{ backgroundColor: getExchangeColor(exchange) }}
              />
              <span className="text-muted-foreground truncate flex-1 capitalize">
                {exchange}
              </span>
              <span className="tabular-nums font-semibold">
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
      <div className="flex gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 min-w-[200px] rounded-xl glass-card p-5"
          >
            <div className="h-3 w-20 prism-loading rounded mb-4" />
            <div className="h-9 w-28 prism-loading rounded" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full prism-loading rounded" />
              <div className="h-3 w-3/4 prism-loading rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalSamples = overall?.sampleSize ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          n = {totalSamples.toLocaleString()}
        </span>
        <span className="text-muted-foreground/60">scored markets</span>
      </div>
      <div className="flex gap-5 flex-wrap">
        <ScoreCard
          label="Brier Score"
          value={overall?.brier ?? null}
          lowerIsBetter={true}
          byExchange={byExchange.map((e) => ({
            exchange: e.exchange,
            score: e.brier,
          }))}
          visible={visibleScores.brier}
          accentColor="#4f46e5"
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
          accentColor="#3b82f6"
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
          accentColor="#0ea5e9"
        />
      </div>
    </div>
  );
}
