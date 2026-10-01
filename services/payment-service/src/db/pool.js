import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../../../../shared/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new pg.Pool({
  connectionString: env.supabase.dbUrl,
  ssl: { rejectUnauthorized: false },
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function initSchema(log) {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  log.info("Payment schema ready");
}

/** Runs fn inside a transaction, rolling back on any error. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function pgHealth() {
  const { rows } = await pool.query("SELECT NOW() AS now");
  return { status: "connected", serverTime: rows[0].now };
}
