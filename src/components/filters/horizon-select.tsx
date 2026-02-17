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
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2.5 block tracking-wide">
          Evaluation Horizon
        </label>
        <div className="flex flex-wrap gap-1.5">
          {HORIZON_PRESETS.map((preset) => {
            const key = evaluationTimeKey(preset.value);
            const selected = key === currentKey;
            return (
              <button
                key={key}
                onClick={() => setEvaluationTime(preset.value)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-accent"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block tracking-wide">
          Tolerance: <span className="text-primary">&plusmn;{horizonToleranceHours}h</span>
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
          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
    </div>
  );
}
