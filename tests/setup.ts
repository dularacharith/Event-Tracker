import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";
import { setTestDb } from "@/db";
import fs from "fs";
import path from "path";

export async function setupTestDatabase() {
  const pglite = new PGlite();
  const testDb = drizzle(pglite, { schema });

  // Read and apply all generated migration SQL files in sequence
  const drizzleDir = path.resolve(__dirname, "../drizzle");
  const sqlFiles = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of sqlFiles) {
    const migrationSql = fs.readFileSync(path.join(drizzleDir, file), "utf8");
    await pglite.exec(migrationSql);
  }

  // Wire up the global db pointer to the test database
  setTestDb(testDb);

  return { pglite, testDb };
}
