import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { latLngToH3Pair } from '../services/h3Service.js';
import { findDuplicateIncident } from '../services/deduplication.js';
import { allocateAsset } from '../services/allocationEngine.js';
import { refreshEquityAsync } from '../services/equityService.js';

const router = Router();

// ── POST /api/sync/batch ──────────────────────────────────────────────────────
// Offline-first LWW batch sync for field units reconnecting after dead zones.
//
// Reconciliation rules:
//   Incidents: idempotent by UUID → ON CONFLICT (id) DO NOTHING
//              + dedup check by (h3_res9, primary_need, time window)
//   Telemetry: LWW → only update if ping_timestamp > last_telemetry_at

const BatchIncidentSchema = z.object({
  id:                     z.string().uuid(),
  raw_sos_text:           z.string().min(1),
  primary_need:           z.string(),
  primary_need_detail:    z.string().optional(),
  secondary_needs:        z.array(z.string()).default([]),
  required_capability_tags: z.array(z.string()).default([]),
  ai_triage_tier:         z.string().default('Unclassified'),
  priority_score:         z.number().min(0).max(1).default(0.5),
  ai_confidence:          z.number().min(0).max(1).optional(),
  ai_rationale:           z.string().optional(),
  people_count:           z.number().int().min(1).default(1),
  vulnerable_infants:     z.number().int().min(0).default(0),
  vulnerable_elderly:     z.number().int().min(0).default(0),
  vulnerable_critical_ill: z.number().int().min(0).default(0),
  latitude:               z.number(),
  longitude:              z.number(),
  origin_channel:         z.string().default('FIELD_APP'),
  reporter_device_id:     z.string().optional(),
  client_recorded_at:     z.string().datetime(),
});

const BatchTelemetrySchema = z.object({
  asset_id:        z.string().uuid(),
  latitude:        z.number(),
  longitude:       z.number(),
  fuel_level:      z.number().min(0).max(1).optional(),
  ping_timestamp:  z.string().datetime(),
});

const BatchSyncSchema = z.object({
  client_device_id:   z.string(),
  synced_at:          z.string().datetime(),
  queued_incidents:   z.array(BatchIncidentSchema).default([]),
  asset_telemetry:    z.array(BatchTelemetrySchema).default([]),
});

router.post('/batch', async (req: Request, res: Response) => {
  const parsed = BatchSyncSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } });
  }

  const { queued_incidents, asset_telemetry } = parsed.data;
  const ingested: { id: string; type: string }[]        = [];
  const skipped:  { id: string; reason: string }[]      = [];
  const errors:   { id: string; reason: string }[]      = [];

  // ── Process incidents ──────────────────────────────────────────────────────
  for (const inc of queued_incidents) {
    try {
      const { h3_res7, h3_res9 } = latLngToH3Pair(inc.latitude, inc.longitude);

      // Deduplication check
      const dupId = await findDuplicateIncident(h3_res9, inc.primary_need);
      if (dupId) {
        skipped.push({ id: inc.id, reason: 'DUPLICATE' });
        continue;
      }

      // Idempotent insert (UUID collision = already synced by another path)
      const result = await pool.query(
        `INSERT INTO incidents (
          id, raw_sos_text, origin_channel, reporter_device_id,
          primary_need, primary_need_detail, secondary_needs, required_capability_tags,
          ai_triage_tier, priority_score, ai_confidence, ai_rationale,
          people_count, vulnerable_infants, vulnerable_elderly, vulnerable_critical_ill,
          location, h3_res7, h3_res9, client_recorded_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16,
          ST_SetSRID(ST_MakePoint($18, $17), 4326), $19, $20, $21
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id`,
        [
          inc.id, inc.raw_sos_text, inc.origin_channel, inc.reporter_device_id ?? null,
          inc.primary_need, inc.primary_need_detail ?? null, inc.secondary_needs, inc.required_capability_tags,
          inc.ai_triage_tier, inc.priority_score, inc.ai_confidence ?? null, inc.ai_rationale ?? null,
          inc.people_count, inc.vulnerable_infants, inc.vulnerable_elderly, inc.vulnerable_critical_ill,
          inc.latitude, inc.longitude, h3_res7, h3_res9, inc.client_recorded_at,
        ]
      );

      if (result.rowCount === 0) {
        skipped.push({ id: inc.id, reason: 'ALREADY_EXISTS' });
        continue;
      }

      // Attempt allocation for the newly synced incident
      await allocateAsset(inc.id, 'SYSTEM_OFFLINE_SYNC');
      ingested.push({ id: inc.id, type: 'incident' });

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ id: inc.id, reason: msg });
    }
  }

  // ── Process asset telemetry (LWW) ─────────────────────────────────────────
  for (const t of asset_telemetry) {
    try {
      await pool.query(
        `UPDATE assets
         SET    location          = ST_SetSRID(ST_MakePoint($2, $1), 4326),
                fuel_level        = COALESCE($3, fuel_level),
                last_telemetry_at = $4,
                updated_at        = NOW()
         WHERE  id = $5
           AND  is_deleted = FALSE
           -- LWW: only update if the incoming ping is newer than what we have
           AND  last_telemetry_at < $4::TIMESTAMPTZ`,
        [t.latitude, t.longitude, t.fuel_level ?? null, t.ping_timestamp, t.asset_id]
      );
      ingested.push({ id: t.asset_id, type: 'telemetry' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ id: t.asset_id, reason: msg });
    }
  }

  // Fire equity refresh once for the whole batch
  if (ingested.length > 0) refreshEquityAsync();

  return res.json({
    ok:       errors.length === 0,
    ingested,
    skipped,
    errors,
    summary: {
      total:    queued_incidents.length + asset_telemetry.length,
      ingested: ingested.length,
      skipped:  skipped.length,
      errors:   errors.length,
    },
  });
});

export default router;
