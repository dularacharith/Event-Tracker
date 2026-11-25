import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.warn(
      "Notice: DATABASE_URL or POSTGRES_URL environment variable is not defined. Skipping migration step."
    );
    return;
  }

  console.log("Connecting to Postgres database for migration...");
  const pool = new pg.Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production" ||
      connectionString.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const db = drizzle(pool);

  try {
    const migrationsFolder = path.resolve(__dirname, "../drizzle");
    console.log(`Running migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log("Migrations successfully applied!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
