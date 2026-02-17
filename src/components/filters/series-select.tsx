"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/store/dashboard-store";

export function SeriesSelect() {
  const selectedSeries = useDashboardStore((s) => s.selectedSeries);
  const setSelectedSeries = useDashboardStore((s) => s.setSelectedSeries);
  const [search, setSearch] = useState("");
  const [allSeries, setAllSeries] = useState<string[]>([]);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/filter-options");
      if (!response.ok) return;
      const data = (await response.json()) as { series?: string[] };
      setAllSeries(data.series ?? []);
    };
    run();
  }, []);

  const visible = useMemo(() => {
    if (!search.trim()) return allSeries.slice(0, 12);
    const term = search.toLowerCase();
    return allSeries.filter((s) => s.toLowerCase().includes(term)).slice(0, 12);
  }, [allSeries, search]);

  const toggleSeries = (series: string) => {
    if (selectedSeries.includes(series)) {
      setSelectedSeries(selectedSeries.filter((s) => s !== series));
      return;
    }
    setSelectedSeries([...selectedSeries, series]);
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">Series</label>
      <input
        type="text"
        placeholder="Search series..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2 w-full rounded-md border border-input bg-background/70 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="max-h-36 overflow-y-auto space-y-1 rounded-md border border-border/60 p-1.5 bg-background/40">
        {visible.map((series) => {
          const selected = selectedSeries.includes(series);
          return (
            <button
              key={series}
              onClick={() => toggleSeries(series)}
              className={`w-full rounded px-2 py-1 text-left text-xs transition-colors ${
                selected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {series}
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="px-2 py-1 text-xs text-muted-foreground">No series found.</p>
        )}
      </div>
    </div>
  );
}
