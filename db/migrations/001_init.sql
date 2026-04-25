-- OS-LLM-Benchmark initial schema (PostgreSQL 16+)
-- UUID and timestamps in UTC

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  source TEXT,
  params_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  profile TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  p95_ms DOUBLE PRECISION,
  tok_per_s DOUBLE PRECISION,
  approx_peak_mb DOUBLE PRECISION,
  jain_fairness DOUBLE PRECISION,
  raw_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runs_model_started ON runs (model_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_profile ON runs (profile);

CREATE TABLE IF NOT EXISTS run_log_lines (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_run_log_lines_run ON run_log_lines (run_id, ts);
