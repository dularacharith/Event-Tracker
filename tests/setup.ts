import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";
import { setTestDb } from "@/db";
import fs from "fs";
import path from "path";

export async function setupTestDatabase() {
  const pglite = new PGlite();
  const testDb = drizzle(pglite, { schema });

  // Read and apply the generated migration SQL
  const migrationSql = fs.readFileSync(
    path.resolve(__dirname, "../drizzle/0000_worried_oracle.sql"),
    "utf8"
  );

  // Split on statement breakpoints or execute directly
  await pglite.exec(migrationSql);

  // Wire up the global db pointer to the test database
  setTestDb(testDb);

  return { pglite, testDb };
}
