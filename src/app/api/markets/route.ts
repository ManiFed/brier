import { NextRequest, NextResponse } from "next/server";
import { queryCohort } from "@/lib/filters/cohort";
import type { EvaluationTime } from "@/lib/scoring/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const exchanges = searchParams.get("exchanges")?.split(",").filter(Boolean);
    const topics = searchParams.get("topics")?.split(",").filter(Boolean);
    const series = searchParams.get("series")?.split(",").filter(Boolean);
    const resolutionStart = searchParams.get("resolution_start");
    const resolutionEnd = searchParams.get("resolution_end");
    const outcomeStatus =
      (searchParams.get("outcome_status") as "resolved_only" | "all") ??
      "resolved_only";

    // Evaluation time
    const horizonType = searchParams.get("horizon_type") ?? "fixed_horizon";
    const horizonHours = parseInt(
      searchParams.get("horizon_hours") ?? "168",
      10
    );
    const safetyOffset = parseInt(
      searchParams.get("safety_offset") ?? "5",
      10
    );
    const windowHours = parseInt(
      searchParams.get("window_hours") ?? "24",
      10
    );
    const timeWeighted = searchParams.get("time_weighted") === "true";
    const toleranceHours = parseFloat(
      searchParams.get("tolerance_hours") ?? "6"
    );

    let evaluationTime: EvaluationTime;
    switch (horizonType) {
      case "close":
        evaluationTime = { type: "close", safetyOffsetMinutes: safetyOffset };
        break;
      case "smoothed_close":
        evaluationTime = {
          type: "smoothed_close",
          windowHours,
          timeWeighted,
        };
        break;
      default:
        evaluationTime = { type: "fixed_horizon", hours: horizonHours };
    }

    const result = await queryCohort({
      exchanges,
      topics,
      series,
      resolutionStart: resolutionStart ? new Date(resolutionStart) : undefined,
      resolutionEnd: resolutionEnd ? new Date(resolutionEnd) : undefined,
      outcomeStatus,
      evaluationTime,
      horizonToleranceHours: toleranceHours,
    });

    return NextResponse.json({
      markets: result.markets.map((m) => ({
        ...m,
        resolvedAt: m.resolvedAt.toISOString(),
        sampledAt: m.sampledAt.toISOString(),
        metadata: {
          ...m.metadata,
          createdAt: m.metadata.createdAt.toISOString(),
        },
      })),
      summary: {
        ...result.summary,
        resolutionWindow: result.summary.resolutionWindow
          ? {
              start: result.summary.resolutionWindow.start.toISOString(),
              end: result.summary.resolutionWindow.end.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Markets API error:", error);
    return NextResponse.json(
      { error: "Failed to query markets" },
      { status: 500 }
    );
  }
}
