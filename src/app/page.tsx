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

function GeometricBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-pink-300/25 blur-3xl" />
      <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />

      <div className="absolute top-24 right-20 h-40 w-40 rounded-3xl border border-white/40 bg-white/25 backdrop-blur-xl shadow-xl rotate-12" />
      <div className="absolute bottom-20 left-16 h-32 w-32 rounded-full border border-white/45 bg-white/20 backdrop-blur-xl" />
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
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative aurora-bg">
        <GeometricBackground />

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
