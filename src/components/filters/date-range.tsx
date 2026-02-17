"use client";

import { useDashboardStore } from "@/store/dashboard-store";

export function DateRange() {
  const resolutionWindow = useDashboardStore((s) => s.resolutionWindow);
  const setResolutionWindow = useDashboardStore((s) => s.setResolutionWindow);

  const startStr = resolutionWindow?.start
    ? resolutionWindow.start.toISOString().split("T")[0]
    : "";
  const endStr = resolutionWindow?.end
    ? resolutionWindow.end.toISOString().split("T")[0]
    : "";

  const handleStartChange = (value: string) => {
    if (!value) {
      setResolutionWindow(null);
      return;
    }
    const start = new Date(value);
    const end = resolutionWindow?.end ?? new Date();
    setResolutionWindow({ start, end });
  };

  const handleEndChange = (value: string) => {
    if (!value) {
      setResolutionWindow(null);
      return;
    }
    const end = new Date(value);
    const start = resolutionWindow?.start ?? new Date("2020-01-01");
    setResolutionWindow({ start, end });
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">
        Resolution Window
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          value={startStr}
          onChange={(e) => handleStartChange(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Start"
        />
        <input
          type="date"
          value={endStr}
          onChange={(e) => handleEndChange(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="End"
        />
      </div>
      {resolutionWindow && (
        <button
          onClick={() => setResolutionWindow(null)}
          className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Clear dates
        </button>
      )}
    </div>
  );
}
