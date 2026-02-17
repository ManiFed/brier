"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getExchangeColor, type ExchangeScores } from "@/lib/scoring/types";

interface SharpnessPanelProps {
  byExchange: ExchangeScores[];
  loading: boolean;
}

const HIST_HEIGHT = 100;
const HIST_WIDTH = 200;
const MARGIN = { top: 5, right: 5, bottom: 20, left: 5 };

function MiniHistogram({
  distribution,
  color,
  label,
  entropy,
}: {
  distribution: number[];
  color: string;
  label: string;
  entropy: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = HIST_WIDTH - MARGIN.left - MARGIN.right;
    const h = HIST_HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${HIST_WIDTH} ${HIST_HEIGHT}`)
      .attr("width", HIST_WIDTH)
      .attr("height", HIST_HEIGHT)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = d3
      .scaleBand()
      .domain(distribution.map((_, i) => String(i)))
      .range([0, w])
      .padding(0.15);

    const yMax = Math.max(...distribution, 1);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([h, 0]);

    g.selectAll("rect")
      .data(distribution)
      .join("rect")
      .attr("x", (_, i) => xScale(String(i)) ?? 0)
      .attr("y", (d) => yScale(d))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => h - yScale(d))
      .attr("fill", color)
      .attr("opacity", 0.65)
      .attr("rx", 1);

    // X axis labels
    g.append("text")
      .attr("x", 0)
      .attr("y", h + 14)
      .attr("font-size", "9px")
      .attr("fill", "#6366f1")
      .attr("opacity", 0.6)
      .text("0%");

    g.append("text")
      .attr("x", w / 2)
      .attr("y", h + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#6366f1")
      .attr("opacity", 0.6)
      .text("50%");

    g.append("text")
      .attr("x", w)
      .attr("y", h + 14)
      .attr("text-anchor", "end")
      .attr("font-size", "9px")
      .attr("fill", "#6366f1")
      .attr("opacity", 0.6)
      .text("100%");
  }, [distribution, color]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold capitalize">{label}</span>
      </div>
      <svg ref={svgRef} />
      <span className="text-[10px] text-muted-foreground/70 mt-1.5">
        Entropy: {entropy.toFixed(3)}
      </span>
    </div>
  );
}

export function SharpnessPanel({ byExchange, loading }: SharpnessPanelProps) {
  const [collapsed, setCollapsed] = useState(true);

  if (loading || byExchange.length === 0) return null;

  return (
    <div className="rounded-xl glass-card gradient-border">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2.5 px-5 py-3.5 text-sm font-semibold hover:bg-accent/30 transition-colors rounded-xl"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-primary/50" />
        ) : (
          <ChevronDown className="h-4 w-4 text-primary/50" />
        )}
        <span>Sharpness / Probability Distribution</span>
      </button>
      {!collapsed && (
        <div className="px-5 pb-5">
          <div className="flex flex-wrap gap-6">
            {byExchange.map(({ exchange, sharpness }) => (
              <MiniHistogram
                key={exchange}
                distribution={sharpness.probDistribution}
                color={getExchangeColor(exchange)}
                label={exchange}
                entropy={sharpness.meanEntropy}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
