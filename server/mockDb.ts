import { latLngToCell } from 'h3-js';

export interface MockAgency {
  id: string;
  category: string;
  category_detail?: string;
  name: string;
  incident_commander?: string;
  radio_channel?: string;
  phone?: string;
}

export interface MockAsset {
  id: string;
  agency_id: string;
  name: string;
  call_sign: string;
  category: string;
  category_detail?: string;
  status: string;
  capability_tags: string[];
  capabilities: Record<string, unknown>;
  fuel_level: number;
  latitude: number;
  longitude: number;
  last_telemetry_at: string;
  is_deleted: boolean;
  updated_at: string;
  updated_by: string;
}

export interface MockIncident {
  id: string;
  raw_sos_text: string;
  origin_channel: string;
  reporter_device_id?: string | null;
  primary_need: string;
  primary_need_detail?: string | null;
  secondary_needs: string[];
  required_capability_tags: string[];
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
  duplicate_of_id?: string | null;
  client_recorded_at: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface MockAllocation {
  id: string;
  incident_id: string;
  asset_id: string;
  allocation_version: number;
  algorithm: string;
  dispatched_by: string;
  distance_km: number;
  est_transit_minutes: number;
  est_fuel_drain: number;
  status: string;
  superseded_by_id?: string | null;
  supersession_reason?: string | null;
  dispatched_at: string;
  on_scene_at?: string | null;
  completed_at?: string | null;
}

class MockDatabase {
  agencies: MockAgency[] = [];
  assets: MockAsset[] = [];
  incidents: MockIncident[] = [];
  allocations: MockAllocation[] = [];

  constructor() {
    this.resetToSeed();
  }

  resetToSeed() {
    this.agencies = [
      { id: 'a0000001-0000-0000-0000-000000000001', category: 'NDRF', name: 'NDRF 8th Battalion Jaipur', incident_commander: 'Col. Rakesh Sharma', radio_channel: 'CH-01', phone: '+91-141-2700001' },
      { id: 'a0000001-0000-0000-0000-000000000002', category: 'SDRF', name: 'SDRF Rajasthan Quick Response', incident_commander: 'Maj. Priya Singh', radio_channel: 'CH-02', phone: '+91-141-2700002' },
      { id: 'a0000001-0000-0000-0000-000000000003', category: 'Local_Police', name: 'Jaipur City Police Civil Defence', incident_commander: 'DCP Anil Gupta', radio_channel: 'CH-03', phone: '+91-141-2700003' },
      { id: 'a0000001-0000-0000-0000-000000000004', category: 'Health_Dept', name: 'SMS Hospital Medical DART', incident_commander: 'Dr. Meena Sharma', radio_channel: 'CH-04', phone: '+91-141-2700004' },
      { id: 'a0000001-0000-0000-0000-000000000005', category: 'NGO_Volunteer', name: 'Jaipur Flood Relief Volunteer Syndicate', incident_commander: 'Ramesh Patel', radio_channel: 'CH-05' },
    ];

    this.assets = [
      { id: 'b0000001-0000-0000-0000-000000000001', agency_id: 'a0000001-0000-0000-0000-000000000001', name: 'NDRF Motorized Rescue Boat Alpha-1', call_sign: 'NDRF-MB1', category: 'Motorized_Rescue_Boat', capability_tags: ['water_rescue', 'evac', 'floodwater_capable'], capabilities: { evac_capacity_persons: 8, speed_kmh: 30, max_range_km: 35, floodwater_capable: true }, fuel_level: 0.92, status: 'Available', latitude: 26.9200, longitude: 75.7800, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000002', agency_id: 'a0000001-0000-0000-0000-000000000001', name: 'NDRF Motorized Rescue Boat Alpha-2', call_sign: 'NDRF-MB2', category: 'Motorized_Rescue_Boat', capability_tags: ['water_rescue', 'evac', 'floodwater_capable'], capabilities: { evac_capacity_persons: 8, speed_kmh: 30, max_range_km: 35, floodwater_capable: true }, fuel_level: 0.78, status: 'Available', latitude: 26.9150, longitude: 75.7650, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000003', agency_id: 'a0000001-0000-0000-0000-000000000001', name: 'NDRF Motorized Rescue Boat Alpha-3', call_sign: 'NDRF-MB3', category: 'Motorized_Rescue_Boat', capability_tags: ['water_rescue', 'evac', 'floodwater_capable'], capabilities: { evac_capacity_persons: 8, speed_kmh: 30, max_range_km: 35, floodwater_capable: true }, fuel_level: 0.85, status: 'Available', latitude: 26.8900, longitude: 75.7900, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000004', agency_id: 'a0000001-0000-0000-0000-000000000001', name: 'NDRF Motorized Rescue Boat Alpha-4', call_sign: 'NDRF-MB4', category: 'Motorized_Rescue_Boat', capability_tags: ['water_rescue', 'evac', 'floodwater_capable'], capabilities: { evac_capacity_persons: 8, speed_kmh: 30, max_range_km: 35, floodwater_capable: true }, fuel_level: 0.60, status: 'Available', latitude: 26.9300, longitude: 75.8050, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000005', agency_id: 'a0000001-0000-0000-0000-000000000001', name: 'NDRF Inflatable Boat Beta-1', call_sign: 'NDRF-IB1', category: 'Inflatable_Rescue_Boat', capability_tags: ['water_rescue', 'evac', 'floodwater_capable', 'shallow_water'], capabilities: { evac_capacity_persons: 4, speed_kmh: 18, max_range_km: 20, floodwater_capable: true, shallow_water: true }, fuel_level: 0.95, status: 'Available', latitude: 26.9050, longitude: 75.7720, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000006', agency_id: 'a0000001-0000-0000-0000-000000000001', name: 'NDRF Inflatable Boat Beta-2', call_sign: 'NDRF-IB2', category: 'Inflatable_Rescue_Boat', capability_tags: ['water_rescue', 'evac', 'floodwater_capable', 'shallow_water'], capabilities: { evac_capacity_persons: 4, speed_kmh: 18, max_range_km: 20, floodwater_capable: true, shallow_water: true }, fuel_level: 0.88, status: 'Available', latitude: 26.8800, longitude: 75.7600, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000007', agency_id: 'a0000001-0000-0000-0000-000000000001', name: 'NDRF Supply Drone Gamma-1', call_sign: 'NDRF-D1', category: 'Payload_Delivery_Drone', capability_tags: ['evac', 'supply_drop', 'recon'], capabilities: { evac_capacity_persons: 0, payload_kg: 5, speed_kmh: 60, max_range_km: 15 }, fuel_level: 0.75, status: 'Available', latitude: 26.9200, longitude: 75.7800, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000008', agency_id: 'a0000001-0000-0000-0000-000000000002', name: 'SDRF Medical Ambulance Delta-1', call_sign: 'SDRF-A1', category: '4x4_Ambulance', capability_tags: ['medical_als', 'medical_bls', 'evac', 'road_capable'], capabilities: { evac_capacity_persons: 3, speed_kmh: 60, max_range_km: 80, medical_als: true, medical_bls: true }, fuel_level: 0.90, status: 'Available', latitude: 26.9100, longitude: 75.7500, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000009', agency_id: 'a0000001-0000-0000-0000-000000000002', name: 'SDRF Medical Ambulance Delta-2', call_sign: 'SDRF-A2', category: '4x4_Ambulance', capability_tags: ['medical_als', 'medical_bls', 'evac', 'road_capable'], capabilities: { evac_capacity_persons: 3, speed_kmh: 60, max_range_km: 80, medical_als: true, medical_bls: true }, fuel_level: 0.82, status: 'Available', latitude: 26.9000, longitude: 75.8100, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000010', agency_id: 'a0000001-0000-0000-0000-000000000002', name: 'SDRF K9 Search Squad Echo-1', call_sign: 'SDRF-K1', category: 'K9_Search_Squad', capability_tags: ['search_rescue', 'structural', 'road_capable'], capabilities: { evac_capacity_persons: 0, speed_kmh: 40, max_range_km: 50, k9: true }, fuel_level: 1.0, status: 'Available', latitude: 26.8950, longitude: 75.7650, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000011', agency_id: 'a0000001-0000-0000-0000-000000000002', name: 'SDRF K9 Search Squad Echo-2', call_sign: 'SDRF-K2', category: 'K9_Search_Squad', capability_tags: ['search_rescue', 'structural', 'road_capable'], capabilities: { evac_capacity_persons: 0, speed_kmh: 40, max_range_km: 50, k9: true }, fuel_level: 1.0, status: 'Available', latitude: 26.9100, longitude: 75.7900, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000012', agency_id: 'a0000001-0000-0000-0000-000000000003', name: 'Jaipur Police Surveillance Drone Foxtrot-1', call_sign: 'JCP-D1', category: 'Surveillance_Drone', capability_tags: ['recon', 'thermal_camera'], capabilities: { evac_capacity_persons: 0, speed_kmh: 80, max_range_km: 10, thermal_camera: true }, fuel_level: 0.95, status: 'Available', latitude: 26.9200, longitude: 75.7800, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000013', agency_id: 'a0000001-0000-0000-0000-000000000003', name: 'Jaipur Police Surveillance Drone Foxtrot-2', call_sign: 'JCP-D2', category: 'Surveillance_Drone', capability_tags: ['recon', 'thermal_camera'], capabilities: { evac_capacity_persons: 0, speed_kmh: 80, max_range_km: 10, thermal_camera: true }, fuel_level: 0.70, status: 'Available', latitude: 26.9000, longitude: 75.7600, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000014', agency_id: 'a0000001-0000-0000-0000-000000000004', name: 'SMS Hospital DART Medical Team Golf-1', call_sign: 'SMS-MT1', category: 'Medical_Team', capability_tags: ['medical_als', 'medical_bls', 'triage', 'road_capable'], capabilities: { evac_capacity_persons: 2, speed_kmh: 50, max_range_km: 30, medical_als: true, medical_bls: true, triage: true }, fuel_level: 1.0, status: 'Available', latitude: 26.9150, longitude: 75.7700, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
      { id: 'b0000001-0000-0000-0000-000000000015', agency_id: 'a0000001-0000-0000-0000-000000000005', name: 'Volunteer Fishing Boat Syndicate Hotel-1', call_sign: 'VOL-B1', category: 'Other', category_detail: 'Private motorized fishing boat fleet — local river knowledge', capability_tags: ['water_rescue', 'evac', 'shallow_water'], capabilities: { evac_capacity_persons: 6, speed_kmh: 15, max_range_km: 18, floodwater_capable: true }, fuel_level: 1.0, status: 'Available', latitude: 26.8900, longitude: 75.7550, last_telemetry_at: new Date().toISOString(), is_deleted: false, updated_at: new Date().toISOString(), updated_by: 'SEED' },
    ];

    this.incidents = [
      { id: 'c0000001-0000-0000-0000-000000000001', raw_sos_text: 'Help help water rising fast, grandma cannot breathe, she has heart problem, second floor Civil Hospital colony', origin_channel: 'WEB_SOS', primary_need: 'Medical_Emergency', secondary_needs: [], required_capability_tags: ['medical_als', 'evac'], ai_triage_tier: 'T1_Immediate', priority_score: 0.97, ai_confidence: 0.95, ai_rationale: 'T1_Immediate: cardiac patient in rising floodwater, imminent life risk within 1 hour.', people_count: 2, vulnerable_infants: 0, vulnerable_elderly: 1, vulnerable_critical_ill: 1, latitude: 26.9250, longitude: 75.7830, h3_res7: '873da218cffffff', h3_res9: '893da218c03ffff', status: 'Open', client_recorded_at: new Date().toISOString(), created_at: new Date(Date.now() - 600000).toISOString(), updated_at: new Date().toISOString(), updated_by: 'SYSTEM' },
      { id: 'c0000001-0000-0000-0000-000000000002', raw_sos_text: '5 log phase ghar ki chhat par hai, paani bahut tej aa raha hai, bachcha 6 mahine ka hai, kuch nahi hai khane ko', origin_channel: 'FIELD_APP', primary_need: 'Water_Evacuation', secondary_needs: [], required_capability_tags: ['water_rescue', 'evac'], ai_triage_tier: 'T1_Immediate', priority_score: 0.92, ai_confidence: 0.91, ai_rationale: 'T1_Immediate: 5 people including 6-month infant stranded on rooftop in rapidly rising water.', people_count: 5, vulnerable_infants: 1, vulnerable_elderly: 0, vulnerable_critical_ill: 0, latitude: 26.9180, longitude: 75.7700, h3_res7: '873da2181ffffff', h3_res9: '893da218123ffff', status: 'Open', client_recorded_at: new Date().toISOString(), created_at: new Date(Date.now() - 500000).toISOString(), updated_at: new Date().toISOString(), updated_by: 'SYSTEM' },
      { id: 'c0000001-0000-0000-0000-000000000003', raw_sos_text: 'Two old people on terrace Mansarovar ext, water at 4 feet in street, cannot walk downstairs, diabetic', origin_channel: 'WEB_SOS', primary_need: 'Water_Evacuation', secondary_needs: [], required_capability_tags: ['water_rescue', 'evac'], ai_triage_tier: 'T1_Immediate', priority_score: 0.89, ai_confidence: 0.88, ai_rationale: 'T1_Immediate: two diabetic elderly isolated on rooftop, road submerged, no self-evacuation possible.', people_count: 2, vulnerable_infants: 0, vulnerable_elderly: 2, vulnerable_critical_ill: 1, latitude: 26.9120, longitude: 75.7620, h3_res7: '873da2181ffffff', h3_res9: '893da218173ffff', status: 'Open', client_recorded_at: new Date().toISOString(), created_at: new Date(Date.now() - 400000).toISOString(), updated_at: new Date().toISOString(), updated_by: 'SYSTEM' },
      { id: 'c0000001-0000-0000-0000-000000000004', raw_sos_text: 'Building collapse near Dravyavati, 3 people trapped under rubble, one is a child, we can hear them', origin_channel: 'COMMANDER_ENTRY', primary_need: 'Structural_Extrication', secondary_needs: [], required_capability_tags: ['search_rescue', 'structural'], ai_triage_tier: 'T1_Immediate', priority_score: 0.95, ai_confidence: 0.93, ai_rationale: 'T1_Immediate: confirmed live victims under structural collapse, child among trapped.', people_count: 3, vulnerable_infants: 1, vulnerable_elderly: 0, vulnerable_critical_ill: 2, latitude: 26.9040, longitude: 75.7960, h3_res7: '873da2188ffffff', h3_res9: '893da21885bffff', status: 'Open', client_recorded_at: new Date().toISOString(), created_at: new Date(Date.now() - 300000).toISOString(), updated_at: new Date().toISOString(), updated_by: 'SYSTEM' },
      { id: 'c0000001-0000-0000-0000-000000000005', raw_sos_text: 'My father is on peritoneal dialysis machine, power cut for 6 hours, battery backup dying, please help Pratap Nagar', origin_channel: 'WEB_SOS', primary_need: 'Power_Medical_Equipment', secondary_needs: [], required_capability_tags: ['medical_als', 'road_capable'], ai_triage_tier: 'T1_Immediate', priority_score: 0.93, ai_confidence: 0.90, ai_rationale: 'T1_Immediate: dialysis-dependent patient with imminent equipment power failure.', people_count: 1, vulnerable_infants: 0, vulnerable_elderly: 0, vulnerable_critical_ill: 1, latitude: 26.8980, longitude: 75.7550, h3_res7: '873da2183ffffff', h3_res9: '893da218313ffff', status: 'Open', client_recorded_at: new Date().toISOString(), created_at: new Date(Date.now() - 200000).toISOString(), updated_at: new Date().toISOString(), updated_by: 'SYSTEM' },
    ];

    this.allocations = [];
  }

  // Haversine distance in km
  calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  fn_allocate_asset(incidentId: string, dispatchedBy: string = 'SYSTEM_AI') {
    const incident = this.incidents.find(i => i.id === incidentId && i.status === 'Open');
    if (!incident) {
      return { ok: false, code: 'INCIDENT_NOT_AVAILABLE', message: 'Incident not available' };
    }

    // Find best asset: Available, non-deleted, matches required capability tags
    const candidates = this.assets
      .filter(a => a.status === 'Available' && !a.is_deleted)
      .filter(a => incident.required_capability_tags.every(tag => a.capability_tags.includes(tag)))
      .map(a => {
        const dist_km = this.calcDistanceKm(a.latitude, a.longitude, incident.latitude, incident.longitude);
        const speed_kmh = (a.capabilities.speed_kmh as number) || 30;
        const max_range_km = (a.capabilities.max_range_km as number) || 20;
        const score = (dist_km / max_range_km) * 0.65 + (1.0 - a.fuel_level) * 0.35;
        return { asset: a, dist_km, speed_kmh, max_range_km, score };
      })
      .sort((a, b) => a.score - b.score);

    if (candidates.length === 0) {
      return { ok: false, code: 'NO_ASSET_AVAILABLE', message: 'No capable asset available in range' };
    }

    const best = candidates[0];
    const prevAllocs = this.allocations.filter(al => al.incident_id === incidentId);
    const allocVersion = prevAllocs.length + 1;

    // Mutate state
    incident.status = 'Assigned';
    incident.updated_at = new Date().toISOString();
    incident.updated_by = dispatchedBy;

    best.asset.status = 'Assigned';
    best.asset.updated_at = new Date().toISOString();
    best.asset.updated_by = dispatchedBy;

    const allocId = `d0000001-0000-0000-0000-${String(this.allocations.length + 1).padStart(12, '0')}`;
    const allocation: MockAllocation = {
      id: allocId,
      incident_id: incident.id,
      asset_id: best.asset.id,
      allocation_version: allocVersion,
      algorithm: 'GREEDY_CAPABILITY_HAVERSINE',
      dispatched_by: dispatchedBy,
      distance_km: Math.round(best.dist_km * 100) / 100,
      est_transit_minutes: Math.round((best.dist_km / best.speed_kmh) * 60 * 10) / 10,
      est_fuel_drain: Math.round((best.dist_km / best.max_range_km) * 0.5 * 100) / 100,
      status: 'Dispatched',
      dispatched_at: new Date().toISOString(),
    };
    this.allocations.push(allocation);

    return {
      ok: true,
      incident_id: incident.id,
      asset_id: best.asset.id,
      asset_name: best.asset.name,
      call_sign: best.asset.call_sign,
      distance_km: allocation.distance_km,
      eta_minutes: allocation.est_transit_minutes,
      alloc_version: allocVersion,
    };
  }

  fn_handle_asset_degradation(assetId: string, reason: string = 'ASSET_DEGRADED') {
    const asset = this.assets.find(a => a.id === assetId);
    if (!asset) return { ok: false, code: 'ASSET_NOT_FOUND' };

    // Find active allocation
    const activeAlloc = this.allocations
      .filter(al => al.asset_id === assetId && !['Completed', 'Superseded'].includes(al.status))
      .sort((a, b) => new Date(b.dispatched_at).getTime() - new Date(a.dispatched_at).getTime())[0];

    asset.status = 'Degraded';
    asset.updated_at = new Date().toISOString();
    asset.updated_by = 'SYSTEM_FAILOVER';

    if (!activeAlloc) {
      return { ok: true, orphaned_incident: false };
    }

    activeAlloc.status = 'Superseded';
    activeAlloc.supersession_reason = reason;

    const incident = this.incidents.find(i => i.id === activeAlloc.incident_id);
    if (incident) {
      incident.status = 'Open';
      incident.updated_at = new Date().toISOString();
      incident.updated_by = 'SYSTEM_FAILOVER';
    }

    return {
      ok: true,
      orphaned_incident: true,
      incident_id: activeAlloc.incident_id,
      superseded_alloc: activeAlloc.id,
    };
  }

  fn_update_allocation_status(assetId: string, newStatus: string, updatedBy: string = 'SYSTEM') {
    if (!['En_Route', 'On_Scene', 'Completed'].includes(newStatus)) {
      return { ok: false, code: 'INVALID_STATUS' };
    }

    const activeAlloc = this.allocations
      .filter(al => al.asset_id === assetId && !['Completed', 'Superseded'].includes(al.status))
      .sort((a, b) => new Date(b.dispatched_at).getTime() - new Date(a.dispatched_at).getTime())[0];

    if (!activeAlloc) return { ok: false, code: 'NO_ACTIVE_ALLOCATION' };

    activeAlloc.status = newStatus;
    const now = new Date().toISOString();
    if (newStatus === 'On_Scene') activeAlloc.on_scene_at = now;
    if (newStatus === 'Completed') activeAlloc.completed_at = now;

    const asset = this.assets.find(a => a.id === assetId);
    const incident = this.incidents.find(i => i.id === activeAlloc.incident_id);

    if (newStatus === 'On_Scene') {
      if (asset) { asset.status = 'On_Scene'; asset.updated_at = now; asset.updated_by = updatedBy; }
      if (incident) { incident.status = 'On_Scene'; incident.updated_at = now; incident.updated_by = updatedBy; }
    } else if (newStatus === 'Completed') {
      if (asset) { asset.status = 'Returning'; asset.updated_at = now; asset.updated_by = updatedBy; }
      if (incident) { incident.status = 'Resolved'; incident.updated_at = now; incident.updated_by = updatedBy; }
    }

    return {
      ok: true,
      allocation_id: activeAlloc.id,
      incident_id: activeAlloc.incident_id,
      new_status: newStatus,
    };
  }

  getHexEquityRows() {
    const activeIncidents = this.incidents.filter(i => !['Resolved', 'Duplicate', 'False_Alarm'].includes(i.status));
    const hexMap = new Map<string, { total_incidents: number; total_victims: number; need_weight: number; deployed_capacity: number }>();

    for (const inc of activeIncidents) {
      const v = 1.0 + 0.3 * inc.vulnerable_infants + 0.2 * inc.vulnerable_elderly + 0.4 * inc.vulnerable_critical_ill;
      const w = inc.people_count * inc.priority_score * v;
      const existing = hexMap.get(inc.h3_res7) || { total_incidents: 0, total_victims: 0, need_weight: 0, deployed_capacity: 0 };
      existing.total_incidents += 1;
      existing.total_victims += inc.people_count;
      existing.need_weight += w;
      hexMap.set(inc.h3_res7, existing);
    }

    // Capacity from active allocations
    const activeAllocs = this.allocations.filter(al => !['Completed', 'Superseded'].includes(al.status));
    for (const al of activeAllocs) {
      const inc = this.incidents.find(i => i.id === al.incident_id);
      const asset = this.assets.find(a => a.id === al.asset_id);
      if (inc && asset) {
        const cap = (asset.capabilities.evac_capacity_persons as number) || 1;
        const entry = hexMap.get(inc.h3_res7);
        if (entry) entry.deployed_capacity += cap;
      }
    }

    const rows = [];
    for (const [h3_res7, data] of hexMap.entries()) {
      const equity_ratio = data.need_weight === 0 ? 1.0 : Math.round((data.deployed_capacity / data.need_weight) * 10000) / 10000;
      const is_neglected = data.need_weight > 3.0 && equity_ratio < 0.35;
      rows.push({
        h3_res7,
        total_incidents: data.total_incidents,
        total_victims: data.total_victims,
        need_weight: Math.round(data.need_weight * 100) / 100,
        deployed_capacity: data.deployed_capacity,
        equity_ratio,
        is_neglected,
        computed_at: new Date().toISOString(),
      });
    }

    return rows.sort((a, b) => a.equity_ratio - b.equity_ratio);
  }

  async query<T = any>(sql: string, values: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const s = sql.trim().toUpperCase();

    // Transactions
    if (s.startsWith('BEGIN') || s.startsWith('COMMIT') || s.startsWith('ROLLBACK')) {
      return { rows: [], rowCount: 0 };
    }

    // Refresh equity
    if (s.includes('FN_REFRESH_EQUITY')) {
      return { rows: [] as T[], rowCount: 1 };
    }

    // Equity: neglected hexes
    if (s.includes('MV_HEX_EQUITY') && s.includes('IS_NEGLECTED = TRUE')) {
      const limit = typeof values[0] === 'number' ? values[0] : 5;
      const rows = this.getHexEquityRows().filter(r => r.is_neglected).slice(0, limit) as unknown as T[];
      return { rows, rowCount: rows.length };
    }

    // Equity: all hexes
    if (s.includes('MV_HEX_EQUITY')) {
      const rows = this.getHexEquityRows() as unknown as T[];
      return { rows, rowCount: rows.length };
    }

    // Assets: list all
    if (s.includes('FROM ASSETS A') && s.includes('JOIN AGENCIES AG')) {
      const rows = this.assets.filter(a => !a.is_deleted).map(a => {
        const agency = this.agencies.find(ag => ag.id === a.agency_id);
        return {
          id: a.id,
          name: a.name,
          call_sign: a.call_sign,
          category: a.category,
          category_detail: a.category_detail || null,
          status: a.status,
          capability_tags: a.capability_tags,
          capabilities: a.capabilities,
          fuel_level: a.fuel_level,
          longitude: a.longitude,
          latitude: a.latitude,
          last_telemetry_at: a.last_telemetry_at,
          updated_at: a.updated_at,
          agency_name: agency?.name || 'NDRF',
          agency_category: agency?.category || 'NDRF',
        };
      }) as unknown as T[];
      return { rows, rowCount: rows.length };
    }

    // Assets: update telemetry
    if (s.startsWith('UPDATE ASSETS') && s.includes('LAST_TELEMETRY_AT')) {
      // latitude=$1 or $2, longitude, fuel_level, id
      const id = values[values.length - 1];
      const asset = this.assets.find(a => a.id === id);
      if (asset) {
        asset.latitude = Number(values[0]);
        asset.longitude = Number(values[1]);
        if (values[2] != null) asset.fuel_level = Number(values[2]);
        asset.last_telemetry_at = new Date().toISOString();
        asset.updated_at = new Date().toISOString();
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // Assets: update status
    if (s.startsWith('UPDATE ASSETS') && s.includes('STATUS =')) {
      const id = values[values.length - 1];
      const status = values[0];
      const updatedBy = values[1] || 'COMMANDER';
      const asset = this.assets.find(a => a.id === id);
      if (asset) {
        asset.status = status;
        asset.updated_by = updatedBy;
        asset.updated_at = new Date().toISOString();
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // Incidents: deduplication query
    if (s.includes('FROM   INCIDENTS') && s.includes('H3_RES9 = $1') && s.includes('PRIMARY_NEED = $2')) {
      const h3 = values[0];
      const need = values[1];
      const match = this.incidents.find(i => i.h3_res9 === h3 && i.primary_need === need && !['Resolved', 'Duplicate', 'False_Alarm'].includes(i.status));
      return { rows: match ? [{ id: match.id }] as unknown as T[] : [], rowCount: match ? 1 : 0 };
    }

    // Incidents: get by ID
    if (s.includes('FROM INCIDENTS I') && s.includes('WHERE I.ID = $1')) {
      const id = values[0];
      const i = this.incidents.find(item => item.id === id);
      if (!i) return { rows: [], rowCount: 0 };
      const alloc = this.allocations.find(al => al.incident_id === i.id && !['Completed', 'Superseded'].includes(al.status));
      const row = {
        ...i,
        assigned_asset_id: alloc?.asset_id || null,
        distance_km: alloc?.distance_km || null,
        est_transit_minutes: alloc?.est_transit_minutes || null,
        dispatched_at: alloc?.dispatched_at || null,
        allocation_status: alloc?.status || null,
      } as unknown as T;
      return { rows: [row], rowCount: 1 };
    }

    // Incidents: list queue
    if (s.includes('FROM INCIDENTS I') && s.includes('LEFT JOIN ACTIVE_ALLOCATIONS')) {
      const status = values[0] || 'Open';
      const limit = typeof values[1] === 'number' ? values[1] : 100;
      const matched = this.incidents.filter(i => i.status === status).slice(0, limit);
      const rows = matched.map(i => {
        const alloc = this.allocations.find(al => al.incident_id === i.id && !['Completed', 'Superseded'].includes(al.status));
        return {
          ...i,
          assigned_asset_id: alloc?.asset_id || null,
          distance_km: alloc?.distance_km || null,
          est_transit_minutes: alloc?.est_transit_minutes || null,
          dispatched_at: alloc?.dispatched_at || null,
        };
      }) as unknown as T[];
      return { rows, rowCount: rows.length };
    }

    // Incidents: update status
    if (s.startsWith('UPDATE INCIDENTS') && s.includes('STATUS = $1')) {
      const status = values[0];
      const updatedBy = values[1];
      const id = values[2];
      const inc = this.incidents.find(i => i.id === id);
      if (inc) {
        inc.status = status;
        inc.updated_by = updatedBy;
        inc.updated_at = new Date().toISOString();
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // Incidents: insert (either standard or sync batch)
    if (s.startsWith('INSERT INTO INCIDENTS')) {
      // Create new incident
      const isBatch = s.includes('ON CONFLICT (ID) DO NOTHING');
      const id = isBatch ? values[0] : `c0000001-0000-0000-0000-${String(this.incidents.length + 1).padStart(12, '0')}`;
      
      const newInc: MockIncident = {
        id,
        raw_sos_text: isBatch ? values[1] : values[0],
        origin_channel: isBatch ? values[2] : values[1],
        reporter_device_id: isBatch ? values[3] : values[2],
        primary_need: isBatch ? values[4] : values[3],
        primary_need_detail: isBatch ? values[5] : values[4],
        secondary_needs: (isBatch ? values[6] : values[5]) || [],
        required_capability_tags: (isBatch ? values[7] : values[6]) || [],
        ai_triage_tier: isBatch ? values[8] : values[7],
        priority_score: isBatch ? values[9] : values[8],
        ai_confidence: isBatch ? values[10] : values[9],
        ai_rationale: isBatch ? values[11] : values[10],
        people_count: Number(isBatch ? values[12] : values[11]),
        vulnerable_infants: Number(isBatch ? values[13] : values[12]),
        vulnerable_elderly: Number(isBatch ? values[14] : values[13]),
        vulnerable_critical_ill: Number(isBatch ? values[15] : values[14]),
        latitude: Number(isBatch ? values[16] : values[15]),
        longitude: Number(isBatch ? values[17] : values[16]),
        h3_res7: isBatch ? values[18] : values[17],
        h3_res9: isBatch ? values[19] : values[18],
        status: 'Open',
        client_recorded_at: isBatch ? values[20] : new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'SYSTEM',
      };

      if (isBatch && this.incidents.some(i => i.id === id)) {
        return { rows: [], rowCount: 0 };
      }

      this.incidents.push(newInc);
      return { rows: [{ id }] as unknown as T[], rowCount: 1 };
    }

    // Reset simulator
    if (s.includes('DELETE FROM ALLOCATIONS')) {
      this.allocations = [];
      return { rows: [], rowCount: 0 };
    }
    if (s.includes('DELETE FROM INCIDENTS')) {
      this.incidents = [];
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  }
}

export const mockDb = new MockDatabase();
