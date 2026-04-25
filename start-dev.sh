#!/usr/bin/env bash
# Local dev: Postgres + Redis in Docker, worker + Next.js on the host.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
WDIR="${ROOT}/services/benchmark-worker"
UVICORN="${WDIR}/.venv/bin/uvicorn"

echo ""
echo "[OS-LLM-Benchmark] Starting local dev stack (Unix)"
echo "  - Docker: Postgres + Redis only (worker runs in your venv with --reload)"
echo "  - Foreground: Next.js. Background: worker on port 8081 (stopped when you Ctrl+C)"
echo ""

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker not in PATH. Install Docker, or start Postgres/Redis yourself."
  exit 1
fi

echo "Starting: docker compose up -d db redis ..."
docker compose -f "${ROOT}/docker-compose.yml" up -d db redis

if ! test -x "${UVICORN}"; then
  echo ""
  echo "No venv (or missing uvicorn) at services/benchmark-worker/.venv"
  echo "  cd services/benchmark-worker"
  echo "  python3.12 -m venv .venv  # or python3 -m venv .venv"
  echo "  source .venv/bin/activate"
  echo "  pip install -r requirements.txt"
  echo ""
  exit 1
fi

if ! test -d "${ROOT}/node_modules"; then
  echo ""
  echo "Run once from repo root: npm install"
  echo ""
  exit 1
fi

if ! test -f "${ROOT}/apps/web/.env.local" && ! test -f "${ROOT}/.env"; then
  echo "WARNING: No .env or apps/web/.env.local. Copy .env.example and set DATABASE_URL, WORKER_BASE_URL."
  echo ""
fi

WORKER_PID=""
cleanup() {
  if [[ -n "${WORKER_PID}" ]] && kill -0 "${WORKER_PID}" 2>/dev/null; then
    echo "Stopping worker (pid ${WORKER_PID})..."
    kill "${WORKER_PID}" 2>/dev/null || true
    wait "${WORKER_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting worker in background (port 8081)..."
( cd "${WDIR}" && "${UVICORN}" main:app --reload --host 127.0.0.1 --port 8081 ) &
WORKER_PID=$!
sleep 2

echo "Starting Next.js (port 3000) - press Ctrl+C to stop web + worker"
cd "${ROOT}"
# Do not exec npm: EXIT trap must stop the background worker
npm run dev
