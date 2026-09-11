import { EquityZone, Incident, Asset, Assignment } from '../types/disaster';

const RESOURCE_WEIGHTS: Record<Asset['category'], number> = {
  AMBULANCE: 10,
  RESCUE_SQUAD: 8,
  BOAT: 6,
  DRONE: 4,
  SUPPLY_TRUCK: 2,
};

/**
 * Computes live Fulfilled Need Ratio (Ei) for all zones
 */
export function evaluateEquityMetrics(
  zones: EquityZone[],
  incidents: Incident[],
  assignments: Assignment[],
  assets: Asset[]
): EquityZone[] {
  return zones.map((zone) => {
    // Find incidents in this zone
    const zoneIncidents = incidents.filter((inc) => inc.zoneId === zone.zoneId);
    const cumulativeNeed = zoneIncidents.reduce(
      (sum, inc) => sum + (inc.assessment.priorityScore * 0.8),
      zone.needWeight
    );

    // Find assignments targeting this zone
    const zoneAssignments = assignments.filter((asg) => asg.zoneName === zone.zoneName);
    
    // Calculate deployed resource weight
    const deployedWeight = zoneAssignments.reduce((sum, asg) => {
      const asset = assets.find((a) => a.id === asg.assetId);
      const weight = asset ? RESOURCE_WEIGHTS[asset.category] || 5 : 5;
      return sum + weight;
    }, 0);

    const safeNeed = Math.max(cumulativeNeed, 1);
    const rawEi = deployedWeight / safeNeed;
    const equityRatioEi = Math.round(rawEi * 100) / 100;

    let status: EquityZone['status'] = 'ADEQUATE';
    if (equityRatioEi >= 1.0) {
      status = 'WELL_SERVED';
    } else if (equityRatioEi >= 0.6) {
      status = 'ADEQUATE';
    } else if (equityRatioEi >= 0.4) {
      status = 'UNDERSERVED';
    } else if (equityRatioEi > 0) {
      status = 'CRITICAL';
    } else {
      status = 'FORGOTTEN';
    }

    return {
      ...zone,
      needWeight: Math.round(cumulativeNeed * 10) / 10,
      resourcesDeployedWeight: deployedWeight,
      equityRatioEi,
      status,
      activeIncidentsCount: zoneIncidents.length,
    };
  });
}
