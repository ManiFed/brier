import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { benchmarks } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, data } = body as {
      name: string;
      data: { marketId: string; probability: number }[];
    };

    if (!name || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Missing 'name' or 'data' array" },
        { status: 400 }
      );
    }

    const records = data.map((d) => ({
      id: randomUUID(),
      name,
      marketId: d.marketId,
      probability: d.probability,
      createdAt: Date.now(),
    }));

    for (const record of records) {
      await db.insert(benchmarks).values(record);
    }

    return NextResponse.json({
      success: true,
      benchmarkName: name,
      count: records.length,
    });
  } catch (error) {
    console.error("Benchmark upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload benchmarks" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const allBenchmarks = await db.select().from(benchmarks).all();
    const names = [...new Set(allBenchmarks.map((b) => b.name))];
    return NextResponse.json({ benchmarks: names });
  } catch (error) {
    console.error("Benchmark list error:", error);
    return NextResponse.json(
      { error: "Failed to list benchmarks" },
      { status: 500 }
    );
  }
}
