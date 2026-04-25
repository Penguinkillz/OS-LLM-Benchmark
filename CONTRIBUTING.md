# Contributing

Thanks for your interest in **OS-LLM-Benchmark**. This document describes how to set up a dev environment, make changes, and open pull requests. For a project overview and end-to-end setup, read [README.md](README.md) first.

## Getting started

1. **Fork** the repository (or ask for access if you work in a private org fork).
2. **Clone** your fork and create a **branch** for your work (e.g. `fix/leaderboard-sort`, `feat/model-tags`).
3. Follow the [README](README.md#full-local-setup) setup: Node/npm at the repo root, Python venv in `services/benchmark-worker/`, Docker for Postgres/Redis, env files, and SQL migrations applied in order.
4. **Verify** the app runs: `npm run dev` (web) and a worker on the URL in `WORKER_BASE_URL` (see README).

## What lives where

| Path | Role |
|------|------|
| `apps/web/` | Next.js UI and API routes; Drizzle + `pg` for the database. |
| `services/benchmark-worker/` | FastAPI worker; runs Transformers benchmark workloads. |
| `db/migrations/` | **Ordered** SQL migrations (apply in filename order). |
| `docker-compose.yml` | Postgres, Redis, and an optional **containerized** worker. |

## Making changes

- **Scope:** Keep changes focused. One feature or fix per PR is easier to review.
- **Style:** Match existing patterns (imports, formatting, naming). For the web app, run `npm run lint` from the repo root before opening a PR.
- **Build:** From the repo root, `npm run build` should succeed for changes that touch the Next.js app.
- **Worker:** If you change Python code, use a virtualenv and `pip install -r requirements.txt`. Do not commit virtualenvs, API keys, or local `.env` files.

## Database migrations

- New schema changes go in **new** files under `db/migrations/`, e.g. `003_your_feature.sql`, with a name that **sorts after** the latest migration.
- Document in your PR what the migration does and whether it is safe to re-run (our dev scripts often pipe SQL into `psql`; idempotent or clearly documented re-runs help everyone).

## Pull requests

- **Title:** Short and descriptive.
- **Description:** What changed, why, and how you tested (e.g. `npm run lint` + `npm run build`, manual run on CPU, migration applied to a fresh database).
- **Link issues** when applicable, e.g. "Fixes #123".

## Security and secrets

- Never commit real `WORKER_API_KEY` values, database passwords, or Hugging Face tokens.
- Do not add `NEXT_PUBLIC_` to worker secrets; the browser must not see API keys.
- If you find a **security issue**, report it privately to the maintainers instead of filing a public issue with exploit details.

## License

By contributing, you agree that your contributions are licensed under the same license as the project ([MIT](LICENSE)), unless stated otherwise by the maintainers.
