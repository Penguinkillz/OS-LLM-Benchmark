"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type RunRow = {
  run: {
    p95Ms: number | null;
    approxPeakMb: number | null;
    startedAt: string;
  };
};

export default function AnalysisPage() {
  const [rows, setRows] = useState<RunRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    fetch("/api/runs", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Could not load runs");
        return r.json();
      })
      .then((j) => {
        if (!ok) return;
        const list = (j.data ?? []) as RunRow[];
        setRows(
          list
            .filter((r) => r.run.p95Ms != null)
            .slice(0, 20)
            .sort((a, b) => new Date(b.run.startedAt).getTime() - new Date(a.run.startedAt).getTime())
        );
      })
      .catch((e) => {
        if (ok) setErr(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      ok = false;
    };
  }, []);

  const p95 = rows?.map((r) => r.run.p95Ms!).filter((n) => n > 0) ?? [];
  const mem = rows?.map((r) => r.run.approxPeakMb).filter((n): n is number => n != null && n > 0) ?? [];

  const maxP95 = p95.length ? Math.max(200, ...p95, 1) : 200;
  const maxMem = mem.length ? Math.max(1, ...mem, 1) * 1.1 : 512;

  return (
    <div>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">Analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Latency and memory from completed runs in your database (most recent, up to 20 points).
        </p>
      </div>
      {err && (
        <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground" role="alert">
          {err} — check DATABASE_URL, run migrations, and that Postgres is up.
        </p>
      )}
      {!err && rows && p95.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">No run data yet. Complete a benchmark run from the dashboard to see charts here.</p>
      )}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-card">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latency tail</p>
                <p className="mt-0.5 font-mono text-sm text-foreground">p95 (ms) by run (newest first)</p>
              </div>
            </div>
            <div className="mt-4 flex h-48 min-h-[12rem] items-end gap-1 border-b border-l border-border/40 pl-1 pb-0">
              {p95.length === 0
                ? Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="min-w-0 flex-1 rounded-t-md bg-muted/30" style={{ height: "8%" }} title="no data" />
                  ))
                : p95.map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${(v / maxP95) * 100}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.02 }}
                      className="min-w-0 flex-1 rounded-t-md bg-gradient-to-t from-primary/50 to-primary"
                      title={`${v.toFixed(1)} ms`}
                    />
                  ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>oldest in window</span>
              <span>newest</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Memory</p>
          <p className="mt-0.5 font-mono text-sm text-foreground">approx peak (MB) by run</p>
          <div className="mt-6 space-y-2">
            {mem.length === 0
              ? [0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-2 opacity-50">
                    <div className="w-8 font-mono text-[10px] text-muted-foreground">—</div>
                    <div className="h-2 flex-1 rounded-full bg-muted/40" />
                    <span className="w-10 text-right font-mono text-xs text-muted-foreground">—</span>
                  </div>
                ))
              : mem.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 font-mono text-[10px] text-muted-foreground">r{i}</div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent/40 to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${(m / maxMem) * 100}%` }}
                        transition={{ delay: 0.2 + i * 0.03 }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs text-foreground">{m.toFixed(0)}</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
