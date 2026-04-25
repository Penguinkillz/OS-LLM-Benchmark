"use client";

import { useState } from "react";
type RiskLevel = "ok" | "caution" | "critical";

const PROFILES = ["latency", "memory", "fairness", "balanced", "mixed_tenant"] as const;

type AssessPayload = {
  level: RiskLevel;
  title: string;
  message: string;
  details: Record<string, unknown>;
};

export function RunBenchmarkForm({ modelId }: { modelId: string }) {
  const [profile, setProfile] = useState<string>("balanced");
  const [max_tokens, setMaxTokens] = useState(128);
  const [batch_size, setBatch] = useState(1);
  const [concurrent_tenants, setTenants] = useState(2);
  const [num_iterations, setIters] = useState(40);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<AssessPayload | null>(null);

  const runBody = () => ({
    modelId,
    profile,
    runParams: {
      max_tokens,
      batch_size,
      concurrent_tenants,
      num_iterations,
      warmup_iterations: 5,
      prompt_len_tokens: 64,
    },
  });

  async function executeRun() {
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runBody()),
      });
      const j = (await res.json()) as { data?: { id: string }; error?: string };
      if (!res.ok) {
        setErr(j.error || "Run failed. Is WORKER_BASE_URL set and the Python worker running?");
        return;
      }
      setOk("Run completed: " + (j.data?.id ?? ""));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const aRes = await fetch("/api/runs/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runBody()),
      });
      const aj = (await aRes.json()) as { data?: AssessPayload; error?: string };
      if (!aRes.ok) {
        setErr(aj.error || "Assessment failed. Is the worker up?");
        return;
      }
      const a = aj.data;
      if (!a) {
        setErr("No assessment data");
        return;
      }
      if (a.level === "ok") {
        await executeRun();
        return;
      }
      setPending(a);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setPending(null);
  }

  async function confirmAfterAssess() {
    setPending(null);
    setLoading(true);
    try {
      await executeRun();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="assess-title">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 shadow-lg">
            <h2
              id="assess-title"
              className={pending.level === "critical" ? "text-lg font-bold text-destructive" : "text-lg font-semibold"}
            >
              {pending.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{pending.message}</p>
            {pending.level === "critical" && (
              <p className="mt-2 text-sm font-medium text-amber-200/90">
                You should not proceed unless you accept the risk of system instability, long runtimes, or OOM. This tool provides no warranty.
              </p>
            )}
            <pre className="mt-3 max-h-32 overflow-auto rounded border border-border/50 bg-background/50 p-2 text-xs text-muted-foreground">
              {JSON.stringify(pending.details, null, 2)}
            </pre>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="rounded-full border border-border px-4 py-2 text-sm" onClick={closeModal} disabled={loading}>
                Cancel
              </button>
              {pending.level === "critical" ? (
                <button
                  type="button"
                  className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
                  onClick={confirmAfterAssess}
                  disabled={loading}
                >
                  {loading ? "Starting…" : "I understand — run anyway"}
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  onClick={confirmAfterAssess}
                  disabled={loading}
                >
                  {loading ? "Starting…" : "Confirm and run"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card/30 p-4">
        <p className="text-xs text-muted-foreground">
          Before a run, the worker checks whether the model and settings look unusually heavy for this machine. You can always dismiss warnings, but
          you are responsible for your hardware and time.
        </p>
        <div>
          <label className="text-xs text-muted-foreground">Profile</label>
          <select
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
          >
            {PROFILES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">max_tokens</label>
            <input type="number" className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm" value={max_tokens} onChange={(e) => setMaxTokens(+e.target.value)} min={1} max={8192} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">batch_size</label>
            <input type="number" className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm" value={batch_size} onChange={(e) => setBatch(+e.target.value)} min={1} max={64} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">concurrent_tenants</label>
            <input type="number" className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm" value={concurrent_tenants} onChange={(e) => setTenants(+e.target.value)} min={1} max={32} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">num_iterations</label>
            <input type="number" className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm" value={num_iterations} onChange={(e) => setIters(+e.target.value)} min={1} max={500} />
          </div>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        {ok && <p className="text-sm text-success">{ok}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {loading ? "Checking / running…" : "Run benchmark (assess, then worker + DB)"}
        </button>
      </form>
    </>
  );
}
