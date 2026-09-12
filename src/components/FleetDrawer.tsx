import React, { useState } from 'react';
import {
  X,
  Truck,
  BatteryCharging,
  Radio,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  Shield,
  Building2,
  Droplets,
  Package,
  HeartPulse,
  Plus,
  Minus,
  Send,
  BedDouble,
  Activity,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';
import { getAgencyConfig, AGENCY_CONFIG } from '../utils/agencyConfig';

export const FleetDrawer: React.FC = () => {
  const {
    assets,
    shelters,
    activeInventoryTab,
    setActiveInventoryTab,
    updateShelterOccupancy,
    dispatchSuppliesToZone,
    isFleetDrawerOpen,
    setFleetDrawerOpen,
    incidents,
  } = useDisasterStore();

  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');
  const [selectedTargetZone, setSelectedTargetZone] = useState<string>(incidents[0]?.zoneId || 'zone-rudraprayag');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  if (!isFleetDrawerOpen) return null;

  const agencyFilterOptions = [
    { id: 'ALL', label: 'All Fleet', icon: null },
    { id: 'NDRF', label: 'NDRF', icon: AGENCY_CONFIG.NDRF.icon },
    { id: 'SDRF', label: 'SDRF', icon: AGENCY_CONFIG.SDRF.icon },
    { id: 'POLICE', label: 'Police', icon: AGENCY_CONFIG.POLICE.icon },
    { id: 'EMS', label: 'EMS', icon: AGENCY_CONFIG.EMS.icon },
    { id: 'ITBP', label: 'ITBP', icon: AGENCY_CONFIG.ITBP.icon },
  ];

  const filteredAssets =
    selectedAgency === 'ALL'
      ? assets
      : assets.filter((a) => a.agency.toUpperCase().includes(selectedAgency.toUpperCase()));

  // Shelter Aggregates
  const totalBeds = shelters.reduce((acc, s) => acc + s.totalCapacityBeds, 0);
  const totalOccupied = shelters.reduce((acc, s) => acc + s.occupiedBeds, 0);
  const totalFood = shelters.reduce((acc, s) => acc + s.foodPacketsStock, 0);
  const totalWater = shelters.reduce((acc, s) => acc + s.waterLitresStock, 0);
  const totalKits = shelters.reduce((acc, s) => acc + s.medicalKitsStock, 0);

  const handleQuickDispatch = (shelterId: string) => {
    dispatchSuppliesToZone(shelterId, selectedTargetZone, 100, 250, 5);
    const targetZoneObj = incidents.find((i) => i.zoneId === selectedTargetZone);
    setDispatchSuccessMsg(`Dispatched 100 Food · 250L Water · 5 Kits to ${targetZoneObj?.zoneName || 'Zone'}`);
    setTimeout(() => setDispatchSuccessMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity select-none">
      <div className="w-full max-w-lg bg-surface-panel border-l border-border-strong flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              {activeInventoryTab === 'FLEET' ? (
                <Truck className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-content-primary flex items-center gap-2">
                {activeInventoryTab === 'FLEET' ? 'Multi-Agency Fleet Telemetry' : 'Relief Shelters & Stockpiles'}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-card border border-border-strong text-indigo-300">
                  {activeInventoryTab === 'FLEET' ? `${assets.length} Units` : `${shelters.length} Facilities`}
                </span>
              </h2>
              <p className="text-xs text-content-muted">
                {activeInventoryTab === 'FLEET'
                  ? 'Live GPS telemetry, fuel reserves, and crew assignments'
                  : 'Bed occupancy, medical staff, and emergency food/water stockpiles'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setFleetDrawerOpen(false)}
            className="p-1 rounded-md hover:bg-surface-hover text-content-muted hover:text-content-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Switcher Segmented Tabs */}
        <div className="p-2 border-b border-border-subtle bg-surface-canvas/80 flex items-center gap-2">
          <button
            onClick={() => setActiveInventoryTab('FLEET')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeInventoryTab === 'FLEET'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-hover text-content-secondary border border-border-subtle'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Active Fleet ({assets.length})</span>
          </button>
          <button
            onClick={() => setActiveInventoryTab('SHELTERS_SUPPLIES')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeInventoryTab === 'SHELTERS_SUPPLIES'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-hover text-content-secondary border border-border-subtle'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Shelters & Supplies ({shelters.length})</span>
          </button>
        </div>

        {/* FLEET VIEW */}
        {activeInventoryTab === 'FLEET' && (
          <>
            {/* Agency Filter Tabs */}
            <div className="px-4 py-2 border-b border-border-subtle bg-surface-canvas/50 flex items-center gap-1.5 overflow-x-auto">
              {agencyFilterOptions.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedAgency(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                    selectedAgency === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-surface-card hover:bg-surface-hover text-content-secondary border border-border-subtle'
                  }`}
                >
                  {tab.icon && (
                    <img src={tab.icon} alt={tab.label} className="h-3.5 w-3.5 object-contain rounded" />
                  )}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Fleet Asset Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredAssets.map((asset) => {
                const agencyCfg = getAgencyConfig(asset.agency);

                return (
                  <div
                    key={asset.id}
                    className="p-3.5 rounded-lg bg-surface-card border border-border-subtle hover:border-border-strong transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={agencyCfg.icon}
                          alt={asset.agency}
                          className="h-7 w-7 rounded-md object-contain border border-border-strong bg-black/40"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-content-primary">
                              {asset.name}
                            </span>
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-surface-panel text-content-muted border border-border-subtle">
                              {asset.assetCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-content-secondary flex items-center gap-1">
                            <Shield className="h-3 w-3 text-indigo-400" />
                            {asset.agency}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          asset.status === 'AVAILABLE'
                            ? 'bg-status-safe/15 text-status-safe border border-status-safe/40'
                            : asset.status === 'EN_ROUTE'
                            ? 'bg-status-dispatched/15 text-status-dispatched border border-status-dispatched/40'
                            : 'bg-status-high/15 text-status-high border border-status-high/40'
                        }`}
                      >
                        {asset.status === 'AVAILABLE' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {asset.status}
                      </span>
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle text-[11px] font-mono">
                      <div className="flex items-center gap-1 text-content-secondary">
                        <BatteryCharging className="h-3 w-3 text-emerald-400" />
                        <span>88% Fuel</span>
                      </div>
                      <div className="flex items-center gap-1 text-content-secondary">
                        <Users className="h-3 w-3 text-sky-400" />
                        <span>{asset.capacity} Crew</span>
                      </div>
                      <div className="flex items-center gap-1 text-content-secondary">
                        <Radio className="h-3 w-3 text-amber-400" />
                        <span>Ch 07-VHF</span>
                      </div>
                    </div>

                    {/* Station & Capabilities */}
                    <div className="flex items-center justify-between text-[11px] text-content-muted">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="h-3 w-3 shrink-0 text-indigo-400" />
                        {asset.baseStation}
                      </span>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const caps: string[] = [];
                          if (asset.capabilities.waterRescue) caps.push('Water Rescue');
                          if (asset.capabilities.mountainRescue) caps.push('Mountain Rescue');
                          if (asset.capabilities.alsMedical) caps.push('ALS Trauma');
                          if (asset.capabilities.rubbleRescue) caps.push('Rubble Rescue');
                          if (asset.capabilities.thermalVision) caps.push('FLIR Thermal');
                          return caps.slice(0, 2).map((c, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-surface-panel border border-border-subtle"
                            >
                              {c}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* SHELTERS & RELIEF STOCKPILES VIEW */}
        {activeInventoryTab === 'SHELTERS_SUPPLIES' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Global Aggregates Banner */}
            <div className="p-3.5 rounded-lg bg-surface-card border border-border-strong space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-400" />
                  Valley Relief Capacity
                </span>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  {totalOccupied} / {totalBeds} Beds ({Math.round((totalOccupied / totalBeds) * 100)}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-surface-canvas rounded-full overflow-hidden border border-border-subtle flex">
                <div
                  style={{ width: `${Math.round((totalOccupied / totalBeds) * 100)}%` }}
                  className="h-full bg-indigo-500 transition-all duration-500"
                />
              </div>

              {/* Stockpile Counters */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded bg-surface-canvas/60 border border-border-subtle text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 font-mono">
                    <Package className="h-3 w-3" />
                    <span>Food</span>
                  </div>
                  <div className="text-xs font-bold font-mono text-content-primary mt-0.5">
                    {totalFood.toLocaleString()} pkts
                  </div>
                </div>
                <div className="p-2 rounded bg-surface-canvas/60 border border-border-subtle text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-400 font-mono">
                    <Droplets className="h-3 w-3" />
                    <span>Water</span>
                  </div>
                  <div className="text-xs font-bold font-mono text-content-primary mt-0.5">
                    {totalWater.toLocaleString()} L
                  </div>
                </div>
                <div className="p-2 rounded bg-surface-canvas/60 border border-border-subtle text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-rose-400 font-mono">
                    <HeartPulse className="h-3 w-3" />
                    <span>Trauma</span>
                  </div>
                  <div className="text-xs font-bold font-mono text-content-primary mt-0.5">
                    {totalKits} kits
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Dispatch Bar */}
            <div className="p-3 rounded-lg bg-indigo-950/25 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-200 font-bold flex items-center gap-1.5">
                  <Send className="h-3 w-3 text-indigo-400" />
                  Target Zone For Supply Dispatches:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTargetZone}
                  onChange={(e) => setSelectedTargetZone(e.target.value)}
                  aria-label="Target Zone for Relief Convoy"
                  className="flex-1 bg-surface-card border border-border-strong rounded px-2.5 py-1.5 text-xs text-content-primary font-mono focus:outline-none focus:border-indigo-400"
                >
                  {incidents.map((inc) => (
                    <option key={inc.zoneId} value={inc.zoneId}>
                      {inc.zoneName} ({inc.incidentCode})
                    </option>
                  ))}
                </select>
              </div>
              {dispatchSuccessMsg && (
                <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded p-1.5 text-center">
                  ✓ {dispatchSuccessMsg}
                </div>
              )}
            </div>

            {/* Individual Shelter Cards */}
            <div className="space-y-3">
              {shelters.map((shelter) => {
                const occPct = Math.round((shelter.occupiedBeds / shelter.totalCapacityBeds) * 100);
                return (
                  <div
                    key={shelter.id}
                    className="p-3.5 rounded-lg bg-surface-card border border-border-subtle hover:border-border-strong transition-all space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
                          <h3 className="font-bold text-xs text-content-primary">
                            {shelter.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-content-muted mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-indigo-400" />
                          {shelter.zoneName} · {shelter.assignedDoctorInCharge}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          shelter.status === 'OPERATIONAL'
                            ? 'bg-status-safe/15 text-status-safe border border-status-safe/40'
                            : shelter.status === 'NEAR_CAPACITY'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {shelter.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Bed Occupancy Meter */}
                    <div className="p-2.5 rounded bg-surface-canvas/60 border border-border-subtle space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-content-secondary flex items-center gap-1">
                          <BedDouble className="h-3 w-3 text-indigo-300" />
                          Bed Capacity: {shelter.occupiedBeds} / {shelter.totalCapacityBeds}
                        </span>
                        <span className="font-bold text-content-primary">{occPct}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-panel rounded-full overflow-hidden border border-border-subtle">
                        <div
                          style={{ width: `${occPct}%` }}
                          className={`h-full transition-all duration-300 ${
                            occPct >= 90 ? 'bg-rose-500' : occPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      {/* Interactive Admission Controls */}
                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                        <span className="text-content-muted">
                          Available: {shelter.availableBeds} beds · {shelter.medicalStaffCount} medical staff
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateShelterOccupancy(shelter.id, -5)}
                            disabled={shelter.occupiedBeds <= 0}
                            title="Discharge 5 patients"
                            className="px-1.5 py-0.5 rounded bg-surface-panel hover:bg-surface-hover text-content-secondary border border-border-subtle disabled:opacity-30 flex items-center gap-0.5"
                          >
                            <Minus className="h-2.5 w-2.5" /> 5
                          </button>
                          <button
                            onClick={() => updateShelterOccupancy(shelter.id, 5)}
                            disabled={shelter.availableBeds <= 0}
                            title="Admit 5 evacuees"
                            className="px-1.5 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 disabled:opacity-30 flex items-center gap-0.5"
                          >
                            <Plus className="h-2.5 w-2.5" /> 5
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stockpiles & Dispatch Button */}
                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-mono border-t border-border-subtle">
                      <div className="flex items-center gap-3 text-content-secondary">
                        <span className="flex items-center gap-1" title="Food packets">
                          <Package className="h-3 w-3 text-amber-400" />
                          {shelter.foodPacketsStock}
                        </span>
                        <span className="flex items-center gap-1" title="Potable water liters">
                          <Droplets className="h-3 w-3 text-cyan-400" />
                          {shelter.waterLitresStock}L
                        </span>
                        <span className="flex items-center gap-1" title="Trauma kits">
                          <HeartPulse className="h-3 w-3 text-rose-400" />
                          {shelter.medicalKitsStock}
                        </span>
                      </div>

                      <button
                        onClick={() => handleQuickDispatch(shelter.id)}
                        disabled={shelter.foodPacketsStock < 100 || shelter.waterLitresStock < 250}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors shadow-sm"
                      >
                        <Send className="h-2.5 w-2.5" />
                        Dispatch Convoy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

