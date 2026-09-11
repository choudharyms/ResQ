import React from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  ShieldCheck,
  Zap,
  Scale,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';

export const JudgeDemoTour: React.FC = () => {
  const {
    tourStep,
    setTourStep,
    selectIncident,
    incidents,
    runAllocation,
    approveCurrentPlan,
    toggleHighwayCut,
    isHighwayCut,
    setEquityDrawerOpen,
    forceEquityAllocation,
  } = useDisasterStore();

  if (tourStep === null) return null;

  const acts = [
    {
      act: 1,
      title: 'Act 1: Multi-Agency SOS Ingestion & H3 Tessellation',
      badge: 'Information Fusion',
      description:
        'Cloudburst in Alaknanda & Mandakini valleys. Unstructured SOS feeds from police radios, SDRF posts, and citizen calls are deduplicated into Uber H3 hexagons.',
      actionLabel: 'Select Critical Incident & View Demand Vector',
      onAction: () => {
        if (incidents.length > 0) {
          selectIncident(incidents[0].id);
        }
      },
    },
    {
      act: 2,
      title: 'Act 2: Greedy Priority Dispatch & Explainability',
      badge: 'Resource Optimisation',
      description:
        'Deterministic greedy allocator scores (Priority × Match × Transit). Each unit receives an auditable "Why this allocation?" mathematical justification.',
      actionLabel: 'Authorize Plan & Dispatch Units',
      onAction: () => {
        runAllocation();
        approveCurrentPlan();
      },
    },
    {
      act: 3,
      title: 'Act 3: Environmental Mutation — NH-07 Bridge Washout',
      badge: 'Dynamic Situation Engine',
      description:
        'Landslide severs Helang Bridge on NH-07. Engine 4 halts severed dispatches, calculates mountain bypass routes (+55 min detour), and presents a Plan Diff.',
      actionLabel: isHighwayCut ? 'View Before/After Plan Diff' : 'Trigger Helang Bridge Washout',
      onAction: () => {
        if (!isHighwayCut) {
          toggleHighwayCut();
        }
      },
    },
    {
      act: 4,
      title: 'Act 4: Algorithmic Fairness & Forgotten Zone Rescue',
      badge: 'Equity Engine',
      description:
        'Isolated Raini Village has Fulfilled Need Ratio (Ei) = 0 for >90 min. The Fairness Layer flags this starvation bias and executes an emergency forced allocation pass.',
      actionLabel: 'Open Equity Lens & Force Rescue Pass',
      onAction: () => {
        setEquityDrawerOpen(true);
        forceEquityAllocation('zone-raini');
      },
    },
  ];

  const currentAct = acts[tourStep - 1] || acts[0];

  const handleNext = () => {
    if (tourStep < 4) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      // Auto-trigger the appropriate action for the next step
      if (nextStep === 2) {
        runAllocation();
      } else if (nextStep === 3 && !isHighwayCut) {
        toggleHighwayCut();
      } else if (nextStep === 4) {
        setEquityDrawerOpen(true);
      }
    } else {
      setTourStep(null);
    }
  };

  const handlePrev = () => {
    if (tourStep > 1) {
      setTourStep(tourStep - 1);
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-3xl bg-surface-panel/95 backdrop-blur-md border-2 border-sky-500/50 shadow-2xl rounded-xl p-4 text-content-primary ring-4 ring-sky-500/20 transition-all duration-300">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-sky-500/20 text-sky-400">
            <Sparkles className="h-4 w-4 animate-spin" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-sky-400">
            Judge Guided Walkthrough Mode
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-card border border-border-strong text-content-secondary font-mono">
            Act {tourStep} of 4
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => setTourStep(step)}
              className={`h-2.5 rounded-full transition-all ${
                tourStep === step
                  ? 'w-7 bg-sky-500 shadow-sm shadow-sky-500/50'
                  : tourStep > step
                  ? 'w-2.5 bg-sky-700 hover:bg-sky-600'
                  : 'w-2.5 bg-surface-card border border-border-strong'
              }`}
              title={`Jump to Act ${step}`}
            />
          ))}
          <button
            onClick={() => setTourStep(null)}
            className="p-1 rounded-md hover:bg-surface-hover text-content-muted hover:text-content-primary transition-colors ml-2"
            title="Exit Walkthrough"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body content */}
      <div className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            {tourStep === 1 && <Radio className="h-4 w-4 text-sky-400" />}
            {tourStep === 2 && <ShieldCheck className="h-4 w-4 text-emerald-400" />}
            {tourStep === 3 && <Zap className="h-4 w-4 text-amber-400" />}
            {tourStep === 4 && <Scale className="h-4 w-4 text-purple-400" />}
            <h3 className="text-sm font-bold text-content-primary">
              {currentAct.title}
            </h3>
          </div>
          <p className="text-xs text-content-secondary leading-relaxed">
            {currentAct.description}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={currentAct.onAction}
          className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/60 text-xs font-semibold text-sky-200 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
          <span>{currentAct.actionLabel}</span>
        </button>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
        <button
          onClick={handlePrev}
          disabled={tourStep === 1}
          className="px-2.5 py-1 rounded text-content-secondary hover:text-content-primary disabled:opacity-30 disabled:hover:text-content-secondary flex items-center gap-1 font-mono transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>

        <button
          onClick={handleNext}
          className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <span>{tourStep === 4 ? 'Complete Walkthrough' : 'Next Step'}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
