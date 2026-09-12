import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Cpu,
  Navigation,
  Scale,
  Activity,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDisasterStore } from '../stores/useDisasterStore';
import { getAgencyConfig } from '../utils/agencyConfig';

export const AllocationPlanPanel: React.FC = () => {
  const {
    activePlan,
    runAllocation,
    approveCurrentPlan,
    selectIncident,
    selectedIncidentId,
    assets,
  } = useDisasterStore();

  const [expandedReasoningId, setExpandedReasoningId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'EQUITY' | 'UNMET'>('ALL');
  const [isSolving, setIsSolving] = useState(false);

  const handleApprove = () => {
    approveCurrentPlan();
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.75 },
      });
    } catch {
      // fallback
    }
  };

  const handleTriggerReSolve = () => {
    setIsSolving(true);
    setTimeout(() => {
      runAllocation();
      setIsSolving(false);
    }, 180);
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoningId((prev) => (prev === id ? null : id));
  };

  const equityAssignmentsCount = activePlan?.assignments.filter((a) => a.isEquityForced).length || 0;
  const totalUnmetCount = activePlan?.unmetNeeds.reduce((acc, u) => acc + u.unmetCount, 0) || 0;

  const displayedAssignments = activePlan?.assignments.filter((asg) => {
    if (filterMode === 'EQUITY') return asg.isEquityForced;
    return true;
  }) || [];

  return (
    <aside className="w-full lg:w-[380px] bg-surface-panel border-l border-border-subtle flex flex-col h-[calc(100vh-56px)] select-none shrink-0 overflow-hidden">
      {/* 1. TOP HEADER: Engine Identity & Solver Action */}
      <div className="h-12 px-3.5 border-b border-border-subtle bg-surface-panel/95 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider font-mono">
                Optimization Engine
              </h3>
              <span className="text-[9px] px-1 py-0.2 rounded bg-surface-card border border-border-subtle text-content-muted font-mono">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-content-muted font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
              <span>Greedy Solver · ~32ms Math</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerReSolve}
          disabled={isSolving}
          className="h-7 px-2.5 rounded-md bg-surface-card hover:bg-surface-hover border border-border-subtle hover:border-border-strong text-content-secondary hover:text-content-primary text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Re-run deterministic greedy allocation algorithm"
        >
          <RotateCw className={`h-3 w-3 text-sky-400 ${isSolving ? 'animate-spin' : ''}`} />
          <span>{isSolving ? 'Solving...' : 'Re-Solve'}</span>
        </button>
      </div>

      {/* 2. SCROLLABLE PLAN BODY */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!activePlan ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="h-12 w-12 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-sky-400 shadow-inner">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-content-primary">
                Solver Standby
              </h4>
              <p className="text-xs text-content-muted mt-1 leading-relaxed">
                Run the deterministic capability optimizer to calculate priority dispatches across active Uttarakhand mountain sectors.
              </p>
            </div>
            <button
              onClick={handleTriggerReSolve}
              className="h-8 px-3 rounded-md bg-sky-500 hover:bg-sky-400 text-sky-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Generate Dispatch Plan</span>
            </button>
          </div>
        ) : (
          /* Active Plan Content */
          <>
            {/* Mission Metadata & Status Card */}
            <div className="p-3 rounded-lg bg-surface-card border border-border-subtle space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-content-primary">
                    Plan #{activePlan.planId}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                      activePlan.status === 'APPROVED'
                        ? 'bg-emerald-950/30 text-emerald-300 border-emerald-700/50'
                        : 'bg-amber-950/30 text-amber-300 border-amber-700/50'
                    }`}
                  >
                    {activePlan.status === 'APPROVED' ? 'Active Mission' : 'Pending Approval'}
                  </span>
                </div>
                <span className="text-[10px] text-content-muted font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3 text-sky-400" /> {activePlan.generatedAt}
                </span>
              </div>

              {/* 4-Cell Macro KPI Strip */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5 text-center font-mono">
                <div className="p-1.5 rounded bg-surface-panel border border-border-subtle">
                  <p className="text-[9px] text-content-muted uppercase">Dispatched</p>
                  <p className="text-xs font-bold text-content-primary">
                    {activePlan.totalUnitsDispatched} <span className="text-[10px] text-content-muted font-normal">/ {assets.length}</span>
                  </p>
                </div>
                <div className="p-1.5 rounded bg-surface-panel border border-border-subtle">
                  <p className="text-[9px] text-content-muted uppercase">Secured</p>
                  <p className="text-xs font-bold text-emerald-400">
                    +{activePlan.projectedLivesSecured}
                  </p>
                </div>
                <div className="p-1.5 rounded bg-surface-panel border border-border-subtle">
                  <p className="text-[9px] text-content-muted uppercase">Reserve</p>
                  <p className="text-xs font-bold text-sky-400">
                    {activePlan.fleetReserveRemainingPct}%
                  </p>
                </div>
                <div className="p-1.5 rounded bg-surface-panel border border-border-subtle">
                  <p className="text-[9px] text-content-muted uppercase">Deficit</p>
                  <p className={`text-xs font-bold ${totalUnmetCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {totalUnmetCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Tabs: All vs Fairness vs Deficits */}
            <div className="flex items-center gap-1 p-1 rounded-md bg-surface-card border border-border-subtle text-xs font-mono">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`flex-1 py-1 rounded text-[11px] font-semibold transition-all ${
                  filterMode === 'ALL'
                    ? 'bg-surface-panel text-content-primary shadow-sm'
                    : 'text-content-muted hover:text-content-primary'
                }`}
              >
                All ({activePlan.assignments.length})
              </button>
              <button
                onClick={() => setFilterMode('EQUITY')}
                className={`flex-1 py-1 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  filterMode === 'EQUITY'
                    ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40'
                    : 'text-content-muted hover:text-purple-300'
                }`}
              >
                <Scale className="h-3 w-3" />
                <span>Fairness ({equityAssignmentsCount})</span>
              </button>
              {totalUnmetCount > 0 && (
                <button
                  onClick={() => setFilterMode('UNMET')}
                  className={`flex-1 py-1 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    filterMode === 'UNMET'
                      ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                      : 'text-content-muted hover:text-amber-300'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Deficits ({totalUnmetCount})</span>
                </button>
              )}
            </div>

            {/* 3. UNMET RESOURCE DEFICITS ALERT (If Present) */}
            {(filterMode === 'UNMET' || (filterMode === 'ALL' && activePlan.unmetNeeds.length > 0)) && (
              <div className="p-2.5 rounded-lg bg-amber-950/15 border border-amber-800/40 space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Resource Bottlenecks ({activePlan.unmetNeeds.length})</span>
                  </span>
                  <span className="text-[10px] text-amber-500/80">Regional Deficit</span>
                </div>
                <div className="space-y-1">
                  {activePlan.unmetNeeds.map((unmet, uIdx) => (
                    <div
                      key={uIdx}
                      className="p-1.5 rounded bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-200 flex items-center justify-between"
                    >
                      <span className="font-sans font-medium">{unmet.zoneName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 font-bold text-amber-300 border border-amber-500/30">
                        Need {unmet.unmetCount}x {unmet.needType}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-amber-400/80 font-sans leading-relaxed">
                  All capable district units in range deployed. Mutual-aid request forwarded to Uttarakhand State DEOC.
                </p>
              </div>
            )}

            {/* 4. ASSIGNMENT CARDS LIST */}
            {filterMode !== 'UNMET' && (
              <div className="space-y-2">
                {displayedAssignments.length === 0 ? (
                  <div className="text-center p-4 rounded-lg bg-surface-card border border-border-subtle text-xs text-content-muted font-mono">
                    No assignments matching current filter.
                  </div>
                ) : (
                  displayedAssignments.map((asg) => {
                    const isExpanded = expandedReasoningId === asg.id;
                    const isSelected = selectedIncidentId === asg.incidentId;

                    const agencyCfg = getAgencyConfig(asg.agency);
                    const agencyIconSrc = agencyCfg.icon;

                    return (
                      <div
                        key={asg.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-surface-card border-sky-500/60 ring-1 ring-sky-500/30 shadow-md'
                            : asg.isEquityForced
                            ? 'bg-purple-950/15 border-purple-800/40 hover:border-purple-600/60'
                            : 'bg-surface-card border-border-subtle hover:border-border-strong'
                        }`}
                      >
                        {/* Top Line: Unit Emblem, Code, Agency, and Travel Time */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-slate-950 border border-border-subtle flex items-center justify-center p-0.5 shrink-0">
                              <img src={agencyIconSrc} alt={asg.agency} className="h-full w-full object-contain" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-bold text-content-primary">
                                  {asg.assetCode}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${agencyCfg.chipClass}`}>
                                  {asg.agency}
                                </span>
                              </div>
                              <p className="text-[10px] text-content-muted truncate max-w-[150px]">
                                {asg.assetName}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono">
                            <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" /> {asg.travelMinutes} min
                            </span>
                            <span className="text-[10px] text-content-muted">
                              {asg.distanceKm} km
                            </span>
                          </div>
                        </div>

                        {/* Route Corridor: Origin ➔ Crisis Destination */}
                        <button
                          onClick={() => selectIncident(asg.incidentId)}
                          className="w-full text-left p-2 rounded bg-surface-panel/80 hover:bg-surface-panel border border-border-subtle transition-all mb-2 group"
                          title="Click to focus incident on map"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-content-primary mb-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <Navigation className="h-3 w-3 text-sky-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              <span className="truncate">{asg.zoneName}</span>
                            </div>
                            <span className="text-[10px] font-mono text-sky-400 shrink-0 ml-2">
                              {asg.incidentCode}
                            </span>
                          </div>
                          <p className="text-[10px] text-content-muted font-mono truncate">
                            via {asg.routeDescription}
                          </p>
                        </button>

                        {/* Match Score & Badges Bar */}
                        <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-content-muted">Capability:</span>
                            <span className="font-bold text-emerald-400">
                              {Math.round(asg.matchScore * 100)}% Match
                            </span>
                          </div>

                          {asg.isEquityForced ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 font-mono font-bold border border-purple-700/50 flex items-center gap-1">
                              <Scale className="h-2.5 w-2.5" />
                              <span>EQUITY OVERRIDE</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 text-content-muted">
                              <Activity className="h-3 w-3 text-sky-400" />
                              <span>Util: {asg.utilityScore}</span>
                            </div>
                          )}
                        </div>

                        {/* Explainability Accordion ("Why this allocation?") */}
                        <button
                          onClick={() => toggleReasoning(asg.id)}
                          className="w-full flex items-center justify-between text-[10px] px-2 py-1 rounded bg-surface-panel border border-border-subtle text-content-secondary hover:text-content-primary transition-colors font-mono"
                        >
                          <span className="flex items-center gap-1 font-semibold text-sky-400">
                            <span>Mathematical Trace</span>
                          </span>
                          <div className="flex items-center gap-1 text-content-muted">
                            <span>{isExpanded ? 'Hide Trace' : 'Inspect Why'}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                        </button>

                        {/* Detailed Reasoning Trace Body */}
                        {isExpanded && (
                          <div className="mt-2 p-2.5 rounded bg-surface-panel/95 border border-border-subtle text-[10px] text-content-secondary space-y-1.5 font-mono">
                            <div className="text-[9px] uppercase font-bold text-sky-400 tracking-wider pb-1 border-b border-border-subtle flex items-center justify-between">
                              <span>Solver Decision Trace</span>
                              <span className="text-content-muted">ICS-300 Form</span>
                            </div>
                            <ul className="space-y-1 pt-0.5">
                              {asg.reasoning.map((r, rIdx) => (
                                <li key={rIdx} className="flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-sky-400 font-bold shrink-0">&bull;</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. STICKY BOTTOM COMMAND DISPATCH BAR */}
      {activePlan && (
        <div className="p-3 border-t border-border-subtle bg-surface-panel/95 backdrop-blur sticky bottom-0 z-10 shrink-0">
          {activePlan.status !== 'APPROVED' ? (
            <button
              onClick={handleApprove}
              className="w-full h-9 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-98"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve & Dispatch Plan (Enter)</span>
            </button>
          ) : (
            <div className="w-full h-9 px-3 rounded-md bg-emerald-950/20 border border-emerald-700/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Mission Dispatched · Fleet En Route</span>
              </span>
              <button
                onClick={handleTriggerReSolve}
                className="text-[11px] underline hover:text-white font-mono"
              >
                Re-Solve
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
