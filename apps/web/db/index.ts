import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const g = globalThis as unknown as {
  __osllm_pool: Pool | undefined;
  __osllm_db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

function pool() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  let url = raw.trim();
  const isLocal =
    /localhost/i.test(url) || /127\.0\.0\.1/.test(url) || /@db[:/]/.test(url);
  if (isLocal && !/[?&]sslmode=/i.test(url)) {
    url += url.includes("?") ? "&sslmode=disable" : "?sslmode=disable";
  }
  if (!g.__osllm_pool) {
    g.__osllm_pool = new Pool({
      connectionString: url,
      max: 10,
      connectionTimeoutMillis: 10_000,
    });
  }
  return g.__osllm_pool;
}

export function getDb() {
  if (!g.__osllm_db) g.__osllm_db = drizzle(pool(), { schema });
  return g.__osllm_db;
}
