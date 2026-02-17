import { mkdirSync } from "fs";
import { dirname } from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
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

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma("journal_mode = WAL");

  return drizzle(sqlite, { schema });
}

export const db = globalThis.__brier_db ?? createDrizzle();

if (process.env.NODE_ENV !== "production") {
  globalThis.__brier_db = db;
}
