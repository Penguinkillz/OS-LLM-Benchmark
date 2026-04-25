import {
  BENCHMARK_INPUT_PARAMETERS,
  LEADERBOARD_COMPOSITE,
  MEASUREMENT_CRITERIA,
  WORKLOAD_PROFILES,
} from "@/lib/benchmark-criteria";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ParametersPage() {
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">Parameters and evaluation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What you tune, what we measure, how we compare. Open methodology for full math.
          </p>
        </div>
        <Link
          href="/docs/methodology"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 text-sm hover:border-primary/30"
        >
          <BookOpen className="h-4 w-4" /> Full methodology
        </Link>
      </div>
      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-primary">Profiles</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {WORKLOAD_PROFILES.map((p) => (
          <div key={p.id} className="rounded-lg border border-border/50 p-3 text-sm">
            <code className="text-accent">{p.id}</code> {p.desc}
          </div>
        ))}
      </div>
      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-primary">Tunable parameters</h3>
      <div className="mt-2 space-y-2">
        {BENCHMARK_INPUT_PARAMETERS.map((p) => (
          <div key={p.key} className="rounded-lg border border-border/40 p-3 text-sm">
            <span className="font-mono text-accent">{p.key}</span> {p.label} <span className="text-xs">({p.unit})</span>
            <p className="text-muted-foreground mt-1">{p.description}</p>
          </div>
        ))}
      </div>
      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-primary">Metrics we report</h3>
      <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
        {MEASUREMENT_CRITERIA.map((c) => (
          <li key={c.id}>
            <span className="text-foreground">{c.name}</span> {c.short}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">{LEADERBOARD_COMPOSITE.description}</p>
    </div>
  );
}
