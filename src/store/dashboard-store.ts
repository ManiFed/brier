"use client";

import { create } from "zustand";
import type {
  EvaluationTime,
  BinScheme,
  Aggregation,
} from "@/lib/scoring/types";

interface DashboardStore {
  // ─── Cohort filters ───────────────────────────────────────
  selectedExchanges: string[];
  selectedTopics: string[];
  selectedSeries: string[];
  resolutionWindow: { start: Date; end: Date } | null;
  outcomeStatus: "resolved_only" | "all";

  // ─── Evaluation ───────────────────────────────────────────
  evaluationTime: EvaluationTime;
  horizonToleranceHours: number;
  aggregation: Aggregation;

  // ─── Scoring ──────────────────────────────────────────────
  visibleScores: { brier: boolean; logarithmic: boolean; spherical: boolean };

  // ─── Calibration ──────────────────────────────────────────
  calibrationView: "reliability" | "residuals";
  binScheme: BinScheme;

  // ─── Comparison ───────────────────────────────────────────
  pinnedExchanges: string[];

  // ─── Rolling ──────────────────────────────────────────────
  rollingMode: boolean;
  rollingWindowDays: number;
  rollingStepDays: number;

  // ─── Drill-down ───────────────────────────────────────────
  selectedBin: { exchange: string; binIndex: number } | null;
  drawerOpen: boolean;

  // ─── Actions ──────────────────────────────────────────────
  setSelectedExchanges: (exchanges: string[]) => void;
  toggleExchange: (exchange: string) => void;
  setSelectedTopics: (topics: string[]) => void;
  setSelectedSeries: (series: string[]) => void;
  setResolutionWindow: (window: { start: Date; end: Date } | null) => void;
  setOutcomeStatus: (status: "resolved_only" | "all") => void;
  setEvaluationTime: (time: EvaluationTime) => void;
  setHorizonToleranceHours: (hours: number) => void;
  setAggregation: (agg: Aggregation) => void;
  setVisibleScore: (
    score: "brier" | "logarithmic" | "spherical",
    visible: boolean
  ) => void;
  setCalibrationView: (view: "reliability" | "residuals") => void;
  setBinScheme: (scheme: BinScheme) => void;
  pinExchange: (exchange: string) => void;
  unpinExchange: (exchange: string) => void;
  setRollingMode: (enabled: boolean) => void;
  setRollingWindowDays: (days: number) => void;
  setRollingStepDays: (days: number) => void;
  setSelectedBin: (bin: { exchange: string; binIndex: number } | null) => void;
  setDrawerOpen: (open: boolean) => void;
  resetFilters: () => void;
}

const DEFAULT_STATE = {
  selectedExchanges: [] as string[],
  selectedTopics: [] as string[],
  selectedSeries: [] as string[],
  resolutionWindow: null as { start: Date; end: Date } | null,
  outcomeStatus: "resolved_only" as const,
  evaluationTime: { type: "fixed_horizon", hours: 168 } as EvaluationTime,
  horizonToleranceHours: 6,
  aggregation: "mean" as Aggregation,
  visibleScores: { brier: true, logarithmic: true, spherical: true },
  calibrationView: "residuals" as const,
  binScheme: "fixed_width" as BinScheme,
  pinnedExchanges: [] as string[],
  rollingMode: false,
  rollingWindowDays: 90,
  rollingStepDays: 7,
  selectedBin: null as { exchange: string; binIndex: number } | null,
  drawerOpen: false,
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  ...DEFAULT_STATE,

  setSelectedExchanges: (exchanges) => set({ selectedExchanges: exchanges }),

  toggleExchange: (exchange) =>
    set((state) => {
      const exists = state.selectedExchanges.includes(exchange);
      return {
        selectedExchanges: exists
          ? state.selectedExchanges.filter((e) => e !== exchange)
          : [...state.selectedExchanges, exchange],
      };
    }),

  setSelectedTopics: (topics) => set({ selectedTopics: topics }),
  setSelectedSeries: (series) => set({ selectedSeries: series }),
  setResolutionWindow: (window) => set({ resolutionWindow: window }),
  setOutcomeStatus: (status) => set({ outcomeStatus: status }),
  setEvaluationTime: (time) => set({ evaluationTime: time }),
  setHorizonToleranceHours: (hours) => set({ horizonToleranceHours: hours }),
  setAggregation: (agg) => set({ aggregation: agg }),

  setVisibleScore: (score, visible) =>
    set((state) => ({
      visibleScores: { ...state.visibleScores, [score]: visible },
    })),

  setCalibrationView: (view) => set({ calibrationView: view }),
  setBinScheme: (scheme) => set({ binScheme: scheme }),

  pinExchange: (exchange) =>
    set((state) => {
      if (state.pinnedExchanges.includes(exchange)) return state;
      if (state.pinnedExchanges.length >= 3) return state;
      return { pinnedExchanges: [...state.pinnedExchanges, exchange] };
    }),

  unpinExchange: (exchange) =>
    set((state) => ({
      pinnedExchanges: state.pinnedExchanges.filter((e) => e !== exchange),
    })),

  setRollingMode: (enabled) => set({ rollingMode: enabled }),
  setRollingWindowDays: (days) => set({ rollingWindowDays: days }),
  setRollingStepDays: (days) => set({ rollingStepDays: days }),

  setSelectedBin: (bin) => set({ selectedBin: bin, drawerOpen: bin !== null }),
  setDrawerOpen: (open) =>
    set({ drawerOpen: open, selectedBin: open ? undefined : null }),

  resetFilters: () => set(DEFAULT_STATE),
}));
