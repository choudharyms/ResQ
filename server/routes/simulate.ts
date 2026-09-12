import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { handleAssetDegradation } from '../services/allocationEngine.js';
import { refreshEquityAsync } from '../services/equityService.js';
import { isMockMode, mockDb } from '../db.js';

const router = Router();

// ── GET /api/simulate/status ──────────────────────────────────────────────────
// Reports the current simulation mode (LIVE_DB vs LOCAL_MOCK)
router.get('/status', (_req: Request, res: Response) => {
  return res.json({
    ok: true,
    mode: isMockMode ? 'LOCAL_MOCK' : 'LIVE_DB',
    scenario: 'Uttarakhand Flash Flood — Rudraprayag / Joshimath / Helang Bridge',
  });
});

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
    if (isMockMode) {
      // Reset in-memory mock database to initial seed state
      mockDb.resetToSeed();
      return res.json({ ok: true, message: 'Mock database reset to Uttarakhand seed state.' });
    }

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

    return res.json({ ok: true, message: 'Demo environment reset to Uttarakhand seed state.' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('[POST /simulate/reset]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Reset failed' } });
  }
});

// ── POST /api/simulate/sos-burst ─────────────────────────────────────────────
// Inject a burst of 3 pre-scripted SOS incidents for the Uttarakhand Flash Flood demo
router.post('/sos-burst', async (_req: Request, res: Response) => {
  // Uttarakhand Flash Flood — 5 demo incidents showcasing all triage tiers
  const demoIncidents = [
    {
      text: 'Alaknanda water 4.2m above danger level, 64 pilgrims trapped on Rudraprayag temple terrace, river confluence completely flooded',
      lat: 30.2854, lng: 78.9812,
    },
    {
      text: 'Dam spillway surge inundating houses at Srinagar Garhwal riverside, 45 residents including 2 infants and 12 elderly trapped',
      lat: 30.2227, lng: 78.7844,
    },
    {
      text: 'Glacial debris landslide at Joshimath Raini sector, structural bridge damage, 32 people trapped under rockfall, 4 critically injured',
      lat: 30.5564, lng: 79.5668,
    },
    {
      text: 'NH-07 Badrinath Highway washed out at Helang Bridge Km 18, 85 bus pilgrims cut off, multiple fractures and trauma reported',
      lat: 30.5278, lng: 79.5220,
    },
    {
      text: 'Mandakini tributary overflowing, road to Kedarnath blocked at Guptkashi, 28 people stranded, silent zone, comms intermittent',
      lat: 30.5229, lng: 79.0768,
    },
  ];

  return res.json({
    ok: true,
    message: 'Use these SOS texts with POST /api/incidents to demo the Uttarakhand flash flood intake pipeline.',
    scenario: 'Uttarakhand Flash Flood — Rudraprayag / Joshimath / Guptkashi',
    demo_incidents: demoIncidents,
  });
});

export default router;
