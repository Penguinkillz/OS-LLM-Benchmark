import { getDb } from "@/db";
import { models } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ModelsIndexPage() {
  let list: (typeof models.$inferSelect)[] = [];
  let err: string | null = null;
  try {
    const db = getDb();
    list = await db.select().from(models).orderBy(desc(models.createdAt));
  } catch (e) {
    err = e instanceof Error ? e.message : "Database unavailable";
  }
  if (err) {
    return (
      <div>
        <h2 className="font-display text-xl font-bold">Models</h2>
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{err}</p>
        <p className="mt-2 text-sm text-muted-foreground">Set DATABASE_URL and run db/migrations (001, 002) on PostgreSQL.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">Models</h2>
          <p className="mt-1 text-sm text-muted-foreground">Register a logical model, then open it to run a benchmark. Results are stored in Postgres when the API and worker run.</p>
        </div>
        <Link href="/dashboard/models/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Add model
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No models yet.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {list.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/30 px-4 py-3">
              <div>
                <Link href={"/dashboard/models/" + m.id} className="font-medium text-foreground hover:text-primary">
                  {m.displayName}
                </Link>
                <p className="font-mono text-xs text-muted-foreground">
                  {m.slug}
                  {m.source ? " · " + m.source : ""}
                </p>
              </div>
              <Link href={"/dashboard/models/" + m.id} className="text-sm text-accent">Open</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
