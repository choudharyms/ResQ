import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDisasterStore } from '../stores/useDisasterStore';

export const AllocationPlanPanel: React.FC = () => {
  const {
    activePlan,
    runAllocation,
    approveCurrentPlan,
  } = useDisasterStore();

  const [expandedReasoningId, setExpandedReasoningId] = useState<string | null>(null);

  const handleApprove = () => {
    approveCurrentPlan();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {
      // fallback
    }
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoningId((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="w-full lg:w-[380px] bg-surface-panel border-l border-border-subtle flex flex-col h-[calc(100vh-57px)] select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-border-subtle bg-surface-panel/90 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider font-mono">
              Optimization Engine
            </h3>
            <p className="text-[11px] text-content-muted">
              Greedy Capability Matcher &bull; Sub-50ms Math
            </p>
          </div>

          <button
            onClick={runAllocation}
            className="px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{activePlan ? 'Re-Run' : 'Run Allocator'}</span>
          </button>
        </div>
      </div>

      {/* Plan Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!activePlan ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="h-12 w-12 rounded-full bg-surface-canvas border border-border-strong flex items-center justify-center text-indigo-400 shadow-inner">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-content-primary">
                No Plan Generated Yet
              </h4>
              <p className="text-xs text-content-muted mt-1 leading-relaxed">
                Run the deterministic optimizer to match available NDRF, SDRF, and ITBP units to active sectors based on mountain terrain access.
              </p>
            </div>
            <button
              onClick={runAllocation}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Disaster Dispatch Plan</span>
            </button>
          </div>
        ) : (
          /* Active Plan Details */
          <>
            {/* Plan Meta Banner */}
            <div className="p-3 rounded-lg bg-surface-card border border-border-strong space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-content-primary">
                    Plan #{activePlan.planId}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      activePlan.status === 'APPROVED'
                        ? 'bg-status-safe/20 text-status-safe border border-status-safe/40'
                        : 'bg-status-high/20 text-status-high border border-status-high/40'
                    }`}
                  >
                    {activePlan.status}
                  </span>
                </div>
                <span className="text-[11px] text-content-muted font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {activePlan.generatedAt}
                </span>
              </div>

              {/* KPI Metrics Strip */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
                <div className="p-1.5 rounded bg-surface-canvas border border-border-subtle">
                  <p className="text-[10px] text-content-muted uppercase">Units</p>
                  <p className="text-sm font-bold text-content-primary">
                    {activePlan.totalUnitsDispatched}
                  </p>
                </div>
                <div className="p-1.5 rounded bg-surface-canvas border border-border-subtle">
                  <p className="text-[10px] text-content-muted uppercase">Secured</p>
                  <p className="text-sm font-bold text-status-safe">
                    +{activePlan.projectedLivesSecured}
                  </p>
                </div>
                <div className="p-1.5 rounded bg-surface-canvas border border-border-subtle">
                  <p className="text-[10px] text-content-muted uppercase">Reserve</p>
                  <p className="text-sm font-bold text-indigo-400">
                    {activePlan.fleetReserveRemainingPct}%
                  </p>
                </div>
              </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-content-muted uppercase tracking-wider font-mono">
                Recommended Assignments ({activePlan.assignments.length})
              </p>

              {activePlan.assignments.map((asg) => {
                const isExpanded = expandedReasoningId === asg.id;

                return (
                  <div
                    key={asg.id}
                    className={`p-3 rounded-lg border transition-all ${
                      asg.isEquityForced
                        ? 'bg-purple-950/20 border-status-forgotten/50'
                        : 'bg-surface-card border-border-subtle hover:border-border-strong'
                    }`}
                  >
                    {/* Top Row: Unit, Agency, and Travel Time */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            asg.agency.includes('SDRF')
                              ? '/assets/agencies/sdrf-icon.png'
                              : asg.agency.includes('Police')
                              ? '/assets/agencies/police-icon.png'
                              : asg.agency.includes('Medical') || asg.agency.includes('EMS')
                              ? '/assets/agencies/ems-icon.png'
                              : asg.agency.includes('ITBP') || asg.agency.includes('Army')
                              ? '/assets/agencies/ngo-icon.png'
                              : '/assets/agencies/ndrf-icon.png'
                          }
                          alt={asg.agency}
                          className="h-5 w-5 rounded object-contain border border-border-strong bg-black/40"
                        />
                        <span className="text-xs font-mono font-bold text-content-primary">
                          {asg.assetCode}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-canvas text-blue-300 font-mono border border-border-subtle">
                          {asg.agency}
                        </span>
                        {asg.isEquityForced && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-status-forgotten/30 text-purple-300 font-mono font-bold border border-status-forgotten/40">
                            EQUITY FORCED
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {asg.travelMinutes} min
                      </span>
                    </div>

                    {/* Mission Destination */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-content-secondary mb-1.5">
                      <ArrowRight className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span className="font-bold text-content-primary line-clamp-1">
                        {asg.zoneName}
                      </span>
                    </div>

                    {/* Route description pill */}
                    <p className="text-[11px] text-content-muted font-mono mb-2 line-clamp-1">
                      via {asg.routeDescription} ({asg.distanceKm} km)
                    </p>

                    {/* Accordion Trigger: Why This Allocation? */}
                    <button
                      onClick={() => toggleReasoning(asg.id)}
                      className="w-full flex items-center justify-between text-[11px] px-2 py-1 rounded bg-surface-canvas border border-border-subtle text-indigo-300 hover:text-indigo-200 transition-colors font-mono"
                    >
                      <span className="flex items-center gap-1">
                        <HelpCircle className="h-3 w-3 text-indigo-400" />
                        Why this allocation?
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* Reasoning Accordion Body */}
                    {isExpanded && (
                      <ul className="mt-2 p-2 rounded bg-surface-canvas/90 border border-border-subtle text-[11px] text-content-secondary space-y-1 font-mono">
                        {asg.reasoning.map((r, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-1.5">
                            <span className="text-indigo-400 font-bold">&bull;</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      {activePlan && (
        <div className="p-3 border-t border-border-subtle bg-surface-panel/90 backdrop-blur sticky bottom-0 z-10 flex items-center gap-2">
          {activePlan.status !== 'APPROVED' ? (
            <button
              onClick={handleApprove}
              className="w-full py-2.5 rounded-lg bg-status-safe hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve & Dispatch Plan (Enter)</span>
            </button>
          ) : (
            <div className="w-full py-2 px-3 rounded-lg bg-status-safe/15 border border-status-safe/40 text-status-safe text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Units Dispatched En Route
              </span>
              <button
                onClick={runAllocation}
                className="text-[11px] underline hover:text-white"
              >
                Recalculate
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
