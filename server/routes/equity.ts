import { Router, Request, Response } from 'express';
import { getHexEquityData, getNeglectedHexes } from '../services/equityService.js';
import { hexToBoundaryGeoJson } from '../services/h3Service.js';

const router = Router();

// ── GET /api/equity ───────────────────────────────────────────────────────────
// Full equity data for Mapbox choropleth layer.
// Each hex includes its GeoJSON polygon boundary for direct map rendering.
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await getHexEquityData();

    res.setHeader('Cache-Control', 'public, max-age=5');

    const features = rows.map(row => ({
      type:       'Feature' as const,
      properties: row,
      geometry:   hexToBoundaryGeoJson(row.h3_res7),
    }));

    return res.json({
      ok:   true,
      data: {
        type:     'FeatureCollection',
        features,
      },
      meta: {
        total_hexes:    rows.length,
        neglected_count: rows.filter(r => r.is_neglected).length,
        computed_at:    rows[0]?.computed_at ?? new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[GET /equity]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch equity data' } });
  }
});

// ── GET /api/equity/neglected ─────────────────────────────────────────────────
// Top N neglected hexes for the commander alert panel
router.get('/neglected', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 5), 20);
    const rows  = await getNeglectedHexes(limit);
    return res.json({ ok: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('[GET /equity/neglected]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch neglected hexes' } });
  }
});

export default router;
