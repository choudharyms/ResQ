import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { extractSosIntent } from '../services/geminiParser.js';
import { latLngToH3Pair } from '../services/h3Service.js';
import { findDuplicateIncident } from '../services/deduplication.js';
import { allocateAsset } from '../services/allocationEngine.js';
import { refreshEquityAsync } from '../services/equityService.js';

const router = Router();

// ── Validation ────────────────────────────────────────────────────────────────
const CreateIncidentSchema = z.object({
  raw_sos_text:      z.string().min(5, 'SOS message must be at least 5 characters'),
  latitude:          z.number().min(-90).max(90),
  longitude:         z.number().min(-180).max(180),
  origin_channel:    z.enum(['WEB_SOS', 'FIELD_APP', 'SMS_GATEWAY', 'COMMANDER_ENTRY']).default('WEB_SOS'),
  reporter_device_id: z.string().max(64).optional(),
  // Optional manual overrides (e.g. commander bypasses AI for known situation)
  override_need:     z.string().optional(),
  override_priority: z.number().min(0).max(1).optional(),
});

// ── POST /api/incidents ───────────────────────────────────────────────────────
// Full intake pipeline: validate → Gemini parse → H3 index → dedup → insert → allocate
router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateIncidentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } });
  }

  const { raw_sos_text, latitude, longitude, origin_channel, reporter_device_id } = parsed.data;

  try {
    // 1. Extract structured intent with Gemini (never throws — returns fallback on failure)
    const extraction = await extractSosIntent(raw_sos_text);

    // 2. Compute H3 hex indices
    const { h3_res7, h3_res9 } = latLngToH3Pair(latitude, longitude);

    // 3. Check for spatial + categorical duplicate
    const duplicateId = await findDuplicateIncident(h3_res9, extraction.primary_need);
    if (duplicateId) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        duplicate_of_id: duplicateId,
        message: 'A similar incident was already reported nearby. Your report has been noted.',
      });
    }

    // 4. Insert incident
    const insertResult = await pool.query<{ id: string }>(
      `INSERT INTO incidents (
        raw_sos_text, origin_channel, reporter_device_id,
        primary_need, primary_need_detail, secondary_needs, required_capability_tags,
        ai_triage_tier, priority_score, ai_confidence, ai_rationale,
        people_count, vulnerable_infants, vulnerable_elderly, vulnerable_critical_ill,
        location, h3_res7, h3_res9
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15,
        ST_SetSRID(ST_MakePoint($17, $16), 4326), $18, $19
      ) RETURNING id`,
      [
        raw_sos_text, origin_channel, reporter_device_id ?? null,
        extraction.primary_need,
        extraction.primary_need_detail ?? null,
        extraction.secondary_needs,
        extraction.required_capability_tags,
        extraction.ai_triage_tier,
        extraction.priority_score,
        extraction.ai_confidence,
        extraction.ai_rationale,
        extraction.people_count,
        extraction.vulnerable_infants,
        extraction.vulnerable_elderly,
        extraction.vulnerable_critical_ill,
        latitude, longitude, h3_res7, h3_res9,
      ]
    );

    const incidentId = insertResult.rows[0].id;

    // 5. Attempt immediate auto-allocation
    const allocation = await allocateAsset(incidentId, 'SYSTEM_AI_AUTO');

    // 6. Refresh equity metrics async (fire-and-forget)
    refreshEquityAsync();

    return res.status(201).json({
      ok:         true,
      duplicate:  false,
      incident:   { id: incidentId, ...extraction, h3_res7, h3_res9 },
      allocation: allocation.ok ? allocation : null,
      no_asset_available: !allocation.ok,
    });

  } catch (err) {
    console.error('[POST /incidents]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Incident creation failed' } });
  }
});

// ── GET /api/incidents ────────────────────────────────────────────────────────
// List open incidents ordered by priority for the triage queue
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) ?? 'Open';
    const limit  = Math.min(Number(req.query.limit ?? 100), 500);

    const result = await pool.query(
      `SELECT
          i.*,
          ST_X(i.location::GEOMETRY) AS longitude,
          ST_Y(i.location::GEOMETRY) AS latitude,
          aa.asset_id                AS assigned_asset_id,
          aa.distance_km,
          aa.est_transit_minutes,
          aa.dispatched_at
       FROM incidents i
       LEFT JOIN active_allocations aa ON aa.incident_id = i.id
       WHERE i.status = $1
       ORDER BY i.priority_score DESC, i.created_at ASC
       LIMIT $2`,
      [status, limit]
    );

    return res.json({ ok: true, data: result.rows, count: result.rowCount });
  } catch (err) {
    console.error('[GET /incidents]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch incidents' } });
  }
});

// ── GET /api/incidents/:id ────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
          i.*,
          ST_X(i.location::GEOMETRY) AS longitude,
          ST_Y(i.location::GEOMETRY) AS latitude,
          aa.asset_id                AS assigned_asset_id,
          aa.distance_km,
          aa.eta_minutes             AS est_transit_minutes,
          aa.dispatched_at,
          aa.allocation_status
       FROM incidents i
       LEFT JOIN active_allocations aa ON aa.incident_id = i.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Incident not found' } });
    }

    return res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error('[GET /incidents/:id]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch incident' } });
  }
});

// ── PATCH /api/incidents/:id/status ──────────────────────────────────────────
const UpdateStatusSchema = z.object({
  status:     z.enum(['On_Scene', 'Resolved', 'False_Alarm', 'Duplicate']),
  updated_by: z.string().default('COMMANDER'),
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  const parsed = UpdateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } });
  }

  try {
    await pool.query(
      `UPDATE incidents SET status = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3`,
      [parsed.data.status, parsed.data.updated_by, req.params.id]
    );
    refreshEquityAsync();
    return res.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /incidents/:id/status]', err);
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Status update failed' } });
  }
});

export default router;
