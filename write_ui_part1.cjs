const fs = require("fs");
const path = require("path");
const base = path.join(__dirname, "apps", "web");
function w(rel, c) {
  const p = path.join(base, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, c, "utf8");
}

w("app/docs/methodology/page.tsx", `import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  BENCHMARK_INPUT_PARAMETERS,
  LEADERBOARD_COMPOSITE,
  MEASUREMENT_CRITERIA,
  WORKLOAD_PROFILES,
} from "@/lib/benchmark-criteria";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology | OS-LLM-Benchmark",
  description: "Math, criteria, and comparison logic for OS-style LLM evaluation",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="font-display text-3xl font-bold text-foreground">Methodology and criteria</h1>
      <p className="mt-2 text-muted-foreground">
        Definitions for workload profiles, tunable run parameters, and reported metrics. The worker uses a stub harness until you connect a real inference runtime.
      </p>
      <h2 className="mt-10 font-display text-xl font-semibold">Workload profiles</h2>
      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
        {WORKLOAD_PROFILES.map((p) => (
          <li key={p.id}>
            <code className="text-accent">{p.id}</code> — {p.name}: {p.desc}
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-display text-xl font-semibold">Input parameters</h2>
      <ul className="mt-3 space-y-3 text-sm">
        {BENCHMARK_INPUT_PARAMETERS.map((p) => (
          <li key={p.key} className="rounded-lg border border-border/60 bg-card/30 p-3">
            <span className="font-mono text-accent">{p.key}</span> — {p.label} ({p.unit})
            <br />
            <span className="text-muted-foreground">{p.description}</span>{" "}
            <span className="text-xs text-border">({p.usedIn})</span>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 font-display text-xl font-semibold">Measurement criteria</h2>
      {MEASUREMENT_CRITERIA.map((c) => (
        <section key={c.id} className="mt-6 rounded-xl border border-border/50 bg-card/20 p-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {c.name} ({c.short})
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{c.howMeasured}</p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{c.math}</p>
          <p className="mt-2 text-sm"><span className="text-muted-foreground">Why: </span>{c.whyItMatters}</p>
          <p className="mt-1 text-sm"><span className="text-muted-foreground">Comparing: </span>{c.comparisonNote}</p>
        </section>
      ))}
      <h2 className="mt-10 font-display text-xl font-semibold">{LEADERBOARD_COMPOSITE.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{LEADERBOARD_COMPOSITE.description}</p>
      <p className="mt-2 font-mono text-xs text-muted-foreground whitespace-pre-wrap">{LEADERBOARD_COMPOSITE.formula}</p>
    </div>
  );
}
`);

console.log("1");
