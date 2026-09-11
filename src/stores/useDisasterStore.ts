import { create } from 'zustand';
import {
  Incident,
  Asset,
  AllocationPlan,
  PlanDiff,
  EquityZone,
  ShelterFacility,
  FragmentarySOSReport,
} from '../types/disaster';
import {
  INITIAL_INCIDENTS,
  INITIAL_ASSETS,
  INITIAL_EQUITY_ZONES,
  INITIAL_SHELTERS,
  INITIAL_FRAGMENTARY_FEED,
} from '../data/uttarakhandData';
import { runDeterministicAllocation } from '../engines/allocatorEngine';
import { evaluateEquityMetrics } from '../engines/equityEngine';
import { generatePlanDiff } from '../engines/dynamicEngine';
import {
  assessIncident,
  computeDemandVector,
} from '../engines/priorityEngine';
import {
  playDispatchChime,
  playEmergencySiren,
  playEquityRadarPulse,
} from '../utils/soundFx';
import { apiClient } from '../services/apiClient';
import {
  queueOfflineSos,
  getUnsyncedSosReports,
  markSosReportsSynced,
  countUnsyncedSosReports,
} from '../services/offlineDb';

interface DisasterState {
  incidents: Incident[];
  selectedIncidentId: string | null;
  assets: Asset[];
  equityZones: EquityZone[];
  shelters: ShelterFacility[];
  fragmentaryFeed: FragmentarySOSReport[];
  activeInventoryTab: 'FLEET' | 'SHELTERS_SUPPLIES';
  activeIncidentView: 'CANONICAL' | 'FRAGMENTARY_FEED';
  activePlan: AllocationPlan | null;
  activePlanDiff: PlanDiff | null;
  isHighwayCut: boolean;
  isDiffModalOpen: boolean;
  isEquityDrawerOpen: boolean;
  isFieldFormOpen: boolean;
  isFleetDrawerOpen: boolean;
  isDegradedMode: boolean;
  offlineQueueCount: number;
  isMuted: boolean;
  tourStep: number | null; // 1: Ingestion, 2: Allocation, 3: Road Cut Diff, 4: Equity

  // Backend Integration State
  isApiConnected: boolean;
  backendMode: 'LIVE_API' | 'LOCAL_SIMULATION';
  isSyncing: boolean;
  lastSyncTime: string | null;

  // Actions
  hydrateFromBackend: () => Promise<void>;
  selectIncident: (id: string | null) => void;
  runAllocation: () => void;
  approveCurrentPlan: () => void;
  toggleHighwayCut: () => void;
  forceEquityAllocation: (zoneId: string) => void;
  addIncident: (data: {
    zoneName: string;
    eventType: Incident['eventType'];
    casualties: Incident['casualties'];
    location: Incident['location'];
    accessNote: string;
  }) => Promise<void>;
  setDiffModalOpen: (open: boolean) => void;
  setEquityDrawerOpen: (open: boolean) => void;
  setFieldFormOpen: (open: boolean) => void;
  setFleetDrawerOpen: (open: boolean) => void;
  setActiveInventoryTab: (tab: 'FLEET' | 'SHELTERS_SUPPLIES') => void;
  setActiveIncidentView: (view: 'CANONICAL' | 'FRAGMENTARY_FEED') => void;
  updateShelterOccupancy: (shelterId: string, deltaBeds: number) => void;
  dispatchSuppliesToZone: (shelterId: string, zoneId: string, food: number, water: number, kits: number) => void;
  toggleDegradedMode: () => Promise<void>;
  toggleMute: () => void;
  setTourStep: (step: number | null) => void;
}

export const useDisasterStore = create<DisasterState>((set, get) => ({
  incidents: INITIAL_INCIDENTS,
  selectedIncidentId: INITIAL_INCIDENTS[0].id,
  assets: INITIAL_ASSETS,
  equityZones: INITIAL_EQUITY_ZONES,
  shelters: INITIAL_SHELTERS,
  fragmentaryFeed: INITIAL_FRAGMENTARY_FEED,
  activeInventoryTab: 'FLEET',
  activeIncidentView: 'CANONICAL',
  activePlan: null,
  activePlanDiff: null,
  isHighwayCut: false,
  isDiffModalOpen: false,
  isEquityDrawerOpen: false,
  isFieldFormOpen: false,
  isFleetDrawerOpen: false,
  isDegradedMode: false,
  offlineQueueCount: 0,
  isMuted: false,
  tourStep: null,

  // Backend Integration Initial State
  isApiConnected: false,
  backendMode: 'LOCAL_SIMULATION',
  isSyncing: false,
  lastSyncTime: null,

  hydrateFromBackend: async () => {
    set({ isSyncing: true });
    try {
      // Check API health
      const health = await apiClient.checkHealth();
      if (!health || !health.ok) {
        console.warn('[ResQ] Express API unreachable, continuing in deterministic local mode');
        set({
          isApiConnected: false,
          backendMode: 'LOCAL_SIMULATION',
          isSyncing: false,
        });
        get().runAllocation();
        return;
      }

      // Fetch live incidents, assets, and equity zones concurrently
      const [backendIncidents, backendAssets, backendEquity] = await Promise.all([
        apiClient.fetchIncidents().catch((err) => {
          console.warn('[ResQ] Incidents fetch fallback:', err);
          return null;
        }),
        apiClient.fetchAssets().catch((err) => {
          console.warn('[ResQ] Assets fetch fallback:', err);
          return null;
        }),
        apiClient.fetchEquityZones().catch((err) => {
          console.warn('[ResQ] Equity fetch fallback:', err);
          return null;
        }),
      ]);

      const currentIncidents = backendIncidents && backendIncidents.length > 0 ? backendIncidents : get().incidents;
      const currentAssets = backendAssets && backendAssets.length > 0 ? backendAssets : get().assets;
      const currentEquity = backendEquity && backendEquity.length > 0 ? backendEquity : get().equityZones;

      // Check Dexie for pending offline records
      const pendingCount = await countUnsyncedSosReports().catch(() => 0);

      set({
        incidents: currentIncidents,
        selectedIncidentId: currentIncidents[0]?.id || null,
        assets: currentAssets,
        equityZones: currentEquity,
        isApiConnected: true,
        backendMode: 'LIVE_API',
        isSyncing: false,
        lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        offlineQueueCount: pendingCount,
      });

      // Run deterministic allocation over active state
      get().runAllocation();
    } catch (err) {
      console.error('[ResQ] Hydration failed, falling back to local simulation:', err);
      set({
        isApiConnected: false,
        backendMode: 'LOCAL_SIMULATION',
        isSyncing: false,
      });
      get().runAllocation();
    }
  },

  selectIncident: (id) => set({ selectedIncidentId: id }),

  runAllocation: () => {
    const { incidents, assets, isHighwayCut, equityZones } = get();
    const newPlan = runDeterministicAllocation(incidents, assets, isHighwayCut);
    const updatedEquity = evaluateEquityMetrics(
      equityZones,
      incidents,
      newPlan.assignments,
      assets
    );
    set({ activePlan: newPlan, equityZones: updatedEquity });
  },

  approveCurrentPlan: () => {
    const { activePlan, assets, isMuted, isApiConnected } = get();
    if (!activePlan) return;

    // Trigger tactical sound
    playDispatchChime(isMuted);

    // Update asset statuses to EN_ROUTE
    const assignedAssetIds = new Set(activePlan.assignments.map((a) => a.assetId));
    const updatedAssets = assets.map((asset) => {
      if (assignedAssetIds.has(asset.id)) {
        // Asynchronously notify backend if online
        if (isApiConnected) {
          apiClient.updateAssetStatus(asset.id, 'Assigned', 'COMMANDER_APPROVED_PLAN').catch((e) =>
            console.warn('[ResQ] Failed to push asset status update:', e)
          );
        }
        return { ...asset, status: 'EN_ROUTE' as const };
      }
      return asset;
    });

    const approvedPlan: AllocationPlan = {
      ...activePlan,
      status: 'APPROVED',
    };

    set({
      activePlan: approvedPlan,
      assets: updatedAssets,
      isDiffModalOpen: false,
    });
  },

  toggleHighwayCut: () => {
    const { isHighwayCut, incidents, assets, activePlan, equityZones, isMuted, isApiConnected } = get();
    const nextCutState = !isHighwayCut;

    // Sound alert on road cut mutation
    if (nextCutState) {
      playEmergencySiren(isMuted);
    } else {
      playDispatchChime(isMuted);
    }

    // Notify backend if connected
    if (isApiConnected) {
      apiClient.simulateBridgeCut(undefined, nextCutState ? 'NH-07_WASHOUT' : 'NH-07_CLEARED').catch((e) =>
        console.warn('[ResQ] Bridge cut sync error:', e)
      );
    }

    // Re-run allocator with or without highway cut penalty
    const newPlan = runDeterministicAllocation(incidents, assets, nextCutState);

    // If an approved or active plan existed, generate a dynamic plan diff
    if (activePlan) {
      const diff = generatePlanDiff(
        activePlan,
        newPlan,
        nextCutState
          ? 'CRITICAL EVENT: NH-07 Washed Out at Helang Bridge Km 18'
          : 'CLEARANCE EVENT: NH-07 Helang Bridge Cleared by Border Roads Org'
      );
      const updatedEquity = evaluateEquityMetrics(
        equityZones,
        incidents,
        newPlan.assignments,
        assets
      );
      set({
        isHighwayCut: nextCutState,
        activePlan: newPlan,
        activePlanDiff: diff,
        isDiffModalOpen: true,
        equityZones: updatedEquity,
      });
    } else {
      set({ isHighwayCut: nextCutState, activePlan: newPlan });
    }
  },

  forceEquityAllocation: (zoneId) => {
    const { incidents, assets, activePlan, equityZones } = get();
    const targetZone = equityZones.find((z) => z.zoneId === zoneId);
    if (!targetZone) return;

    // Find available asset
    const availableAsset = assets.find((a) => a.status === 'AVAILABLE');
    if (!availableAsset) return;

    const targetIncident = incidents.find((i) => i.zoneId === zoneId) || incidents[0];

    const forcedAssignment = {
      id: `forced-${availableAsset.id}-${Date.now()}`,
      assetId: availableAsset.id,
      assetCode: availableAsset.assetCode,
      assetName: availableAsset.name,
      agency: availableAsset.agency,
      incidentId: targetIncident.id,
      incidentCode: targetIncident.incidentCode,
      zoneName: targetZone.zoneName,
      needType: 'Emergency Equity Squad',
      travelMinutes: 35,
      distanceKm: 28,
      routeDescription: 'Priority Direct Valley Route',
      matchScore: 1.0,
      utilityScore: 99.0,
      isEquityForced: true,
      reasoning: [
        'Mandatory Equity Override: Zone had Ei = 0 for >90 mins',
        'Next available multi-agency asset pulled from central reserve',
        'Direct mountain dispatch authorized to prevent catastrophic delay',
        'Assigned by: ALGORITHMIC FAIRNESS LAYER',
      ],
    };

    const currentAssignments = activePlan ? activePlan.assignments : [];
    const updatedPlan: AllocationPlan = {
      planId: activePlan?.planId || `OPT-EQ-${Math.floor(1000 + Math.random() * 9000)}`,
      generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      status: 'PENDING',
      authorizer: 'Algorithmic Fairness Layer / Cmdr Raj Kumar',
      assignments: [forcedAssignment, ...currentAssignments],
      unmetNeeds: activePlan?.unmetNeeds || [],
      totalUnitsDispatched: (activePlan?.totalUnitsDispatched || 0) + 1,
      projectedLivesSecured: (activePlan?.projectedLivesSecured || 0) + 24,
      fleetReserveRemainingPct: Math.max((activePlan?.fleetReserveRemainingPct || 40) - 6, 10),
    };

    const updatedAssets = assets.map((a) =>
      a.id === availableAsset.id ? { ...a, status: 'EN_ROUTE' as const } : a
    );

    const updatedEquity = evaluateEquityMetrics(
      equityZones,
      incidents,
      updatedPlan.assignments,
      updatedAssets
    );

    // Audio radar chime on equity rescue
    playEquityRadarPulse(get().isMuted);

    set({
      activePlan: updatedPlan,
      assets: updatedAssets,
      equityZones: updatedEquity,
      isEquityDrawerOpen: true,
    });
  },

  addIncident: async (data) => {
    const { isDegradedMode, isMuted, isApiConnected } = get();

    playDispatchChime(isMuted);

    const newId = `inc-${Date.now()}`;
    const code = `INC-${Math.floor(2000 + Math.random() * 8000)}`;
    const demandVector = computeDemandVector(data.casualties, data.eventType);

    const draftIncident: Incident = {
      id: newId,
      incidentCode: code,
      zoneId: `zone-${Date.now()}`,
      zoneName: data.zoneName,
      location: data.location,
      h3Index: '88609a6544fffff',
      eventType: data.eventType,
      status: 'ACTIVE',
      roadStatus: 'PARTIAL',
      accessNote: data.accessNote,
      casualties: data.casualties,
      demandVector,
      assessment: {
        severity: 0.8,
        urgency: 0.85,
        needIntensity: 0.9,
        confidence: 0.88,
        priorityScore: 84.0,
      },
      evidenceCount: 1,
      reportedAt: 'Just now',
    };

    const assessedAssessment = assessIncident(draftIncident);
    draftIncident.assessment = assessedAssessment;

    // Optimistic UI update
    set((state) => {
      const updated = [draftIncident, ...state.incidents];
      return {
        incidents: updated,
        selectedIncidentId: draftIncident.id,
      };
    });

    // Re-evaluate allocations immediately with zero latency
    get().runAllocation();

    // Offline / Degraded or Network Disconnect Handling
    if (isDegradedMode || !isApiConnected) {
      await queueOfflineSos({
        id: draftIncident.id,
        raw_sos_text: `${data.zoneName}: ${data.eventType} - ${data.accessNote}`,
        primary_need: data.eventType === 'FLOOD' ? 'Water_Evacuation' : data.eventType === 'LANDSLIDE' ? 'Road_Clearance' : 'Medical_Emergency',
        latitude: data.location.lat,
        longitude: data.location.lng,
        client_recorded_at: new Date().toISOString(),
        people_count: data.casualties.affected,
        vulnerable_infants: data.casualties.children,
        vulnerable_elderly: data.casualties.elderly,
        vulnerable_critical_ill: data.casualties.injured,
      }).catch((e) => console.warn('[ResQ] Dexie queue error:', e));

      set((state) => ({ offlineQueueCount: state.offlineQueueCount + 1 }));
      return;
    }

    // Online dispatch to Express backend
    try {
      await apiClient.createIncident({
        raw_sos_text: `${data.zoneName}: ${data.eventType} - ${data.accessNote} (Affected: ${data.casualties.affected})`,
        latitude: data.location.lat,
        longitude: data.location.lng,
        origin_channel: 'FIELD_APP',
      });
    } catch (err) {
      console.warn('[ResQ] Failed to push incident to API, buffering in Dexie:', err);
      await queueOfflineSos({
        id: draftIncident.id,
        raw_sos_text: `${data.zoneName}: ${data.eventType} - ${data.accessNote}`,
        primary_need: 'Emergency_Triage',
        latitude: data.location.lat,
        longitude: data.location.lng,
        client_recorded_at: new Date().toISOString(),
        people_count: data.casualties.affected,
        vulnerable_infants: data.casualties.children,
        vulnerable_elderly: data.casualties.elderly,
        vulnerable_critical_ill: data.casualties.injured,
      }).catch(() => {});
      set((state) => ({ offlineQueueCount: state.offlineQueueCount + 1 }));
    }
  },

  setDiffModalOpen: (open) => set({ isDiffModalOpen: open }),
  setEquityDrawerOpen: (open) => set({ isEquityDrawerOpen: open }),
  setFieldFormOpen: (open) => set({ isFieldFormOpen: open }),
  setFleetDrawerOpen: (open) => set({ isFleetDrawerOpen: open }),

  toggleDegradedMode: async () => {
    const { isDegradedMode, offlineQueueCount, isApiConnected } = get();

    // If reconnecting from degraded mode with queued reports
    if (isDegradedMode) {
      if (offlineQueueCount > 0 && isApiConnected) {
        set({ isSyncing: true });
        try {
          const unsynced = await getUnsyncedSosReports();
          if (unsynced.length > 0) {
            const batchPayload = {
              client_device_id: 'COMMANDER_COCKPIT_WEB_01',
              synced_at: new Date().toISOString(),
              queued_incidents: unsynced.map((u) => ({
                id: u.id.startsWith('inc-') ? `c0000001-0000-0000-0000-${String(Math.floor(100000000000 + Math.random() * 899999999999))}` : u.id,
                raw_sos_text: u.raw_sos_text,
                primary_need: u.primary_need,
                latitude: u.latitude,
                longitude: u.longitude,
                client_recorded_at: u.client_recorded_at,
                people_count: u.people_count,
                vulnerable_infants: u.vulnerable_infants,
                vulnerable_elderly: u.vulnerable_elderly,
                vulnerable_critical_ill: u.vulnerable_critical_ill,
              })),
            };

            await apiClient.batchSync(batchPayload);
            await markSosReportsSynced(unsynced.map((u) => u.id));
          }
        } catch (syncErr) {
          console.error('[ResQ] Batch reconciliation failed:', syncErr);
        }
        set({ isDegradedMode: false, offlineQueueCount: 0, isSyncing: false });
        // Refresh store from live backend
        get().hydrateFromBackend();
        return;
      }

      set({ isDegradedMode: false, offlineQueueCount: 0 });
    } else {
      set({ isDegradedMode: true });
    }
  },

  setActiveInventoryTab: (tab) => set({ activeInventoryTab: tab }),
  setActiveIncidentView: (view) => set({ activeIncidentView: view }),

  updateShelterOccupancy: (shelterId, deltaBeds) => {
    set((state) => ({
      shelters: state.shelters.map((s) => {
        if (s.id !== shelterId) return s;
        const newOccupied = Math.max(0, Math.min(s.totalCapacityBeds, s.occupiedBeds + deltaBeds));
        const newAvailable = s.totalCapacityBeds - newOccupied;
        const occupancyPct = newOccupied / s.totalCapacityBeds;
        const newStatus = occupancyPct >= 0.95 ? 'FULL' : occupancyPct >= 0.75 ? 'NEAR_CAPACITY' : 'OPERATIONAL';
        return {
          ...s,
          occupiedBeds: newOccupied,
          availableBeds: newAvailable,
          status: newStatus,
        };
      }),
    }));
  },

  dispatchSuppliesToZone: (shelterId, zoneId, food, water, kits) => {
    if (!get().isMuted) {
      playDispatchChime();
    }
    set((state) => ({
      shelters: state.shelters.map((s) => {
        if (s.id !== shelterId) return s;
        return {
          ...s,
          foodPacketsStock: Math.max(0, s.foodPacketsStock - food),
          waterLitresStock: Math.max(0, s.waterLitresStock - water),
          medicalKitsStock: Math.max(0, s.medicalKitsStock - kits),
        };
      }),
      // Reduce unmet demand in matching incidents for this zone
      incidents: state.incidents.map((inc) => {
        if (inc.zoneId !== zoneId) return inc;
        return {
          ...inc,
          demandVector: {
            ...inc.demandVector,
            foodPackets: Math.max(0, inc.demandVector.foodPackets - food),
            waterLitres: Math.max(0, inc.demandVector.waterLitres - water),
            medicalResponders: Math.max(0, inc.demandVector.medicalResponders - kits),
          },
        };
      }),
    }));
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setTourStep: (step) => set({ tourStep: step }),
}));
