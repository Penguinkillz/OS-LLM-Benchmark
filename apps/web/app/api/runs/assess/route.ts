import { createRunSchema } from "@/lib/validation";
import { assessRun } from "@/lib/assess-run";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const parsed = createRunSchema.parse(await req.json());
    const data = await assessRun(parsed);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Assess failed" }, { status: 400 });
  }
}
