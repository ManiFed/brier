"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import { HORIZON_PRESETS, type EvaluationTime } from "@/lib/scoring/types";

function evaluationTimeKey(et: EvaluationTime): string {
  if (et.type === "fixed_horizon") return `fh-${et.hours}`;
  if (et.type === "close") return `close-${et.safetyOffsetMinutes}`;
  return `sc-${et.windowHours}-${et.timeWeighted}`;
}

export function HorizonSelect() {
  const evaluationTime = useDashboardStore((s) => s.evaluationTime);
  const setEvaluationTime = useDashboardStore((s) => s.setEvaluationTime);
  const horizonToleranceHours = useDashboardStore(
    (s) => s.horizonToleranceHours
  );
  const setHorizonToleranceHours = useDashboardStore(
    (s) => s.setHorizonToleranceHours
  );

  const currentKey = evaluationTimeKey(evaluationTime);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Evaluation Horizon
        </label>
        <div className="flex flex-wrap gap-1">
          {HORIZON_PRESETS.map((preset) => {
            const key = evaluationTimeKey(preset.value);
            const selected = key === currentKey;
            return (
              <button
                key={key}
                onClick={() => setEvaluationTime(preset.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Tolerance: ±{horizonToleranceHours}h
        </label>
        <input
          type="range"
          min={1}
          max={24}
          step={1}
          value={horizonToleranceHours}
          onChange={(e) =>
            setHorizonToleranceHours(parseInt(e.target.value, 10))
          }
          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
      </div>
    </div>
  );
}
