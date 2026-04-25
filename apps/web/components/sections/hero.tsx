import type { ElementType } from "react";
import { ArrowRight, Cpu, Gauge, Layers, Shield, Activity } from "lucide-react";
import { MotionSection } from "@/components/motion-section";
import Link from "next/link";

export function Hero() {
  return (
    <MotionSection className="relative mx-auto max-w-6xl px-4 pt-6 pb-8 md:pt-10 md:pb-16">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/50 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card backdrop-blur">
            <Activity className="h-3.5 w-3.5 text-crimson/80" />
            <span className="text-foreground/90">LLM inference</span>
            <span className="text-border">-</span>
            <span>OS-style metrics</span>
          </div>
          <h1 className="font-display text-balance text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-[3.25rem]">
            Benchmark small models with{" "}
            <span className="text-silver/95 underline decoration-crimson/30 decoration-2 underline-offset-4">
              systems rigor
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Tail latency, memory pressure, fairness under contention — the same questions operating systems care about,
            applied to transformer serving.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
            >
              Launch dashboard
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center rounded-full border border-border bg-card/40 px-6 py-3 text-sm font-medium text-foreground/90 shadow-card transition hover:border-crimson/25 hover:bg-card/60"
            >
              What we measure
            </a>
          </div>
          <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-border/50 pt-8 sm:max-w-md">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tail focus</dt>
              <dd className="mt-1 font-display text-lg font-bold text-silver/90">p95 / p99</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fairness</dt>
              <dd className="mt-1 font-display text-lg font-bold text-silver/90">Jain index</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Memory</dt>
              <dd className="mt-1 font-display text-lg font-bold text-silver/90">Peak VRAM</dd>
            </div>
          </dl>
        </div>
        <div className="relative">
          <div className="absolute -inset-3 rounded-3xl bg-crimson/10 via-transparent to-silver/5 opacity-80 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-card backdrop-blur-md">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-crimson/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sample</p>
                  <p className="mt-0.5 font-mono text-sm font-medium text-foreground">workload - mixed_tenant</p>
                </div>
                <span className="rounded-md bg-success/15 px-2 py-1 font-mono text-[10px] font-semibold text-success">stable</span>
              </div>
              <div className="mt-5 space-y-2.5 font-mono text-xs">
                <MetricRow icon={Gauge} label="p95 latency" value="182 ms" trend="good" />
                <MetricRow icon={Layers} label="peak VRAM" value="6.2 GB" trend="neutral" />
                <MetricRow icon={Shield} label="fairness (Jain)" value="0.91" trend="good" />
                <MetricRow icon={Cpu} label="tokens/s" value="112" trend="good" />
              </div>
              <div className="mt-6 flex h-16 gap-1 rounded-lg bg-muted/30 p-2">
                {[35, 52, 48, 61, 44, 58, 49, 66, 55].map((h, i) => (
                  <div key={i} className="flex h-full min-w-0 flex-1 items-end">
                    <div
                      className="w-full rounded-sm bg-gradient-to-t from-crimson/30 to-crimson/60"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground">p95 ms / time bucket (illustrative)</p>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: ElementType;
  label: string;
  value: string;
  trend: "good" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/30 px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-crimson/70" />
        {label}
      </span>
      <span className="flex items-center gap-2">
        <span className="text-foreground">{value}</span>
        <span
          className={
            trend === "good" ? "text-[10px] font-medium text-success" : "text-[10px] font-medium text-muted-foreground"
          }
        >
          {trend === "good" ? "\u2022" : "\u2014"}
        </span>
      </span>
    </div>
  );
}
