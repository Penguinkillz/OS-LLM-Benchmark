"use client";

import { BarChart3, BookOpen, Box, Cpu, FileText, LayoutDashboard, SlidersHorizontal, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/models", label: "Models", icon: Box },
  { href: "/dashboard/parameters", label: "Params", icon: SlidersHorizontal },
  { href: "/dashboard/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/dashboard/logs", label: "Logs", icon: FileText },
  { href: "/dashboard/leaderboard", label: "Board", icon: Trophy },
  { href: "/docs/methodology", label: "Math", icon: BookOpen },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="relative h-14 w-full sm:h-16">
        <Link
          href="/"
          aria-label="Home"
          className="group absolute left-3 top-1/2 z-30 flex -translate-y-1/2 items-center sm:left-5"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-crimson to-rose-700 shadow-md shadow-crimson/30 ring-2 ring-crimson/60 ring-offset-2 ring-offset-background transition group-hover:brightness-110">
            <Cpu className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
          </span>
        </Link>

        <nav
          className="absolute left-1/2 top-1/2 z-20 flex max-w-[min(calc(100vw-2rem),44rem)] -translate-x-1/2 -translate-y-1/2 flex-nowrap items-center justify-center gap-0.5 overflow-x-auto overflow-y-hidden rounded-lg border border-border/60 bg-card/90 p-1 shadow-lg backdrop-blur-sm sm:max-w-[min(100%,52rem)] sm:gap-0.5"
          aria-label="Main"
        >
          {nav.map((n) => {
            const Icon = n.icon;
            const active =
              n.href === "/dashboard"
                ? pathname === "/dashboard"
                : n.href === "/docs/methodology"
                  ? pathname === "/docs/methodology"
                  : pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 lg:text-xs",
                  active
                    ? "bg-crimson/20 text-foreground ring-1 ring-crimson/40 shadow-[0_0_0_1px_hsl(0_45%_45%/0.25)]"
                    : "text-muted-foreground hover:bg-crimson/10 hover:text-foreground hover:ring-1 hover:ring-crimson/30 hover:shadow-[0_0_20px_-4px_hsl(0_50%_40%/0.35)]"
                )}
              >
                <Icon className="h-3.5 w-3.5 opacity-80" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
