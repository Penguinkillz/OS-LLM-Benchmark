import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 border-b border-border/40 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-crimson/80">Control plane</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">Benchmark console</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Live when <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs">DATABASE_URL</code> and the worker
          at <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs">WORKER_BASE_URL</code> are set.
        </p>
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <DashboardSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
