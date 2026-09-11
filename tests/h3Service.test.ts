import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { latLngToH3Pair, hexToBoundaryGeoJson, H3_RES_EQUITY, H3_RES_DEDUP } from '../server/services/h3Service.js';
import { latLngToCell } from 'h3-js';

describe('h3Service Tests', () => {
  const jaipurLat = 26.9250;
  const jaipurLng = 75.7830;

  it('should generate valid dual-resolution H3 indices', () => {
    const pair = latLngToH3Pair(jaipurLat, jaipurLng);
    assert.ok(pair.h3_res7, 'res7 index should exist');
    assert.ok(pair.h3_res9, 'res9 index should exist');

    const expectedRes7 = latLngToCell(jaipurLat, jaipurLng, H3_RES_EQUITY);
    const expectedRes9 = latLngToCell(jaipurLat, jaipurLng, H3_RES_DEDUP);

    assert.equal(pair.h3_res7, expectedRes7);
    assert.equal(pair.h3_res9, expectedRes9);
    assert.equal(pair.h3_res7, '873da218cffffff');
  });

  it('should generate a valid closed GeoJSON polygon for Mapbox', () => {
    const pair = latLngToH3Pair(jaipurLat, jaipurLng);
    const geoJson = hexToBoundaryGeoJson(pair.h3_res7);

    assert.equal(geoJson.type, 'Polygon');
    assert.ok(Array.isArray(geoJson.coordinates), 'Coordinates must be array');
    assert.equal(geoJson.coordinates.length, 1, 'Should have 1 exterior ring');

    const ring = geoJson.coordinates[0];
    assert.ok(ring.length >= 7, 'Hexagon ring should have at least 7 points (6 vertices + 1 closing)');

    // Closed ring check: first and last point must match
    const first = ring[0];
    const last = ring[ring.length - 1];
    assert.equal(first[0], last[0], 'Ring must be closed (longitude matches)');
    assert.equal(first[1], last[1], 'Ring must be closed (latitude matches)');

    // Coordinate ordering convention: [lng, lat]
    assert.ok(first[0] >= 75 && first[0] <= 76, 'Longitude should be in Jaipur region (~75.78)');
    assert.ok(first[1] >= 26 && first[1] <= 27, 'Latitude should be in Jaipur region (~26.92)');
  });
});
