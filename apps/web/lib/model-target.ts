import type { InferSelectModel } from "drizzle-orm";
import type { models } from "@/db/schema";

export function resolveModelLoadTarget(
  m: Pick<InferSelectModel<typeof models>, "source" | "paramsJson">,
): { hf_model_id: string | null; local_model_path: string | null } {
  const pj = (m.paramsJson ?? {}) as Record<string, unknown>;
  const hf = typeof pj.hf_model_id === "string" && pj.hf_model_id.trim() ? pj.hf_model_id.trim() : null;
  const local =
    typeof pj.local_model_path === "string" && pj.local_model_path.trim() ? pj.local_model_path.trim() : null;
  const src = m.source?.trim() ?? "";
  const sourceAsHf = src && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(src) ? src : null;
  return { hf_model_id: hf ?? sourceAsHf, local_model_path: local };
}
