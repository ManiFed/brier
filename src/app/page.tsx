"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { ScoreStrip } from "@/components/layout/score-strip";
import { CohortBar } from "@/components/layout/cohort-bar";
import { CalibrationChart } from "@/components/charts/calibration-chart";
import { SharpnessPanel } from "@/components/charts/sharpness-panel";
import { ScoreTrend } from "@/components/charts/score-trend";
import { BinDrawer } from "@/components/drill-down/bin-drawer";
import { WorstMistakes } from "@/components/drill-down/worst-mistakes";
import { useCohort } from "@/hooks/use-cohort";
import { useScores } from "@/hooks/use-scores";
import { useDashboardStore } from "@/store/dashboard-store";

/** Decorative geometric SVG overlay for the main content area */
function GeometricBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Large faded triangle - top right */}
      <svg
        className="absolute -top-20 -right-20 w-[500px] h-[500px] opacity-[0.03]"
        viewBox="0 0 500 500"
        fill="none"
      >
        <polygon
          points="250,30 470,420 30,420"
          stroke="#4f46e5"
          strokeWidth="2"
          fill="none"
        />
        <polygon
          points="250,80 430,390 70,390"
          stroke="#3b82f6"
          strokeWidth="1"
          fill="none"
        />
        <polygon
          points="250,130 390,360 110,360"
          stroke="#0ea5e9"
          strokeWidth="0.5"
          fill="none"
        />
      </svg>

      {/* Diamond grid pattern - bottom left */}
      <svg
        className="absolute -bottom-10 -left-10 w-[400px] h-[400px] opacity-[0.025]"
        viewBox="0 0 400 400"
        fill="none"
      >
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={col * 100 + 20}
              y={row * 100 + 20}
              width="60"
              height="60"
              transform={`rotate(45, ${col * 100 + 50}, ${row * 100 + 50})`}
              stroke="#4f46e5"
              strokeWidth="1"
              fill="none"
            />
          ))
        )}
      </svg>

      {/* Hexagonal pattern - middle right */}
      <svg
        className="absolute top-1/3 -right-16 w-[300px] h-[300px] opacity-[0.02]"
        viewBox="0 0 300 300"
        fill="none"
      >
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => {
            const cx = col * 90 + 60 + (row % 2) * 45;
            const cy = row * 78 + 60;
            const r = 40;
            const hex = Array.from({ length: 6 }, (_, i) => {
              const angle = (Math.PI / 3) * i - Math.PI / 6;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            }).join(" ");
            return (
              <polygon
                key={`hex-${row}-${col}`}
                points={hex}
                stroke="#3b82f6"
                strokeWidth="1"
                fill="none"
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const { markets, summary, loading, error } = useCohort();
  const { byExchange, overall } = useScores(markets);
  const rollingMode = useDashboardStore((s) => s.rollingMode);
  const drawerOpen = useDashboardStore((s) => s.drawerOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar / filter rail */}
      <Sidebar />

      {/* Main content with geometric background */}
      <main className="flex-1 overflow-y-auto relative geo-grid">
        <GeometricBackground />

        <div className="relative mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
          {/* Page header */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Calibration metrics across prediction market exchanges
            </p>
          </div>

          {/* Score strip */}
          <ScoreStrip
            byExchange={byExchange}
            overall={overall}
            loading={loading}
          />

          {/* Cohort transparency bar */}
          <CohortBar summary={summary} loading={loading} error={error} />

          {/* Main calibration chart */}
          <div className="mt-6">
            <CalibrationChart byExchange={byExchange} loading={loading} />
          </div>

          {/* Sharpness panel */}
          <div className="mt-5">
            <SharpnessPanel byExchange={byExchange} loading={loading} />
          </div>

          {/* Rolling mode score trend */}
          {rollingMode && (
            <div className="mt-5">
              <ScoreTrend markets={markets} loading={loading} />
            </div>
          )}

          {/* Worst mistakes */}
          <div className="mt-6 mb-8">
            <WorstMistakes markets={markets} loading={loading} />
          </div>
        </div>
      </main>

      {/* Bin drill-down drawer */}
      <BinDrawer open={drawerOpen} byExchange={byExchange} />
    </div>
  );
}
