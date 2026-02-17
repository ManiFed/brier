export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDistinctSeries, getDistinctTopics } from "@/lib/db/queries";
import { getDemoFilterOptions } from "@/lib/data/demo-cohort";

export async function GET() {
  try {
    const topics = getDistinctTopics().filter(Boolean).sort((a, b) => a.localeCompare(b));
    const series = getDistinctSeries().filter(Boolean).sort((a, b) => a.localeCompare(b));

    if (topics.length === 0 && series.length === 0) {
      return NextResponse.json(getDemoFilterOptions());
    }

    return NextResponse.json({ topics, series });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load filter options", details: String(error) },
      { status: 500 },
    );
  }
}
