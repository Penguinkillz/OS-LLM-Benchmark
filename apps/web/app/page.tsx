import { Hero } from "@/components/sections/hero";
import { FeatureStackedCarousel } from "@/components/sections/feature-stacked-carousel";
import { MotionSection } from "@/components/motion-section";
import { LandingCinematicIntro } from "@/components/landing-cinematic-intro";
import { ArrowRight, Check, Code2, Database, Server } from "lucide-react";
import Link from "next/link";

const stack = [
  { Icon: Code2, label: "Next.js 15", detail: "App Router, RSC" },
  { Icon: Server, label: "Python worker", detail: "FastAPI, real runs" },
  { Icon: Database, label: "Postgres", detail: "Runs and logs" },
];

export default function HomePage() {
  return (
    <div>
      <LandingCinematicIntro />
      <Hero />
      <FeatureStackedCarousel />
      <MotionSection className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-8 rounded-3xl border border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-background p-8 shadow-card md:grid-cols-2 md:p-10 lg:gap-12">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">See runs in one place</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              The dashboard brings overview stats, per-run analysis, log drill-down, and a leaderboard. Connect PostgreSQL
              and the Python worker; layouts stay stable.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              {["Tail latency and throughput in one run record", "Fairness index for multi-tenant style workloads", "Structured logs for reproducibility"].map(
                (t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2.5} />
                    {t}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-glow/30 transition hover:opacity-90"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/analysis"
                className="inline-flex items-center rounded-full border border-border bg-background/50 px-5 py-2.5 text-sm font-medium text-foreground/90 hover:border-crimson/30"
              >
                Analysis preview
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stack</p>
            <div className="space-y-3">
              {stack.map(({ Icon, label, detail }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background/30 px-4 py-3"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                    <Icon className="h-5 w-5 text-silver" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/90">Redis in Docker is optional for future job queues. See the repo README.</p>
          </div>
        </div>
      </MotionSection>
    </div>
  );
}
