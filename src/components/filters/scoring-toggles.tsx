"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import type { BinScheme } from "@/lib/scoring/types";

export function ScoringToggles() {
  const visibleScores = useDashboardStore((s) => s.visibleScores);
  const setVisibleScore = useDashboardStore((s) => s.setVisibleScore);
  const calibrationView = useDashboardStore((s) => s.calibrationView);
  const setCalibrationView = useDashboardStore((s) => s.setCalibrationView);
  const binScheme = useDashboardStore((s) => s.binScheme);
  const setBinScheme = useDashboardStore((s) => s.setBinScheme);
  const aggregation = useDashboardStore((s) => s.aggregation);
  const setAggregation = useDashboardStore((s) => s.setAggregation);
  const rollingMode = useDashboardStore((s) => s.rollingMode);
  const setRollingMode = useDashboardStore((s) => s.setRollingMode);

  return (
    <div className="space-y-4">
      {/* Score visibility */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Visible Scores
        </label>
        <div className="space-y-1">
          {(
            [
              ["brier", "Brier"],
              ["logarithmic", "Logarithmic"],
              ["spherical", "Spherical"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleScores[key]}
                onChange={(e) => setVisibleScore(key, e.target.checked)}
                className="rounded border-input"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Calibration view */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Calibration View
        </label>
        <div className="flex gap-1">
          {(["reliability", "residuals"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCalibrationView(view)}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors ${
                calibrationView === view
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Bin scheme */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Bin Scheme
        </label>
        <div className="flex gap-1">
          {(
            [
              ["fixed_width", "Fixed Width"],
              ["equal_count", "Equal Count"],
            ] as [BinScheme, string][]
          ).map(([scheme, label]) => (
            <button
              key={scheme}
              onClick={() => setBinScheme(scheme)}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                binScheme === scheme
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregation */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Aggregation
        </label>
        <div className="flex gap-1">
          {(["mean", "median", "volume_weighted"] as const).map((agg) => (
            <button
              key={agg}
              onClick={() => setAggregation(agg)}
              className={`flex-1 rounded-md px-1.5 py-1 text-[10px] font-medium capitalize transition-colors ${
                aggregation === agg
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {agg.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Rolling mode */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={rollingMode}
            onChange={(e) => setRollingMode(e.target.checked)}
            className="rounded border-input"
          />
          Rolling Mode
        </label>
      </div>
    </div>
  );
}
