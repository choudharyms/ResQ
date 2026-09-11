import React, { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  Scale,
  WifiOff,
  Wifi,
  FilePlus,
  Compass,
  Sparkles,
  Truck,
  Volume2,
  VolumeX,
  RefreshCw,
  RotateCcw,
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
    resetDemo,
  } = useDisasterStore();

  const [isResetting, setIsResetting] = useState(false);

  const activeCount = incidents.length;
  const criticalCount = incidents.filter((i) => i.assessment.priorityScore >= 80).length;
  const deployedCount = assets.filter((a) => a.status === 'EN_ROUTE' || a.status === 'ON_SITE').length;
  const totalFleet = assets.length;
  const deployedPct = Math.round((deployedCount / Math.max(totalFleet, 1)) * 100);

  // Bug 2 fix: use strict equality against AgencyType enum values (not substring search)
  const ndrfCount  = assets.filter((a) => a.agency === 'NDRF').length;
  const sdrfCount  = assets.filter((a) => a.agency === 'SDRF').length;
  const policeCount = assets.filter((a) => a.agency === 'POLICE').length;
  const emsCount   = assets.filter((a) => a.agency === 'EMS').length;
  const itbpCount  = assets.filter((a) => a.agency === 'ITBP').length;

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo? All incidents and plan data will return to the Uttarakhand seed state.')) return;
    setIsResetting(true);
    await resetDemo();
    setIsResetting(false);
  };

  return (
    <header className="bg-surface-panel border-b border-border-subtle px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 select-none sticky top-0 z-30 shadow-md">
      {/* Left: Official ResQ Branding & Multi-Agency Pills */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/brand/resq-app-icon.png"
            alt="ResQ Logo"
            className="h-9 w-9 rounded-lg object-contain shadow-md shadow-sky-500/20 ring-1 ring-sky-400/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-content-primary">
                Res<span className="text-sky-400">Q</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-surface-card text-sky-400 border border-sky-500/30 font-mono">
                EOC v2.0
              </span>
            </div>
            <p className="text-xs text-content-muted flex items-center gap-1 font-mono">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-status-safe animate-ping" />
              Uttarakhand Flash Flood | Alaknanda State EOC
            </p>
          </div>
        </div>

        {/* Multi-Agency Badges with Official Crest Squircles */}
        <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-border-subtle">
          <button
            onClick={() => setFleetDrawerOpen(true)}
            className="text-[11px] px-2 py-1 rounded-md bg-orange-950/30 hover:bg-orange-950/60 text-orange-300 border border-orange-700/50 font-mono font-medium flex items-center gap-1.5 transition-colors"
            title="View NDRF Fleet Assets"
          >
            <img src="/assets/agencies/ndrf-icon.png" alt="NDRF" className="h-4 w-4 rounded-sm object-contain" />
            <span>NDRF: {ndrfCount}</span>
          </button>
          <button
            onClick={() => setFleetDrawerOpen(true)}
            className="text-[11px] px-2 py-1 rounded-md bg-blue-950/30 hover:bg-blue-950/60 text-blue-300 border border-blue-700/50 font-mono font-medium flex items-center gap-1.5 transition-colors"
            title="View SDRF Fleet Assets"
          >
            <img src="/assets/agencies/sdrf-icon.png" alt="SDRF" className="h-4 w-4 rounded-sm object-contain" />
            <span>SDRF: {sdrfCount}</span>
          </button>
          <button
            onClick={() => setFleetDrawerOpen(true)}
            className="text-[11px] px-2 py-1 rounded-md bg-slate-900/40 hover:bg-slate-900/80 text-slate-300 border border-slate-700/50 font-mono font-medium flex items-center gap-1.5 transition-colors"
            title="View Indian Police Fleet Assets"
          >
            <img src="/assets/agencies/police-icon.png" alt="Police" className="h-4 w-4 rounded-sm object-contain" />
            <span>Police: {policeCount}</span>
          </button>
          <button
            onClick={() => setFleetDrawerOpen(true)}
            className="text-[11px] px-2 py-1 rounded-md bg-red-950/30 hover:bg-red-950/60 text-red-300 border border-red-700/50 font-mono font-medium flex items-center gap-1.5 transition-colors"
            title="View EMS Medical Units"
          >
            <img src="/assets/agencies/ems-icon.png" alt="EMS" className="h-4 w-4 rounded-sm object-contain" />
            <span>EMS: {emsCount}</span>
          </button>
          <button
            onClick={() => setFleetDrawerOpen(true)}
            className="text-[11px] px-2 py-1 rounded-md bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 font-mono font-medium flex items-center gap-1.5 transition-colors"
            title="View ITBP / NGO Partners"
          >
            <img src="/assets/agencies/ngo-icon.png" alt="NGO" className="h-4 w-4 rounded-sm object-contain" />
            <span>ITBP: {itbpCount}</span>
          </button>
        </div>
      </div>

      {/* Center: Citywide Macro KPIs */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-surface-canvas border border-border-subtle">
          <div className="h-2 w-2 rounded-full bg-status-critical animate-pulse" />
          <div className="text-left">
            <p className="text-[10px] text-content-muted uppercase tracking-wider font-mono">Active Incidents</p>
            <p className="text-sm font-bold font-mono text-content-primary">{activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-surface-canvas border border-border-subtle">
          <AlertTriangle className="h-3.5 w-3.5 text-status-critical" />
          <div className="text-left">
            <p className="text-[10px] text-content-muted uppercase tracking-wider font-mono">Critical</p>
            <p className="text-sm font-bold font-mono text-status-critical">{criticalCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-surface-canvas border border-border-subtle">
          <Compass className="h-3.5 w-3.5 text-status-dispatched" />
          <div className="text-left">
            <p className="text-[10px] text-content-muted uppercase tracking-wider font-mono">Fleet Deployed</p>
            <p className="text-sm font-bold font-mono text-status-dispatched">{deployedPct}%</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-surface-canvas border border-border-subtle">
          <Scale className="h-3.5 w-3.5 text-status-forgotten" />
          <div className="text-left">
            <p className="text-[10px] text-content-muted uppercase tracking-wider font-mono">Unmet Need</p>
            <p className="text-sm font-bold font-mono text-status-high">31%</p>
          </div>
        </div>
      </div>

      {/* Right: Simulation Actions & Modals */}
      <div className="flex items-center gap-2">
        {/* Judge Demo Tour Launch Button */}
        <button
          onClick={() => setTourStep(tourStep ? null : 1)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            tourStep
              ? 'bg-indigo-600 text-white shadow-indigo-600/30 ring-2 ring-indigo-400'
              : 'bg-gradient-to-r from-indigo-950/80 to-purple-950/80 hover:from-indigo-900 hover:to-purple-900 text-indigo-200 border border-indigo-500/50'
          }`}
          title="Interactive 4-Act Hackathon Judge Walkthrough"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
          <span>{tourStep ? `Tour: Act ${tourStep}` : 'Judge Demo Tour'}</span>
        </button>

        {/* Fleet Drawer Trigger */}
        <button
          onClick={() => setFleetDrawerOpen(true)}
          className="px-2.5 py-1.5 rounded-md bg-surface-card hover:bg-surface-hover text-content-primary border border-border-strong text-xs font-semibold flex items-center gap-1.5 transition-all"
          title="Open Multi-Agency Fleet Telemetry Drawer"
        >
          <Truck className="h-3.5 w-3.5 text-indigo-400" />
          <span className="hidden xl:inline">Fleet</span>
        </button>

        {/* Toggle Road Cut Trigger Button */}
        <button
          onClick={toggleHighwayCut}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            isHighwayCut
              ? 'bg-status-critical text-white shadow-status-critical/20 ring-2 ring-status-critical/50'
              : 'bg-surface-card hover:bg-surface-hover text-content-primary border border-border-strong'
          }`}
          title="Simulate cloudburst damage washing out NH-07 Helang bridge"
        >
          <Zap className={`h-3.5 w-3.5 ${isHighwayCut ? 'text-white' : 'text-amber-400'}`} />
          <span>{isHighwayCut ? 'NH-07 Severed' : 'Cut NH-07'}</span>
        </button>

        {/* Equity Lens Drawer Trigger */}
        <button
          onClick={() => setEquityDrawerOpen(true)}
          className="px-2.5 py-1.5 rounded-md bg-surface-card hover:bg-surface-hover text-content-primary border border-border-strong text-xs font-semibold flex items-center gap-1.5 transition-all relative"
          title="Open Sector Equity Lens"
        >
          <Scale className="h-3.5 w-3.5 text-status-forgotten" />
          <span className="hidden sm:inline">Equity</span>
          <span className="h-2 w-2 rounded-full bg-status-forgotten animate-ping absolute -top-0.5 -right-0.5" />
        </button>

        {/* Mobile Field SOS Form Trigger */}
        <button
          onClick={() => setFieldFormOpen(true)}
          className="px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <FilePlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">+ SOS</span>
        </button>

        {/* Tactical Sound Toggle */}
        <button
          onClick={toggleMute}
          className={`p-1.5 rounded-md text-xs transition-all border ${
            isMuted
              ? 'bg-surface-card border-border-subtle text-content-muted hover:text-content-primary'
              : 'bg-indigo-950/40 border-indigo-800/50 text-indigo-400'
          }`}
          title={isMuted ? 'Unmute tactical audio' : 'Mute tactical audio'}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>

        {/* Backend API Connection Status Badge */}
        <button
          onClick={() => hydrateFromBackend()}
          disabled={isSyncing}
          className={`px-2 py-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all border ${
            isApiConnected
              ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-400 hover:bg-emerald-950/60'
              : 'bg-amber-950/30 border-amber-700/50 text-amber-400 hover:bg-amber-950/60'
          }`}
          title={
            isApiConnected
              ? `Express REST API :3001 Active • Synced at ${lastSyncTime || 'now'} (Click to refresh)`
              : 'Standalone Mathematical Simulation Active (Click to reconnect to API :3001)'
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
          <span className="hidden xl:inline font-bold">
            {isSyncing ? 'Syncing...' : isApiConnected ? 'API :3001' : 'Sim Engine'}
          </span>
          <RefreshCw
            className={`h-3 w-3 text-content-muted hover:text-content-primary ${
              isSyncing ? 'animate-spin text-emerald-400' : ''
            }`}
          />
        </button>

        {/* Offline / Degraded Toggle */}
        <button
          onClick={toggleDegradedMode}
          className={`px-2 py-1.5 rounded-md text-xs font-mono flex items-center gap-1 transition-all border ${
            isDegradedMode
              ? 'bg-status-high/20 border-status-high text-status-high'
              : 'bg-surface-card border-border-subtle text-content-muted hover:text-content-primary'
          }`}
          title={isDegradedMode ? 'Offline mode active (Click to simulate reconnect)' : 'Simulate offline network outage'}
        >
          {isDegradedMode ? (
            <>
              <WifiOff className="h-3.5 w-3.5 animate-pulse" />
              <span className="font-bold">{offlineQueueCount > 0 ? `${offlineQueueCount}` : 'Offline'}</span>
            </>
          ) : (
            <Wifi className="h-3.5 w-3.5 text-status-safe" />
          )}
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="px-2 py-1.5 rounded-md text-xs font-mono flex items-center gap-1 transition-all border bg-surface-card border-border-subtle text-content-muted hover:text-amber-400 hover:border-amber-600/50 disabled:opacity-50"
          title="Reset demo to Uttarakhand seed state (clears all plans and allocations)"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden xl:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
