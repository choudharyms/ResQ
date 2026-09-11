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
import { AGENCY_CONFIG } from '../utils/agencyConfig';
import { AgencyType } from '../types/disaster';

export const Header: React.FC = () => {
  const {
    incidents,
    assets,
    activePlan,
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

  // Dynamic Unmet Need computation from active plan
  const totalCasualties = incidents.reduce((sum, inc) => sum + inc.casualties.affected, 0);
  const securedLives = activePlan?.projectedLivesSecured || 0;
  const unmetNeedPct = totalCasualties > 0
    ? Math.max(0, Math.min(100, Math.round(((totalCasualties - securedLives) / totalCasualties) * 100)))
    : 0;

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

        {/* Multi-Agency Badges with Official Crests */}
        <div className="hidden 2xl:flex items-center gap-1 pl-3 border-l border-border-subtle">
          {(['NDRF', 'SDRF', 'POLICE', 'EMS', 'ITBP'] as AgencyType[]).map((type) => {
            const cfg = AGENCY_CONFIG[type];
            const count = assets.filter((a) => a.agency === type).length;
            return (
              <button
                key={type}
                onClick={() => setFleetDrawerOpen(true)}
                className={`text-[11px] px-2 py-1 rounded-md border font-mono font-medium flex items-center gap-1.5 transition-colors ${cfg.chipClass}`}
                title={`View ${cfg.fullName} (${count} Units)`}
              >
                <img src={cfg.icon} alt={cfg.shortName} className="h-3.5 w-3.5 rounded-sm object-contain" />
                <span>{cfg.shortName}: {count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: Citywide Macro KPIs */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-0.5">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-canvas border border-border-subtle">
          <div className="h-2 w-2 rounded-full bg-status-critical animate-pulse" />
          <div className="text-left">
            <p className="text-[10px] text-content-muted uppercase tracking-wider font-mono">Active</p>
            <p className="text-xs font-bold font-mono text-content-primary">{activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-canvas border border-border-subtle">
          <AlertTriangle className="h-3 w-3 text-status-critical" />
          <div className="text-left">
            <p className="text-[10px] text-content-muted uppercase tracking-wider font-mono">Critical</p>
            <p className="text-xs font-bold font-mono text-status-critical">{criticalCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-canvas border border-border-subtle">
          <Compass className="h-3 w-3 text-status-dispatched" />
          <div className="text-left">
            <p className="text-[10px] text-content-muted uppercase tracking-wider font-mono">Deployed</p>
            <p className="text-xs font-bold font-mono text-status-dispatched">{deployedPct}%</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-canvas border border-border-subtle">
          <Scale className="h-3 w-3 text-status-forgotten" />
          <div className="text-left">
            <p className="text-[10px] text-content-muted uppercase tracking-wider font-mono">Unmet</p>
            <p className="text-xs font-bold font-mono text-status-high">{unmetNeedPct}%</p>
          </div>
        </div>
      </div>

      {/* Right: Operations & System Control Clusters */}
      <div className="flex items-center gap-2">
        {/* Tactical Operations Cluster */}
        <div className="flex items-center gap-1.5">
          {/* Judge Demo Tour Launch Button */}
          <button
            onClick={() => setTourStep(tourStep ? null : 1)}
            className={`h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              tourStep
                ? 'bg-sky-600 text-white shadow-sky-600/30 ring-2 ring-sky-400'
                : 'bg-gradient-to-r from-sky-950/80 to-indigo-950/80 hover:from-sky-900 hover:to-indigo-900 text-sky-200 border border-sky-500/50'
            }`}
            title="Interactive 4-Act Hackathon Judge Walkthrough"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-spin" />
            <span>{tourStep ? `Act ${tourStep}` : 'Judge Tour'}</span>
          </button>

          {/* Fleet Drawer Trigger */}
          <button
            onClick={() => setFleetDrawerOpen(true)}
            className="h-8 px-2.5 rounded-md bg-surface-card hover:bg-surface-hover text-content-primary border border-border-strong text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Open Multi-Agency Fleet Telemetry Drawer"
          >
            <Truck className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden xl:inline">Fleet</span>
          </button>

          {/* Toggle Road Cut Trigger Button */}
          <button
            onClick={toggleHighwayCut}
            className={`h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isHighwayCut
                ? 'bg-status-critical text-white shadow-status-critical/20 ring-2 ring-status-critical/50'
                : 'bg-surface-card hover:bg-surface-hover text-content-primary border border-border-strong'
            }`}
            title="Simulate cloudburst damage washing out NH-07 Helang bridge"
          >
            <Zap className={`h-3.5 w-3.5 ${isHighwayCut ? 'text-white' : 'text-amber-400'}`} />
            <span>{isHighwayCut ? 'NH-07 Cut' : 'Cut NH-07'}</span>
          </button>

          {/* Equity Lens Drawer Trigger */}
          <button
            onClick={() => setEquityDrawerOpen(true)}
            className="h-8 px-2.5 rounded-md bg-surface-card hover:bg-surface-hover text-content-primary border border-border-strong text-xs font-semibold flex items-center gap-1.5 transition-all relative"
            title="Open Sector Equity Lens"
          >
            <Scale className="h-3.5 w-3.5 text-status-forgotten" />
            <span className="hidden sm:inline">Equity</span>
            <span className="h-2 w-2 rounded-full bg-status-forgotten animate-ping absolute -top-0.5 -right-0.5" />
          </button>

          {/* Mobile Field SOS Form Trigger */}
          <button
            onClick={() => setFieldFormOpen(true)}
            className="h-8 px-2.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FilePlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+ SOS</span>
          </button>
        </div>

        {/* Subtle Vertical Divider */}
        <div className="h-5 w-px bg-border-strong hidden sm:block" />

        {/* System Telemetry & Control Cluster */}
        <div className="flex items-center gap-1">
          {/* Tactical Sound Toggle */}
          <button
            onClick={toggleMute}
            className={`h-8 w-8 rounded-md text-xs flex items-center justify-center transition-all border ${
              isMuted
                ? 'bg-surface-card border-border-subtle text-content-muted hover:text-content-primary'
                : 'bg-sky-950/40 border-sky-800/50 text-sky-400'
            }`}
            title={isMuted ? 'Unmute tactical audio' : 'Mute tactical audio'}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>

          {/* Backend API Connection Status Badge */}
          <button
            onClick={() => hydrateFromBackend()}
            disabled={isSyncing}
            className={`h-8 px-2 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all border ${
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
              {isSyncing ? 'Sync...' : isApiConnected ? 'API :3001' : 'Sim Mode'}
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
            className={`h-8 px-2 rounded-md text-xs font-mono flex items-center gap-1 transition-all border ${
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
            className="h-8 px-2 rounded-md text-xs font-mono flex items-center gap-1 transition-all border bg-surface-card border-border-subtle text-content-muted hover:text-amber-400 hover:border-amber-600/50 disabled:opacity-50"
            title="Reset demo to Uttarakhand seed state (clears all plans and allocations)"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
