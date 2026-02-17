"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  BarChart3,
  Settings,
  RotateCcw,
} from "lucide-react";
import { ExchangeSelect } from "@/components/filters/exchange-select";
import { TopicSelect } from "@/components/filters/topic-select";
import { SeriesSelect } from "@/components/filters/series-select";
import { DateRange } from "@/components/filters/date-range";
import { HorizonSelect } from "@/components/filters/horizon-select";
import { ScoringToggles } from "@/components/filters/scoring-toggles";
import { useDashboardStore } from "@/store/dashboard-store";

function PrismIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="prism-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {/* Prism triangle */}
      <path
        d="M14 3L25 23H3L14 3Z"
        stroke="url(#prism-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="url(#prism-grad)"
        fillOpacity="0.1"
      />
      {/* Refracted light rays */}
      <line x1="6" y1="12" x2="2" y2="10" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="22" y1="12" x2="26" y2="8" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="23" y1="15" x2="27" y2="14" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

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
    <div className="border-b border-sidebar-border/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-5 py-3.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
      >
        <Icon className="h-4 w-4 text-primary/60" />
        <span className="flex-1 text-left tracking-tight">{title}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

export function Sidebar() {
  const resetFilters = useDashboardStore((s) => s.resetFilters);

  return (
    <aside className="w-72 flex-shrink-0 border-r border-sidebar-border/60 bg-sidebar backdrop-blur-sm overflow-y-auto hidden lg:flex lg:flex-col">
      {/* Header with Prism branding */}
      <div className="px-5 py-5 border-b border-sidebar-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PrismIcon className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold tracking-tight prism-text">
                Prism
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">
                Forecast Accuracy
              </p>
            </div>
          </div>
          <button
            onClick={resetFilters}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            title="Reset all filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter sections */}
      <div className="flex-1 overflow-y-auto">
        <CollapsibleSection title="Cohort" icon={Filter} defaultOpen={true}>
          <ExchangeSelect />
          <TopicSelect />
          <SeriesSelect />
          <DateRange />
        </CollapsibleSection>

        <CollapsibleSection
          title="Evaluation"
          icon={BarChart3}
          defaultOpen={true}
        >
          <HorizonSelect />
        </CollapsibleSection>

        <CollapsibleSection
          title="Scoring"
          icon={Settings}
          defaultOpen={false}
        >
          <ScoringToggles />
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-sidebar-border/60">
        <p className="text-[9px] text-muted-foreground/60 text-center tracking-wider uppercase">
          Polymarket &middot; Metaculus &middot; Manifold
        </p>
      </div>
    </aside>
  );
}
