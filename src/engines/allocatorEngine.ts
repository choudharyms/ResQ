import { Incident, Asset, AllocationPlan, Assignment } from '../types/disaster';

/**
 * Approximate Haversine distance in kilometers
 */
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

/**
 * Calculates road travel time with mountain terrain detour factor
 */
function calculateTravelTimeMinutes(
  asset: Asset,
  incident: Incident,
  isHighwayCut: boolean = false
): { travelMinutes: number; distanceKm: number; routeDescription: string } {
  const straightKm = calculateDistanceKm(
    asset.currentLocation.lat,
    asset.currentLocation.lng,
    incident.location.lat,
    incident.location.lng
  );

  // Mountain winding road penalty: 1.8x straight-line distance
  let roadKm = Math.max(Math.round(straightKm * 1.8 * 10) / 10, 4);
  let routeDescription = 'Direct Highway NH-07 route';

  // If incident requires Helang bridge and road is cut, detour via Chopta pass
  if (isHighwayCut && (incident.zoneId === 'zone-rudraprayag' || incident.zoneId === 'zone-guptkashi')) {
    roadKm += 22; // 22km mountain detour
    routeDescription = 'Detour via Mandal-Chopta Mountain Pass';
  }

  const effectiveSpeed = asset.category === 'DRONE' ? asset.speedKmh : Math.min(asset.speedKmh, 40);
  const travelMinutes = Math.round((roadKm / effectiveSpeed) * 60);

  return { travelMinutes: Math.max(travelMinutes, 5), distanceKm: roadKm, routeDescription };
}

/**
 * Capability Match Score (0 to 1)
 */
function computeCapabilityMatch(asset: Asset, incident: Incident, needType: string): number {
  if (needType === 'boats') {
    return asset.capabilities.waterRescue ? 1.0 : 0.0;
  }
  if (needType === 'ambulances') {
    if (asset.capabilities.blsMedical || asset.capabilities.alsMedical) {
      return asset.capabilities.mountainRescue ? 1.0 : 0.85;
    }
    return 0.0;
  }
  if (needType === 'rescueTeams') {
    if (incident.eventType === 'COLLAPSE' && asset.capabilities.rubbleRescue) return 1.0;
    if (incident.eventType === 'FLOOD' && asset.capabilities.waterRescue) return 1.0;
    if (asset.capabilities.mountainRescue) return 0.90;
    return 0.50;
  }
  return 0.5;
}

/**
 * Pure Deterministic Greedy Priority Allocator
 */
export function runDeterministicAllocation(
  incidents: Incident[],
  assets: Asset[],
  isHighwayCut: boolean = false
): AllocationPlan {
  // Sort incidents strictly by Priority Score descending
  const priorityQueue = [...incidents].sort(
    (a, b) => b.assessment.priorityScore - a.assessment.priorityScore
  );

  const assignments: Assignment[] = [];
  const unmetNeeds: AllocationPlan['unmetNeeds'] = [];
  let availableAssets = assets.filter((a) => a.status === 'AVAILABLE');

  for (const incident of priorityQueue) {
    const demand = incident.demandVector;
    const requiredCategories: Array<{ needType: keyof typeof demand; needed: number }> = [
      { needType: 'ambulances', needed: demand.ambulances },
      { needType: 'boats', needed: demand.boats },
      { needType: 'rescueTeams', needed: demand.rescueTeams },
    ];

    for (const req of requiredCategories) {
      let remaining = req.needed;

      while (remaining > 0) {
        // Find candidate assets
        const candidates = availableAssets
          .map((asset) => {
            const matchScore = computeCapabilityMatch(asset, incident, req.needType);
            const { travelMinutes, distanceKm, routeDescription } = calculateTravelTimeMinutes(
              asset,
              incident,
              isHighwayCut
            );
            const utilityScore =
              (incident.assessment.priorityScore * matchScore) / Math.max(travelMinutes, 1);
            return { asset, matchScore, travelMinutes, distanceKm, routeDescription, utilityScore };
          })
          .filter((c) => c.matchScore >= 0.5)
          .sort((a, b) => {
            // Sort by travel time ASC, then utility score DESC
            if (a.travelMinutes !== b.travelMinutes) return a.travelMinutes - b.travelMinutes;
            return b.utilityScore - a.utilityScore;
          });

        if (candidates.length === 0) {
          unmetNeeds.push({
            incidentId: incident.id,
            zoneName: incident.zoneName,
            needType: req.needType,
            unmetCount: remaining,
          });
          break;
        }

        const selected = candidates[0];
        const nextAlternative = candidates[1];

        const reasoning = [
          `${selected.travelMinutes} min travel time (${selected.distanceKm} km via ${selected.routeDescription})${
            nextAlternative ? `, next best alt: ${nextAlternative.travelMinutes} min` : ', sole viable unit'
          }`,
          `${Math.round(selected.matchScore * 100)}% capability match for ${incident.eventType} response`,
          `Capacity: ${selected.asset.capacity} (${selected.asset.subType})`,
          `Target Zone priority: ${incident.assessment.priorityScore}/100`,
          `Assigned by: DETERMINISTIC GREEDY OPTIMIZER`,
        ];

        assignments.push({
          id: `asg-${selected.asset.id}-${incident.id}-${Date.now()}`,
          assetId: selected.asset.id,
          assetCode: selected.asset.assetCode,
          assetName: selected.asset.name,
          agency: selected.asset.agency,
          incidentId: incident.id,
          incidentCode: incident.incidentCode,
          zoneName: incident.zoneName,
          needType: req.needType,
          travelMinutes: selected.travelMinutes,
          distanceKm: selected.distanceKm,
          routeDescription: selected.routeDescription,
          matchScore: selected.matchScore,
          utilityScore: Math.round(selected.utilityScore * 10) / 10,
          isEquityForced: false,
          reasoning,
        });

        remaining -= 1;
        availableAssets = availableAssets.filter((a) => a.id !== selected.asset.id);
      }
    }
  }

  const totalUnits = assets.length;
  const dispatchedUnits = assignments.length;
  const fleetReserveRemainingPct = Math.round(
    ((totalUnits - dispatchedUnits) / Math.max(totalUnits, 1)) * 100
  );

  return {
    planId: `OPT-${Math.floor(1000 + Math.random() * 9000)}`,
    generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
    status: 'PENDING',
    authorizer: 'District Incident Commander Raj Kumar',
    assignments,
    unmetNeeds,
    totalUnitsDispatched: dispatchedUnits,
    projectedLivesSecured: dispatchedUnits * 14 + 12,
    fleetReserveRemainingPct,
  };
}
