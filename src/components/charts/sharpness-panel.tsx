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
      .padding(0.1);

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
      .attr("opacity", 0.7);

    // X axis labels (0%, 50%, 100%)
    g.append("text")
      .attr("x", 0)
      .attr("y", h + 14)
      .attr("font-size", "9px")
      .attr("fill", "#737373")
      .text("0%");

    g.append("text")
      .attr("x", w / 2)
      .attr("y", h + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#737373")
      .text("50%");

    g.append("text")
      .attr("x", w)
      .attr("y", h + 14)
      .attr("text-anchor", "end")
      .attr("font-size", "9px")
      .attr("fill", "#737373")
      .text("100%");
  }, [distribution, color]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium capitalize">{label}</span>
      </div>
      <svg ref={svgRef} />
      <span className="text-[10px] text-muted-foreground mt-1">
        Entropy: {entropy.toFixed(3)}
      </span>
    </div>
  );
}

export function SharpnessPanel({ byExchange, loading }: SharpnessPanelProps) {
  const [collapsed, setCollapsed] = useState(true);

  if (loading || byExchange.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        <span>Sharpness / Probability Distribution</span>
      </button>
      {!collapsed && (
        <div className="px-4 pb-4">
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
