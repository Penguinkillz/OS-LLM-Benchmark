import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { models, runs } from "@/db/schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: P) {
  const { id } = await params;
  const db = getDb();
  const [m] = await db.select().from(models).where(eq(models.id, id));
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const r = await db.select().from(runs).where(eq(runs.modelId, id));
  return NextResponse.json({ data: m, runCount: r.length });
}

export async function DELETE(_: Request, { params }: P) {
  const { id } = await params;
  const db = getDb();
  const [m] = await db.delete(models).where(eq(models.id, id)).returning();
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
