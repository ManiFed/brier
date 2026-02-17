"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { ScoreStrip } from "@/components/layout/score-strip";
import { CalibrationChart } from "@/components/charts/calibration-chart";
import { SharpnessPanel } from "@/components/charts/sharpness-panel";
import { ScoreTrend } from "@/components/charts/score-trend";
import { BinDrawer } from "@/components/drill-down/bin-drawer";
import { WorstMistakes } from "@/components/drill-down/worst-mistakes";
import { useCohort } from "@/hooks/use-cohort";
import { useScores } from "@/hooks/use-scores";
import { useDashboardStore } from "@/store/dashboard-store";

export default function Dashboard() {
  const { markets, summary, loading, error } = useCohort();
  const { byExchange, overall } = useScores(markets);
  const rollingMode = useDashboardStore((s) => s.rollingMode);
  const drawerOpen = useDashboardStore((s) => s.drawerOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative dashboard-bg">
        <div className="relative mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-10">
          <ScoreStrip
            overall={overall}
            summary={summary}
            loading={loading}
            error={error}
          />

          <div className="mt-6">
            <CalibrationChart byExchange={byExchange} loading={loading} />
          </div>

          <div className="mt-5">
            <SharpnessPanel byExchange={byExchange} loading={loading} />
          </div>

          {rollingMode && (
            <div className="mt-5">
              <ScoreTrend markets={markets} loading={loading} />
            </div>
          )}

          <div className="mt-6 mb-8">
            <WorstMistakes markets={markets} loading={loading} />
          </div>
        </div>
      </main>

      <BinDrawer open={drawerOpen} byExchange={byExchange} />
    </div>
  );
}
