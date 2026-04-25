const fs = require("fs");
const path = require("path");
const webRoot = path.join(__dirname, "..", "..", "apps", "web");
const w = (rel, c) => {
  const p = path.join(webRoot, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, c, "utf8");
};

w("lib/benchmark-criteria.ts", `export type Criterion = {
  id: string;
  name: string;
  short: string;
  howMeasured: string;
  math: string;
  whyItMatters: string;
  comparisonNote: string;
};

export const WORKLOAD_PROFILES: { id: string; name: string; desc: string }[] = [
  { id: "latency", name: "Latency", desc: "Emphasize short batches, measure tail latency and TTFT." },
  { id: "memory", name: "Memory", desc: "Longer context / larger effective KV footprint." },
  { id: "fairness", name: "Fairness", desc: "Split capacity across virtual tenants, compute Jain index." },
  { id: "balanced", name: "Balanced", desc: "Default mix of goals." },
  { id: "mixed_tenant", name: "Mixed tenant", desc: "Contention: concurrent streams with different batch sizes." },
];

export const BENCHMARK_INPUT_PARAMETERS: {
  key: string;
  label: string;
  unit: string;
  description: string;
  usedIn: string;
}[] = [
  { key: "max_tokens", label: "Max new tokens", unit: "tokens", description: "How many output tokens the harness asks for per request (caps work per request).", usedIn: "All profiles" },
  { key: "batch_size", label: "Batch size", unit: "requests", description: "How many forward passes are scheduled together when the backend supports batching.", usedIn: "Serving throughput" },
  { key: "concurrent_tenants", label: "Concurrent tenants", unit: "streams", description: "Simulated independent request streams competing for the same model capacity.", usedIn: "Fairness, mixed_tenant" },
  { key: "num_iterations", label: "Measurement iterations", unit: "iters", description: "How many request cycles are used to form latency and throughput stats after warmup.", usedIn: "Stability" },
  { key: "warmup_iterations", label: "Warmup", unit: "iters", description: "Iterations discarded before recording (caches, kernels, autotune).", usedIn: "All" },
  { key: "prompt_len_tokens", label: "Prompt length", unit: "tokens (approx.)", description: "Approximate input size driving prefill and KV allocation.", usedIn: "Memory, long-context" },
];

export const MEASUREMENT_CRITERIA: Criterion[] = [
  {
    id: "p50_p95_p99",
    name: "Latency percentiles",
    short: "p50, p95, p99",
    howMeasured: "Request end-to-end latencies (or per-phase: TTFT, token inter-arrival) are collected; we report empirical quantiles of the sample.",
    math: "Sort latencies t_(1)\\\\le...\\\\le t_(n). p95 is t_(\\\\lceil 0.95n \\\\rceil). p50 and p99 use 0.50 and 0.99. With small n, we still define quantiles on the finite sample (not an extrapolated parametric model).",
    whyItMatters: "Averages hide tail risk; SLOs for interactive apps care about 95/99% users.",
    comparisonNote: "Lower is better. Compare on the same runParams and hardware.",
  },
  {
    id: "ttft",
    name: "Time to first token (TTFT)",
    short: "TTFT p95",
    howMeasured: "Time from request accepted to first output token. Worker stub reports ttft_p95_ms.",
    math: "Per request TTFT_i; take p95 of {TTFT_i} over the measured window (after warmup).",
    whyItMatters: "User-visible 'typing' delay; separate from per-token time once streaming starts.",
    comparisonNote: "Lower is better; sensitive to prefill, queueing, and batching policy.",
  },
  {
    id: "throughput",
    name: "Throughput",
    short: "tokens/s (aggregate)",
    howMeasured: "Total generated tokens / wall time over the window (or per-stream averages for fairness).",
    math: "tok/s = (\\\\sum generated tokens) / (t_end - t_start) over steady-state window, excluding warm-up if configured.",
    whyItMatters: "System capacity; compare against latency tails—often a tradeoff under batching.",
    comparisonNote: "Higher is better for capacity; compare with same SLO and batch settings.",
  },
  {
    id: "memory",
    name: "Memory pressure",
    short: "approx_peak_mb",
    howMeasured: "High-water mark of device memory (worker stub: fixed model). Real runs should read NVML/ROCm and CPU RSS.",
    math: "Peak over time: max_t M(t). OOM = overflow event.",
    whyItMatters: "When KV cache grows with batch and context, memory becomes the gating resource like RAM in an OS.",
    comparisonNote: "Lower is better at equal quality/throughput, or same peak with higher tok/s is better.",
  },
  {
    id: "jain",
    name: "Jain\\\\'s fairness index",
    short: "Jain 0-1",
    howMeasured: "Per-tenant throughput x_i (tokens/s allocated to each of n tenants).",
    math: "J = (\\\\sum x_i)² / (n \\\\sum x_i²). If all equal, J=1; if one hogs, J→1/n.",
    whyItMatters: "Classic fairness metric; maps noisy-neighbor behavior to a single number.",
    comparisonNote: "Higher is more fair, all else equal; compare at same n and load.",
  },
];

export const LEADERBOARD_COMPOSITE = {
  name: "Default sort (illustrative)",
  description: "The UI ranks by a simple lexicographic preference: lower p95_ms, then higher tok/s, then higher Jain. Replace with a weighted score when you move beyond the stub worker.",
  formula: "No single formula yet—avoid overfitting to fake numbers. Once real: score = w1 \\\\\\\\* norm(p95) + w2 \\\\\\\\* norm(toks) + w3 \\\\\\\\* Jain, with min-max or z-score per cohort.",
};

`);

w("app/api/models/route.ts", `import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { models } from "@/db/schema";
import { createModelSchema } from "@/lib/validation";
import { slugify } from "@/lib/slugify";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(models).orderBy(desc(models.createdAt));
    return NextResponse.json({ data: rows });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB error" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = createModelSchema.parse(await req.json());
    const slug = body.slug && body.slug.length > 0 ? body.slug : slugify(body.displayName);
    const db = getDb();
    const [row] = await db
      .insert(models)
      .values({
        slug,
        displayName: body.displayName,
        source: body.source ?? null,
        paramsJson: body.paramsJson ?? {},
      })
      .onConflictDoNothing()
      .returning();
    if (!row) {
      return NextResponse.json({ error: "Duplicate slug" }, { status: 409 });
    }
    return NextResponse.json({ data: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bad request" }, { status: 400 });
  }
}
`);

w("app/api/models/[id]/route.ts", `import { eq } from "drizzle-orm";
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
`);

w("app/api/runs/route.ts", `import { desc, eq, sql } from "drizzle-orm";
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
`);

w("app/api/runs/[id]/route.ts", `import { eq } from "drizzle-orm";
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
`);

w("app/api/leaderboard/route.ts", `import { desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { models, runs } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, isNotNull, and } from "drizzle-orm";

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
`);

console.log("api+lib");
