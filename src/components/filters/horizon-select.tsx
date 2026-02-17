"use client";

import { useDashboardStore } from "@/store/dashboard-store";

const MIN_HOURS = 1;
const MAX_HOURS = 24 * 60;

export function HorizonSelect() {
  const evaluationTime = useDashboardStore((s) => s.evaluationTime);
  const setEvaluationTime = useDashboardStore((s) => s.setEvaluationTime);
  const horizonToleranceHours = useDashboardStore((s) => s.horizonToleranceHours);
  const setHorizonToleranceHours = useDashboardStore((s) => s.setHorizonToleranceHours);

  const horizonHours = evaluationTime.type === "fixed_horizon" ? evaluationTime.hours : 168;

  const setHours = (hours: number) => {
    const next = Math.max(MIN_HOURS, Math.min(MAX_HOURS, Math.round(hours)));
    setEvaluationTime({ type: "fixed_horizon", hours: next });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block tracking-wide">
          Evaluation Horizon
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={MIN_HOURS}
            max={MAX_HOURS}
            step={1}
            value={horizonHours}
            onChange={(e) => setHours(parseInt(e.target.value, 10))}
            className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
          />
          <input
            type="number"
            min={MIN_HOURS}
            max={MAX_HOURS}
            step={1}
            value={horizonHours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-20 rounded-md border border-input bg-background/70 px-2 py-1 text-xs"
          />
          <span className="text-xs text-muted-foreground">h</span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {Math.floor(horizonHours / 24)}d {horizonHours % 24}h before resolution
        </p>
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
          onChange={(e) => setHorizonToleranceHours(parseInt(e.target.value, 10))}
          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}
