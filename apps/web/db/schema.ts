import { relations } from "drizzle-orm";
import { doublePrecision, jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const models = pgTable("models", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  source: text("source"),
  paramsJson: jsonb("params_json")
    .$type<Record<string, unknown>>()
    .notNull()
    .$defaultFn(() => ({})),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const runs = pgTable("runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelId: uuid("model_id").references(() => models.id, { onDelete: "set null" }),
  profile: text("profile").notNull(),
  status: text("status").notNull().default("pending"),
  p50Ms: doublePrecision("p50_ms"),
  p95Ms: doublePrecision("p95_ms"),
  p99Ms: doublePrecision("p99_ms"),
  ttftP95Ms: doublePrecision("ttft_p95_ms"),
  tokPerS: doublePrecision("tok_per_s"),
  approxPeakMb: doublePrecision("approx_peak_mb"),
  jainFairness: doublePrecision("jain_fairness"),
  runParams: jsonb("run_params")
    .$type<Record<string, unknown>>()
    .notNull()
    .$defaultFn(() => ({})),
  rawMetrics: jsonb("raw_metrics")
    .$type<Record<string, unknown>>()
    .notNull()
    .$defaultFn(() => ({})),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const runLogLines = pgTable("run_log_lines", {
  id: serial("id").primaryKey(),
  runId: uuid("run_id")
    .references(() => runs.id, { onDelete: "cascade" })
    .notNull(),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  context: jsonb("context")
    .$type<Record<string, unknown>>()
    .notNull()
    .$defaultFn(() => ({})),
});

export const modelsRelations = relations(models, ({ many }) => ({
  runs: many(runs),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  model: one(models, { fields: [runs.modelId], references: [models.id] }),
  logLines: many(runLogLines),
}));

export const runLogLinesRelations = relations(runLogLines, ({ one }) => ({
  run: one(runs, { fields: [runLogLines.runId], references: [runs.id] }),
}));
