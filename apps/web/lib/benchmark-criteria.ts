export type Criterion = {
  id: string;
  name: string;
  short: string;
  howMeasured: string;
  math: string;
  whyItMatters: string;
  comparisonNote: string;
};

export const WORKLOAD_PROFILES: { id: string; name: string; desc: string }[] = [
  { id: "latency", name: "Latency", desc: "Emphasize short batches, measure tail latency and TTFT." },
  { id: "memory", name: "Memory", desc: "Longer context / larger effective KV footprint." },
  { id: "fairness", name: "Fairness", desc: "Split capacity across virtual tenants, compute Jain index." },
  { id: "balanced", name: "Balanced", desc: "Default mix of goals." },
  { id: "mixed_tenant", name: "Mixed tenant", desc: "Contention: concurrent streams with different batch sizes." },
];

export const BENCHMARK_INPUT_PARAMETERS: {
  key: string;
  label: string;
  unit: string;
  description: string;
  usedIn: string;
}[] = [
  { key: "max_tokens", label: "Max new tokens", unit: "tokens", description: "How many output tokens the harness asks for per request (caps work per request).", usedIn: "All profiles" },
  { key: "batch_size", label: "Batch size", unit: "requests", description: "How many forward passes are scheduled together when the backend supports batching.", usedIn: "Serving throughput" },
  { key: "concurrent_tenants", label: "Concurrent tenants", unit: "streams", description: "Simulated independent request streams competing for the same model capacity.", usedIn: "Fairness, mixed_tenant" },
  { key: "num_iterations", label: "Measurement iterations", unit: "iters", description: "How many request cycles are used to form latency and throughput stats after warmup.", usedIn: "Stability" },
  { key: "warmup_iterations", label: "Warmup", unit: "iters", description: "Iterations discarded before recording (caches, kernels, autotune).", usedIn: "All" },
  { key: "prompt_len_tokens", label: "Prompt length", unit: "tokens (approx.)", description: "Approximate input size driving prefill and KV allocation.", usedIn: "Memory, long-context" },
];

export const MEASUREMENT_CRITERIA: Criterion[] = [
  {
    id: "p50_p95_p99",
    name: "Latency percentiles",
    short: "p50, p95, p99",
    howMeasured: "Request end-to-end latencies (or per-phase: TTFT, token inter-arrival) are collected; we report empirical quantiles of the sample.",
    math: "Sort latencies t_(1)\\le...\\le t_(n). p95 is t_(\\lceil 0.95n \\rceil). p50 and p99 use 0.50 and 0.99. With small n, we still define quantiles on the finite sample (not an extrapolated parametric model).",
    whyItMatters: "Averages hide tail risk; SLOs for interactive apps care about 95/99% users.",
    comparisonNote: "Lower is better. Compare on the same runParams and hardware.",
  },
  {
    id: "ttft",
    name: "Time to first token (TTFT)",
    short: "TTFT p95",
    howMeasured: "Time from request accepted to first output token. Worker reports ttft_p95_ms.",
    math: "Per request TTFT_i; take p95 of {TTFT_i} over the measured window (after warmup).",
    whyItMatters: "User-visible 'typing' delay; separate from per-token time once streaming starts.",
    comparisonNote: "Lower is better; sensitive to prefill, queueing, and batching policy.",
  },
  {
    id: "throughput",
    name: "Throughput",
    short: "tokens/s (aggregate)",
    howMeasured: "Total generated tokens / wall time over the window (or per-stream averages for fairness).",
    math: "tok/s = (\\sum generated tokens) / (t_end - t_start) over steady-state window, excluding warm-up if configured.",
    whyItMatters: "System capacity; compare against latency tailsâ€”often a tradeoff under batching.",
    comparisonNote: "Higher is better for capacity; compare with same SLO and batch settings.",
  },
  {
    id: "memory",
    name: "Memory pressure",
    short: "approx_peak_mb",
    howMeasured: "High-water mark of device memory (worker: device memory sample). Real runs should read NVML/ROCm and CPU RSS.",
    math: "Peak over time: max_t M(t). OOM = overflow event.",
    whyItMatters: "When KV cache grows with batch and context, memory becomes the gating resource like RAM in an OS.",
    comparisonNote: "Lower is better at equal quality/throughput, or same peak with higher tok/s is better.",
  },
  {
    id: "jain",
    name: "Jain's fairness index",
    short: "Jain 0-1",
    howMeasured: "Per-tenant throughput x_i (tokens/s allocated to each of n tenants).",
    math: "J = (\\sum x_i)Â² / (n \\sum x_iÂ²). If all equal, J=1; if one hogs, Jâ†’1/n.",
    whyItMatters: "Classic fairness metric; maps noisy-neighbor behavior to a single number.",
    comparisonNote: "Higher is more fair, all else equal; compare at same n and load.",
  },
];

export const LEADERBOARD_COMPOSITE = {
  name: "Default sort (illustrative)",
  description:
    "The UI ranks by a simple lexicographic preference: lower p95_ms, then higher tok/s, then higher Jain. Replace with a weighted score when you move in your deployment.",
  formula:
    "Planned: weighted score on normalized p95, tok/s, and Jain (per-cohort z-score or min-max). Current: sort by p95_ms asc, then tok/s, then Jain.",
};
