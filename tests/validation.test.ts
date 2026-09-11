import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

describe('API Route Validation Schemas', () => {
  const UUIDParam = z.string().uuid();

  const CreateIncidentSchema = z.object({
    raw_sos_text:       z.string().min(5, 'SOS message must be at least 5 characters'),
    latitude:           z.number().min(-90).max(90),
    longitude:          z.number().min(-180).max(180),
    origin_channel:     z.enum(['WEB_SOS', 'FIELD_APP', 'SMS_GATEWAY', 'COMMANDER_ENTRY']).default('WEB_SOS'),
    reporter_device_id: z.string().max(64).optional(),
    override_need:      z.string().optional(),
    override_priority:  z.number().min(0).max(1).optional(),
  });

  const BatchIncidentSchema = z.object({
    id:                      z.string().uuid(),
    raw_sos_text:            z.string().min(1),
    primary_need:            z.string(),
    primary_need_detail:     z.string().optional(),
    secondary_needs:         z.array(z.string()).default([]),
    required_capability_tags: z.array(z.string()).default([]),
    ai_triage_tier:          z.string().default('Unclassified'),
    priority_score:          z.number().min(0).max(1).default(0.5),
    ai_confidence:           z.number().min(0).max(1).optional(),
    ai_rationale:            z.string().optional(),
    people_count:            z.number().int().min(1).default(1),
    vulnerable_infants:      z.number().int().min(0).default(0),
    vulnerable_elderly:      z.number().int().min(0).default(0),
    vulnerable_critical_ill: z.number().int().min(0).default(0),
    latitude:                z.number().min(-90).max(90),
    longitude:               z.number().min(-180).max(180),
    origin_channel:          z.string().default('FIELD_APP'),
    reporter_device_id:      z.string().optional(),
    client_recorded_at:      z.string().datetime(),
  });

  const UpdateAssetStatusSchema = z.object({
    status:     z.enum(['Available', 'Assigned', 'On_Scene', 'Returning', 'Standby', 'Refueling_Resting', 'Degraded', 'Offline']),
    reason:     z.string().optional(),
    updated_by: z.string().default('COMMANDER'),
  });

  it('validates UUID correctly', () => {
    assert.ok(UUIDParam.safeParse('c0000001-0000-0000-0000-000000000001').success);
    assert.ok(!UUIDParam.safeParse('not-a-uuid').success);
    assert.ok(!UUIDParam.safeParse('').success);
    assert.ok(!UUIDParam.safeParse('12345').success);
  });

  it('validates CreateIncident payload boundaries', () => {
    // Valid
    const valid = CreateIncidentSchema.safeParse({
      raw_sos_text: 'Flooding on 2nd floor, help!',
      latitude: 26.9250,
      longitude: 75.7830,
    });
    assert.ok(valid.success);
    assert.equal(valid.data?.origin_channel, 'WEB_SOS');

    // Too short SOS text
    const shortText = CreateIncidentSchema.safeParse({
      raw_sos_text: 'Help',
      latitude: 26.9250,
      longitude: 75.7830,
    });
    assert.ok(!shortText.success);

    // Invalid latitude out of range
    const badLat = CreateIncidentSchema.safeParse({
      raw_sos_text: 'Flooding on 2nd floor, help!',
      latitude: 95.0,
      longitude: 75.7830,
    });
    assert.ok(!badLat.success);

    // Invalid longitude out of range
    const badLng = CreateIncidentSchema.safeParse({
      raw_sos_text: 'Flooding on 2nd floor, help!',
      latitude: 26.9250,
      longitude: 195.0,
    });
    assert.ok(!badLng.success);
  });

  it('validates BatchSync incident coordinates and timestamps', () => {
    const valid = BatchIncidentSchema.safeParse({
      id: 'c0000001-0000-0000-0000-000000000001',
      raw_sos_text: 'Emergency',
      primary_need: 'Medical_Emergency',
      latitude: 26.9250,
      longitude: 75.7830,
      client_recorded_at: '2026-09-11T18:00:00.000Z',
    });
    assert.ok(valid.success);
    assert.equal(valid.data?.people_count, 1);
    assert.equal(valid.data?.priority_score, 0.5);

    // Invalid coordinates rejected
    const badCoords = BatchIncidentSchema.safeParse({
      id: 'c0000001-0000-0000-0000-000000000001',
      raw_sos_text: 'Emergency',
      primary_need: 'Medical_Emergency',
      latitude: 99999,
      longitude: 75.7830,
      client_recorded_at: '2026-09-11T18:00:00.000Z',
    });
    assert.ok(!badCoords.success, 'Out of bounds latitude should fail');

    // Invalid timestamp rejected
    const badTime = BatchIncidentSchema.safeParse({
      id: 'c0000001-0000-0000-0000-000000000001',
      raw_sos_text: 'Emergency',
      primary_need: 'Medical_Emergency',
      latitude: 26.9250,
      longitude: 75.7830,
      client_recorded_at: 'yesterday-at-5pm',
    });
    assert.ok(!badTime.success, 'Malformed datetime should fail');
  });

  it('validates Asset status updates against allowed lifecycle enum', () => {
    assert.ok(UpdateAssetStatusSchema.safeParse({ status: 'Available' }).success);
    assert.ok(UpdateAssetStatusSchema.safeParse({ status: 'Degraded', reason: 'Engine broken' }).success);
    assert.ok(UpdateAssetStatusSchema.safeParse({ status: 'Returning' }).success);
    assert.ok(!UpdateAssetStatusSchema.safeParse({ status: 'Destroyed' }).success);
    assert.ok(!UpdateAssetStatusSchema.safeParse({ status: 'Flying' }).success);
  });
});
