import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { models, runLogLines, runs } from "@/db/schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: P) {
  const { id } = await params;
  const db = getDb();
  const [r] = await db.select().from(runs).where(eq(runs.id, id));
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const m = r.modelId ? (await db.select().from(models).where(eq(models.id, r.modelId)))[0] : null;
  const logs = await db.select().from(runLogLines).where(eq(runLogLines.runId, id));
  return NextResponse.json({ data: { run: r, model: m, logs } });
}
