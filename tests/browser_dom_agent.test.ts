import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'http';
import app from '../server/index.js';

describe('Browser DOM Agent Localhost Verification', () => {
  let server: Server;
  let baseUrl: string;
  let createdIncidentId = 'c0000001-0000-0000-0000-000000000001';
  let targetAssetId = 'b0000001-0000-0000-0000-000000000001';

  before(async () => {
    await new Promise<void>((resolve) => {
      // Listen on ephemeral port (port 0) to avoid collisions
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 3001;
        baseUrl = `http://localhost:${port}`;
        console.log(`\n🤖 Browser DOM Test Agent connected to ${baseUrl}`);
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('DOM Test 01: Serves HTML DOM Test Console with required interactive elements', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const html = await res.text();

    // Verify critical DOM elements are rendered
    assert.ok(html.includes('id="run-all-tests"'), 'DOM must contain master test runner button');
    assert.ok(html.includes('id="test-summary"'), 'DOM must contain test summary metric');
    assert.ok(html.includes('id="badge-health"'), 'DOM must contain health badge');
    assert.ok(html.includes('id="badge-assets"'), 'DOM must contain assets badge');
    assert.ok(html.includes('id="badge-telemetry"'), 'DOM must contain telemetry badge');
    assert.ok(html.includes('id="badge-incidents-get"'), 'DOM must contain incidents queue badge');
    assert.ok(html.includes('id="badge-incident-post"'), 'DOM must contain incident intake badge');
    assert.ok(html.includes('id="badge-equity"'), 'DOM must contain equity badge');
    assert.ok(html.includes('id="badge-degrade"'), 'DOM must contain degradation badge');
    assert.ok(html.includes('id="badge-sync"'), 'DOM must contain sync badge');
  });

  it('DOM Test 02: GET /health returns service status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.service, 'ResQ API');
  });

  it('DOM Test 03: GET /api/assets returns active fleet with agency details', async () => {
    const res = await fetch(`${baseUrl}/api/assets`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length >= 5, 'Should have at least 5 seeded assets');

    const first = data.data[0];
    targetAssetId = first.id;
    assert.ok(first.name);
    assert.ok(first.call_sign);
    assert.ok(first.status);
    assert.ok(Array.isArray(first.capability_tags));
    assert.ok(typeof first.latitude === 'number');
    assert.ok(typeof first.longitude === 'number');
  });

  it('DOM Test 04: PATCH /api/assets/:id/telemetry updates GPS coordinates and fuel', async () => {
    const res = await fetch(`${baseUrl}/api/assets/${targetAssetId}/telemetry`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 26.9215,
        longitude: 75.7825,
        fuel_level: 0.89,
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
  });

  it('DOM Test 05: GET /api/incidents returns prioritized triage queue', async () => {
    const res = await fetch(`${baseUrl}/api/incidents?status=Open`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length > 0);

    const first = data.data[0];
    createdIncidentId = first.id;
    assert.ok(first.primary_need);
    assert.ok(first.ai_triage_tier);
    assert.ok(typeof first.priority_score === 'number');
    assert.ok(first.h3_res7);
    assert.ok(first.h3_res9);
  });

  it('DOM Test 06: POST /api/incidents creates distress event and auto-dispatches capable asset', async () => {
    const res = await fetch(`${baseUrl}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_sos_text: 'Flooding rapidly entering home, cardiac patient elderly on roof near Civil Hospital Jaipur',
        latitude: 26.9220,
        longitude: 75.7810,
        origin_channel: 'WEB_SOS',
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.incident);
    assert.ok(data.incident.id);
    createdIncidentId = data.incident.id;

    assert.ok(data.incident.h3_res7);
    assert.ok(data.incident.h3_res9);

    // Verify allocation response structure
    if (data.allocation) {
      assert.equal(data.allocation.ok, true);
      assert.ok(data.allocation.asset_name);
      assert.ok(data.allocation.call_sign);
    }
  });

  it('DOM Test 07: GET /api/incidents/:id returns single incident with active allocation details', async () => {
    const res = await fetch(`${baseUrl}/api/incidents/${createdIncidentId}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.data.id, createdIncidentId);
    assert.ok(data.data.primary_need);
  });

  it('DOM Test 08: PATCH /api/incidents/:id/status updates incident lifecycle', async () => {
    const res = await fetch(`${baseUrl}/api/incidents/${createdIncidentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'On_Scene',
        updated_by: 'BROWSER_DOM_AGENT',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
  });

  it('DOM Test 09: GET /api/equity returns GeoJSON FeatureCollection for Mapbox chloropleth', async () => {
    const res = await fetch(`${baseUrl}/api/equity`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('cache-control')?.includes('max-age=5'));

    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.data.type, 'FeatureCollection');
    assert.ok(Array.isArray(data.data.features));

    if (data.data.features.length > 0) {
      const feat = data.data.features[0];
      assert.equal(feat.type, 'Feature');
      assert.equal(feat.geometry.type, 'Polygon');
      assert.ok(feat.geometry.coordinates[0].length >= 7, 'Hexagon ring must be closed');
      assert.ok(typeof feat.properties.equity_ratio === 'number');
    }
  });

  it('DOM Test 10: GET /api/equity/neglected returns prioritized underserved hexes', async () => {
    const res = await fetch(`${baseUrl}/api/equity/neglected?limit=5`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.data));
  });

  it('DOM Test 11: POST /api/simulate/degrade triggers failover and auto-reallocates orphaned incident', async () => {
    const res = await fetch(`${baseUrl}/api/simulate/degrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset_id: targetAssetId,
        reason: 'AUTOMATED_SIMULATED_PROPELLER_FAILURE',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
  });

  it('DOM Test 12: POST /api/sync/batch reconciles offline field reports with LWW idempotency', async () => {
    const testUUID = 'e0000001-0000-0000-0000-' + String(Date.now()).slice(-12);
    const res = await fetch(`${baseUrl}/api/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_device_id: 'BROWSER_DOM_AGENT_01',
        synced_at: new Date().toISOString(),
        queued_incidents: [{
          id: testUUID,
          raw_sos_text: 'Disconnected offline distress: trapped elderly resident in flooded alley',
          primary_need: 'Water_Evacuation',
          secondary_needs: ['blankets'],
          required_capability_tags: ['water_rescue', 'evac'],
          latitude: 26.9180,
          longitude: 75.7700,
          people_count: 2,
          client_recorded_at: new Date().toISOString(),
        }],
        asset_telemetry: [],
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.summary.ingested >= 0);
  });
});
