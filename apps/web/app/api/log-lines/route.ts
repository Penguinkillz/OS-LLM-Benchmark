import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { models, runLogLines, runs } from "@/db/schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "200", 10) || 200));
  try {
    const db = getDb();
    const rows = await db
      .select({
        line: runLogLines,
        run: { id: runs.id, status: runs.status, profile: runs.profile },
        model: { displayName: models.displayName, slug: models.slug },
      })
      .from(runLogLines)
      .innerJoin(runs, eq(runLogLines.runId, runs.id))
      .leftJoin(models, eq(runs.modelId, models.id))
      .orderBy(desc(runLogLines.ts))
      .limit(limit);
    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.line.id,
        runId: r.line.runId,
        ts: r.line.ts,
        level: r.line.level,
        message: r.line.message,
        context: r.line.context,
        run: r.run,
        model:
          r.model?.displayName != null && r.model?.slug != null
            ? { displayName: r.model.displayName, slug: r.model.slug }
            : null,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB error" }, { status: 503 });
  }
}
