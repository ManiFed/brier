export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDistinctSeries, getDistinctTopics } from "@/lib/db/queries";

export async function GET() {
  try {
    const topics = getDistinctTopics().filter(Boolean).sort((a, b) => a.localeCompare(b));
    const series = getDistinctSeries().filter(Boolean).sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ topics, series });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load filter options", details: String(error) },
      { status: 500 },
    );
  }
}
