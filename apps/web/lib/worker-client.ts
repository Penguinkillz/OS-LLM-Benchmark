export type WorkerRunRequest = {
  model_id: string;
  model_display_name?: string;
  hf_model_id?: string | null;
  local_model_path?: string | null;
  profile: string;
  max_tokens: number;
  batch_size: number;
  concurrent_tenants: number;
  num_iterations: number;
  warmup_iterations: number;
  prompt_len_tokens: number;
  run_id?: string;
};

export type WorkerLogLine = { level: string; message: string; context: Record<string, unknown> };

export type WorkerRunResponse = {
  run_id: string;
  model_id: string;
  profile: string;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  ttft_p95_ms: number;
  tok_per_s: number;
  approx_peak_mb: number;
  jain_fairness: number | null;
  started_at: string;
  finished_at: string;
  message: string;
  parameters_effective: Record<string, unknown>;
  log: WorkerLogLine[];
};

export type RiskLevel = "ok" | "caution" | "critical";

export type WorkerAssessResponse = {
  level: RiskLevel;
  title: string;
  message: string;
  details: Record<string, unknown>;
};

function baseUrl() {
  const b = process.env.WORKER_BASE_URL;
  if (!b) throw new Error("WORKER_BASE_URL is not set. Start the Python worker (uvicorn) or set the env var.");
  return b.replace(/\/$/, "");
}

function authHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.WORKER_API_KEY) headers["X-API-Key"] = process.env.WORKER_API_KEY;
  return headers;
}

export async function invokeWorkerAssess(body: WorkerRunRequest): Promise<WorkerAssessResponse> {
  const res = await fetch(`${baseUrl()}/assess`, { method: "POST", body: JSON.stringify(body), headers: authHeaders(), cache: "no-store" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return (await res.json()) as WorkerAssessResponse;
}

export async function invokeWorkerRun(body: WorkerRunRequest): Promise<WorkerRunResponse> {
  const res = await fetch(`${baseUrl()}/runs`, { method: "POST", body: JSON.stringify(body), headers: authHeaders(), cache: "no-store" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return (await res.json()) as WorkerRunResponse;
}
