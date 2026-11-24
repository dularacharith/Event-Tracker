import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Global variable across hot reloads in development
const globalForDb = globalThis as unknown as {
  pool?: Pool;
  db?: NodePgDatabase<typeof schema>;
};

function createDbConnection() {
  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    // If running in development without a DATABASE_URL, log warning
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "DATABASE_URL or POSTGRES_URL is not defined. Database operations will fail unless set."
      );
    }
  }

  const pool =
    globalForDb.pool ??
    new Pool({
      connectionString: connectionString || "postgres://localhost:5432/campaignflow",
      max: 10,
      ssl:
        process.env.NODE_ENV === "production" ||
        (connectionString && connectionString.includes("neon.tech"))
          ? { rejectUnauthorized: false }
          : undefined,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool;
  }

  return drizzle(pool, { schema });
}

export let db = globalForDb.db ?? createDbConnection();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

/**
 * Used by tests to override the db instance with an in-memory PGlite or test instance
 */
export function setTestDb(testDb: any) {
  db = testDb;
}

export * from "./schema";
