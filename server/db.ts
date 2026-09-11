import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { config } from './config.js';

// ── Supabase client (service role — full permissions, backend only) ────────────
// Used for: Realtime broadcast, Supabase-specific RPC calls.
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// ── Direct postgres pool (for stored procedures, migrations, complex queries) ──
// pg Pool with sane defaults for a hackathon load profile:
//   max: 10 connections — Supabase free tier allows 60 concurrent
//   idleTimeoutMillis: 30s — release idle connections promptly
const { Pool } = pg;
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Validate connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  Database connection failed:', err.message);
    process.exit(1);
  }
  release();
  console.log('✅  Database pool connected');
});

// Typed helper: run a stored procedure and get back a JSONB result
export async function callProc<T>(
  procName: string,
  args: Record<string, unknown>
): Promise<T> {
  const keys   = Object.keys(args);
  const values = Object.values(args);
  const params = keys.map((k, i) => `p_${k} => $${i + 1}`).join(', ');
  const sql    = `SELECT ${procName}(${params}) AS result`;
  const { rows } = await pool.query(sql, values);
  return rows[0].result as T;
}
