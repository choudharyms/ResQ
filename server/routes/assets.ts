import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { handleAssetDegradation, updateAllocationStatus } from '../services/allocationEngine.js';
import { refreshEquityAsync } from '../services/equityService.js';

const router = Router();

// ── GET /api/assets ───────────────────────────────────────────────────────────
// Returns all active (non-deleted) assets with live coordinates for the map layer
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
          a.id, a.name, a.call_sign, a.category, a.category_detail,
          a.status, a.capability_tags, a.capabilities, a.fuel_level,
          ST_X(a.location::GEOMETRY) AS longitude,
          ST_Y(a.location::GEOMETRY) AS latitude,
          a.last_telemetry_at, a.updated_at,
          ag.name AS agency_name, ag.category AS agency_category
       FROM assets a
       JOIN agencies ag ON ag.id = a.agency_id
       WHERE a.is_deleted = FALSE
       ORDER BY a.status, a.name`
    );
    return res.json({ ok: true, data: result.rows, count: result.rowCount });
  } catch (err) {
    console.error('[GET /assets]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assets' } });
  }
});

// ── PATCH /api/assets/:id/status ─────────────────────────────────────────────
// Status transitions trigger different backend behaviors:
//   → 'Degraded': calls fn_handle_asset_degradation (auto-reallocation)
//   → 'On_Scene' / 'Completed': calls fn_update_allocation_status
//   → Others: direct UPDATE
const UpdateAssetStatusSchema = z.object({
  status:     z.enum(['Available', 'Assigned', 'On_Scene', 'Returning', 'Standby', 'Refueling_Resting', 'Degraded', 'Offline']),
  reason:     z.string().optional(),
  updated_by: z.string().default('COMMANDER'),
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  const parsed = UpdateAssetStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } });
  }

  const { status, reason, updated_by } = parsed.data;
  const assetId = req.params.id;

  try {
    if (status === 'Degraded') {
      // Delegation: degradation handler supersedes allocation + auto-reallocates
      const result = await handleAssetDegradation(assetId, reason ?? 'COMMANDER_MARKED_DEGRADED');
      refreshEquityAsync();
      return res.json({ ok: result.ok, data: result });
    }

    if (status === 'On_Scene') {
      const result = await updateAllocationStatus(assetId, 'On_Scene', updated_by);
      return res.json({ ok: result.ok, data: result });
    }

    if (status === 'Returning') {
      // 'Returning' means mission complete — mark allocation Completed
      const result = await updateAllocationStatus(assetId, 'Completed', updated_by);
      refreshEquityAsync();
      return res.json({ ok: result.ok, data: result });
    }

    // Generic status update (Available, Standby, Offline, Refueling_Resting)
    await pool.query(
      `UPDATE assets SET status = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3`,
      [status, updated_by, assetId]
    );
    return res.json({ ok: true });

  } catch (err) {
    console.error('[PATCH /assets/:id/status]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Status update failed' } });
  }
});

// ── PATCH /api/assets/:id/telemetry ──────────────────────────────────────────
// Lightweight GPS + fuel ping from field units (called frequently)
const TelemetrySchema = z.object({
  latitude:   z.number().min(-90).max(90),
  longitude:  z.number().min(-180).max(180),
  fuel_level: z.number().min(0).max(1).optional(),
  ping_timestamp: z.string().datetime().optional(),
});

router.patch('/:id/telemetry', async (req: Request, res: Response) => {
  const parsed = TelemetrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } });
  }

  const { latitude, longitude, fuel_level } = parsed.data;

  try {
    await pool.query(
      `UPDATE assets
       SET    location          = ST_SetSRID(ST_MakePoint($2, $1), 4326),
              fuel_level        = COALESCE($3, fuel_level),
              last_telemetry_at = NOW(),
              updated_at        = NOW()
       WHERE  id = $4 AND is_deleted = FALSE`,
      [latitude, longitude, fuel_level ?? null, req.params.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /assets/:id/telemetry]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Telemetry update failed' } });
  }
});

export default router;
