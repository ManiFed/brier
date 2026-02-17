import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL ?? "./data/brier.db";

// ---------------------------------------------------------------------------
// Singleton – survives Next.js dev-mode hot reloads
// ---------------------------------------------------------------------------
declare const globalThis: {
  __brier_db?: ReturnType<typeof createDrizzle>;
} & typeof global;

function createDrizzle() {
  mkdirSync(dirname(DATABASE_URL), { recursive: true });
  const sqlite = new Database(DATABASE_URL);

  // Wait for transient lock contention (e.g. parallel Next.js build workers)
  sqlite.pragma("busy_timeout = 5000");

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma("journal_mode = WAL");

  const db = drizzle(sqlite, { schema });

  // Auto-run migrations to ensure tables exist
  try {
    migrate(db, {
      migrationsFolder: resolve(process.cwd(), "drizzle/migrations"),
    });
  } catch {
    // Migrations may already be applied — that's fine
  }

  return db;
}

export const db = globalThis.__brier_db ?? createDrizzle();

if (process.env.NODE_ENV !== "production") {
  globalThis.__brier_db = db;
}
