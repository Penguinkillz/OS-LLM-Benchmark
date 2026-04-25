import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { models, runs } from "@/db/schema";
import { createRunSchema } from "@/lib/validation";
import { executeRun } from "@/lib/execute-run";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select({ run: runs, model: models })
      .from(runs)
      .leftJoin(models, eq(runs.modelId, models.id))
      .orderBy(desc(runs.startedAt))
      .limit(100);
    return NextResponse.json({ data: rows });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB error" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = createRunSchema.parse(await req.json());
    const out = await executeRun(parsed);
    return NextResponse.json({ data: out });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Run failed" }, { status: 400 });
  }
}