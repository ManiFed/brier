"use client";

import { useDashboardStore } from "@/store/dashboard-store";

export function SeriesSelect() {
  const selectedSeries = useDashboardStore((s) => s.selectedSeries);
  const setSelectedSeries = useDashboardStore((s) => s.setSelectedSeries);

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">
        Series
      </label>
      <input
        type="text"
        placeholder="Filter by series name..."
        value={selectedSeries.join(", ")}
        onChange={(e) => {
          const value = e.target.value;
          if (value.trim() === "") {
            setSelectedSeries([]);
          } else {
            setSelectedSeries(
              value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            );
          }
        }}
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <p className="mt-1 text-[10px] text-muted-foreground">
        Comma-separated series names
      </p>
    </div>
  );
}
