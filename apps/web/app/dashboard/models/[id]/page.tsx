import { getDb } from "@/db";
import { models } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { runs } from "@/db/schema";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RunBenchmarkForm } from "@/components/run-benchmark-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ModelDetailPage({ params }: Props) {
  const { id } = await params;
  let model: (typeof models.$inferSelect) | null = null;
  let recent: (typeof runs.$inferSelect)[] = [];
  let derr: string | null = null;
  try {
    const db = getDb();
    const [m] = await db.select().from(models).where(eq(models.id, id));
    if (!m) notFound();
    model = m;
    recent = await db.select().from(runs).where(eq(runs.modelId, id)).orderBy(desc(runs.startedAt)).limit(5);
  } catch (e) {
    derr = e instanceof Error ? e.message : "DB error";
  }
  if (derr) {
    return (
      <div>
        <h2 className="font-display text-xl font-bold">Model</h2>
        <p className="text-sm text-amber-200">{derr}</p>
      </div>
    );
  }
  if (!model) notFound();
  return (
    <div>
      <Link href="/dashboard/models" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> All models
      </Link>
      <h2 className="font-display text-xl font-bold text-foreground">{model.displayName}</h2>
      <p className="font-mono text-xs text-muted-foreground">slug: {model.slug}</p>
      {model.source && <p className="text-sm text-muted-foreground">source: {model.source}</p>}

      <h3 className="mt-8 font-display text-sm font-semibold text-primary">Run benchmark</h3>
      <p className="text-sm text-muted-foreground">POST /api/runs will call the Python worker at WORKER_BASE_URL, then store metrics in this database.</p>
      <RunBenchmarkForm modelId={model.id} />

      <h3 className="mt-8 font-display text-sm font-semibold">Recent runs</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No runs yet.</p>
      ) : (
        <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
          {recent.map((r) => (
            <li key={r.id}>
              {r.id.slice(0, 8)}  {r.status}  p95={r.p95Ms ?? "—"}  {r.startedAt?.toISOString?.() ?? ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
