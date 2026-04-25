# Legacy codegen (optional)

These one-off **Node** scripts were used to scaffold files under `apps/web/`. They are **not** part of the build. Edit the real source in `apps/web/`; run a script here only if you intend to **overwrite** generated targets.

- `gen2.cjs` — early API routes, `lib/benchmark-criteria.ts`, etc.
- `gen-backend.cjs` — `db/schema.ts`, `db/index.ts`
- `write-schema.cjs` — alternative Drizzle schema writer
- `write_ui_part1.cjs` — e.g. methodology page

Run from repo root:

```bash
node scripts/legacy-codegen/gen2.cjs
```

`tw_f.py` is a scratch dump of pasted TSX; not used by the app.
