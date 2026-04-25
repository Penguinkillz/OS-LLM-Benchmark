import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({ ok: true, service: "os-llm-benchmark-web", time: new Date().toISOString() });
}
