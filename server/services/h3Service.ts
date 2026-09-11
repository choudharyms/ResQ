import { latLngToCell, cellToBoundary } from 'h3-js';

export const H3_RES_EQUITY  = 7; // ~5 km²  — macro equity zone per hex
export const H3_RES_DEDUP   = 9; // ~0.1 km² — micro dedup block per hex

export interface H3Pair {
  h3_res7: string;
  h3_res9: string;
}

/**
 * Convert a lat/lng coordinate pair into dual-resolution H3 hex indices.
 * res7 is used for equity aggregation; res9 is used for spatial deduplication.
 */
export function latLngToH3Pair(lat: number, lng: number): H3Pair {
  return {
    h3_res7: latLngToCell(lat, lng, H3_RES_EQUITY),
    h3_res9: latLngToCell(lat, lng, H3_RES_DEDUP),
  };
}

/**
 * Get the polygon boundary of a hex cell for Mapbox GeoJSON rendering.
 * Returns coordinates as [lng, lat] pairs (GeoJSON convention).
 */
export function hexToBoundaryGeoJson(h3Index: string): GeoJSON.Polygon {
  // cellToBoundary returns [[lat, lng], ...]; GeoJSON needs [[lng, lat], ...]
  const boundary = cellToBoundary(h3Index).map(([lat, lng]) => [lng, lat] as [number, number]);
  // Close the ring by repeating the first coordinate
  boundary.push(boundary[0]);
  return {
    type: 'Polygon',
    coordinates: [boundary],
  };
}
