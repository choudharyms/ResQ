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
  Radio,
  Satellite,
  MessageSquare,
  Globe,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';
import { Incident } from '../types/disaster';

export const IncidentQueue: React.FC = () => {
  const {
    incidents,
    selectedIncidentId,
    selectIncident,
    fragmentaryFeed,
    activeIncidentView,
    setActiveIncidentView,
  } = useDisasterStore();

  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'FLOOD' | 'LANDSLIDE'>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
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

  const filteredFeed = fragmentaryFeed.filter((item) => {
    if (channelFilter === 'ALL') return true;
    return item.channel === channelFilter;
  });

  const getEventIcon = (eventType: Incident['eventType']) => {
    switch (eventType) {
      case 'FLOOD':
        return <Waves className="h-3.5 w-3.5 text-blue-400" />;
      case 'LANDSLIDE':
        return <Mountain className="h-3.5 w-3.5 text-amber-400" />;
      case 'COLLAPSE':
        return <Building className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SATELLITE_PING':
        return <Satellite className="h-3.5 w-3.5 text-purple-400" />;
      case 'VHF_RADIO':
        return <Radio className="h-3.5 w-3.5 text-amber-400" />;
      case 'SMS_GATEWAY':
        return <MessageSquare className="h-3.5 w-3.5 text-sky-400" />;
      case 'CITIZEN_WEB':
        return <Globe className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'SATELLITE_PING':
        return 'SAT PING';
      case 'VHF_RADIO':
        return 'VHF RADIO';
      case 'SMS_GATEWAY':
        return 'SMS GATE';
      case 'CITIZEN_WEB':
        return 'WEB SOS';
      default:
        return channel;
    }
  };

  return (
    <aside className="w-full lg:w-[350px] bg-surface-panel border-r border-border-subtle flex flex-col h-[calc(100vh-56px)] select-none">
      {/* Top View Selector: Canonical Queue vs Raw Fragmentary SOS Stream */}
      <div className="p-2 border-b border-border-subtle bg-surface-canvas/90 flex items-center gap-1">
        <button
          onClick={() => setActiveIncidentView('CANONICAL')}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeIncidentView === 'CANONICAL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-content-muted hover:text-content-primary hover:bg-surface-panel'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Triage Queue ({incidents.length})</span>
        </button>
        <button
          onClick={() => setActiveIncidentView('FRAGMENTARY_FEED')}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeIncidentView === 'FRAGMENTARY_FEED'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-content-muted hover:text-content-primary hover:bg-surface-panel'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Raw SOS Feed ({fragmentaryFeed.length})</span>
        </button>
      </div>

      {/* CANONICAL INCIDENTS VIEW */}
      {activeIncidentView === 'CANONICAL' && (
        <>
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

              return (
                <div
                  key={incident.id}
                  onClick={() => selectIncident(incident.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-surface-card border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
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
                    {incident.eventType === 'FLOOD' ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-950/40 border border-orange-700/50 text-orange-300 font-mono flex items-center gap-1">
                        <img src="/assets/agencies/ndrf-icon.png" alt="NDRF" className="h-3 w-3 rounded-sm object-contain" />
                        Req: NDRF Water Rescue
                      </span>
                    ) : incident.eventType === 'LANDSLIDE' || incident.eventType === 'COLLAPSE' ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-700/50 text-blue-300 font-mono flex items-center gap-1">
                        <img src="/assets/agencies/sdrf-icon.png" alt="SDRF" className="h-3 w-3 rounded-sm object-contain" />
                        Req: SDRF Mountain Squad
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/40 border border-red-700/50 text-red-300 font-mono flex items-center gap-1">
                        <img src="/assets/agencies/ems-icon.png" alt="EMS" className="h-3 w-3 rounded-sm object-contain" />
                        Req: EMS Advanced Trauma
                      </span>
                    )}
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
                      <HelpCircle className="h-3 w-3 text-status-forgotten" />
                      <span>SILENT ZONE (Low Conf 42% / High Need)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Queue Footer */}
          <div className="p-2 border-t border-border-subtle bg-surface-canvas text-center text-[11px] text-content-muted font-mono flex items-center justify-between px-3">
            <span>{filteredIncidents.length} active sectors</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Updated T+04:15
            </span>
          </div>
        </>
      )}

      {/* RAW FRAGMENTARY SOS STREAM VIEW */}
      {activeIncidentView === 'FRAGMENTARY_FEED' && (
        <>
          {/* Feed Channel Filters */}
          <div className="p-2.5 border-b border-border-subtle bg-surface-panel space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-content-muted">
              <span className="flex items-center gap-1 text-indigo-300 font-bold">
                <Sparkles className="h-3 w-3" />
                Information Fusion Engine
              </span>
              <span>8 Raw Ingested</span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'SATELLITE_PING', label: 'Sat Ping' },
                { id: 'VHF_RADIO', label: 'VHF' },
                { id: 'SMS_GATEWAY', label: 'SMS' },
                { id: 'CITIZEN_WEB', label: 'Web' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChannelFilter(c.id)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    channelFilter === c.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-surface-card hover:bg-surface-hover text-content-secondary border border-border-subtle'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Raw Feed Cards List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredFeed.map((sos) => {
              const isFused = sos.status === 'FUSED';
              return (
                <div
                  key={sos.id}
                  className="p-3 rounded-lg bg-surface-card border border-border-subtle hover:border-border-strong transition-all space-y-2"
                >
                  {/* Channel Badge & Callsign */}
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-panel border border-border-subtle text-content-primary font-bold">
                      {getChannelIcon(sos.channel)}
                      {getChannelLabel(sos.channel)}
                    </span>
                    <span className="text-content-muted">{sos.receivedAt}</span>
                  </div>

                  {/* Verbatim Transcript */}
                  <p className="text-[11px] font-mono text-content-secondary bg-surface-canvas/80 p-2 rounded border border-border-subtle/60 leading-relaxed font-semibold">
                    "{sos.rawSnippet}"
                  </p>

                  {/* Metadata Row: Callsign & Confidence */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-content-muted">
                    <span className="truncate max-w-[150px]">Src: {sos.sourceCallsign}</span>
                    <span>Conf: {Math.round(sos.signalConfidence * 100)}%</span>
                  </div>

                  {/* AI Clustering Status */}
                  <div className="pt-1.5 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono">
                    {isFused ? (
                      <button
                        onClick={() => {
                          const target = incidents.find((i) => i.incidentCode === sos.associatedIncidentCode);
                          if (target) {
                            setActiveIncidentView('CANONICAL');
                            selectIncident(target.id);
                          }
                        }}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline font-bold"
                      >
                        ✓ Fused → {sos.associatedIncidentCode} ({sos.zoneName})
                      </button>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        ⏱ Pending Cross-Agency Fusion...
                      </span>
                    )}
                    <span className="text-content-muted">{sos.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border-subtle bg-surface-canvas text-center text-[10px] text-content-muted font-mono flex items-center justify-between px-3">
            <span>Deduplication: Jaccard + Geo Cluster</span>
            <span className="text-indigo-400">Zero AI Hallucination</span>
          </div>
        </>
      )}
    </aside>
  );
};

