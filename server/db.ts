import "dotenv/config";              // keep env loaded first
import { Pool } from "pg";            // standard Postgres driver
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // optional tuning:
  // max: 10,
  // idleTimeoutMillis: 30_000,
});

export const db = drizzle(pool, { schema });
