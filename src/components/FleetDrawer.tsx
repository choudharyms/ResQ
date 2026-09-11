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
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';

export const FleetDrawer: React.FC = () => {
  const { assets, isFleetDrawerOpen, setFleetDrawerOpen } = useDisasterStore();
  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');

  if (!isFleetDrawerOpen) return null;

  const agencyFilterOptions = [
    { id: 'ALL', label: 'All Fleet', icon: null },
    { id: 'NDRF', label: 'NDRF', icon: '/assets/agencies/ndrf-icon.png' },
    { id: 'SDRF', label: 'SDRF', icon: '/assets/agencies/sdrf-icon.png' },
    { id: 'POLICE', label: 'Police', icon: '/assets/agencies/police-icon.png' },
    { id: 'EMS', label: 'EMS', icon: '/assets/agencies/ems-icon.png' },
    { id: 'ITBP', label: 'ITBP/Army', icon: '/assets/agencies/ngo-icon.png' },
  ];

  const filteredAssets =
    selectedAgency === 'ALL'
      ? assets
      : assets.filter((a) => a.agency.toUpperCase().includes(selectedAgency.toUpperCase()));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-surface-panel border-l border-border-strong flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-content-primary flex items-center gap-2">
                Multi-Agency Fleet Telemetry
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-card border border-border-strong text-indigo-300">
                  {assets.length} Units
                </span>
              </h2>
              <p className="text-xs text-content-muted">
                Live GPS telemetry, fuel reserves, and crew assignments
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
            let agencyIcon = '/assets/agencies/ndrf-icon.png';
            if (asset.agency.includes('SDRF')) agencyIcon = '/assets/agencies/sdrf-icon.png';
            else if (asset.agency.includes('Police')) agencyIcon = '/assets/agencies/police-icon.png';
            else if (asset.agency.includes('Medical') || asset.agency.includes('EMS')) agencyIcon = '/assets/agencies/ems-icon.png';
            else if (asset.agency.includes('ITBP') || asset.agency.includes('Army')) agencyIcon = '/assets/agencies/ngo-icon.png';

            return (
              <div
                key={asset.id}
                className="p-3.5 rounded-lg bg-surface-card border border-border-subtle hover:border-border-strong transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={agencyIcon}
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
                      <Clock className="h-3 w-3 animate-spin" />
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
      </div>
    </div>
  );
};
