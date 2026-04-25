import { and, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { models, runs } from "@/db/schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select({ run: runs, model: models })
      .from(runs)
      .leftJoin(models, eq(runs.modelId, models.id))
      .where(and(eq(runs.status, "completed"), isNotNull(runs.p95Ms)))
      .orderBy(runs.p95Ms)
      .limit(20);
    return NextResponse.json({ data: rows });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB error" }, { status: 503 });
  }
}