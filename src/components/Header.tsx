import React from 'react';
import {
  Zap,
  Scale,
  WifiOff,
  Wifi,
  FilePlus,
  Compass,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';

export const Header: React.FC = () => {
  const {
    incidents,
    assets,
    isHighwayCut,
    toggleHighwayCut,
    setEquityDrawerOpen,
    setFieldFormOpen,
    setFleetDrawerOpen,
    isDegradedMode,
    toggleDegradedMode,
    offlineQueueCount,
    isMuted,
    toggleMute,
    tourStep,
    setTourStep,
    isApiConnected,
    isSyncing,
    lastSyncTime,
    hydrateFromBackend,
  } = useDisasterStore();

  const activeCount = incidents.length;
  const criticalCount = incidents.filter((i) => i.assessment.priorityScore >= 80).length;
  const deployedCount = assets.filter((a) => a.status === 'EN_ROUTE' || a.status === 'ON_SITE').length;
  const totalFleet = assets.length;
  const deployedPct = Math.round((deployedCount / Math.max(totalFleet, 1)) * 100);

  return (
    <header className="h-14 bg-surface-panel border-b border-border-subtle px-3.5 flex items-center justify-between select-none sticky top-0 z-30 shadow-sm shrink-0">
      {/* LEFT ZONE: Branding, Valley Context & Fleet Capsule */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Brand Logo & Version Badge */}
        <div className="flex items-center gap-2">
          <img
            src="/assets/brand/resq-app-icon.png"
            alt="ResQ"
            className="h-7 w-7 rounded-md object-contain ring-1 ring-sky-500/30"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold tracking-tight text-base text-content-primary">
              Res<span className="text-sky-400">Q</span>
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-surface-card text-content-muted border border-border-subtle font-mono">
              EOC v2.0
            </span>
          </div>
        </div>

        {/* Location / Operational Sector */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-card/60 border border-border-subtle text-xs font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-status-safe animate-ping shrink-0" />
          <span className="text-content-primary font-medium">Uttarakhand</span>
          <span className="text-content-muted">·</span>
          <span className="text-content-muted text-[11px]">Alaknanda Valley</span>
        </div>

        {/* Compact Unified Fleet Capsule (Clickable trigger for Fleet Drawer) */}
        <button
          onClick={() => setFleetDrawerOpen(true)}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-card hover:bg-surface-hover border border-border-subtle hover:border-border-strong text-xs text-content-secondary hover:text-content-primary transition-all font-mono group"
          title="Open Multi-Agency Fleet Telemetry Drawer (NDRF, SDRF, ITBP, Police, EMS)"
        >
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            <img src="/assets/agencies/ndrf-icon.png" alt="NDRF" className="h-3.5 w-3.5 rounded-full ring-1 ring-surface-panel object-contain" />
            <img src="/assets/agencies/sdrf-icon.png" alt="SDRF" className="h-3.5 w-3.5 rounded-full ring-1 ring-surface-panel object-contain" />
            <img src="/assets/agencies/police-icon.png" alt="Police" className="h-3.5 w-3.5 rounded-full ring-1 ring-surface-panel object-contain" />
            <img src="/assets/agencies/ems-icon.png" alt="EMS" className="h-3.5 w-3.5 rounded-full ring-1 ring-surface-panel object-contain" />
            <img src="/assets/agencies/ngo-icon.png" alt="ITBP" className="h-3.5 w-3.5 rounded-full ring-1 ring-surface-panel object-contain" />
          </div>
          <span className="text-content-primary font-semibold">{totalFleet} Units</span>
          <span className="text-[10px] text-content-muted group-hover:text-sky-400 transition-colors">Fleet →</span>
        </button>
      </div>

      {/* CENTER ZONE: Unified Tactical HUD Telemetry Bar (Segmented Control) */}
      <div className="hidden sm:flex items-center h-8 px-3 rounded-md bg-surface-card/80 border border-border-subtle text-xs font-mono divide-x divide-border-subtle shadow-inner">
        {/* Active & Critical Incidents */}
        <div className="flex items-center gap-1.5 pr-3">
          <span className="h-2 w-2 rounded-full bg-status-critical animate-pulse shrink-0" />
          <span className="text-content-primary font-bold">{activeCount}</span>
          <span className="text-content-muted text-[11px]">Active</span>
          {criticalCount > 0 && (
            <span className="text-[10px] text-status-critical font-bold bg-status-critical/10 px-1 py-0.5 rounded border border-status-critical/20 ml-0.5">
              {criticalCount} Crit
            </span>
          )}
        </div>

        {/* Fleet Deployment Ratio */}
        <div className="flex items-center gap-1.5 px-3">
          <Compass className="h-3 w-3 text-sky-400 shrink-0" />
          <span className="text-content-primary font-bold">{deployedPct}%</span>
          <span className="text-content-muted text-[11px]">Deployed</span>
        </div>

        {/* Fairness / Unmet Need Ratio */}
        <div className="flex items-center gap-1.5 pl-3">
          <Scale className="h-3 w-3 text-status-forgotten shrink-0" />
          <span className="text-content-primary font-bold">31%</span>
          <span className="text-content-muted text-[11px]">Unmet</span>
        </div>
      </div>

      {/* RIGHT ZONE: Unified Command Controls & Action Cluster */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Hackathon Demo Tour Trigger */}
        <button
          onClick={() => setTourStep(tourStep ? null : 1)}
          className={`h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            tourStep
              ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 ring-1 ring-sky-400/30'
              : 'bg-surface-card hover:bg-surface-hover border-border-subtle hover:border-border-strong text-content-secondary hover:text-content-primary'
          }`}
          title="Interactive 4-Act Decision Support Tour"
        >
          <Sparkles className={`h-3 w-3 ${tourStep ? 'text-sky-400 animate-spin' : 'text-sky-400/80'}`} />
          <span className="hidden xl:inline">{tourStep ? `Tour: Act ${tourStep}` : 'Demo Tour'}</span>
        </button>

        {/* Road Cut Simulation Toggle */}
        <button
          onClick={toggleHighwayCut}
          className={`h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            isHighwayCut
              ? 'bg-red-950/40 border-red-500/50 text-red-300 ring-1 ring-red-500/30'
              : 'bg-surface-card hover:bg-surface-hover border-border-subtle hover:border-border-strong text-content-secondary hover:text-content-primary'
          }`}
          title="Simulate cloudburst damage washing out NH-07 Helang bridge"
        >
          <Zap className={`h-3 w-3 ${isHighwayCut ? 'text-red-400 fill-red-400' : 'text-amber-400'}`} />
          <span className="hidden md:inline">{isHighwayCut ? 'NH-07 Blocked' : 'Cut Road'}</span>
        </button>

        {/* Equity Lens Drawer Trigger */}
        <button
          onClick={() => setEquityDrawerOpen(true)}
          className="h-8 px-2.5 rounded-md bg-surface-card hover:bg-surface-hover border border-border-subtle hover:border-border-strong text-xs font-semibold text-content-secondary hover:text-content-primary flex items-center gap-1.5 transition-all relative"
          title="Open Sector Equity & Forgotten Zone Lens (Hotkey: E)"
        >
          <Scale className="h-3 w-3 text-status-forgotten" />
          <span className="hidden md:inline">Equity</span>
          <span className="h-1.5 w-1.5 rounded-full bg-status-forgotten animate-ping absolute top-1 right-1" />
        </button>

        {/* Primary Action: + SOS Report Form */}
        <button
          onClick={() => setFieldFormOpen(true)}
          className="h-8 px-3 rounded-md bg-sky-500 hover:bg-sky-400 text-sky-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-sky-500/20 active:scale-95"
          title="Submit Field Emergency Distress Report"
        >
          <FilePlus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>+ SOS</span>
        </button>

        {/* Subtle Vertical Group Divider */}
        <div className="h-4 w-px bg-border-subtle mx-0.5 hidden sm:block" />

        {/* Tactical Sound Toggle */}
        <button
          onClick={toggleMute}
          className={`h-8 w-8 rounded-md flex items-center justify-center transition-all border ${
            isMuted
              ? 'bg-surface-card border-border-subtle text-content-muted hover:text-content-primary'
              : 'bg-surface-card border-border-subtle text-sky-400 hover:border-border-strong'
          }`}
          title={isMuted ? 'Unmute tactical audio feedback' : 'Mute tactical audio feedback'}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>

        {/* Consolidated API & Connectivity Telemetry Pill */}
        <div className="flex items-center h-8 rounded-md bg-surface-card border border-border-subtle text-xs font-mono overflow-hidden">
          {/* API Health & Manual Refresh */}
          <button
            onClick={() => hydrateFromBackend()}
            disabled={isSyncing}
            className="h-full px-2 flex items-center gap-1.5 hover:bg-surface-hover text-content-secondary hover:text-content-primary transition-all"
            title={
              isApiConnected
                ? `Express REST API :3001 Active • Synced at ${lastSyncTime || 'now'} (Click to refresh)`
                : 'Local Mathematical Simulation Engine Active'
            }
          >
            <span className="relative flex h-2 w-2">
              {isApiConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isApiConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="hidden xl:inline text-[11px] font-medium">
              {isSyncing ? 'Syncing' : isApiConnected ? 'API Live' : 'Sim'}
            </span>
            <RefreshCw
              className={`h-2.5 w-2.5 text-content-muted ${isSyncing ? 'animate-spin text-emerald-400' : ''}`}
            />
          </button>

          {/* Micro-divider */}
          <div className="h-3.5 w-px bg-border-subtle" />

          {/* Offline / Degraded Network Mode Toggle */}
          <button
            onClick={toggleDegradedMode}
            className={`h-full px-2 flex items-center gap-1 transition-all ${
              isDegradedMode
                ? 'bg-amber-500/15 text-amber-300'
                : 'hover:bg-surface-hover text-content-muted hover:text-content-primary'
            }`}
            title={isDegradedMode ? 'Offline mode active (Click to simulate reconnect)' : 'Simulate network outage'}
          >
            {isDegradedMode ? (
              <>
                <WifiOff className="h-3 w-3 text-amber-400 animate-pulse" />
                <span className="font-bold text-[11px]">{offlineQueueCount > 0 ? `${offlineQueueCount}` : 'Offline'}</span>
              </>
            ) : (
              <Wifi className="h-3 w-3 text-content-muted" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
