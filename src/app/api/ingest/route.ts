import { NextRequest, NextResponse } from "next/server";
import { ingestExchange, ingestAll } from "@/lib/data/ingestion";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const exchange = body.exchange as string | undefined;

    if (exchange) {
      const result = await ingestExchange(exchange);
      return NextResponse.json({
        exchange,
        ...result,
      });
    }

    const results = await ingestAll();
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: "Ingestion failed", details: String(error) },
      { status: 500 }
    );
  }
}
