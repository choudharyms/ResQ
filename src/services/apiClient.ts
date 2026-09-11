import { Incident, Asset, EquityZone, EventType, AssetStatus, AgencyType } from '../types/disaster';
import { computeDemandVector } from '../engines/priorityEngine';

const API_BASE = '/api';

export interface HealthCheckResponse {
  ok: boolean;
  service: string;
  env: string;
}

export interface BackendIncident {
  id: string;
  raw_sos_text: string;
  origin_channel?: string;
  primary_need: string;
  primary_need_detail?: string | null;
  secondary_needs?: string[];
  required_capability_tags?: string[];
  ai_triage_tier: string;
  priority_score: number;
  ai_confidence?: number | null;
  ai_rationale?: string | null;
  people_count: number;
  vulnerable_infants: number;
  vulnerable_elderly: number;
  vulnerable_critical_ill: number;
  latitude: number;
  longitude: number;
  h3_res7: string;
  h3_res9: string;
  status: string;
  assigned_asset_id?: string | null;
  distance_km?: number | null;
  est_transit_minutes?: number | null;
  dispatched_at?: string | null;
  created_at?: string;
}

export interface BackendAsset {
  id: string;
  name: string;
  call_sign: string;
  category: string;
  category_detail?: string | null;
  status: string;
  capability_tags: string[];
  capabilities: Record<string, unknown>;
  fuel_level: number;
  latitude: number;
  longitude: number;
  last_telemetry_at: string;
  agency_name: string;
  agency_category: string;
}

export interface BackendEquityFeature {
  type: 'Feature';
  properties: {
    h3_res7: string;
    total_incidents?: number;
    total_victims?: number;
    need_weight: number;
    deployed_capacity?: number;
    resources_allocated_weight?: number;
    equity_ratio?: number;
    equity_ratio_ei?: number;
    is_neglected: boolean;
    hours_without_service?: number;
    vulnerability_score?: number;
    computed_at: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

// Map backend primary_need to frontend EventType
function mapNeedToEventType(need: string, rawText: string): EventType {
  const upper = (need + ' ' + rawText).toUpperCase();
  if (upper.includes('LANDSLIDE') || upper.includes('ROCKFALL') || upper.includes('MUDSLIDE')) return 'LANDSLIDE';
  if (upper.includes('COLLAPSE') || upper.includes('STRUCTURAL') || upper.includes('EXTRICATION')) return 'COLLAPSE';
  if (upper.includes('MEDICAL') || upper.includes('CARDIAC') || upper.includes('TRAUMA') || upper.includes('SURGE')) return 'MEDICAL_SURGE';
  return 'FLOOD';
}

// Map backend status to frontend IncidentStatus
function mapBackendIncidentStatus(status: string): Incident['status'] {
  const s = status.toUpperCase();
  if (s === 'OPEN') return 'ACTIVE';
  if (s === 'ASSIGNED' || s === 'ON_SCENE') return 'ASSIGNED';
  if (s === 'RESOLVED') return 'RESOLVED';
  return 'ACTIVE';
}

// Map backend asset status to frontend AssetStatus
function mapBackendAssetStatus(status: string): AssetStatus {
  const s = status.toUpperCase();
  if (s === 'AVAILABLE') return 'AVAILABLE';
  if (s === 'ASSIGNED' || s === 'DISPATCHED') return 'EN_ROUTE';
  if (s === 'ON_SCENE') return 'ON_SITE';
  if (s === 'RETURNING') return 'RETURNING';
  if (s === 'STANDBY') return 'STAGED';
  if (s === 'DEGRADED' || s === 'OFFLINE') return 'DAMAGED';
  return 'AVAILABLE';
}

// Explicit map of backend agency_category → frontend AgencyType
const AGENCY_CATEGORY_MAP: Record<string, AgencyType> = {
  'NDRF': 'NDRF',
  'SDRF': 'SDRF',
  'Local_Police': 'POLICE',
  'Health_Dept': 'EMS',
  'NGO_Volunteer': 'ITBP', // ITBP covers mountain volunteer/paramilitary corps
};

// Map agency string to AgencyType — try category map first, then name substring
function mapAgencyCategory(agencyCat: string, agencyName: string): AgencyType {
  if (AGENCY_CATEGORY_MAP[agencyCat]) return AGENCY_CATEGORY_MAP[agencyCat];
  const upper = (agencyName).toUpperCase();
  if (upper.includes('NDRF')) return 'NDRF';
  if (upper.includes('SDRF')) return 'SDRF';
  if (upper.includes('POLICE')) return 'POLICE';
  if (upper.includes('AIIMS') || upper.includes('HOSPITAL') || upper.includes('EMS') || upper.includes('HEALTH') || upper.includes('MEDICAL')) return 'EMS';
  if (upper.includes('ITBP') || upper.includes('NGO') || upper.includes('VOLUNTEER') || upper.includes('HIMALAYAN')) return 'ITBP';
  return 'NDRF';
}

// Normalize capability_tags that may arrive as space-joined string (mock mode) or proper array
function normalizeTags(tags: string[] | string | undefined | null): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  // Space-separated string from mock SQL serialization
  return (tags as string).split(/[\s,]+/).filter(Boolean);
}


// Transform backend incident to frontend Incident
export function transformBackendIncident(b: BackendIncident): Incident {
  const eventType = mapNeedToEventType(b.primary_need, b.raw_sos_text);
  const casualties = {
    affected: b.people_count || 10,
    trapped: Math.max(1, Math.round((b.people_count || 10) * 0.4)),
    injured: b.vulnerable_critical_ill || 0,
    missing: 0,
    children: b.vulnerable_infants || 0,
    elderly: b.vulnerable_elderly || 0,
  };
  const demandVector = computeDemandVector(casualties, eventType);

  // Extract a sensible location name if present, or format based on coordinates
  let zoneName = b.primary_need_detail || 'Alaknanda Valley Sector';
  if (b.raw_sos_text.toLowerCase().includes('rudraprayag')) zoneName = 'Rudraprayag Sangam';
  else if (b.raw_sos_text.toLowerCase().includes('srinagar')) zoneName = 'Srinagar Garhwal Riverside';
  else if (b.raw_sos_text.toLowerCase().includes('joshimath') || b.raw_sos_text.toLowerCase().includes('raini')) zoneName = 'Joshimath Raini Sector';
  else if (b.raw_sos_text.toLowerCase().includes('helang')) zoneName = 'Helang Bridge Km 18';
  else if (b.raw_sos_text.toLowerCase().includes('guptkashi')) zoneName = 'Guptkashi Mountain Hamlet';
  else if (b.raw_sos_text.toLowerCase().includes('karnaprayag')) zoneName = 'Karnaprayag Confluence Ghat';

  const priorityScore = Math.round((b.priority_score <= 1.0 ? b.priority_score * 100 : b.priority_score) * 10) / 10;

  return {
    id: b.id,
    incidentCode: b.id.length > 8 ? `INC-${b.id.slice(-4).toUpperCase()}` : b.id,
    zoneId: `zone-${b.h3_res7.slice(-6)}`,
    zoneName,
    location: {
      lat: Number(b.latitude),
      lng: Number(b.longitude),
    },
    h3Index: b.h3_res9 || b.h3_res7,
    eventType,
    status: mapBackendIncidentStatus(b.status),
    roadStatus: b.raw_sos_text.toLowerCase().includes('blocked') || b.raw_sos_text.toLowerCase().includes('cut off') ? 'BLOCKED' : 'PARTIAL',
    accessNote: b.raw_sos_text,
    casualties,
    demandVector,
    assessment: {
      severity: Math.min(1.0, priorityScore / 100),
      urgency: Math.min(1.0, (priorityScore + 5) / 100),
      needIntensity: Math.min(1.0, (priorityScore + 2) / 100),
      confidence: b.ai_confidence ?? 0.88,
      priorityScore,
    },
    evidenceCount: 3,
    reportedAt: b.created_at ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
    isSilentPocket: b.ai_confidence != null && b.ai_confidence < 0.65,
  };
}

// Transform backend asset to frontend Asset
export function transformBackendAsset(b: BackendAsset): Asset {
  const agency = mapAgencyCategory(b.agency_category, b.agency_name);
  const tags = normalizeTags(b.capability_tags);

  let category: Asset['category'] = 'RESCUE_SQUAD';
  const catUpper = b.category.toUpperCase();
  if (catUpper.includes('BOAT') || catUpper.includes('RAFT') || catUpper.includes('ZODIAC')) category = 'BOAT';
  else if (catUpper.includes('AMBULANCE')) category = 'AMBULANCE';
  else if (catUpper.includes('DRONE') || catUpper.includes('SURVEILLANCE')) category = 'DRONE';
  else if (catUpper.includes('TRUCK') || catUpper.includes('SUPPLY')) category = 'SUPPLY_TRUCK';

  return {
    id: b.id,
    assetCode: b.call_sign || b.id.slice(0, 8),
    name: b.name,
    agency,
    category,
    subType: b.category_detail || b.category.replace(/_/g, ' '),
    capabilities: {
      waterRescue: tags.includes('water_rescue') || category === 'BOAT',
      mountainRescue: tags.includes('search_rescue') || category === 'RESCUE_SQUAD',
      blsMedical: tags.includes('medical_bls') || category === 'AMBULANCE',
      alsMedical: tags.includes('medical_als'),
      rubbleRescue: tags.includes('structural'),
      thermalVision: tags.includes('thermal_camera') || category === 'DRONE',
      passengerCapacity: Number(b.capabilities?.evac_capacity_persons) || (category === 'BOAT' ? 12 : 6),
    },
    capacity: Number(b.capabilities?.evac_capacity_persons) || 12,
    status: mapBackendAssetStatus(b.status),
    currentLocation: {
      lat: Number(b.latitude),
      lng: Number(b.longitude),
    },
    baseStation: b.agency_name || 'Forward Valley Depot',
    batteryLevel: b.fuel_level,
    speedKmh: Number(b.capabilities?.speed_kmh) || 40,
  };
}

// Transform backend equity rows into frontend EquityZone
export function transformBackendEquityFeatures(features: BackendEquityFeature[]): EquityZone[] {
  return features.map((f, idx) => {
    const p = f.properties;
    const ratio = p.equity_ratio ?? p.equity_ratio_ei ?? 0.5;

    let status: EquityZone['status'] = 'ADEQUATE';
    if (p.is_neglected || ratio === 0) status = 'FORGOTTEN';
    else if (ratio < 0.25) status = 'CRITICAL';
    else if (ratio < 0.5) status = 'UNDERSERVED';
    else if (ratio > 1.0) status = 'WELL_SERVED';

    const zoneNames = [
      'Rudraprayag Sangam',
      'Srinagar Garhwal Riverside',
      'Joshimath Raini Sector',
      'Guptkashi Mountain Hamlet',
      'Karnaprayag Confluence Ghat',
      'Devprayag Upper Sector',
    ];

    return {
      zoneId: `zone-${p.h3_res7.slice(-6)}`,
      zoneName: zoneNames[idx % zoneNames.length] || `Valley Sector ${p.h3_res7.slice(-4)}`,
      h3Index: p.h3_res7,
      needWeight: p.need_weight,
      resourcesDeployedWeight: p.deployed_capacity ?? p.resources_allocated_weight ?? 0,
      equityRatioEi: Math.round(ratio * 100) / 100,
      status,
      hoursWithoutResources: p.hours_without_service ?? (status === 'FORGOTTEN' ? 3.2 : 0.8),
      vulnerabilityIndex: p.vulnerability_score ?? 0.65,
      activeIncidentsCount: p.total_incidents ?? 1,
    };
  });
}

export const apiClient = {
  async checkHealth(): Promise<HealthCheckResponse | null> {
    try {
      let res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) {
        res = await fetch('/health', { signal: AbortSignal.timeout(3000) });
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async fetchIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/incidents`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch incidents`);
    const json = await res.json();
    if (!json.ok || !Array.isArray(json.data)) throw new Error('Malformed incidents response');
    return json.data.map(transformBackendIncident);
  },

  async fetchAssets(): Promise<Asset[]> {
    const res = await fetch(`${API_BASE}/assets`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch assets`);
    const json = await res.json();
    if (!json.ok || !Array.isArray(json.data)) throw new Error('Malformed assets response');
    return json.data.map(transformBackendAsset);
  },

  async fetchEquityZones(): Promise<EquityZone[]> {
    const res = await fetch(`${API_BASE}/equity`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch equity data`);
    const json = await res.json();
    if (!json.ok || !json.data?.features) throw new Error('Malformed equity response');
    return transformBackendEquityFeatures(json.data.features);
  },

  async createIncident(payload: {
    raw_sos_text: string;
    latitude: number;
    longitude: number;
    origin_channel?: 'WEB_SOS' | 'FIELD_APP' | 'SMS_GATEWAY' | 'COMMANDER_ENTRY';
    override_need?: string;
    override_priority?: number;
  }): Promise<{ ok: boolean; duplicate?: boolean; incident?: unknown; allocation?: unknown }> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async updateAssetStatus(
    assetId: string,
    status: 'Available' | 'Assigned' | 'On_Scene' | 'Returning' | 'Standby' | 'Refueling_Resting' | 'Degraded' | 'Offline',
    reason?: string
  ): Promise<{ ok: boolean; data?: unknown }> {
    const res = await fetch(`${API_BASE}/assets/${assetId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason, updated_by: 'COMMANDER' }),
    });
    return await res.json();
  },

  async simulateBridgeCut(assetId?: string, reason?: string): Promise<{ ok: boolean; data?: unknown }> {
    const res = await fetch(`${API_BASE}/simulate/degrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset_id: assetId || 'b0000001-0000-0000-0000-000000000001',
        reason: reason || 'NH-07_HELANG_BRIDGE_WASHOUT',
      }),
    });
    return await res.json();
  },

  async batchSync(payload: {
    client_device_id: string;
    synced_at: string;
    queued_incidents: Array<{
      id: string;
      raw_sos_text: string;
      primary_need: string;
      latitude: number;
      longitude: number;
      client_recorded_at: string;
      people_count?: number;
      vulnerable_infants?: number;
      vulnerable_elderly?: number;
      vulnerable_critical_ill?: number;
    }>;
  }): Promise<{ ok: boolean; summary?: { ingested: number; skipped: number; errors: number } }> {
    const res = await fetch(`${API_BASE}/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        asset_telemetry: [],
      }),
    });
    return await res.json();
  },

  async resolveIncident(
    incidentId: string,
    status: 'On_Scene' | 'Resolved' | 'False_Alarm' | 'Duplicate' = 'Resolved'
  ): Promise<{ ok: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, updated_by: 'COMMANDER' }),
      });
      return await res.json();
    } catch {
      return { ok: false };
    }
  },

  async fetchAsset(assetId: string): Promise<Asset | null> {
    try {
      const res = await fetch(`${API_BASE}/assets/${assetId}`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.ok || !json.data) return null;
      return transformBackendAsset(json.data as BackendAsset);
    } catch {
      return null;
    }
  },

  async resetDemo(): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/simulate/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch {
      return { ok: false };
    }
  },
};
