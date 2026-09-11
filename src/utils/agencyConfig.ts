import { AgencyType } from '../types/disaster';

export interface AgencyMeta {
  type: AgencyType;
  shortName: string;
  name: string;
  fullName: string;
  icon: string;
  badgeIcon: string;
  color: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  chipClass: string;
}

export const AGENCY_CONFIG: Record<AgencyType, AgencyMeta> = {
  NDRF: {
    type: 'NDRF',
    shortName: 'NDRF',
    name: 'NDRF 8th Bn',
    fullName: 'National Disaster Response Force',
    icon: '/assets/agencies/ndrf-icon.png',
    badgeIcon: '/assets/agencies/ndrf-badge.png',
    color: 'orange',
    hex: '#F97316',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-400',
    chipClass: 'bg-orange-950/40 border-orange-700/50 text-orange-300 hover:bg-orange-950/70',
  },
  SDRF: {
    type: 'SDRF',
    shortName: 'SDRF',
    name: 'SDRF Alpine',
    fullName: 'State Disaster Response Force',
    icon: '/assets/agencies/sdrf-icon.png',
    badgeIcon: '/assets/agencies/sdrf-badge.png',
    color: 'sky',
    hex: '#0284C7',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/30',
    textClass: 'text-sky-400',
    chipClass: 'bg-sky-950/40 border-sky-700/50 text-sky-300 hover:bg-sky-950/70',
  },
  POLICE: {
    type: 'POLICE',
    shortName: 'Police',
    name: 'Garhwal Police',
    fullName: 'Uttarakhand State Police',
    icon: '/assets/agencies/police-icon.png',
    badgeIcon: '/assets/agencies/police-badge.png',
    color: 'indigo',
    hex: '#6366F1',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/30',
    textClass: 'text-indigo-400',
    chipClass: 'bg-indigo-950/40 border-indigo-700/50 text-indigo-300 hover:bg-indigo-950/70',
  },
  EMS: {
    type: 'EMS',
    shortName: 'EMS',
    name: 'AIIMS / Trauma',
    fullName: 'Emergency Medical & Trauma Services',
    icon: '/assets/agencies/ems-icon.png',
    badgeIcon: '/assets/agencies/ems-badge.png',
    color: 'rose',
    hex: '#F43F5E',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    textClass: 'text-rose-400',
    chipClass: 'bg-rose-950/40 border-rose-700/50 text-rose-300 hover:bg-rose-950/70',
  },
  ITBP: {
    type: 'ITBP',
    shortName: 'ITBP/NGO',
    name: 'ITBP 1st Bn',
    fullName: 'Indo-Tibetan Border Police & Mountain Volunteers',
    icon: '/assets/agencies/ngo-icon.png',
    badgeIcon: '/assets/agencies/ngo-badge.png',
    color: 'emerald',
    hex: '#10B981',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-400',
    chipClass: 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-950/70',
  },
};

export function getAgencyConfig(agency?: string | AgencyType): AgencyMeta {
  if (!agency) return AGENCY_CONFIG.NDRF;
  const upper = agency.toUpperCase();
  if (upper.includes('NDRF')) return AGENCY_CONFIG.NDRF;
  if (upper.includes('SDRF')) return AGENCY_CONFIG.SDRF;
  if (upper.includes('POLICE')) return AGENCY_CONFIG.POLICE;
  if (upper.includes('EMS') || upper.includes('MEDICAL') || upper.includes('HOSPITAL') || upper.includes('HEALTH') || upper.includes('AIIMS')) {
    return AGENCY_CONFIG.EMS;
  }
  if (upper.includes('ITBP') || upper.includes('ARMY') || upper.includes('NGO') || upper.includes('VOLUNTEER')) {
    return AGENCY_CONFIG.ITBP;
  }
  return AGENCY_CONFIG.NDRF;
}

export function getAgencyMapColor(agency?: string | AgencyType): string {
  return getAgencyConfig(agency).hex;
}
