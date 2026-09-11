import { create } from 'zustand';
import {
  Incident,
  Asset,
  AllocationPlan,
  PlanDiff,
  EquityZone,
} from '../types/disaster';
import {
  INITIAL_INCIDENTS,
  INITIAL_ASSETS,
  INITIAL_EQUITY_ZONES,
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

interface DisasterState {
  incidents: Incident[];
  selectedIncidentId: string | null;
  assets: Asset[];
  equityZones: EquityZone[];
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

  // Actions
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
  }) => void;
  setDiffModalOpen: (open: boolean) => void;
  setEquityDrawerOpen: (open: boolean) => void;
  setFieldFormOpen: (open: boolean) => void;
  setFleetDrawerOpen: (open: boolean) => void;
  toggleDegradedMode: () => void;
  toggleMute: () => void;
  setTourStep: (step: number | null) => void;
}

export const useDisasterStore = create<DisasterState>((set, get) => ({
  incidents: INITIAL_INCIDENTS,
  selectedIncidentId: INITIAL_INCIDENTS[0].id,
  assets: INITIAL_ASSETS,
  equityZones: INITIAL_EQUITY_ZONES,
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
    const { activePlan, assets, isMuted } = get();
    if (!activePlan) return;

    // Trigger tactical sound
    playDispatchChime(isMuted);

    // Update asset statuses to EN_ROUTE
    const assignedAssetIds = new Set(activePlan.assignments.map((a) => a.assetId));
    const updatedAssets = assets.map((asset) => {
      if (assignedAssetIds.has(asset.id)) {
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
    const { isHighwayCut, incidents, assets, activePlan, equityZones, isMuted } = get();
    const nextCutState = !isHighwayCut;

    // Sound alert on road cut mutation
    if (nextCutState) {
      playEmergencySiren(isMuted);
    } else {
      playDispatchChime(isMuted);
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

  addIncident: (data) => {
    const { isDegradedMode, isMuted } = get();

    if (isDegradedMode) {
      set((state) => ({ offlineQueueCount: state.offlineQueueCount + 1 }));
      return;
    }

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

    set((state) => {
      const updated = [draftIncident, ...state.incidents];
      return {
        incidents: updated,
        selectedIncidentId: draftIncident.id,
      };
    });

    // Re-evaluate allocations
    get().runAllocation();
  },

  setDiffModalOpen: (open) => set({ isDiffModalOpen: open }),
  setEquityDrawerOpen: (open) => set({ isEquityDrawerOpen: open }),
  setFieldFormOpen: (open) => set({ isFieldFormOpen: open }),
  setFleetDrawerOpen: (open) => set({ isFleetDrawerOpen: open }),

  toggleDegradedMode: () => {
    const { isDegradedMode, offlineQueueCount } = get();
    if (isDegradedMode && offlineQueueCount > 0) {
      // Reconnected and flushing
      set({ isDegradedMode: false, offlineQueueCount: 0 });
    } else {
      set({ isDegradedMode: !isDegradedMode });
    }
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setTourStep: (step) => set({ tourStep: step }),
}));
