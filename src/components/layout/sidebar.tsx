"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Filter, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExchangeSelect } from "@/components/filters/exchange-select";
import { TopicSelect } from "@/components/filters/topic-select";
import { SeriesSelect } from "@/components/filters/series-select";
import { DateRange } from "@/components/filters/date-range";
import { HorizonSelect } from "@/components/filters/horizon-select";
import { ScoringToggles } from "@/components/filters/scoring-toggles";
import { useDashboardStore } from "@/store/dashboard-store";

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left">{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

export function Sidebar() {
  const resetFilters = useDashboardStore((s) => s.resetFilters);

  return (
    <aside className="w-72 flex-shrink-0 border-r border-border bg-sidebar overflow-y-auto hidden lg:block">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Brier</h1>
          <p className="text-xs text-muted-foreground">
            Prediction Market Accuracy
          </p>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Cohort filters */}
      <CollapsibleSection title="Cohort" icon={Filter} defaultOpen={true}>
        <ExchangeSelect />
        <TopicSelect />
        <SeriesSelect />
        <DateRange />
      </CollapsibleSection>

      {/* Evaluation settings */}
      <CollapsibleSection title="Evaluation" icon={BarChart3} defaultOpen={true}>
        <HorizonSelect />
      </CollapsibleSection>

      {/* Scoring settings */}
      <CollapsibleSection title="Scoring" icon={Settings} defaultOpen={false}>
        <ScoringToggles />
      </CollapsibleSection>
    </aside>
  );
}
