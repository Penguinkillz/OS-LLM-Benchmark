import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { models, runLogLines, runs } from "@/db/schema";
import { resolveModelLoadTarget } from "./model-target";
import { invokeWorkerRun } from "./worker-client";
import { createRunSchema } from "./validation";
import type { z } from "zod";

type CreateRun = z.infer<typeof createRunSchema>;

export async function executeRun(input: CreateRun) {
  const db = getDb();
  const [m] = await db.select().from(models).where(eq(models.id, input.modelId));
  if (!m) throw new Error("Model not found");
  const load = resolveModelLoadTarget(m);
  if (!load.hf_model_id && !load.local_model_path) {
    throw new Error(
      "This model has no load target. Set a Hugging Face id or local model folder (model params: hf_model_id, local_model_path, or source as org/model).",
    );
  }
  const started = new Date();
  const [row] = await db
    .insert(runs)
    .values({
      modelId: m.id,
      profile: input.profile,
      status: "running",
      runParams: input.runParams as Record<string, unknown>,
      rawMetrics: { phase: "starting" } as Record<string, unknown>,
      startedAt: started,
    })
    .returning();

  const addLog = async (level: string, message: string, context: Record<string, unknown> = {}) => {
    await db.insert(runLogLines).values({ runId: row.id, level, message, context });
  };

  try {
    await addLog("info", `model slug=${m.slug} profile=${input.profile}`);
    const out = await invokeWorkerRun({
      model_id: m.slug,
      model_display_name: m.displayName,
      hf_model_id: load.hf_model_id,
      local_model_path: load.local_model_path,
      profile: input.profile,
      max_tokens: input.runParams.max_tokens,
      batch_size: input.runParams.batch_size,
      concurrent_tenants: input.runParams.concurrent_tenants,
      num_iterations: input.runParams.num_iterations,
      warmup_iterations: input.runParams.warmup_iterations,
      prompt_len_tokens: input.runParams.prompt_len_tokens,
      run_id: row.id,
    });
    for (const line of out.log) {
      await addLog(line.level, line.message, line.context);
    }
    const raw = { ...out, parameters_effective: out.parameters_effective } as Record<string, unknown>;
    await db
      .update(runs)
      .set({
        status: "completed",
        p50Ms: out.p50_ms,
        p95Ms: out.p95_ms,
        p99Ms: out.p99_ms,
        ttftP95Ms: out.ttft_p95_ms,
        tokPerS: out.tok_per_s,
        approxPeakMb: out.approx_peak_mb,
        jainFairness: out.jain_fairness ?? null,
        rawMetrics: raw,
        finishedAt: new Date(),
      })
      .where(eq(runs.id, row.id));
    return { id: row.id, status: "completed" as const };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await addLog("error", err);
    await db
      .update(runs)
      .set({ status: "failed", errorMessage: err, finishedAt: new Date() })
      .where(eq(runs.id, row.id));
    throw e;
  }
}
