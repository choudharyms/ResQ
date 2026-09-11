import { pool } from '../db.js';

/**
 * Fire-and-forget: triggers REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hex_equity.
 * Called after any incident or allocation write. Never awaited by the request handler
 * — the HTTP response is sent before the refresh completes.
 * CONCURRENT refresh means no reads are blocked during the operation.
 */
export function refreshEquityAsync(): void {
  pool.query('SELECT fn_refresh_equity()').catch((err: Error) => {
    console.error('[Equity] Background refresh failed:', err.message);
  });
}

export interface HexEquityRow {
  h3_res7:           string;
  total_incidents:   number;
  total_victims:     number;
  need_weight:       number;
  deployed_capacity: number;
  equity_ratio:      number;
  is_neglected:      boolean;
  computed_at:       string;
}

/**
 * Fetch all current hex equity metrics for the Mapbox choropleth layer.
 * Returns only hexes with active incidents (need_weight > 0).
 */
export async function getHexEquityData(): Promise<HexEquityRow[]> {
  const result = await pool.query<HexEquityRow>(
    `SELECT h3_res7, total_incidents, total_victims, need_weight,
            deployed_capacity, equity_ratio, is_neglected, computed_at
     FROM   mv_hex_equity
     WHERE  need_weight > 0
     ORDER  BY equity_ratio ASC`
  );
  return result.rows;
}

/**
 * Returns the top N most neglected hexes for the Least-Served Hexes panel.
 */
export async function getNeglectedHexes(limit = 5): Promise<HexEquityRow[]> {
  const result = await pool.query<HexEquityRow>(
    `SELECT h3_res7, total_incidents, total_victims, need_weight,
            deployed_capacity, equity_ratio, is_neglected, computed_at
     FROM   mv_hex_equity
     WHERE  is_neglected = TRUE
     ORDER  BY equity_ratio ASC
     LIMIT  $1`,
    [limit]
  );
  return result.rows;
}
