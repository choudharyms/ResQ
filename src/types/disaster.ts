// Disaster Domain Types

export type EventType = 'FLOOD' | 'LANDSLIDE' | 'COLLAPSE' | 'MEDICAL_SURGE';

export type RoadAccessStatus = 'OPEN' | 'PARTIAL' | 'BLOCKED';

export type IncidentStatus = 'ACTIVE' | 'ASSIGNED' | 'RESOLVED' | 'FORGOTTEN';

export type AssetStatus = 'AVAILABLE' | 'EN_ROUTE' | 'ON_SITE' | 'PARTIALLY_USED' | 'RETURNING' | 'STAGED' | 'DAMAGED';

export type AgencyType = 'NDRF' | 'SDRF' | 'ITBP' | 'EMS' | 'POLICE';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface CasualtyProfile {
  affected: number;
  trapped: number;
  injured: number;
  missing: number;
  children: number;
  elderly: number;
}

export interface DemandVector {
  boats: number;
  ambulances: number;
  rescueTeams: number;
  k9Teams: number;
  foodPackets: number;
  waterLitres: number;
  medicalResponders: number;
}

export interface IncidentAssessment {
  severity: number;      // 0 to 1
  urgency: number;       // 0 to 1
  needIntensity: number; // 0 to 1
  confidence: number;    // 0 to 1
  priorityScore: number; // 0 to 100
}

export interface Incident {
  id: string;
  incidentCode: string;
  zoneId: string;
  zoneName: string;
  location: LocationCoords;
  h3Index: string;
  eventType: EventType;
  status: IncidentStatus;
  roadStatus: RoadAccessStatus;
  accessNote: string;
  casualties: CasualtyProfile;
  demandVector: DemandVector;
  assessment: IncidentAssessment;
  evidenceCount: number;
  reportedAt: string;
  isSilentPocket?: boolean;
}

export interface AssetCapabilities {
  waterRescue?: boolean;
  mountainRescue?: boolean;
  blsMedical?: boolean;
  alsMedical?: boolean;
  rubbleRescue?: boolean;
  thermalVision?: boolean;
  patientCapacity?: number;
  passengerCapacity?: number;
}

export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  agency: AgencyType;
  category: 'BOAT' | 'AMBULANCE' | 'RESCUE_SQUAD' | 'DRONE' | 'SUPPLY_TRUCK';
  subType: string;
  capabilities: AssetCapabilities;
  capacity: number;
  status: AssetStatus;
  currentLocation: LocationCoords;
  baseStation: string;
  batteryLevel?: number; // 0 to 1 (for drones/electric)
  speedKmh: number;
  assignedIncidentId?: string;
}

export interface Assignment {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  agency: AgencyType;
  incidentId: string;
  incidentCode: string;
  zoneName: string;
  needType: string;
  travelMinutes: number;
  distanceKm: number;
  routeDescription: string;
  matchScore: number;
  utilityScore: number;
  isEquityForced: boolean;
  reasoning: string[];
}

export interface AllocationPlan {
  planId: string;
  generatedAt: string;
  status: 'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED';
  authorizer: string;
  assignments: Assignment[];
  unmetNeeds: {
    incidentId: string;
    zoneName: string;
    needType: string;
    unmetCount: number;
  }[];
  totalUnitsDispatched: number;
  projectedLivesSecured: number;
  fleetReserveRemainingPct: number;
}

export interface PlanDiffItem {
  assetCode: string;
  assetName: string;
  action: 'REROUTED' | 'NEW_DISPATCH' | 'PAUSED' | 'UNCHANGED';
  previousRoute: string;
  proposedRoute: string;
  travelDeltaMinutes: number;
  operationalReason: string;
}

export interface PlanDiff {
  triggerEvent: string;
  triggeredAt: string;
  previousPlanId: string;
  proposedPlanId: string;
  items: PlanDiffItem[];
  projectedNetLivesSecured: number;
  avgResponseLatencyDeltaMinutes: number;
  fleetReservePct: number;
}

export interface EquityZone {
  zoneId: string;
  zoneName: string;
  h3Index: string;
  needWeight: number;
  resourcesDeployedWeight: number;
  equityRatioEi: number;
  status: 'WELL_SERVED' | 'ADEQUATE' | 'UNDERSERVED' | 'CRITICAL' | 'FORGOTTEN';
  hoursWithoutResources: number;
  vulnerabilityIndex: number;
  activeIncidentsCount: number;
  reportVolumeCount?: number;
  reportingBiasRatio?: number;
  biasCorrectionApplied?: boolean;
}

export interface ShelterFacility {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string;
  location: LocationCoords;
  totalCapacityBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  status: 'OPERATIONAL' | 'NEAR_CAPACITY' | 'FULL';
  medicalStaffCount: number;
  contactRadio: string;
  foodPacketsStock: number;
  waterLitresStock: number;
  medicalKitsStock: number;
  assignedDoctorInCharge: string;
}

export interface FragmentarySOSReport {
  id: string;
  channel: 'SATELLITE_PING' | 'VHF_RADIO' | 'SMS_GATEWAY' | 'CITIZEN_WEB';
  sourceCallsign: string;
  rawSnippet: string;
  receivedAt: string;
  signalConfidence: number; // 0 to 1
  zoneName: string;
  associatedIncidentCode?: string;
  status: 'INGESTED' | 'FUSED' | 'PENDING_VERIFICATION';
}

