# Project status — what is missing

See the repository root for the full **README**. This file is a short **gap list**.

## Backend not wired
- No database client in Next.js yet; `DATABASE_URL` unused in code
- Worker does not insert into PostgreSQL; metrics are stubbed
- No Redis job consumer; queue is for future work
- No real model inference (llama.cpp, vLLM, etc.)
- No authentication or per-tenant isolation

## Product flows not built
- Run creation / history UI, export, deep links, live log streaming
- Error states when services are down (partially addressed with mock data in UI)

## What you can do next
1. Apply `db/migrations/001_init.sql` to Postgres
2. Add API route: trigger worker, persist `runs`
3. Replace mocks in dashboard with server components reading the DB