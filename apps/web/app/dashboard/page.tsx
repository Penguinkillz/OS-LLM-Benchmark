import type { ElementType } from "react";
import { getDb } from "@/db";
import { models, runs } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";
import { Activity, Box, Timer } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  let nModels = 0;
  let nRuns = 0;
  let lastLabel = "—";
  let running = 0;
  let derr: string | null = null;
  try {
    const db = getDb();
    const mc = await db.select({ c: count() }).from(models);
    nModels = Number(mc[0]?.c ?? 0);
    const rc = await db.select({ c: count() }).from(runs);
    nRuns = Number(rc[0]?.c ?? 0);
    const rrun = await db.select({ c: count() }).from(runs).where(eq(runs.status, "running"));
    running = Number(rrun[0]?.c ?? 0);
    const [last] = await db.select().from(runs).orderBy(desc(runs.startedAt)).limit(1);
    if (last?.startedAt) {
      const d = new Date(last.startedAt);
      lastLabel = d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
    }
  } catch (e) {
    derr = e instanceof Error ? e.message : "Database unavailable";
  }
  if (derr) {
    return (
      <div>
        <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">Overview</h2>
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {derr} Set DATABASE_URL and apply db/migrations.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Live counts from PostgreSQL.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Running" value={String(running)} sub="status=running" icon={Activity} tone="text-accent" />
        <Stat label="Models" value={String(nModels)} sub="registered" icon={Box} tone="text-primary" />
        <Stat label="Total runs" value={String(nRuns)} sub={"last: " + lastLabel} icon={Timer} tone="text-success" />
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-border/60 bg-card/20 p-6 text-sm text-muted-foreground">
        <Link href="/dashboard/models" className="text-primary hover:underline">Add a model</Link>, then run a benchmark (worker + WORKER_BASE_URL).{" "}
        <Link href="/dashboard/leaderboard" className="ml-1 text-primary hover:underline">Leaderboard</Link>
      </div>
    </div>
  );
}
function Stat({ label, value, sub, icon: Icon, tone }: { label: string; value: string; sub: string; icon: ElementType; tone: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/90 to-card/30 p-5 shadow-card">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className={"h-4 w-4 " + tone} />
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
