"use client";

import { useEffect, useState } from "react";

type Line = {
  id: number;
  runId: string;
  ts: string;
  level: string;
  message: string;
  run: { id: string; status: string; profile: string };
  model: { displayName: string; slug: string } | null;
};

const levelCls: Record<string, string> = {
  info: "text-foreground/90",
  error: "text-destructive",
  warn: "text-warning",
  metric: "text-accent",
};

function cls(level: string) {
  return levelCls[level] ?? "text-muted-foreground/90";
}

export default function LogsPage() {
  const [lines, setLines] = useState<Line[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    fetch("/api/log-lines?limit=250", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Could not load logs");
        return r.json();
      })
      .then((j) => {
        if (ok) setLines((j.data ?? []) as Line[]);
      })
      .catch((e) => {
        if (ok) setErr(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      ok = false;
    };
  }, []);

  return (
    <div>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">Logs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent structured lines from all runs (newest first), stored in Postgres.
        </p>
      </div>
      {err && (
        <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
          {err} — check DATABASE_URL and migrations.
        </p>
      )}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-[#0b0d12] shadow-card">
        <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 font-mono text-[10px] text-muted-foreground">run_log_lines — tail</span>
        </div>
        <div className="max-h-[28rem] overflow-auto p-4 font-mono text-xs leading-relaxed">
          {lines && lines.length === 0 && !err && <p className="text-muted-foreground">No log lines yet. Run a benchmark to populate the database.</p>}
          {lines?.map((l) => (
            <p key={l.id} className={cls(l.level)} title={l.runId}>
              <span className="text-muted-foreground/60">
                {new Date(l.ts).toISOString().replace("T", " ").slice(0, 19)} [{l.level}]{' '}
              </span>
              {l.model && <span className="text-muted-foreground/80">[{l.model.slug}] </span>}
              {l.message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
