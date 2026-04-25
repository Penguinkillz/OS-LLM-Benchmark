import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { models } from "@/db/schema";
import { resolveModelLoadTarget } from "./model-target";
import { invokeWorkerAssess } from "./worker-client";
import type { z } from "zod";
import type { createRunSchema } from "./validation";

type CreateRun = z.infer<typeof createRunSchema>;

export async function assessRun(input: CreateRun) {
  const db = getDb();
  const [m] = await db.select().from(models).where(eq(models.id, input.modelId));
  if (!m) throw new Error("Model not found");
  const load = resolveModelLoadTarget(m);
  if (!load.hf_model_id && !load.local_model_path) {
    throw new Error(
      "This model has no load target. Set a Hugging Face id or local model folder (model params: hf_model_id, local_model_path, or source as org/model).",
    );
  }
  return invokeWorkerAssess({
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
  });
}
