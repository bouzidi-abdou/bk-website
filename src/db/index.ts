import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { ensureSchemaInitialized } from "@/lib/db-init";

type Db = NodePgDatabase<typeof schema>;

let cachedPool: Pool | null = null;
let cachedDb: Db | null = null;

function init(): Db {
  if (cachedDb && cachedPool) return cachedDb;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required — add it in your hosting Environment Variables (Vercel / Netlify)."
    );
  }

  const isLocal =
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0");

  cachedPool = new Pool({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // Handle unexpected errors on idle pool connections in serverless containers
  cachedPool.on("error", (err) => {
    console.error("[db] Unexpected pool error:", err);
    cachedPool = null;
    cachedDb = null;
  });

  // Trigger non-blocking schema and seed initialization
  ensureSchemaInitialized(cachedPool).catch((err) => {
    console.error("[db] Schema init background error:", err);
  });

  cachedDb = drizzle(cachedPool, { schema });
  return cachedDb;
}

const globalForDb = globalThis as typeof globalThis & {
  __bkMarketDb?: Db;
};

function getDb(): Db {
  if (process.env.NODE_ENV !== "production") {
    if (!globalForDb.__bkMarketDb) globalForDb.__bkMarketDb = init();
    return globalForDb.__bkMarketDb;
  }
  return init();
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});
