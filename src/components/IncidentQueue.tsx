import React, { useState } from 'react';
import {
  AlertTriangle,
  Users,
  Search,
  ChevronRight,
  HelpCircle,
  Clock,
  Waves,
  Mountain,
  Building,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';
import { Incident } from '../types/disaster';
import { getAgencyConfig } from '../utils/agencyConfig';

export const IncidentQueue: React.FC = () => {
  const { incidents, selectedIncidentId, selectIncident, lastSyncTime } = useDisasterStore();
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'FLOOD' | 'LANDSLIDE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncidents = incidents
    .filter((inc) => {
      if (filter === 'CRITICAL') return inc.assessment.priorityScore >= 80;
      if (filter === 'FLOOD') return inc.eventType === 'FLOOD';
      if (filter === 'LANDSLIDE') return inc.eventType === 'LANDSLIDE' || inc.eventType === 'COLLAPSE';
      return true;
    })
    .filter((inc) => {
      if (!searchQuery) return true;
      return (
        inc.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.incidentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.h3Index.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  const getEventIcon = (eventType: Incident['eventType']) => {
    switch (eventType) {
      case 'FLOOD':
        return <Waves className="h-3.5 w-3.5 text-sky-400" />;
      case 'LANDSLIDE':
        return <Mountain className="h-3.5 w-3.5 text-amber-400" />;
      case 'COLLAPSE':
        return <Building className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />;
    }
  };

  return (
    <aside className="w-full lg:w-[360px] bg-surface-panel border-r border-border-subtle flex flex-col h-full min-h-0 select-none shrink-0">
      {/* Search and Quick Filters */}
      <div className="p-3 border-b border-border-subtle bg-surface-panel/90 backdrop-blur sticky top-0 z-10 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-content-muted" />
          <input
            type="text"
            placeholder="Search incident, zone, or H3 index..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-canvas border border-border-strong rounded-md pl-8 pr-3 py-1.5 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-border-focus font-sans transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2 py-1 rounded transition-colors ${
              filter === 'ALL'
                ? 'bg-surface-hover text-content-primary font-bold border border-border-strong'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            All ({incidents.length})
          </button>
          <button
            onClick={() => setFilter('CRITICAL')}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              filter === 'CRITICAL'
                ? 'bg-status-critical/20 text-status-critical font-bold border border-status-critical/40'
                : 'text-content-muted hover:text-status-critical'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilter('FLOOD')}
            className={`px-2 py-1 rounded transition-colors ${
              filter === 'FLOOD'
                ? 'bg-blue-900/30 text-blue-400 font-bold border border-blue-800/50'
                : 'text-content-muted hover:text-blue-400'
            }`}
          >
            Flood
          </button>
          <button
            onClick={() => setFilter('LANDSLIDE')}
            className={`px-2 py-1 rounded transition-colors ${
              filter === 'LANDSLIDE'
                ? 'bg-amber-900/30 text-amber-400 font-bold border border-amber-800/50'
                : 'text-content-muted hover:text-amber-400'
            }`}
          >
            Landslide
          </button>
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredIncidents.map((incident) => {
          const isSelected = selectedIncidentId === incident.id;
          const isCritical = incident.assessment.priorityScore >= 80;

            const reqAgency = incident.eventType === 'FLOOD' ? 'NDRF' : incident.eventType === 'LANDSLIDE' || incident.eventType === 'COLLAPSE' ? 'SDRF' : 'EMS';
            const agencyCfg = getAgencyConfig(reqAgency);

            return (
              <div
                key={incident.id}
                onClick={() => selectIncident(incident.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-surface-card border-sky-500 shadow-md ring-1 ring-sky-500/40'
                    : 'bg-surface-panel hover:bg-surface-card border-border-subtle hover:border-border-strong'
                }`}
              >
                {/* Header: Code, Priority, and Status Pill */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-content-primary">
                      {incident.incidentCode}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-surface-canvas text-content-muted border border-border-subtle font-mono">
                      {getEventIcon(incident.eventType)}
                      {incident.eventType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-xs font-extrabold px-1.5 py-0.5 rounded ${
                        isCritical
                          ? 'bg-status-critical/20 text-status-critical border border-status-critical/40'
                          : 'bg-status-high/20 text-status-high border border-status-high/40'
                      }`}
                    >
                      {incident.assessment.priorityScore}
                    </span>
                  </div>
                </div>

                {/* Title & Location */}
                <h4 className="text-xs font-bold text-content-primary mb-1 line-clamp-1">
                  {incident.zoneName}
                </h4>

                {/* Primary Agency Requirement Badge */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${agencyCfg.chipClass} font-mono flex items-center gap-1 border`}>
                    <img src={agencyCfg.icon} alt={agencyCfg.shortName} className="h-3 w-3 rounded-sm object-contain" />
                    <span>Req: {agencyCfg.shortName} {incident.eventType === 'FLOOD' ? 'Water Rescue' : incident.eventType === 'MEDICAL_SURGE' ? 'Trauma Team' : 'Alpine Squad'}</span>
                  </span>
                </div>

              {/* Casualties summary */}
              <div className="flex items-center gap-3 text-[11px] text-content-secondary font-mono mb-2">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-content-muted" />
                  {incident.casualties.affected} affected
                </span>
                {incident.casualties.trapped > 0 && (
                  <span className="text-status-critical font-bold">
                    {incident.casualties.trapped} trapped
                  </span>
                )}
                {incident.casualties.injured > 0 && (
                  <span className="text-status-high">
                    {incident.casualties.injured} injured
                  </span>
                )}
              </div>

              {/* Road Access Pill & H3 Index */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle text-[10px] font-mono">
                <span
                  className={`px-1.5 py-0.5 rounded uppercase font-semibold ${
                    incident.roadStatus === 'OPEN'
                      ? 'bg-status-safe/15 text-status-safe'
                      : incident.roadStatus === 'PARTIAL'
                      ? 'bg-status-high/15 text-status-high'
                      : 'bg-status-critical/15 text-status-critical'
                  }`}
                >
                  Road: {incident.roadStatus}
                </span>

                <span className="text-content-muted flex items-center gap-1" title="Uber H3 Hex Resolution 8">
                  H3: {incident.h3Index.substring(0, 7)}...
                  <ChevronRight className="h-3 w-3 text-content-muted" />
                </span>
              </div>

              {/* Silent / Forgotten Zone Special Warning */}
              {incident.isSilentPocket && (
                <div className="mt-2 px-2 py-1 rounded bg-status-forgotten/15 border border-status-forgotten/40 flex items-center gap-1.5 text-[10px] text-purple-300 font-mono">
                  <HelpCircle className="h-3 w-3 text-status-forgotten animate-spin" />
                  <span>SILENT ZONE (Low Conf 42% / High Need)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Queue Footer: Queue count & time */}
      <div className="p-2.5 border-t border-border-subtle bg-surface-canvas text-center text-[11px] text-content-muted font-mono flex items-center justify-between px-3">
        <span>{filteredIncidents.length} active sectors</span>
        <span className="flex items-center gap-1 text-content-secondary">
          <Clock className="h-3 w-3 text-sky-400" /> {lastSyncTime ? `Synced ${lastSyncTime}` : 'Live Telemetry'}
        </span>
      </div>
    </aside>
  );
};
