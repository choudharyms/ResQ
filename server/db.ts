import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { config } from './config.js';
import { mockDb } from './mockDb.js';

// Re-export mockDb so routes can call mockDb.resetToSeed() etc.
export { mockDb };

// ── Supabase client (service role — full permissions, backend only) ────────────
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// ── Direct postgres pool with fallback to in-memory simulation mode ───────────
const { Pool } = pg;
export const rawPool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 3_000,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export let isMockMode = false;

// Check connection on startup
rawPool.connect((err, client, release) => {
  if (err) {
    isMockMode = true;
    console.warn(`⚠️  PostgreSQL connection unavailable (${err.message}).`);
    console.warn('   Running in Local In-Memory Simulation mode for development & testing.');
  } else {
    release();
    console.log('✅  Database pool connected to PostgreSQL');
  }
});

// Resilient pool wrapper
export const pool = {
  query: async <T = any>(sql: string, values?: any[]): Promise<{ rows: T[]; rowCount: number }> => {
    if (isMockMode) {
      return mockDb.query<T>(sql, values);
    }
    try {
      const res = await rawPool.query(sql, values);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
    } catch (err: any) {
      isMockMode = true;
      return mockDb.query<T>(sql, values);
    }
  },
};

// Typed helper: run a stored procedure and get back a JSONB result
export async function callProc<T>(
  procName: string,
  args: Record<string, unknown>
): Promise<T> {
  // Validate identifier names to prevent SQL injection
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(procName)) {
    throw new Error(`Invalid procedure name: ${procName}`);
  }
  const keys = Object.keys(args);
  for (const k of keys) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) {
      throw new Error(`Invalid parameter key: ${k}`);
    }
  }

  // Intercept stored procedures in mock mode
  if (isMockMode) {
    if (procName === 'fn_allocate_asset') {
      return mockDb.fn_allocate_asset(args.incident_id as string, args.dispatched_by as string) as unknown as T;
    }
    if (procName === 'fn_handle_asset_degradation') {
      return mockDb.fn_handle_asset_degradation(args.asset_id as string, args.reason as string) as unknown as T;
    }
    if (procName === 'fn_update_allocation_status') {
      return mockDb.fn_update_allocation_status(args.asset_id as string, args.new_status as string, args.updated_by as string) as unknown as T;
    }
    if (procName === 'fn_refresh_equity') {
      return {} as T;
    }
  }

  const values = Object.values(args);
  const params = keys.map((k, i) => `p_${k} => $${i + 1}`).join(', ');
  const sql    = `SELECT ${procName}(${params}) AS result`;
  const { rows } = await pool.query(sql, values);
  if (!rows || rows.length === 0 || !rows[0]) {
    throw new Error(`Procedure ${procName} returned no rows`);
  }
  return rows[0].result as T;
}
