import { getDb } from "@/db";
import { models, runs } from "@/db/schema";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { Medal } from "lucide-react";

export const dynamic = "force-dynamic";

type Row = { run: typeof runs.$inferSelect; model: typeof models.$inferSelect | null };

export default async function LeaderboardPage() {
  let rows: Row[] = [];
  let derr: string | null = null;
  try {
    const db = getDb();
    rows = await db
      .select({ run: runs, model: models })
      .from(runs)
      .leftJoin(models, eq(runs.modelId, models.id))
      .where(and(eq(runs.status, "completed"), isNotNull(runs.p95Ms)))
      .orderBy(asc(runs.p95Ms), desc(runs.tokPerS), desc(runs.jainFairness))
      .limit(20);
  } catch (e) {
    derr = e instanceof Error ? e.message : "DB error";
  }
  if (derr) {
    return (
      <div>
        <h2 className="font-display text-xl font-bold">Leaderboard</h2>
        <p className="text-sm text-amber-200">{derr}</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">Leaderboard</h2>
      <p className="mt-1 text-sm text-muted-foreground">Completed runs, sorted by p95 latency (asc), then tok/s. Requires DATABASE_URL and completed runs.</p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No completed runs with p95 yet. Run a benchmark from a model page.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card/40">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="p-3 pl-4 font-medium text-muted-foreground">#</th>
                <th className="p-3 font-medium text-muted-foreground">Model</th>
                <th className="p-3 font-medium text-muted-foreground">p95 ms</th>
                <th className="p-3 font-medium text-muted-foreground">tok/s</th>
                <th className="p-3 pr-4 font-medium text-muted-foreground">Fairness</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const rank = i + 1;
                const name = r.model?.displayName ?? "—";
                return (
                  <tr key={r.run.id} className="border-b border-border/30">
                    <td className="p-3 pl-4">
                      {rank <= 3 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Medal className={rank === 1 ? "h-4 w-4 text-amber-400" : rank === 2 ? "h-4 w-4 text-slate-300" : "h-4 w-4 text-amber-700"} />
                          {rank}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">{rank}</span>
                      )}
                    </td>
                    <td className="p-3 font-medium">{name}</td>
                    <td className="p-3 font-mono tabular-nums text-muted-foreground">{r.run.p95Ms != null ? Math.round(r.run.p95Ms) : "—"}</td>
                    <td className="p-3 font-mono tabular-nums text-muted-foreground">{r.run.tokPerS != null ? r.run.tokPerS.toFixed(1) : "—"}</td>
                    <td className="p-3 pr-4 font-mono tabular-nums text-accent">{r.run.jainFairness != null ? r.run.jainFairness.toFixed(2) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
