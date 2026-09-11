import { Incident, DemandVector, IncidentAssessment } from '../types/disaster';

/**
 * Pure deterministic severity computation
 * Severity = 0.40 * medical + 0.30 * structural + 0.20 * env + 0.10 * density
 */
export function computeSeverity(
  casualties: Incident['casualties'],
  eventType: Incident['eventType'],
  structuralThreat: number = 0.5
): number {
  const { affected, injured, trapped, missing } = casualties;
  const safeAffected = Math.max(affected, 1);

  const medicalIntensity = Math.min(
    injured / safeAffected + 2 * (trapped / safeAffected) + 1.5 * (missing / safeAffected),
    1.0
  );

  const envHazardMap: Record<Incident['eventType'], number> = {
    FLOOD: 0.85,
    LANDSLIDE: 0.80,
    COLLAPSE: 0.90,
    MEDICAL_SURGE: 0.75,
  };
  const envHazard = envHazardMap[eventType] || 0.7;
  const densityFactor = Math.min(affected / 500, 1.0);

  const score =
    0.40 * medicalIntensity +
    0.30 * structuralThreat +
    0.20 * envHazard +
    0.10 * densityFactor;

  return Math.round(score * 100) / 100;
}

/**
 * Pure deterministic urgency computation
 * Urgency = 0.50 * timeCriticality + 0.30 * accessDegradation + 0.20 * depletion
 */
export function computeUrgency(
  eventType: Incident['eventType'],
  roadStatus: Incident['roadStatus'],
  hoursWithoutSupply: number = 2
): number {
  const timeCritMap: Record<Incident['eventType'], number> = {
    FLOOD: 0.95,     // Flash flood water level rising rapidly
    LANDSLIDE: 0.90, // Unstable mountain slope
    COLLAPSE: 0.95,  // Trapped rubble golden hour
    MEDICAL_SURGE: 0.85,
  };
  const timeCriticality = timeCritMap[eventType] || 0.8;

  const accessMap: Record<Incident['roadStatus'], number> = {
    OPEN: 0.10,
    PARTIAL: 0.50,
    BLOCKED: 0.90,
  };
  const accessDegradation = accessMap[roadStatus] || 0.5;
  const resourceDepletion = Math.min(hoursWithoutSupply / 24, 1.0);

  const score =
    0.50 * timeCriticality +
    0.30 * accessDegradation +
    0.20 * resourceDepletion;

  return Math.round(score * 100) / 100;
}

/**
 * Transparent demand vector rules
 */
export function computeDemandVector(
  casualties: Incident['casualties'],
  eventType: Incident['eventType']
): DemandVector {
  const { affected, injured, trapped, children, elderly } = casualties;

  const ambulances = Math.ceil((injured * 0.4) / 4);
  const rescueTeams = Math.ceil(trapped / 20);
  const boats = eventType === 'FLOOD' ? Math.ceil(trapped / 18) : 0;
  const k9Teams = (eventType === 'COLLAPSE' || eventType === 'LANDSLIDE') && trapped > 0 ? 1 : 0;
  const foodPackets = Math.ceil(affected * 1.2);
  const waterLitres = affected * 3;
  const medicalResponders = Math.ceil(injured / 6);

  // High vulnerability modifier: if elderly + children > 30% of affected
  const vulnRatio = (children + elderly) / Math.max(affected, 1);
  const vulnMultiplier = vulnRatio > 0.30 ? 1.3 : 1.0;

  return {
    boats: Math.max(boats, eventType === 'FLOOD' && trapped > 0 ? 1 : 0),
    ambulances: Math.ceil(ambulances * vulnMultiplier),
    rescueTeams: Math.max(rescueTeams, trapped > 0 ? 1 : 0),
    k9Teams,
    foodPackets,
    waterLitres,
    medicalResponders: Math.ceil(medicalResponders * vulnMultiplier),
  };
}

/**
 * Composite Priority formula (0 to 100)
 */
export function computePriorityScore(
  severity: number,
  urgency: number,
  needIntensity: number,
  casualties: Incident['casualties'],
  roadStatus: Incident['roadStatus'],
  confidence: number
): number {
  const { children, elderly, affected } = casualties;
  const vulnerability = Math.min((children + elderly) / Math.max(affected, 1), 1.0);

  const accessScoreMap: Record<Incident['roadStatus'], number> = {
    OPEN: 0.90,
    PARTIAL: 0.50,
    BLOCKED: 0.05,
  };
  const isolation = 1 - accessScoreMap[roadStatus];

  // Floor confidence at 0.70 so even uncorroborated high-severity reports are prioritized
  const confidenceModifier = Math.max(confidence, 0.70);

  const rawScore =
    (0.35 * severity +
      0.25 * urgency +
      0.20 * needIntensity +
      0.10 * vulnerability +
      0.10 * isolation) *
    confidenceModifier *
    100;

  return Math.round(rawScore * 10) / 10;
}

export function assessIncident(incident: Incident): IncidentAssessment {
  const severity = computeSeverity(incident.casualties, incident.eventType);
  const urgency = computeUrgency(incident.eventType, incident.roadStatus);
  const needIntensity = incident.assessment?.needIntensity || 0.85;
  const confidence = incident.assessment?.confidence || 0.85;

  const priorityScore = computePriorityScore(
    severity,
    urgency,
    needIntensity,
    incident.casualties,
    incident.roadStatus,
    confidence
  );

  return {
    severity,
    urgency,
    needIntensity,
    confidence,
    priorityScore,
  };
}
