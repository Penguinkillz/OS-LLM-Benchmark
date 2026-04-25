"""OS-LLM-Benchmark worker - real Hugging Face Transformers engine."""
from __future__ import annotations

import os
import re
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Literal

import psutil
import structlog
import torch
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM, AutoTokenizer

structlog.configure(
    processors=[structlog.stdlib.ProcessorFormatter.wrap_for_formatter],
    logger_factory=structlog.stdlib.LoggerFactory(),
)
log = structlog.get_logger("worker")

def _hf_hub_token() -> str | None:
    for key in ("HF_TOKEN", "HUGGING_FACE_HUB_TOKEN", "HUGGINGFACEHUB_API_TOKEN"):
        v = os.environ.get(key, "").strip()
        if v:
            return v
    return None


def _max_context_tokens(model: Any) -> int:
    c = getattr(model, "config", None)
    if c is None:
        return 8192
    for name in ("max_position_embeddings", "n_ctx", "seq_length", "max_sequence_length", "sliding_window"):
        v = getattr(c, name, None)
        if isinstance(v, int) and v > 8:
            return v
    return 8192


_cached_key: str | None = None
_cached: tuple[AutoModelForCausalLM, Any] | None = None


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "benchmark-worker"


class RunRequest(BaseModel):
    model_id: str
    model_display_name: str | None = None
    hf_model_id: str | None = None
    local_model_path: str | None = None
    profile: str = "balanced"
    max_tokens: int = Field(128, ge=1, le=8192)
    batch_size: int = Field(1, ge=1, le=64)
    concurrent_tenants: int = Field(2, ge=1, le=32)
    num_iterations: int = Field(40, ge=1, le=500)
    warmup_iterations: int = Field(5, ge=0, le=100)
    prompt_len_tokens: int = Field(64, ge=8, le=4096)
    run_id: str | None = None


RiskLevel = Literal["ok", "caution", "critical"]


class AssessResponse(BaseModel):
    level: RiskLevel
    title: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class LogLine(BaseModel):
    level: str = "info"
    message: str
    context: dict[str, Any] = Field(default_factory=dict)


class RunResponse(BaseModel):
    run_id: str
    model_id: str
    profile: str
    p50_ms: float
    p95_ms: float
    p99_ms: float
    ttft_p95_ms: float
    tok_per_s: float
    approx_peak_mb: float
    jain_fairness: float | None
    started_at: datetime
    finished_at: datetime
    message: str
    parameters_effective: dict[str, Any]
    log: list[LogLine]


def _resolve_model_ref(req: RunRequest) -> str:
    if req.local_model_path and req.local_model_path.strip():
        p = req.local_model_path.strip()
        if not os.path.isdir(p):
            raise HTTPException(
                status_code=400, detail="local_model_path is not a directory: " + p
            )
        return "local:" + p
    if req.hf_model_id and req.hf_model_id.strip():
        return "hf:" + req.hf_model_id.strip()
    raise HTTPException(
        status_code=400,
        detail="Provide hf_model_id or local_model_path (Hugging Face id or on-disk folder).",
    )

def require_worker_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
    expected = (os.environ.get("WORKER_API_KEY") or "").strip()
    if not expected:
        return
    if (x_api_key or "").strip() != expected:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or missing X-API-Key. Set WORKER_API_KEY in the environment for both "
                "the Next.js server and this worker, or remove it for local dev only."
            ),
        )


def _estimate_params_billions_from_name(*names: str) -> float | None:
    for raw in names:
        if not raw:
            continue
        t = raw.lower()
        m = re.search(r"(\d+)x(\d+\.?\d*)\s*b\b", t)
        if m:
            return float(m.group(1)) * float(m.group(2))
        m = re.search(r"(\d+\.?\d*)\s*b\b", t)
        if m:
            v = float(m.group(1))
            if 0.1 < v < 500:
                return v
    return None


def _local_weight_files_gib(path: str) -> float | None:
    if not path or not os.path.isdir(path):
        return None
    total = 0.0
    for root, _, files in os.walk(path):
        for name in files:
            if not name.endswith((".safetensors", ".bin", ".pt", ".pth", ".ckpt", ".gguf")):
                continue
            try:
                total += os.path.getsize(os.path.join(root, name))
            except OSError:
                pass
    if total <= 0:
        return None
    return total / (1024**3)


def _params_billions_from_weights_gib(gib: float) -> float:
    return (gib * (1024**3) / 2) / 1e9


def _model_ram_need_gib(params_b: float, device: str) -> float:
    if device == "cpu":
        return params_b * 4.0
    return params_b * 2.0


def _bottleneck_capacity_gib(device: str) -> tuple[float, str, dict[str, Any]]:
    vm = psutil.virtual_memory()
    ram_gib = float(vm.available) / (1024**3)
    info: dict[str, Any] = {"ram_available_gib": round(ram_gib, 2)}
    if device == "cuda" and torch.cuda.is_available():
        p = torch.cuda.get_device_properties(0)
        v = float(p.total_memory) / (1024**3)
        info["vram_total_gib"] = round(v, 2)
        info["gpu_name"] = p.name
        return max(v * 0.85, 0.1), f"cuda ({p.name})", info
    if device == "mps":
        info["note"] = "Apple Silicon: using available RAM as proxy for unified memory."
        return max(ram_gib * 0.75, 0.1), "mps", info
    return max(ram_gib * 0.6, 0.1), "cpu", info


def _level_rank(level: str) -> int:
    return {"ok": 0, "caution": 1, "critical": 2}.get(level, 0)


def _max_risk(a: str, b: str) -> str:
    return a if _level_rank(a) >= _level_rank(b) else b


def assess_run_request(req: RunRequest) -> AssessResponse:
    device = _pick_device()
    err: str | None = None
    try:
        _ = _resolve_model_ref(req)
    except HTTPException as e:
        err = e.detail if isinstance(e.detail, str) else "Invalid model reference"

    parts: list[str] = [req.model_id, req.model_display_name or "", req.hf_model_id or ""]
    p_local = (req.local_model_path or "").strip()
    w_gib: float | None = None
    if p_local and os.path.isdir(p_local):
        parts.append(p_local)
        w_gib = _local_weight_files_gib(p_local)
    params_b: float | None = _estimate_params_billions_from_name(*parts)
    if params_b is None and w_gib is not None:
        params_b = _params_billions_from_weights_gib(w_gib)
    if params_b is None:
        for s in (req.hf_model_id, req.model_id, req.model_display_name or ""):
            params_b = _estimate_params_billions_from_name(s or "")
            if params_b is not None:
                break

    cap_gib, cap_label, mem_info = _bottleneck_capacity_gib(device)
    details: dict[str, Any] = {
        "device": device,
        "capacity_gib": round(cap_gib, 2),
        "capacity_source": cap_label,
        "mem": mem_info,
    }
    if w_gib is not None:
        details["local_weights_gib"] = round(w_gib, 2)
    if params_b is not None:
        details["params_billions_est"] = round(params_b, 2)

    if err:
        return AssessResponse(
            level="critical",
            title="Invalid load target",
            message=err,
            details=details,
        )

    need_gib: float | None = None
    if params_b is not None:
        need_gib = _model_ram_need_gib(params_b, device)
        details["model_ram_need_gib_est"] = round(need_gib, 2)

    load_level: str = "ok"
    if params_b is None:
        load_level = "caution"
        load_title = "Unknown model size"
        load_msg = (
            "Could not guess parameter count from the name or on-disk weight files. "
            "The run may still be very heavy. Confirm you have enough VRAM or RAM."
        )
    elif need_gib is not None and need_gib > cap_gib * 1.02:
        load_level = "critical"
        load_title = "Very likely to fail or cause severe thrashing"
        load_msg = (
            f"Estimated need ~{need_gib:.1f} GiB to load in {device} mode vs ~{cap_gib:.1f} GiB available ({cap_label}). "
            "Proceeding can freeze the machine, run for a very long time, or OOM. "
            "We strongly recommend stopping and using a smaller model, a GPU with headroom, or more free memory."
        )
    elif need_gib is not None and need_gib > cap_gib * 0.55:
        load_level = "caution"
        load_title = "Tight on memory for this model"
        load_msg = (
            f"Estimated ~{need_gib:.1f} GiB needed vs ~{cap_gib:.1f} GiB available. "
            "The run may work but could be slow or unstable."
        )
    else:
        load_level = "ok"
        load_title = "Heuristic load size OK"
        load_msg = "Estimated weights fit the available device memory (rough check only)."

    workload = (
        req.num_iterations
        * max(1, req.batch_size)
        * max(1, req.concurrent_tenants)
    )
    details["workload_score"] = int(workload)
    work_level: str = "ok"
    w_msg: str = ""
    if req.num_iterations > 200 or workload > 20000:
        work_level = "caution"
        w_msg = "This is a long or heavy configuration and may run for a while and heat up your CPU or GPU."
    if workload > 80000 or req.num_iterations > 400:
        work_level = _max_risk(work_level, "caution")

    final = _max_risk(load_level, work_level)
    if final == "ok":
        return AssessResponse(
            level="ok",
            title=load_title,
            message=load_msg,
            details=details,
        )
    if work_level == "caution" and load_level == "ok":
        return AssessResponse(
            level="caution",
            title="Heavier benchmark run",
            message=w_msg or "This configuration may run for a long time. Confirm to proceed.",
            details=details,
        )
    if final == "caution":
        return AssessResponse(
            level="caution",
            title=load_title,
            message=load_msg,
            details=details,
        )
    return AssessResponse(
        level="critical",
        title=load_title,
        message=load_msg,
        details=details,
    )



def _pick_device() -> str:
    o = (os.environ.get("OSLLM_DEVICE") or "").strip().lower()
    if o in ("cpu", "cuda", "mps"):
        if o == "cuda" and not torch.cuda.is_available():
            return "cpu"
        mps = getattr(torch.backends, "mps", None)
        if o == "mps" and (mps is None or not mps.is_available()):
            return "cpu"
        return o
    if torch.cuda.is_available():
        return "cuda"
    mps2 = getattr(torch.backends, "mps", None)
    if mps2 and mps2.is_available():
        return "mps"
    return "cpu"


def _load_model_and_tok(
    model_ref: str, device: str
) -> tuple[AutoModelForCausalLM, Any]:
    global _cached_key, _cached
    if _cached_key is not None and _cached_key != model_ref:
        _cached = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    if _cached_key == model_ref and _cached is not None:
        return _cached

    trust = os.environ.get("TRUST_REMOTE_CODE", "").lower() in ("1", "true", "yes")
    dtype = torch.float16 if device in ("cuda", "mps") else torch.float32
    is_local = model_ref.startswith("local:")
    path = model_ref[6:] if is_local else model_ref[3:]

    load_kw: dict[str, Any] = {
        "torch_dtype": dtype,
        "low_cpu_mem_usage": True,
        "trust_remote_code": trust,
    }
    if is_local:
        load_kw["local_files_only"] = True

    tok_kw: dict[str, Any] = dict(trust_remote_code=trust, local_files_only=is_local)
    ht = _hf_hub_token()
    if ht:
        tok_kw["token"] = ht
    tok = AutoTokenizer.from_pretrained(path, **tok_kw)
    if tok.pad_token_id is None and tok.eos_token_id is not None:
        tok.pad_token = tok.eos_token

    ht2 = _hf_hub_token()
    if ht2:
        load_kw["token"] = ht2
    model = AutoModelForCausalLM.from_pretrained(path, **load_kw)
    model = model.to(device)
    model.eval()
    for p in model.parameters():
        p.requires_grad_(False)

    _cached_key = model_ref
    _cached = (model, tok)
    return _cached


def _percentile_ms(sorted_values: list[float], q: float) -> float:
    n = len(sorted_values)
    if n == 0:
        return 0.0
    if n == 1:
        return sorted_values[0] * 1000.0
    idx = int(q * (n - 1))
    return sorted_values[idx] * 1000.0


def jain_fairness_index(throughputs: list[float]) -> float:
    if not throughputs:
        return 1.0
    t = [max(x, 1e-9) for x in throughputs]
    n = len(t)
    s = sum(t)
    return (s**2) / (n * sum(x**2 for x in t))


def _sync_device(device: str) -> None:
    if device == "cuda" and torch.cuda.is_available():
        torch.cuda.synchronize()
    if device == "mps" and hasattr(torch, "mps") and torch.backends.mps.is_available():
        torch.mps.synchronize()


def _build_inputs(
    tokenizer: Any,
    prompt_len: int,
    batch_size: int,
    device: str,
    tenant_drift: int,
) -> dict[str, torch.Tensor]:
    seed = "The quick brown fox jumps over the lazy dog. Tenant " + str(tenant_drift) + ".\n"
    ids: list[int] = []
    text = seed
    while len(ids) < prompt_len + 2:
        enc = tokenizer.encode(text, add_special_tokens=False)
        ids.extend(enc)
        text = text + " " + seed
    if tokenizer.bos_token_id is not None:
        seq = [tokenizer.bos_token_id] + ids[: max(0, prompt_len - 1)]
    else:
        seq = ids[:prompt_len]
    if len(seq) < prompt_len:
        pad = tokenizer.pad_token_id or tokenizer.eos_token_id or 0
        seq = seq + [pad] * (prompt_len - len(seq))
    else:
        seq = seq[:prompt_len]
    input_ids = torch.tensor([seq], dtype=torch.long, device=device)
    if batch_size > 1:
        input_ids = input_ids.expand(batch_size, -1).contiguous()
    attn = torch.ones_like(input_ids, dtype=torch.long, device=device)
    return {"input_ids": input_ids, "attention_mask": attn}


def _peak_mem_mb(device: str) -> float:
    cpu_mb = psutil.Process(os.getpid()).memory_info().rss / (1024**2)
    if device == "cuda" and torch.cuda.is_available():
        return max(cpu_mb, torch.cuda.max_memory_allocated() / (1024**2))
    return cpu_mb


def _run_real_benchmark(req: RunRequest) -> dict[str, Any]:
    model_ref = _resolve_model_ref(req)
    device = _pick_device()
    log.info("benchmark_start", model_ref=model_ref, device=device, run_id=req.run_id)
    if device == "cuda" and torch.cuda.is_available():
        torch.cuda.reset_peak_memory_stats()

    tenants = max(1, req.concurrent_tenants)
    e2e_latencies: list[float] = []
    ttft_list: list[float] = []
    per_tenant_tokens: list[float] = [0.0] * tenants
    per_tenant_time: list[float] = [1e-9] * tenants
    total_new_tokens = 0
    total_steady_time = 0.0
    bsz = min(req.batch_size, 64)
    p_len = min(req.prompt_len_tokens, 4096)
    _model, tokenizer = _load_model_and_tok(model_ref, device)
    max_ctx = _max_context_tokens(_model)
    safety = 8
    budget = max(32, max_ctx - safety)
    p_len = min(p_len, budget)
    eff_max_new = min(req.max_tokens, max(1, budget - p_len))

    for w in range(req.warmup_iterations):
        t_idx = w % tenants
        inputs = _build_inputs(
            tokenizer, p_len, bsz, device, t_idx + w
        )
        with torch.inference_mode():
            _ = _model.generate(
                **inputs,
                max_new_tokens=min(eff_max_new, 32),
                do_sample=False,
                pad_token_id=tokenizer.pad_token_id,
            )
        _sync_device(device)

    for it in range(req.num_iterations):
        t_idx = it % tenants
        inputs = _build_inputs(
            tokenizer, p_len, bsz, device, t_idx * 1000 + it
        )
        with torch.inference_mode():
            tpf0 = time.perf_counter()
            _ = _model(**inputs, use_cache=True)
            _sync_device(device)
            t_pref = time.perf_counter() - tpf0
            ttft_list.append(t_pref)
            tg0 = time.perf_counter()
            out_ids = _model.generate(
                **inputs,
                max_new_tokens=eff_max_new,
                do_sample=False,
                pad_token_id=tokenizer.pad_token_id,
            )
            _sync_device(device)
        t_gen = time.perf_counter() - tg0
        e2e_latencies.append(t_gen)
        in_len = inputs["input_ids"].shape[1]
        if out_ids is not None and out_ids.shape[1] > in_len:
            new_tok = (out_ids.shape[1] - in_len) * bsz
        else:
            new_tok = max(0, eff_max_new * bsz)
        total_new_tokens += new_tok
        total_steady_time += t_gen
        per_tenant_tokens[t_idx] = per_tenant_tokens[t_idx] + float(new_tok)
        per_tenant_time[t_idx] = per_tenant_time[t_idx] + t_gen

    e2e_latencies.sort()
    ttft_list.sort()
    p50 = _percentile_ms(e2e_latencies, 0.50)
    p95 = _percentile_ms(e2e_latencies, 0.95)
    p99 = _percentile_ms(e2e_latencies, 0.99)
    ttft_p95 = _percentile_ms(ttft_list, 0.95) if ttft_list else 0.0
    tok_per_s = (total_new_tokens / total_steady_time) if total_steady_time > 0 else 0.0
    thr = [per_tenant_tokens[i] / per_tenant_time[i] for i in range(tenants)]
    jain = jain_fairness_index(thr)
    peak = _peak_mem_mb(device)
    return {
        "max_ctx": max_ctx,
        "prompt_len_effective": p_len,
        "max_new_tokens_effective": eff_max_new,
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "ttft_p95_ms": round(ttft_p95, 2),
        "tok_per_s": round(tok_per_s, 2),
        "approx_peak_mb": round(peak, 1),
        "jain_fairness": round(jain, 4) if jain is not None else None,
        "device": device,
        "model_ref": model_ref,
    }


@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("worker_starting", version=os.getenv("APP_VERSION", "0.1.0"))
    yield
    log.info("worker_stopping")


app = FastAPI(title="OS-LLM-Benchmark Worker", version="0.1.0", lifespan=lifespan)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@app.post("/assess", response_model=AssessResponse, dependencies=[Depends(require_worker_key)])
async def assess(req: RunRequest) -> AssessResponse:
    if not req.model_id.strip():
        raise HTTPException(status_code=400, detail="model_id is required")
    return assess_run_request(req)


@app.post("/runs", response_model=RunResponse, dependencies=[Depends(require_worker_key)])
async def start_run(req: RunRequest) -> RunResponse:
    if not req.model_id.strip():
        raise HTTPException(status_code=400, detail="model_id is required")
    start = datetime.now(timezone.utc)
    try:
        m = _run_real_benchmark(req)
    except HTTPException:
        raise
    except Exception as e:
        log.exception("benchmark_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e
    end = datetime.now(timezone.utc)
    eff: dict[str, Any] = {
        "max_tokens": req.max_tokens,
        "batch_size": req.batch_size,
        "concurrent_tenants": req.concurrent_tenants,
        "num_iterations": req.num_iterations,
        "warmup_iterations": req.warmup_iterations,
        "prompt_len_tokens": req.prompt_len_tokens,
        "prompt_len_tokens_effective": m.get("prompt_len_effective", req.prompt_len_tokens),
        "max_new_tokens_effective": m.get("max_new_tokens_effective", req.max_tokens),
        "max_context_tokens": m.get("max_ctx"),
        "device": m.get("device"),
        "model_ref": m.get("model_ref"),
    }
    rid = str(req.run_id) if req.run_id else str(uuid.uuid4())
    logs = [
        LogLine(
            message="transformers benchmark complete",
            context={
                "p95_ms": m["p95_ms"],
                "tok_per_s": m["tok_per_s"],
                "device": m.get("device"),
            },
        ),
    ]
    return RunResponse(
        run_id=rid,
        model_id=req.model_id,
        profile=req.profile,
        p50_ms=float(m["p50_ms"]),
        p95_ms=float(m["p95_ms"]),
        p99_ms=float(m["p99_ms"]),
        ttft_p95_ms=float(m["ttft_p95_ms"]),
        tok_per_s=float(m["tok_per_s"]),
        approx_peak_mb=float(m["approx_peak_mb"]),
        jain_fairness=float(m["jain_fairness"]) if m.get("jain_fairness") is not None else None,
        started_at=start,
        finished_at=end,
        message="Transformers engine (Hugging Face from_pretrained or local directory).",
        parameters_effective=eff,
        log=logs,
    )

