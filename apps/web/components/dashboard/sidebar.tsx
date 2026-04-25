"use client";

import { BarChart3, Box, FileText, LayoutDashboard, SlidersHorizontal, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, desc: "KPIs" },
  { href: "/dashboard/models", label: "Models", icon: Box, desc: "Register" },
  { href: "/dashboard/parameters", label: "Parameters", icon: SlidersHorizontal, desc: "Criteria" },
  { href: "/dashboard/analysis", label: "Analysis", icon: BarChart3, desc: "Charts" },
  { href: "/dashboard/logs", label: "Logs", icon: FileText, desc: "Run output" },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy, desc: "Ranks" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-full md:w-56 md:shrink-0">
      <div className="rounded-2xl border border-border/60 bg-card/40 p-2 shadow-card backdrop-blur-sm md:sticky md:top-20">
        <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Console</p>
        <Link
          href="/docs/methodology"
          className="mb-1 block rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition hover:bg-background/50 hover:text-foreground"
        >
          Methodology (math){" "}
          <span className="text-crimson/70" aria-hidden>
            &rarr;
          </span>
        </Link>
        <nav className="flex flex-col gap-0.5">
          {tabs.map(({ href, label, icon: Icon, desc }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm transition",
                  active
                    ? "bg-crimson/10 text-foreground ring-1 ring-crimson/20"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    active ? "bg-crimson/15 text-crimson" : "bg-muted/50 text-muted-foreground group-hover:text-silver/80",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{label}</span>
                  <span className="truncate text-[10px] text-muted-foreground/80">{desc}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
