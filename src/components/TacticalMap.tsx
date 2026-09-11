import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { cellToBoundary } from 'h3-js';
import { Layers, Shield, Radio, Navigation } from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';
import { getAgencyConfig } from '../utils/agencyConfig';

export const TacticalMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    incidentsLayer: L.LayerGroup;
    assetsLayer: L.LayerGroup;
    hexagonsLayer: L.LayerGroup;
    routesLayer: L.LayerGroup;
  } | null>(null);

  const {
    incidents,
    assets,
    selectedIncidentId,
    selectIncident,
    activePlan,
    isHighwayCut,
  } = useDisasterStore();

  const [showIncidents, setShowIncidents] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showHexagons, setShowHexagons] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around Garhwal Himalayas (Rudraprayag / Srinagar Garhwal)
    const map = L.map(mapContainerRef.current, {
      center: [30.32, 79.08],
      zoom: 10,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap baselayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const incidentsLayer = L.layerGroup().addTo(map);
    const assetsLayer = L.layerGroup().addTo(map);
    const hexagonsLayer = L.layerGroup().addTo(map);
    const routesLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      incidentsLayer,
      assetsLayer,
      hexagonsLayer,
      routesLayer,
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Incidents Layer
  useEffect(() => {
    if (!layersRef.current) return;
    const { incidentsLayer } = layersRef.current;
    incidentsLayer.clearLayers();

    if (!showIncidents) return;

    incidents.forEach((incident) => {
      const isSelected = incident.id === selectedIncidentId;
      const isCritical = incident.assessment.priorityScore >= 80;

      // Custom marker HTML
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer">
          <div class="h-6 w-6 rounded-full ${
            incident.isSilentPocket
              ? 'bg-purple-600 border-2 border-white'
              : isCritical
              ? 'bg-status-critical border-2 border-white'
              : 'bg-status-high border-2 border-white'
          } flex items-center justify-center shadow-lg ${
            isSelected ? 'ring-4 ring-sky-400 scale-125' : ''
          }">
            <span class="text-[9px] font-mono font-bold text-white">${incident.incidentCode.split('-')[1]}</span>
          </div>
          ${
            isCritical
              ? '<span class="absolute h-8 w-8 rounded-full bg-status-critical/40 animate-ping pointer-events-none"></span>'
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-incident-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([incident.location.lat, incident.location.lng], {
        icon: customIcon,
      });

      marker.bindPopup(`
        <div class="p-1 space-y-1 font-sans">
          <div class="flex items-center justify-between gap-2 border-b border-gray-700 pb-1">
            <span class="font-mono text-xs font-bold text-white">${incident.incidentCode}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-status-critical/20 text-status-critical font-mono">
              Priority ${incident.assessment.priorityScore}
            </span>
          </div>
          <p class="text-xs font-bold text-gray-200">${incident.zoneName}</p>
          <div class="text-[11px] text-gray-400 font-mono">
            <div>Trapped: <b class="text-white">${incident.casualties.trapped}</b> | Injured: <b class="text-white">${incident.casualties.injured}</b></div>
            <div>Road Status: <span class="uppercase text-amber-400">${incident.roadStatus}</span></div>
          </div>
        </div>
      `);

      marker.on('click', () => {
        selectIncident(incident.id);
      });

      incidentsLayer.addLayer(marker);
    });
  }, [incidents, selectedIncidentId, showIncidents, selectIncident]);

  // Sync Assets Layer
  useEffect(() => {
    if (!layersRef.current) return;
    const { assetsLayer } = layersRef.current;
    assetsLayer.clearLayers();

    if (!showAssets) return;

    assets.forEach((asset) => {
      const isDispatched = asset.status === 'EN_ROUTE' || asset.status === 'ON_SITE';
      const agencyCfg = getAgencyConfig(asset.agency);
      const agencyIconSrc = agencyCfg.icon;
      const ringColor = agencyCfg.hex;

      const assetHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <img src="${agencyIconSrc}" alt="${asset.agency}" class="h-6 w-6 rounded-md shadow-lg border border-white/90 bg-black/60 object-contain group-hover:scale-110 transition-transform" />
          ${
            isDispatched
              ? `<span style="background-color: ${ringColor}" class="absolute -inset-1 rounded-md opacity-60 animate-ping pointer-events-none"></span>`
              : ''
          }
        </div>
      `;

      const icon = L.divIcon({
        html: assetHtml,
        className: 'custom-asset-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([asset.currentLocation.lat, asset.currentLocation.lng], { icon });

      marker.bindPopup(`
        <div class="p-1.5 space-y-1.5 font-sans min-w-[180px]">
          <div class="flex items-center justify-between gap-2 border-b border-gray-700 pb-1">
            <div class="flex items-center gap-1.5">
              <img src="${agencyIconSrc}" class="h-4 w-4 rounded-sm object-contain" />
              <span class="font-mono text-xs font-bold text-white">${asset.assetCode}</span>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${agencyCfg.chipClass} font-mono">${agencyCfg.shortName}</span>
          </div>
          <p class="text-xs font-bold text-gray-200">${asset.name}</p>
          <div class="text-[11px] text-gray-400 font-mono space-y-0.5">
            <div>Status: <span class="font-bold text-emerald-400 uppercase">${asset.status}</span></div>
            <div>Base: ${asset.baseStation}</div>
            <div>Crew: ${asset.capacity} Specialists</div>
          </div>
        </div>
      `);

      assetsLayer.addLayer(marker);
    });
  }, [assets, showAssets]);

  // Sync Uber H3 Hexagons Layer
  useEffect(() => {
    if (!layersRef.current) return;
    const { hexagonsLayer } = layersRef.current;
    hexagonsLayer.clearLayers();

    if (!showHexagons) return;

    incidents.forEach((incident) => {
      try {
        // Compute H3 boundary coordinates: returns array of [lat, lng]
        const boundary = cellToBoundary(incident.h3Index);
        const latLngs = boundary.map(([lat, lng]) => [lat, lng] as [number, number]);

        const isSelected = incident.id === selectedIncidentId;
        const color = incident.isSilentPocket
          ? '#A855F7'
          : incident.assessment.priorityScore >= 80
          ? '#EF4444'
          : '#F59E0B';

        const polygon = L.polygon(latLngs, {
          color: isSelected ? '#38BDF8' : color,
          weight: isSelected ? 3 : 1.5,
          fillColor: isSelected ? '#0284C7' : color,
          fillOpacity: isSelected ? 0.35 : 0.2,
        });

        polygon.bindTooltip(
          `<b>${incident.zoneName}</b><br/>H3: ${incident.h3Index.substring(0, 8)}...<br/>Priority: ${incident.assessment.priorityScore}`,
          { permanent: false, direction: 'top' }
        );

        polygon.on('click', () => {
          selectIncident(incident.id);
        });

        hexagonsLayer.addLayer(polygon);
      } catch {
        // Fallback if H3 resolution conversion throws
      }
    });
  }, [incidents, selectedIncidentId, showHexagons, selectIncident]);

  // Sync Route Polylines and Highway Blockage
  useEffect(() => {
    if (!layersRef.current) return;
    const { routesLayer } = layersRef.current;
    routesLayer.clearLayers();

    // Road blockage marker at Helang Bridge Km 18
    if (isHighwayCut) {
      const bridgeCoords: [number, number] = [30.5278, 79.522];
      const cutHtml = `
        <div class="h-6 w-6 rounded-full bg-status-critical flex items-center justify-center text-white border-2 border-white shadow-lg animate-bounce" title="NH-07 Badrinath Highway Severed at Helang">
          <span class="text-[10px] font-black font-mono">✕</span>
        </div>
      `;
      const cutIcon = L.divIcon({
        html: cutHtml,
        className: 'highway-cut-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const cutMarker = L.marker(bridgeCoords, { icon: cutIcon });
      cutMarker.bindPopup(`
        <div class="p-1 font-sans">
          <p class="text-xs font-bold text-status-critical">⚠️ NH-07 SEVERED AT HELANG</p>
          <p class="text-[11px] text-gray-300">Helang mountain bridge washed out. Convoys detoured via Mandal-Chopta pass.</p>
        </div>
      `);
      routesLayer.addLayer(cutMarker);
    }

    if (!showRoutes || !activePlan) return;

    activePlan.assignments.forEach((asg) => {
      const asset = assets.find((a) => a.id === asg.assetId);
      const incident = incidents.find((i) => i.id === asg.incidentId);

      if (asset && incident) {
        const polyline = L.polyline(
          [
            [asset.currentLocation.lat, asset.currentLocation.lng],
            [incident.location.lat, incident.location.lng],
          ],
          {
            color: asg.isEquityForced ? '#A855F7' : '#3B82F6',
            weight: 2.5,
            dashArray: asg.isEquityForced ? '6, 6' : undefined,
            opacity: 0.8,
          }
        );

        polyline.bindTooltip(
          `${asg.assetCode} ➔ ${asg.zoneName} (${asg.travelMinutes} min)`,
          { sticky: true }
        );

        routesLayer.addLayer(polyline);
      }
    });
  }, [activePlan, assets, incidents, isHighwayCut, showRoutes]);

  // Center on selected incident
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedIncidentId) return;
    const target = incidents.find((i) => i.id === selectedIncidentId);
    if (target) {
      mapInstanceRef.current.panTo([target.location.lat, target.location.lng], {
        animate: true,
        duration: 0.6,
      });
    }
  }, [selectedIncidentId, incidents]);

  return (
    <main className="flex-1 relative h-full w-full min-h-0 bg-surface-canvas overflow-hidden">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Layer Controls */}
      <div className="absolute top-3 right-3 z-20">
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="px-2.5 py-1.5 rounded-md bg-surface-panel/90 backdrop-blur border border-border-strong text-content-primary text-xs font-semibold flex items-center gap-1.5 shadow-lg hover:bg-surface-card transition-all"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Map Layers</span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-lg bg-surface-panel border border-border-strong shadow-2xl p-2 space-y-1.5 text-xs text-content-primary z-30">
              <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                <span className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-status-critical" /> Incidents
                </span>
                <input
                  type="checkbox"
                  checked={showIncidents}
                  onChange={(e) => setShowIncidents(e.target.checked)}
                  className="rounded border-border-strong text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                <span className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-blue-400" /> Multi-Agency Fleet
                </span>
                <input
                  type="checkbox"
                  checked={showAssets}
                  onChange={(e) => setShowAssets(e.target.checked)}
                  className="rounded border-border-strong text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                <span className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" /> Uber H3 Hex Grid
                </span>
                <input
                  type="checkbox"
                  checked={showHexagons}
                  onChange={(e) => setShowHexagons(e.target.checked)}
                  className="rounded border-border-strong text-indigo-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                <span className="flex items-center gap-2">
                  <Navigation className="h-3.5 w-3.5 text-indigo-400" /> Dispatch Routes
                </span>
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={(e) => setShowRoutes(e.target.checked)}
                  className="rounded border-border-strong text-indigo-600 focus:ring-0"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-lg bg-surface-panel/90 backdrop-blur border border-border-subtle shadow-xl text-[11px] font-mono space-y-1.5 hidden sm:block">
        <p className="font-bold text-content-primary uppercase tracking-wider text-[10px] mb-1">
          H3 Tactical Legend
        </p>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-status-critical" />
          <span className="text-content-secondary">Critical Urgency (Ei &lt; 0.4)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-status-high" />
          <span className="text-content-secondary">High Priority (Ei 0.4–0.6)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-status-forgotten animate-pulse" />
          <span className="text-purple-300 font-bold">Forgotten Pocket (Ei = 0)</span>
        </div>
        {isHighwayCut && (
          <div className="flex items-center gap-2 text-status-critical pt-1 border-t border-border-subtle">
            <span className="h-2 w-2 rounded-full bg-status-critical animate-ping" />
            <span className="font-bold">NH-07 Cut (Helang)</span>
          </div>
        )}
      </div>
    </main>
  );
};
