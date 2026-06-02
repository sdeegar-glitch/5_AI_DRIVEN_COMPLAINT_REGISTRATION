import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema/schema.js";

console.log("[DB] [ENTRY] Initializing database client connection...");

let dbClient;
try {
  const queryClient = postgres(env.DATABASE_URL);
  dbClient = drizzle(queryClient, { schema });
  console.log("[DB] [EXIT] Database client successfully connected.");
} catch (error) {
  console.error("[DB] [ERROR] Database connection failed:", error);
  throw error;
}

export const db = dbClient;
