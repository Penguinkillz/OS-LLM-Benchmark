import Link from "next/link";
import { Cpu, Github, Activity } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/docs/methodology", label: "Methodology" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-border/50 bg-card/15">
      <div className="mesh-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="relative mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-crimson/15">
                <Cpu className="h-4 w-4 text-crimson/90" />
              </span>
              <span className="font-display text-base font-bold text-foreground">OS-LLM-Benchmark</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Benchmarking harness for LLM inference: tail latency, memory pressure, fairness - not a single headline throughput number.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
              <Activity className="h-3.5 w-3.5 text-crimson/60" />
              Self-hosted research tool; not hardened for public production.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explore</p>
            <ul className="flex flex-col gap-2 sm:items-end">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-foreground/90 transition hover:text-crimson/90">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href="https://github.com"
              className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              Source
            </a>
          </div>
        </div>
        <div className="mt-12 border-t border-border/40 pt-8 text-center text-xs text-muted-foreground">
          {new Date().getFullYear()} OS-LLM-Benchmark
        </div>
      </div>
    </footer>
  );
}
