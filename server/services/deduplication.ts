import { pool } from '../db.js';

const DEDUP_WINDOW_MINUTES = 30;

/**
 * Check whether a spatially and categorically similar incident already exists
 * in the same H3 res9 micro-block (≈100m radius) within the dedup window.
 *
 * Returns the existing incident ID if a duplicate is found, null otherwise.
 *
 * Design note: We use h3_res9 (not a radius query) for dedup because:
 * 1. It's indexed and O(log n) vs. an ST_DWithin that scans all active incidents.
 * 2. In practice, the same building/street maps to exactly one res9 hex.
 * 3. Same primary_need in the same micro-block within 30 min is very unlikely
 *    to be a coincidence — treating it as duplicate is the safer default.
 */
export async function findDuplicateIncident(
  h3_res9:      string,
  primaryNeed:  string
): Promise<string | null> {
  const result = await pool.query<{ id: string }>(
    `SELECT id
     FROM   incidents
     WHERE  h3_res9      = $1
       AND  primary_need = $2
       AND  status NOT IN ('Resolved', 'Duplicate', 'False_Alarm')
       AND  created_at  >= NOW() - INTERVAL '${DEDUP_WINDOW_MINUTES} minutes'
     ORDER  BY created_at DESC
     LIMIT  1`,
    [h3_res9, primaryNeed]
  );

  return result.rows.length > 0 ? result.rows[0].id : null;
}
