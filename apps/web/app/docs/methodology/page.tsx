import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BENCHMARK_INPUT_PARAMETERS, LEADERBOARD_COMPOSITE, MEASUREMENT_CRITERIA, WORKLOAD_PROFILES } from "@/lib/benchmark-criteria";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Methodology | OS-LLM-Benchmark", description: "Math and criteria for OS-style LLM evaluation" };
const SNIP = `def calculate_percentile(sorted_ms, q):
    n = len(sorted_ms)
    if n < 1: return 0.0
    idx = int(q * (n - 1))
    return sorted_ms[idx]`;
export default function MethodologyPage() {
  return (
    <div className="min-h-screen border-t border-border/30">
      <div className="border-b border-border/40 bg-card/20 py-3">
        <div className="mx-auto max-w-6xl px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Home</Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Foundational methodology: the control plane of LLMs</h1>
          <p className="mt-2 text-sm text-muted-foreground">Percentiles, fairness, and parameters for the Python worker (Hugging Face Transformers).</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">Statistical robustness: p95 and p99</h2>
            <p className="mt-2 text-sm text-muted-foreground">p95 approximates a heavy day; p99 captures tail risk (slowest 1%).</p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border/40 bg-background/50 p-4 font-mono text-[11px] text-silver/90"><code>{SNIP}</code></pre>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">Jain fairness index</h2>
            <p className="mt-1 text-sm text-muted-foreground">n tenants, x throughput shares. 1.0 is perfectly fair.</p>
            <div className="mt-4 rounded-xl border border-crimson/20 bg-background/50 px-4 py-6 text-center font-mono text-base text-crimson/90 md:text-lg">J(x) = (Σxᵢ)² / (n · Σxᵢ²)</div>
            <p className="mt-2 text-sm text-muted-foreground">Classical Jain: J = (sum x_i)^2 / (n sum x_i^2).</p>
          </div>
        </div>
        <h2 className="font-display text-xl font-semibold">Workload profiles</h2>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">{WORKLOAD_PROFILES.map(p => (
          <li key={p.id}><code className="text-crimson/90">{p.id}</code> {p.name}: {p.desc}</li>))}</ul>
        <h2 className="mt-2 font-display text-xl font-semibold">Input parameters</h2>
        <ul className="mt-2 space-y-2">{BENCHMARK_INPUT_PARAMETERS.map(p => (
          <li key={p.key} className="rounded-lg border border-border/40 p-3 text-sm">
            <code className="text-crimson/80">{p.key}</code> {p.label} ({p.unit}): {p.description}
          </li>))}</ul>
        <h2 className="mt-2 font-display text-xl font-semibold">Measurement criteria</h2>
        {MEASUREMENT_CRITERIA.map(c => (
          <section key={c.id} className="mt-4 rounded-xl border border-border/40 bg-card/15 p-4">
            <h3 className="font-display font-semibold">{c.name} ({c.short})</h3>
            <p className="text-sm text-muted-foreground">{c.howMeasured}</p>
            <p className="mt-2 font-mono text-xs whitespace-pre-wrap text-foreground/90">{c.math}</p>
            <p className="mt-2 text-sm text-muted-foreground">Why: {c.whyItMatters}</p>
            <p className="text-sm text-muted-foreground">Comparing: {c.comparisonNote}</p>
          </section>))}
        <h2 className="mt-6 font-display text-xl font-semibold">{LEADERBOARD_COMPOSITE.name}</h2>
        <p className="text-sm text-muted-foreground">{LEADERBOARD_COMPOSITE.description}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground whitespace-pre-wrap">{LEADERBOARD_COMPOSITE.formula}</p>
      </div>
    </div>
  );
}
