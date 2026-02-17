"use client";

import { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { getExchangeColor, type ScoredMarket } from "@/lib/scoring/types";
import { computeBrierScores } from "@/lib/scoring/brier";
import { useDashboardStore } from "@/store/dashboard-store";

interface ScoreTrendProps {
  markets: ScoredMarket[];
  loading: boolean;
}

const MARGIN = { top: 10, right: 80, bottom: 30, left: 50 };
const HEIGHT = 200;

interface TrendPoint {
  date: Date;
  score: number;
  exchange: string;
}

export function ScoreTrend({ markets, loading }: ScoreTrendProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rollingWindowDays = useDashboardStore((s) => s.rollingWindowDays);
  const rollingStepDays = useDashboardStore((s) => s.rollingStepDays);

  const trendData = useMemo(() => {
    const included = markets.filter((m) => !m.excluded);
    if (included.length === 0) return [];

    // Group by exchange
    const groups = new Map<string, ScoredMarket[]>();
    for (const m of included) {
      const group = groups.get(m.exchange) || [];
      group.push(m);
      groups.set(m.exchange, group);
    }

    // Get time range
    const dates = included.map((m) => m.resolvedAt.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    const windowMs = rollingWindowDays * 24 * 60 * 60 * 1000;
    const stepMs = rollingStepDays * 24 * 60 * 60 * 1000;

    const points: TrendPoint[] = [];

    for (const [exchange, exchangeMarkets] of groups) {
      for (
        let windowStart = minDate;
        windowStart + windowMs <= maxDate;
        windowStart += stepMs
      ) {
        const windowEnd = windowStart + windowMs;
        const windowCenter = new Date(windowStart + windowMs / 2);

        const inWindow = exchangeMarkets.filter((m) => {
          const t = m.resolvedAt.getTime();
          return t >= windowStart && t < windowEnd;
        });

        if (inWindow.length >= 5) {
          const result = computeBrierScores(inWindow);
          points.push({
            date: windowCenter,
            score: result.aggregate,
            exchange,
          });
        }
      }
    }

    return points;
  }, [markets, rollingWindowDays, rollingStepDays]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || trendData.length === 0)
      return;

    const containerWidth = containerRef.current.clientWidth;
    const width = containerWidth - MARGIN.left - MARGIN.right;
    const height = HEIGHT - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${containerWidth} ${HEIGHT}`);

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(trendData, (d) => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(trendData, (d) => d.score) ?? 0.5])
      .nice()
      .range([height, 0]);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .call((g) => g.selectAll("text").attr("font-size", "10px").attr("fill", "#737373"));

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .call((g) => g.selectAll("text").attr("font-size", "10px").attr("fill", "#737373"));

    // Group by exchange
    const exchanges = [...new Set(trendData.map((d) => d.exchange))];

    for (const exchange of exchanges) {
      const data = trendData
        .filter((d) => d.exchange === exchange)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const color = getExchangeColor(exchange);

      const line = d3
        .line<TrendPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.score))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(data)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      // Label at end
      if (data.length > 0) {
        const last = data[data.length - 1];
        g.append("text")
          .attr("x", xScale(last.date) + 5)
          .attr("y", yScale(last.score))
          .attr("dy", "0.35em")
          .attr("fill", color)
          .attr("font-size", "10px")
          .text(exchange);
      }
    }
  }, [trendData]);

  if (loading || trendData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Score Trend (Rolling {rollingWindowDays}d)
        </h3>
        <div className="text-xs text-muted-foreground">
          {loading
            ? "Loading..."
            : "Not enough data for rolling windows (need 5+ markets per window)"}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-2">
        Brier Score Trend (Rolling {rollingWindowDays}d window, {rollingStepDays}d step)
      </h3>
      <div ref={containerRef}>
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
