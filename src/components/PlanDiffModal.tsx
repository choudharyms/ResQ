import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';

export const PlanDiffModal: React.FC = () => {
  const {
    activePlanDiff,
    isDiffModalOpen,
    setDiffModalOpen,
    approveCurrentPlan,
  } = useDisasterStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDiffModalOpen) return;
      if (e.key === 'Enter') {
        approveCurrentPlan();
        setDiffModalOpen(false);
      }
      if (e.key === 'Escape') {
        setDiffModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDiffModalOpen, approveCurrentPlan, setDiffModalOpen]);

  if (!isDiffModalOpen || !activePlanDiff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-4xl bg-surface-panel border border-border-strong rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-border-subtle bg-status-critical/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-status-critical/20 border border-status-critical/40 flex items-center justify-center text-status-critical shrink-0">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-content-primary">
                  Dynamic Re-Optimization Required
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-status-critical text-white font-bold">
                  PLAN DIFF
                </span>
              </div>
              <p className="text-xs text-status-critical font-mono mt-0.5">
                {activePlanDiff.triggerEvent}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDiffModalOpen(false)}
            className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-card transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Diff Comparison Table */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border-strong text-content-muted text-[11px] uppercase">
                  <th className="py-2 px-3">Unit / Asset</th>
                  <th className="py-2 px-3">Previous Route</th>
                  <th className="py-2 px-3">Proposed New Route</th>
                  <th className="py-2 px-3">Travel Delta</th>
                  <th className="py-2 px-3">Operational Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {activePlanDiff.items.map((item, idx) => {
                  const isRerouted = item.action === 'REROUTED';
                  const isNew = item.action === 'NEW_DISPATCH';

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-surface-hover/50 transition-colors ${
                        isRerouted ? 'bg-amber-950/15' : isNew ? 'bg-blue-950/15' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-content-primary">{item.assetCode}</div>
                        <div className="text-[10px] text-content-muted">{item.assetName}</div>
                      </td>

                      <td className="py-3 px-3 text-content-secondary line-clamp-1">
                        {item.previousRoute}
                      </td>

                      <td className="py-3 px-3 font-semibold text-content-primary">
                        <div className="flex items-center gap-1">
                          <ArrowRight className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span>{item.proposedRoute}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {item.travelDeltaMinutes > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-status-critical/20 text-status-critical font-bold">
                            +{item.travelDeltaMinutes} min
                          </span>
                        ) : item.travelDeltaMinutes < 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-status-safe/20 text-status-safe font-bold">
                            {item.travelDeltaMinutes} min
                          </span>
                        ) : (
                          <span className="text-content-muted">0 min</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-content-secondary text-[11px] leading-relaxed max-w-xs">
                        {item.operationalReason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Projected Operational Impact Bar */}
          <div className="p-3 rounded-lg bg-surface-card border border-border-strong grid grid-cols-1 sm:grid-cols-3 gap-3 text-center font-mono">
            <div>
              <p className="text-[10px] text-content-muted uppercase">Net Lives Secured</p>
              <p className="text-sm font-bold text-status-safe">
                +{activePlanDiff.projectedNetLivesSecured} individuals
              </p>
            </div>
            <div>
              <p className="text-[10px] text-content-muted uppercase">Avg Latency Delta</p>
              <p className="text-sm font-bold text-status-high">
                +{activePlanDiff.avgResponseLatencyDeltaMinutes} min detour
              </p>
            </div>
            <div>
              <p className="text-[10px] text-content-muted uppercase">Fleet Reserve Left</p>
              <p className="text-sm font-bold text-indigo-400">
                {activePlanDiff.fleetReservePct}%
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action buttons */}
        <div className="p-4 border-t border-border-subtle bg-surface-panel flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-content-muted font-mono">
            Actor: <span className="text-content-primary font-bold">DIG_RAJ_EOC_COMM_01</span> (Tamper-Evident Audit Stamp)
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setDiffModalOpen(false)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-surface-card hover:bg-surface-hover text-content-primary border border-border-strong text-xs font-semibold transition-all"
            >
              Reject & Hold
            </button>
            <button
              onClick={() => {
                approveCurrentPlan();
                setDiffModalOpen(false);
              }}
              className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-status-critical hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Authorize & Reroute Convoys (Enter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
