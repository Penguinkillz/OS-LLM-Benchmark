# OS-LLM-Benchmark

Bench LLM serving with **operating-systems-style metrics** (tail latency, approximate peak memory, fairness under contention). The stack is a **Next.js** dashboard, **PostgreSQL** for runs and models, **Redis** (as wired in this repo), and a **Python FastAPI worker** that runs **real [Hugging Face Transformers](https://huggingface.co/docs/transformers)** workloads (`from_pretrained` for Hub ids or local folders).

**Self-hosting:** Clone and run on your own machine. You provide hardware, models, and risk tolerance. See [CONTRIBUTING.md](CONTRIBUTING.md) to propose changes.

---

## Repository layout

| Path | Description |
|------|-------------|
| `apps/web/` | Next.js 15 app (UI, server API routes, Drizzle, Tailwind). Env: `apps/web/.env.local` (see `apps/web/.env.example`). |
| `services/benchmark-worker/` | FastAPI app; run with `uvicorn main:app` in development. |
| `db/migrations/` | **Ordered** SQL; apply in filename order before using features that depend on them. |
| `docker-compose.yml` | Postgres, Redis, and an optional `worker` service. |
| `start-dev.bat` / `start-dev.sh` | Optional: start DB/Redis and both processes (see below). |

From the **repo root**, `npm run dev`, `npm run build`, and `npm run lint` target `apps/web`.

---

## Prerequisites

- **Node.js** and **npm** (this repo uses npm workspaces; Node 20+ is a good baseline for Next 15).
- **Python 3** for the worker (recommended: venv at `services/benchmark-worker/.venv`).
- **Docker** for Postgres and Redis via Compose, or your own compatible instances.

---

## Full local setup

1. **Clone** and install dependencies from the repo root:
   ```bash
   cd os-llm-benchmark
   npm install
   ```
2. **Environment:** Copy [`.env.example`](.env.example) to `.env` and/or copy [`apps/web/.env.example`](apps/web/.env.example) to `apps/web/.env.local`. Set at least `DATABASE_URL`, `WORKER_BASE_URL`, and (if you use it) the same `WORKER_API_KEY` for both the web process and the worker. Defaults for Dockerized Postgres are user `osllm`, password `osllm`, database `osllm` on port `5432` (see [Environment variables](#environment-variables)).
3. **Postgres and Redis** (typical):
   ```bash
   docker compose up -d db redis
   ```
4. **Migrations:** Apply every file in `db/migrations/` **in order** to your database (e.g. `psql`, or on Windows the piping used in `start-dev.bat` against the `db` container). `start-dev.sh` on macOS/Linux does **not** run migrations; apply them yourself the first time.
5. **Worker:**
   ```bash
   cd services/benchmark-worker
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # macOS / Linux: source .venv/bin/activate
   pip install -r requirements.txt
   ```
   If you use a worker API key, export it in this shell, then:
   ```bash
   uvicorn main:app --reload --port 8081 --host 127.0.0.1
   ```
   The port must match `WORKER_BASE_URL` (e.g. `http://127.0.0.1:8081`).
6. **Web** (from repo root):
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

**Optional one-shot dev scripts**

- **Windows:** `start-dev.bat` starts `db` and `redis`, applies the SQL files under `db/migrations/` to the `db` container, then opens the worker on **8081** and Next on **3000** in new windows. Requires prior `npm install`, a worker venv with `pip install -r requirements.txt`, and env files. The script sets `WORKER_API_KEY=change-me` for the worker process; **use the same value** in your env or change both consistently.
- **macOS / Linux:** `chmod +x start-dev.sh` then `./start-dev.sh` from the repo root. It starts `db` + `redis`, runs the worker in the **background** on **8081**, and `npm run dev` in the **foreground**; **Ctrl+C** stops the web server and the script tears down the worker. Apply database migrations yourself before first use. Same prerequisites: `npm install` and a worker venv.

**Docker note:** `docker compose up --build` can start Postgres, Redis, and a **containerized** worker. The **Next.js** app is still usually run on the host with `npm run dev` unless you add a web service. Point `WORKER_BASE_URL` at the host port for the worker (see `docker-compose.yml`; the service maps **8081** on the host to the app inside the container).

---

## Development commands

| Command | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server (`apps/web`). |
| `npm run build` | Production build of the web app. |
| `npm run lint` | ESLint for `apps/web`. |

---

## Environment variables

Copy from `.env.example` / `apps/web/.env.example` and adjust.

| Variable | Purpose |
|----------|--------|
| `NEXT_PUBLIC_APP_NAME` | Display name in the UI (public). |
| `DATABASE_URL` | PostgreSQL URL for server-side API routes. For local Docker, align with `docker-compose` credentials (default `osllm` / `osllm` on `127.0.0.1:5432`). Use `?sslmode=disable` for local dev if needed. |
| `REDIS_URL` | Redis (default local: `redis://localhost:6379/0`). |
| `WORKER_BASE_URL` | Base URL the Next.js **server** uses to call the worker (e.g. `http://127.0.0.1:8081`). Not sent to the browser. |
| `WORKER_API_KEY` | Optional shared secret; when set, must match on both Next and worker (`X-API-Key`). |
| `HUGGING_FACE_HUB_TOKEN` | Optional; private or gated Hub models. |
| `OSLLM_DEVICE` | Optional worker override: `cpu`, `cuda`, or `mps`. |

If you see **password authentication failed** for Postgres, fix `DATABASE_URL` or reset the stack volume (e.g. `docker compose down -v` — **wipes** local DB data).

See **Security and `WORKER_API_KEY`** below for auth behavior.

---

## What gets measured

The worker runs a **repeatable** benchmark: tokenized prompts, forward + generate passes, and aggregates **p50/p95/p99** end-to-end latency, **p95** prefill-style timings, **tokens/sec**, **approximate peak memory**, and **Jain fairness** across synthetic tenants. Exact formulas and parameter meanings are documented in-app under `/docs/methodology` and `/dashboard/parameters` where applicable.

This is a **harness** for comparison on *your* hardware, not a replacement for security review or for vendor-published SLAs.

---

## Pre-run risk assessment (`/assess`)

Before executing a run, the UI calls **`POST /api/runs/assess`**, which asks the worker for a **heuristic** risk level:

| Level | Meaning |
|-------|--------|
| **ok** | No extra confirmation. |
| **caution** | Lighter dialog (e.g. long run or borderline resource fit). |
| **critical** | Strong warning (e.g. model size vs available RAM/VRAM looks dangerous). You must explicitly accept. |

**Limits:** This uses **name parsing**, on-disk weight file sizes, and `psutil` / PyTorch device memory — not a full planner. A wrong guess does not make an unsafe run safe. You remain responsible for your system.

---

## Security and `WORKER_API_KEY`

- The Next.js app calls the worker **from the server** using `WORKER_BASE_URL` and, when set, sends **`X-API-Key: WORKER_API_KEY`**.
- The worker **enforces** that key on **`/assess`** and **`/runs`** when `WORKER_API_KEY` is set in the worker environment. **`/health` stays open** for probes.
- If `WORKER_API_KEY` is **unset**, both sides skip auth (convenient for local dev, **inappropriate** if the worker is reachable on a network).
- **Never** expose the raw worker to the public internet without authentication, body size limits, and a threat model. Loading arbitrary checkouts with `trust_remote_code` is a supply-chain risk.
- The browser does **not** need the key; do not add `NEXT_PUBLIC_` for the worker secret.

---

## License

This project is licensed under the [MIT License](LICENSE).

## Disclaimer

Software is provided **as is**. Running large models can cause **out-of-memory**, system **freezes**, or **very long** runtimes. **You** decide whether to proceed after warnings.
