import React from 'react';
import {
  Scale,
  X,
  AlertTriangle,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';

export const EquityDrawer: React.FC = () => {
  const {
    equityZones,
    isEquityDrawerOpen,
    setEquityDrawerOpen,
    forceEquityAllocation,
  } = useDisasterStore();

  if (!isEquityDrawerOpen) return null;

  const totalZones = equityZones.length;
  const adequateCount = equityZones.filter(
    (z) => z.status === 'WELL_SERVED' || z.status === 'ADEQUATE'
  ).length;
  const coveragePct = Math.round((adequateCount / Math.max(totalZones, 1)) * 100);

  const forgottenZone = equityZones.find((z) => z.status === 'FORGOTTEN');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-surface-panel border-l border-border-strong h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between gap-3 bg-surface-panel/90 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-status-forgotten/20 border border-status-forgotten/40 flex items-center justify-center text-status-forgotten">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-content-primary font-mono">
                Equity Lens (Fairness Layer)
              </h3>
              <p className="text-[11px] text-content-muted">
                Auditing live Fulfilled Need Ratios (Ei) across all H3 sectors
              </p>
            </div>
          </div>

          <button
            onClick={() => setEquityDrawerOpen(false)}
            className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-card transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Macro Coverage Progress Bar */}
          <div className="p-3.5 rounded-lg bg-surface-card border border-border-strong space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-content-primary uppercase">Sector Coverage Equity</span>
              <span className={coveragePct >= 60 ? 'text-status-safe' : 'text-status-high'}>
                {coveragePct}% Adequately Served
              </span>
            </div>

            <div className="h-2.5 w-full bg-surface-canvas rounded-full overflow-hidden border border-border-subtle flex">
              <div
                style={{ width: `${coveragePct}%` }}
                className="h-full bg-status-safe transition-all duration-500"
              />
              <div
                style={{ width: `${100 - coveragePct}%` }}
                className="h-full bg-status-critical/60 transition-all duration-500"
              />
            </div>

            <p className="text-[11px] text-content-muted font-mono pt-1">
              Guarantees response parity: assets cannot be monopolized by high-reporting urban hubs.
            </p>
          </div>

          {/* Forgotten Zone High-Priority Alert Banner */}
          {forgottenZone && (
            <div className="p-3.5 rounded-lg bg-status-forgotten/15 border border-status-forgotten/50 space-y-2.5 shadow-lg relative overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-status-forgotten text-white flex items-center justify-center pulse-forgotten shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      FORGOTTEN POCKET DETECTED
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900 text-purple-200 border border-purple-600">
                        Ei = 0.00
                      </span>
                    </h4>
                    <p className="text-xs font-bold text-purple-200 mt-0.5">
                      {forgottenZone.zoneName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Narrative explanation */}
              <div className="p-2.5 rounded bg-surface-panel/90 border border-purple-800/40 text-[11px] text-purple-100 font-sans leading-relaxed space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-mono text-purple-300 font-bold uppercase">
                  <Sparkles className="h-3 w-3 text-purple-300" />
                  Gemini Flash Decision Narrative:
                </div>
                <p>
                  "Guptkashi has received <b>zero deployed assets</b> for 3.5 hours despite a cumulative need weight of 58.0. With 34 children and 22 elderly residents cut off by rockfalls, this sector represents our most urgent equity deficit. Immediate forced-allocation recommended."
                </p>
              </div>

              <button
                onClick={() => forceEquityAllocation(forgottenZone.zoneId)}
                className="w-full py-2 px-3 rounded-lg bg-status-forgotten hover:bg-purple-600 text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Force-Assign Next Available Fleet Unit</span>
              </button>
            </div>
          )}

          {/* Zones Equity Breakdown List */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-content-muted uppercase tracking-wider font-mono">
              Live Fulfilled Need Ratios (Ei by Hex)
            </h4>

            {equityZones.map((zone) => {
              const isZero = zone.equityRatioEi === 0;

              return (
                <div
                  key={zone.zoneId}
                  className={`p-3 rounded-lg border transition-all ${
                    isZero
                      ? 'bg-purple-950/20 border-status-forgotten/40'
                      : 'bg-surface-card border-border-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-content-primary font-mono">
                      {zone.zoneName}
                    </span>

                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        zone.status === 'WELL_SERVED'
                          ? 'bg-status-safe/20 text-status-safe'
                          : zone.status === 'ADEQUATE'
                          ? 'bg-blue-900/30 text-blue-400'
                          : zone.status === 'UNDERSERVED'
                          ? 'bg-status-high/20 text-status-high'
                          : isZero
                          ? 'bg-status-forgotten/30 text-purple-300 animate-pulse'
                          : 'bg-status-critical/20 text-status-critical'
                      }`}
                    >
                      Ei: {zone.equityRatioEi.toFixed(2)} ({zone.status})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-content-secondary font-mono mt-2 pt-2 border-t border-border-subtle">
                    <div>Need Weight: <b className="text-content-primary">{zone.needWeight}</b></div>
                    <div>Deployed Assets: <b className="text-content-primary">{zone.resourcesDeployedWeight} pts</b></div>
                    <div>Unserved: <span className="text-content-muted">{zone.hoursWithoutResources} hrs</span></div>
                    <div>Vulnerability: <span className="text-amber-400">{(zone.vulnerabilityIndex * 100).toFixed(0)}% SVI</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-border-subtle bg-surface-panel flex items-center justify-between text-xs text-content-muted font-mono">
          <span>Objective: Maximize citywide Ei parity</span>
          <button
            onClick={() => setEquityDrawerOpen(false)}
            className="px-3 py-1.5 rounded-md bg-surface-card hover:bg-surface-hover text-content-primary font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
