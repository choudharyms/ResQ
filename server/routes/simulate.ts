import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { handleAssetDegradation } from '../services/allocationEngine.js';
import { refreshEquityAsync } from '../services/equityService.js';

const router = Router();

// ── POST /api/simulate/degrade ────────────────────────────────────────────────
// Demo checkpoint 3: force an asset into Degraded state and trigger auto-reallocation
router.post('/degrade', async (req: Request, res: Response) => {
  const schema = z.object({
    asset_id: z.string().uuid(),
    reason:   z.string().default('DEMO_VEHICLE_BREAKDOWN'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const result = await handleAssetDegradation(parsed.data.asset_id, parsed.data.reason);
  refreshEquityAsync();
  return res.json({ ok: result.ok, data: result });
});

// ── POST /api/simulate/reset ──────────────────────────────────────────────────
// Reset all assets and incidents to the clean seeded state for a fresh demo run
router.post('/reset', async (_req: Request, res: Response) => {
  try {
    await pool.query('BEGIN');

    // Clear derived/audit data first (FK order)
    await pool.query(`DELETE FROM allocations`);
    await pool.query(`DELETE FROM incidents`);

    // Reset all assets to Available with full fuel
    await pool.query(
      `UPDATE assets SET status = 'Available', fuel_level = 1.0, updated_at = NOW(), updated_by = 'DEMO_RESET'`
    );

    await pool.query('COMMIT');
    refreshEquityAsync();

    return res.json({ ok: true, message: 'Demo environment reset. Re-seeding incidents recommended.' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('[POST /simulate/reset]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Reset failed' } });
  }
});

// ── POST /api/simulate/sos-burst ─────────────────────────────────────────────
// Inject a burst of 3 pre-scripted SOS incidents for the demo
router.post('/sos-burst', async (_req: Request, res: Response) => {
  // These are the 5 incidents from the demo script that showcase all triage tiers
  const demoIncidents = [
    {
      text: 'Water entering second floor near civil hospital. Grandfather has cardiac pain. 3 kids stranded. Help!',
      lat: 26.9210, lng: 75.7835,
    },
    {
      text: '8 families on rooftop Mansarovar, kids crying, no food since yesterday, water 3 feet',
      lat: 26.9150, lng: 75.7650,
    },
    {
      text: 'Building wall collapsed, person trapped under concrete, breathing but cannot move',
      lat: 26.9040, lng: 75.7960,
    },
  ];

  return res.json({
    ok: true,
    message: 'Use these SOS texts with POST /api/incidents to demo the full intake pipeline.',
    demo_incidents: demoIncidents,
  });
});

export default router;
