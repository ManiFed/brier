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

export default function Dashboard() {
  const { markets, summary, loading, error, refetch } = useCohort();
  const { byExchange, overall } = useScores(markets);
  const rollingMode = useDashboardStore((s) => s.rollingMode);
  const drawerOpen = useDashboardStore((s) => s.drawerOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar / filter rail */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
          <div className="mt-4">
            <SharpnessPanel byExchange={byExchange} loading={loading} />
          </div>

          {/* Rolling mode score trend */}
          {rollingMode && (
            <div className="mt-4">
              <ScoreTrend markets={markets} loading={loading} />
            </div>
          )}

          {/* Worst mistakes */}
          <div className="mt-6">
            <WorstMistakes markets={markets} loading={loading} />
          </div>
        </div>
      </main>

      {/* Bin drill-down drawer */}
      <BinDrawer open={drawerOpen} byExchange={byExchange} />
    </div>
  );
}
