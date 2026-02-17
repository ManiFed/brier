"use client";

import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import { useDashboardStore } from "@/store/dashboard-store";
import { getExchangeColor, type ExchangeScores, type CalibrationBin } from "@/lib/scoring/types";

interface CalibrationChartProps {
  byExchange: ExchangeScores[];
  loading: boolean;
}

const MARGIN = { top: 20, right: 30, bottom: 50, left: 50 };
const CHART_HEIGHT = 450;

export function CalibrationChart({ byExchange, loading }: CalibrationChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const calibrationView = useDashboardStore((s) => s.calibrationView);
  const setCalibrationView = useDashboardStore((s) => s.setCalibrationView);
  const pinnedExchanges = useDashboardStore((s) => s.pinnedExchanges);
  const pinExchange = useDashboardStore((s) => s.pinExchange);
  const unpinExchange = useDashboardStore((s) => s.unpinExchange);
  const setSelectedBin = useDashboardStore((s) => s.setSelectedBin);

  const renderChart = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const width = containerWidth - MARGIN.left - MARGIN.right;
    const height = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${containerWidth} ${CHART_HEIGHT}`)
      .attr("width", containerWidth)
      .attr("height", CHART_HEIGHT);

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Scales
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);

    const isResiduals = calibrationView === "residuals";
    const yScale = d3
      .scaleLinear()
      .domain(isResiduals ? [-0.5, 0.5] : [0, 1])
      .range([height, 0]);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "#e5e5e5").attr("stroke-dasharray", "2,2")
      );

    // Reference line
    if (isResiduals) {
      // Zero line for residuals
      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "#a3a3a3")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,4");
    } else {
      // Perfect calibration diagonal
      g.append("line")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", xScale(1))
        .attr("y2", yScale(1))
        .attr("stroke", "#a3a3a3")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,4");
    }

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format(".0%")))
      .call((g) => g.select(".domain").attr("stroke", "#d4d4d4"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#737373").attr("font-size", "11px"));

    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(10)
          .tickFormat(d3.format(isResiduals ? "+.0%" : ".0%"))
      )
      .call((g) => g.select(".domain").attr("stroke", "#d4d4d4"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#737373").attr("font-size", "11px"));

    // Axis labels
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#737373")
      .attr("font-size", "12px")
      .text("Predicted Probability");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -38)
      .attr("text-anchor", "middle")
      .attr("fill", "#737373")
      .attr("font-size", "12px")
      .text(isResiduals ? "Residual (Observed - Predicted)" : "Observed Frequency");

    // Draw exchange lines
    const line = d3
      .line<CalibrationBin>()
      .x((d) => xScale(d.meanPredicted))
      .y((d) => yScale(isResiduals ? d.residual : d.observedFrequency))
      .curve(d3.curveMonotoneX);

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .selectAll(".chart-tooltip")
      .data([null])
      .join("div")
      .attr(
        "class",
        "chart-tooltip absolute pointer-events-none bg-popover text-popover-foreground border border-border rounded-md shadow-md px-3 py-2 text-xs opacity-0 z-50"
      );

    for (const exchangeData of byExchange) {
      const { exchange, calibrationBins } = exchangeData;
      const bins = calibrationBins.filter((b) => b.count > 0);
      if (bins.length === 0) continue;

      const color = getExchangeColor(exchange);
      const isPinned =
        pinnedExchanges.length === 0 || pinnedExchanges.includes(exchange);
      const opacity = isPinned ? 1 : 0.2;

      // CI area
      const area = d3
        .area<CalibrationBin>()
        .x((d) => xScale(d.meanPredicted))
        .y0((d) =>
          yScale(
            isResiduals
              ? d.confidenceInterval.low - d.meanPredicted
              : d.confidenceInterval.low
          )
        )
        .y1((d) =>
          yScale(
            isResiduals
              ? d.confidenceInterval.high - d.meanPredicted
              : d.confidenceInterval.high
          )
        )
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(bins)
        .attr("d", area)
        .attr("fill", color)
        .attr("opacity", opacity * 0.1);

      // Line
      g.append("path")
        .datum(bins)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("opacity", opacity);

      // Points
      g.selectAll(`.point-${exchange}`)
        .data(bins)
        .join("circle")
        .attr("cx", (d) => xScale(d.meanPredicted))
        .attr("cy", (d) =>
          yScale(isResiduals ? d.residual : d.observedFrequency)
        )
        .attr("r", (d) => Math.max(3, Math.min(8, Math.sqrt(d.count))))
        .attr("fill", color)
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("opacity", opacity)
        .attr("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3
            .select(this)
            .attr("r", Math.max(5, Math.min(10, Math.sqrt(d.count) + 2)));
          tooltip
            .style("opacity", "1")
            .html(
              `<div class="font-medium">${exchange}</div>
               <div>Bin: ${(d.binEdgeLow * 100).toFixed(0)}%-${(d.binEdgeHigh * 100).toFixed(0)}%</div>
               <div>Predicted: ${(d.meanPredicted * 100).toFixed(1)}%</div>
               <div>Observed: ${(d.observedFrequency * 100).toFixed(1)}%</div>
               <div>Residual: ${(d.residual * 100).toFixed(1)}%</div>
               <div>n = ${d.count}</div>`
            )
            .style("left", `${event.offsetX + 12}px`)
            .style("top", `${event.offsetY - 12}px`);
        })
        .on("mouseout", function (_, d) {
          d3.select(this).attr("r", Math.max(3, Math.min(8, Math.sqrt(d.count))));
          tooltip.style("opacity", "0");
        })
        .on("click", (_, d) => {
          const binIndex = bins.indexOf(d);
          setSelectedBin({ exchange, binIndex });
        });
    }
  }, [byExchange, calibrationView, pinnedExchanges, setSelectedBin]);

  useEffect(() => {
    renderChart();

    const observer = new ResizeObserver(() => renderChart());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [renderChart]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-muted rounded mb-4" />
          <div
            className="bg-muted rounded"
            style={{ height: CHART_HEIGHT }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">Calibration Chart</h2>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 bg-muted rounded-md p-0.5">
            {(["reliability", "residuals"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalibrationView(view)}
                className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  calibrationView === view
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {byExchange.map(({ exchange, sampleSize }) => {
          const color = getExchangeColor(exchange);
          const isPinned =
            pinnedExchanges.length === 0 || pinnedExchanges.includes(exchange);
          return (
            <button
              key={exchange}
              onClick={() =>
                isPinned && pinnedExchanges.length > 0
                  ? unpinExchange(exchange)
                  : pinExchange(exchange)
              }
              className={`flex items-center gap-1.5 text-xs transition-opacity ${
                isPinned ? "opacity-100" : "opacity-40"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{exchange}</span>
              <span className="text-muted-foreground">({sampleSize})</span>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div ref={containerRef} className="relative">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
