import { z } from "zod";

export const profileSchema = z.enum(["latency", "memory", "fairness", "balanced", "mixed_tenant"]);

export const runParamsSchema = z.object({
  max_tokens: z.coerce.number().int().min(1).max(8192).default(128),
  batch_size: z.coerce.number().int().min(1).max(64).default(1),
  concurrent_tenants: z.coerce.number().int().min(1).max(32).default(2),
  num_iterations: z.coerce.number().int().min(1).max(500).default(40),
  warmup_iterations: z.coerce.number().int().min(0).max(100).default(5),
  prompt_len_tokens: z.coerce.number().int().min(8).max(4096).default(64),
});

export const createModelSchema = z.object({
  displayName: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9][a-z0-9-]*$/).optional(),
  source: z.string().max(500).optional().nullable(),
  hfModelId: z.string().max(500).optional().nullable(),
  localModelPath: z.string().max(2000).optional().nullable(),
  paramsJson: z.record(z.string(), z.any()).optional(),
});

export const createRunSchema = z.object({
  modelId: z.string().uuid(),
  profile: profileSchema,
  runParams: z.preprocess((raw) => (raw && typeof raw === "object" ? raw : {}), runParamsSchema),
});