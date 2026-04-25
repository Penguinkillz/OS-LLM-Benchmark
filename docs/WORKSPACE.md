# Cursor / VS Code workspace

Open **this folder** (`C:\os-llm-benchmark`) as the **root** in your editor (not the whole `C:\` drive). That keeps paths, search, and tooling consistent.

## Local run
1. Copy `apps/web/.env.example` to `apps/web/.env.local` and set `DATABASE_URL`, `WORKER_BASE_URL`.
2. Apply SQL in `db/migrations` to PostgreSQL.
3. `npm install` at repo root, `uvicorn` the worker, `npm run dev` for Next.js.

### Windows PowerShell — apply SQL migrations (Docker Postgres)

PowerShell does **not** support Bash-style `psql ... < file.sql`. Use a **pipe**:

```powershell
Get-Content C:\os-llm-benchmark\db\migrations\001_init.sql -Raw | docker exec -i os-llm-benchmark-db-1 psql -U osllm -d osllm
Get-Content C:\os-llm-benchmark\db\migrations\002_run_params.sql -Raw | docker exec -i os-llm-benchmark-db-1 psql -U osllm -d osllm
```

If your container name differs, run `docker ps` and replace `os-llm-benchmark-db-1`.

### env file

Create `apps\web\.env.local` by copying `apps\web\.env.example` (or the root `.env.example`). The app reads env from `apps\web` when you run `npm run dev`; `.env.local` is gitignored on purpose.
