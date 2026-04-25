"""Lightweight API smoke tests; imports main so CI validates deps + import graph."""
from __future__ import annotations

import os

os.environ.pop("WORKER_API_KEY", None)

from fastapi.testclient import TestClient
from main import app


def test_health() -> None:
    c = TestClient(app)
    r = c.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_assess_rejects_empty_model_id() -> None:
    c = TestClient(app)
    body = {
        "model_id": "   ",
        "profile": "balanced",
        "max_tokens": 32,
        "batch_size": 1,
        "concurrent_tenants": 1,
        "num_iterations": 1,
        "warmup_iterations": 0,
        "prompt_len_tokens": 32,
    }
    r = c.post("/assess", json=body)
    assert r.status_code == 400


def test_runs_rejects_empty_model_id() -> None:
    c = TestClient(app)
    body = {
        "model_id": "  ",
        "profile": "balanced",
        "max_tokens": 32,
        "batch_size": 1,
        "concurrent_tenants": 1,
        "num_iterations": 1,
        "warmup_iterations": 0,
        "prompt_len_tokens": 32,
    }
    r = c.post("/runs", json=body)
    assert r.status_code == 400
