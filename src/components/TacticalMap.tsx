import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { cellToBoundary } from 'h3-js';
import {
  Layers,
  Radio,
  Navigation,
  Crosshair,
  Maximize2,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';

// Basemap Tile Providers (100% free, no API key required, zero watermarks)
const BASEMAP_TILES = {
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap',
    label: 'Dark Tactical',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; Earthstar Geographics',
    label: 'Satellite Recon',
  },
  street: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap',
    label: 'Topo Physical',
  },
};

type BasemapType = 'dark' | 'satellite' | 'street';

// Helper: Calculate quadratic Bézier curved path for connecting nodes
function computeCurvedCoordinates(
  start: [number, number],
  end: [number, number],
  curvature = 0.12,
  numPoints = 24
): [number, number][] {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  // Offset perpendicular to the chord
  const controlLat = midLat - dLng * curvature;
  const controlLng = midLng + dLat * curvature;

  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * controlLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

export const TacticalMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const layersRef = useRef<{
    incidentsLayer: L.LayerGroup;
    assetsLayer: L.LayerGroup;
    sheltersLayer: L.LayerGroup;
    hexagonsLayer: L.LayerGroup;
    routesLayer: L.LayerGroup;
    blockageLayer: L.LayerGroup;
  } | null>(null);

  const {
    incidents,
    assets,
    shelters,
    selectedIncidentId,
    selectIncident,
    activePlan,
    isHighwayCut,
  } = useDisasterStore();

  const [basemap, setBasemap] = useState<BasemapType>('dark');
  const [showIncidents, setShowIncidents] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showHexagons, setShowHexagons] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(10);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around Garhwal Himalayas (Rudraprayag / Srinagar Garhwal)
    const map = L.map(mapContainerRef.current, {
      center: [30.34, 79.12],
      zoom: 10,
      zoomControl: false,
    });

    // Default: CartoDB Dark Matter (High-contrast military dark mode)
    const initialTile = L.tileLayer(BASEMAP_TILES.dark.url, {
      maxZoom: 18,
      attribution: BASEMAP_TILES.dark.attribution,
    }).addTo(map);

    tileLayerRef.current = initialTile;

    // Layer Groups
    const hexagonsLayer = L.layerGroup().addTo(map);
    const routesLayer = L.layerGroup().addTo(map);
    const incidentsLayer = L.layerGroup().addTo(map);
    const assetsLayer = L.layerGroup().addTo(map);
    const sheltersLayer = L.layerGroup().addTo(map);
    const blockageLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      incidentsLayer,
      assetsLayer,
      sheltersLayer,
      hexagonsLayer,
      routesLayer,
      blockageLayer,
    };

    // Track cursor coordinates & zoom
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Math.round(e.latlng.lat * 10000) / 10000,
        lng: Math.round(e.latlng.lng * 10000) / 10000,
      });
    });

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.remove();

    const newTile = L.tileLayer(BASEMAP_TILES[basemap].url, {
      maxZoom: 18,
      attribution: BASEMAP_TILES[basemap].attribution,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTile;
  }, [basemap]);

  // Recenter to active Garhwal bounds
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    if (incidents.length === 0) {
      mapInstanceRef.current.setView([30.34, 79.12], 10);
      return;
    }

    const bounds = L.latLngBounds(
      incidents.map((i) => [i.location.lat, i.location.lng] as [number, number])
    );
    assets.forEach((a) => bounds.extend([a.currentLocation.lat, a.currentLocation.lng]));

    mapInstanceRef.current.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 12,
      animate: true,
    });
  }, [incidents, assets]);

  // Sync Uber H3 Hexagons Layer
  useEffect(() => {
    if (!layersRef.current) return;
    const { hexagonsLayer } = layersRef.current;
    hexagonsLayer.clearLayers();

    if (!showHexagons) return;

    incidents.forEach((incident) => {
      try {
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
          weight: isSelected ? 2.5 : 1.2,
          dashArray: isSelected ? '4, 4' : undefined,
          fillColor: color,
          fillOpacity: isSelected ? 0.32 : 0.16,
        });

        polygon.bindTooltip(
          `
          <div class="font-mono text-xs p-1 min-w-[200px]">
            <div class="font-bold text-white flex items-center justify-between border-b border-gray-700 pb-1">
              <span>${incident.zoneName}</span>
              <span class="text-amber-400 font-extrabold">${incident.assessment.priorityScore} pts</span>
            </div>
            <div class="text-[10px] text-sky-400 mt-1">H3 Hex: ${incident.h3Index.substring(0, 9)}</div>
            <div class="mt-1.5 pt-1 border-t border-gray-800 text-[10px] space-y-0.5">
              <div class="text-indigo-300 font-bold uppercase tracking-wider text-[9px]">Sector Supply Demand:</div>
              <div class="text-amber-300 flex justify-between">
                <span>Food Packets:</span>
                <span class="font-bold">${incident.demandVector.foodPackets} pkts</span>
              </div>
              <div class="text-cyan-300 flex justify-between">
                <span>Potable Water:</span>
                <span class="font-bold">${incident.demandVector.waterLitres} L</span>
              </div>
              <div class="text-rose-300 flex justify-between">
                <span>Trauma Medics/Kits:</span>
                <span class="font-bold">${incident.demandVector.medicalResponders} units</span>
              </div>
              <div class="text-purple-300 flex justify-between">
                <span>Evacuation Beds:</span>
                <span class="font-bold">${incident.casualties.trapped + incident.casualties.injured} beds</span>
              </div>
            </div>
          </div>
          `,
          { permanent: false, direction: 'top', className: 'h3-tactical-tooltip' }
        );

        polygon.on('click', () => {
          selectIncident(incident.id);
        });

        hexagonsLayer.addLayer(polygon);
      } catch {
        // Fallback if H3 conversion throws
      }
    });
  }, [incidents, selectedIncidentId, showHexagons, selectIncident]);

  // Sync Connecting Nodes (Curved Dispatch Trajectories & Interactive Midpoint Badges)
  useEffect(() => {
    if (!layersRef.current) return;
    const { routesLayer } = layersRef.current;
    routesLayer.clearLayers();

    if (!showRoutes || !activePlan) return;

    activePlan.assignments.forEach((asg, idx) => {
      const asset = assets.find((a) => a.id === asg.assetId);
      const incident = incidents.find((i) => i.id === asg.incidentId);

      if (asset && incident) {
        const isRouteSelected = incident.id === selectedIncidentId;
        const startCoords: [number, number] = [asset.currentLocation.lat, asset.currentLocation.lng];
        const endCoords: [number, number] = [incident.location.lat, incident.location.lng];

        // Slightly vary curvature index so multiple routes between shared zones do not overlap
        const curveOffset = (idx % 2 === 0 ? 1 : -1) * (0.09 + (idx % 3) * 0.03);
        const curvedPoints = computeCurvedCoordinates(startCoords, endCoords, curveOffset, 24);

        const routeColor = asg.isEquityForced ? '#A855F7' : isRouteSelected ? '#38BDF8' : '#0EA5E9';

        // 1. Outer Glow Trajectory
        const glowPolyline = L.polyline(curvedPoints, {
          color: routeColor,
          weight: isRouteSelected ? 6 : 4,
          opacity: isRouteSelected ? 0.45 : 0.2,
          lineCap: 'round',
        });

        // 2. Inner Active Core Trajectory (Static High-Contrast Route)
        const corePolyline = L.polyline(curvedPoints, {
          color: isRouteSelected ? '#FFFFFF' : routeColor,
          weight: isRouteSelected ? 2.5 : 1.8,
          dashArray: '6, 6',
          opacity: isRouteSelected ? 0.95 : 0.75,
        });

        const tooltipContent = `
          <div class="p-1 font-mono text-xs">
            <div class="font-bold text-sky-300">${asg.assetCode} ➔ ${asg.zoneName}</div>
            <div class="text-gray-300">${asg.needType} · ${asg.travelMinutes} min ETA (${asg.distanceKm} km)</div>
            <div class="text-[10px] text-gray-400 mt-0.5">${asg.routeDescription}</div>
          </div>
        `;

        glowPolyline.bindTooltip(tooltipContent, { sticky: true });
        corePolyline.bindTooltip(tooltipContent, { sticky: true });

        // Clicking route focuses the incident
        const handleRouteClick = () => {
          selectIncident(incident.id);
        };
        glowPolyline.on('click', handleRouteClick);
        corePolyline.on('click', handleRouteClick);

        routesLayer.addLayer(glowPolyline);
        routesLayer.addLayer(corePolyline);

        // 3. Midpoint Tactical Node Pill (Interactive ETA & Distance Badge)
        const midIndex = Math.floor(curvedPoints.length / 2);
        const midCoord = curvedPoints[midIndex];

        const midBadgeHtml = `
          <div class="cursor-pointer group flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/90 border ${
            isRouteSelected ? 'border-sky-400 text-sky-300 ring-2 ring-sky-400/30' : 'border-slate-700/80 text-gray-300'
          } shadow-lg text-[10px] font-mono whitespace-nowrap hover:scale-105 transition-all">
            <span class="inline-block h-1.5 w-1.5 rounded-full ${asg.isEquityForced ? 'bg-purple-400' : 'bg-sky-400'}"></span>
            <span>${asg.travelMinutes}m</span>
          </div>
        `;

        const midIcon = L.divIcon({
          html: midBadgeHtml,
          className: 'tactical-route-midpoint-node',
          iconSize: [44, 18],
          iconAnchor: [22, 9],
        });

        const midMarker = L.marker(midCoord, { icon: midIcon });
        midMarker.on('click', handleRouteClick);
        midMarker.bindTooltip(tooltipContent, { direction: 'top' });

        routesLayer.addLayer(midMarker);
      }
    });
  }, [activePlan, assets, incidents, selectedIncidentId, showRoutes, selectIncident]);

  // Sync Destination Crisis Nodes (Incidents)
  useEffect(() => {
    if (!layersRef.current) return;
    const { incidentsLayer } = layersRef.current;
    incidentsLayer.clearLayers();

    if (!showIncidents) return;

    incidents.forEach((incident) => {
      const isSelected = incident.id === selectedIncidentId;
      const isCritical = incident.assessment.priorityScore >= 80;

      const markerColor = incident.isSilentPocket
        ? '#A855F7'
        : isCritical
        ? '#EF4444'
        : '#F59E0B';

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer select-none">
          <!-- Outer Radar Shockwave Ping for Critical Incidents -->
          ${
            isCritical || incident.isSilentPocket
              ? `<span style="background-color: ${markerColor}" class="absolute h-9 w-9 rounded-full opacity-40 tactical-node-beacon pointer-events-none"></span>`
              : ''
          }
          <!-- Selection Glow Ring -->
          ${
            isSelected
              ? '<span class="absolute h-8 w-8 rounded-full border-2 border-sky-400 animate-spin pointer-events-none"></span>'
              : ''
          }
          <!-- Core Target Node -->
          <div style="background-color: ${markerColor}" class="h-6 w-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white ${
            isSelected ? 'scale-125 ring-2 ring-sky-400 shadow-sky-500/50' : 'hover:scale-110'
          } transition-transform">
            <span class="text-[9px] font-mono font-black">${Math.round(incident.assessment.priorityScore)}</span>
          </div>
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
        <div class="p-1 space-y-1.5 font-sans min-w-[200px]">
          <div class="flex items-center justify-between gap-2 border-b border-gray-700/80 pb-1">
            <span class="font-mono text-xs font-bold text-white">${incident.incidentCode}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-status-critical/20 text-status-critical font-mono">
              Priority ${incident.assessment.priorityScore}
            </span>
          </div>
          <p class="text-xs font-bold text-gray-100">${incident.zoneName}</p>
          <div class="text-[11px] text-gray-300 font-mono space-y-0.5">
            <div>Trapped: <b class="text-white">${incident.casualties.trapped}</b> · Injured: <b class="text-white">${incident.casualties.injured}</b></div>
            <div>Access: <span class="uppercase text-amber-400 font-semibold">${incident.roadStatus}</span></div>
            <div class="text-[10px] text-gray-400 pt-0.5 border-t border-gray-800">${incident.accessNote}</div>
          </div>
        </div>
      `);

      marker.on('click', () => {
        selectIncident(incident.id);
      });

      incidentsLayer.addLayer(marker);
    });
  }, [incidents, selectedIncidentId, showIncidents, selectIncident]);

  // Sync Origin Dispatch Nodes (Fleet Assets)
  useEffect(() => {
    if (!layersRef.current) return;
    const { assetsLayer } = layersRef.current;
    assetsLayer.clearLayers();

    if (!showAssets) return;

    assets.forEach((asset) => {
      const isDispatched = asset.status === 'EN_ROUTE' || asset.status === 'ON_SITE';
      let agencyIconSrc = '/assets/agencies/ndrf-icon.png';
      let agencyColor = '#F97316';

      if (asset.agency.includes('SDRF')) {
        agencyIconSrc = '/assets/agencies/sdrf-icon.png';
        agencyColor = '#0284C7';
      } else if (asset.agency.includes('Police')) {
        agencyIconSrc = '/assets/agencies/police-icon.png';
        agencyColor = '#3B82F6';
      } else if (asset.agency.includes('Medical') || asset.agency.includes('EMS')) {
        agencyIconSrc = '/assets/agencies/ems-icon.png';
        agencyColor = '#EF4444';
      } else if (asset.agency.includes('ITBP') || asset.agency.includes('Army')) {
        agencyIconSrc = '/assets/agencies/ngo-icon.png';
        agencyColor = '#10B981';
      }

      const assetHtml = `
        <div class="relative flex items-center justify-center cursor-pointer select-none group">
          <!-- Origin Deployment Ring -->
          ${
            isDispatched
              ? `<span style="border-color: ${agencyColor}" class="absolute -inset-1 rounded-md border-2 border-dashed pointer-events-none opacity-80"></span>`
              : ''
          }
          <!-- Asset Emblemed Squircle Node -->
          <div class="h-6 w-6 rounded-md bg-slate-950 border border-white/80 shadow-xl overflow-hidden flex items-center justify-center group-hover:scale-115 transition-transform">
            <img src="${agencyIconSrc}" alt="${asset.agency}" class="h-4 w-4 object-contain" />
          </div>
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
        <div class="p-1 space-y-1.5 font-sans min-w-[190px]">
          <div class="flex items-center justify-between gap-2 border-b border-gray-700 pb-1">
            <div class="flex items-center gap-1.5">
              <img src="${agencyIconSrc}" class="h-4 w-4 rounded-sm object-contain" />
              <span class="font-mono text-xs font-bold text-white">${asset.assetCode}</span>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/50 font-mono">${asset.agency}</span>
          </div>
          <p class="text-xs font-bold text-gray-100">${asset.name}</p>
          <div class="text-[11px] text-gray-300 font-mono space-y-0.5">
            <div>Status: <span class="font-bold text-emerald-400 uppercase">${asset.status}</span></div>
            <div>Base: ${asset.baseStation}</div>
            <div>Speed: ${asset.speedKmh} km/h · Cap: ${asset.capacity} pers</div>
          </div>
        </div>
      `);

      assetsLayer.addLayer(marker);
    });
  }, [assets, showAssets]);

  // Sync Environmental Blockages (Helang Bridge Km 18 Washout)
  useEffect(() => {
    if (!layersRef.current) return;
    const { blockageLayer } = layersRef.current;
    blockageLayer.clearLayers();

    if (!isHighwayCut) return;

    const bridgeCoords: [number, number] = [30.5278, 79.522];
    const cutHtml = `
      <div class="relative flex items-center justify-center cursor-pointer select-none">
        <div class="h-7 w-7 rounded-full bg-status-critical flex items-center justify-center text-white border-2 border-white shadow-xl" title="NH-07 Helang Mountain Bridge Washed Out">
          <span class="text-xs font-black font-mono">✕</span>
        </div>
      </div>
    `;

    const cutIcon = L.divIcon({
      html: cutHtml,
      className: 'highway-cut-pin',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const cutMarker = L.marker(bridgeCoords, { icon: cutIcon });
    cutMarker.bindPopup(`
      <div class="p-1 font-sans min-w-[210px]">
        <div class="flex items-center gap-1.5 text-xs font-bold text-status-critical border-b border-red-900/50 pb-1">
          <span>⚠️ NH-07 SEVERED AT HELANG KM 18</span>
        </div>
        <p class="text-[11px] text-gray-300 mt-1">Cloudburst debris has collapsed the Alaknanda gorge bridge span.</p>
        <div class="text-[10px] text-amber-400 font-mono mt-1 pt-1 border-t border-gray-800">
          Convoy Route Detour: Via Mandal-Chopta Alpine Pass (+24 min)
        </div>
      </div>
    `);

    blockageLayer.addLayer(cutMarker);
  }, [isHighwayCut]);

  // Sync Shelters Layer (Relief Depots & Bed Occupancy Markers)
  useEffect(() => {
    if (!layersRef.current) return;
    const { sheltersLayer } = layersRef.current;
    sheltersLayer.clearLayers();

    if (!showShelters) return;

    shelters.forEach((shelter) => {
      const occPct = Math.round((shelter.occupiedBeds / shelter.totalCapacityBeds) * 100);
      const isCriticalCapacity = occPct >= 90;
      const statusColor = isCriticalCapacity ? '#EF4444' : occPct >= 75 ? '#F59E0B' : '#10B981';

      const shelterIcon = L.divIcon({
        className: 'shelter-marker-container',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer select-none group">
            <div class="h-8 w-8 rounded-lg bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 18h12"></path><path d="M3 22h18"></path><path d="m19 10-7-7-7 7"></path><path d="M9 22V12h6v10"></path>
              </svg>
            </div>
            <span class="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full border border-surface-panel text-[8px] font-mono font-bold text-white shadow-sm" style="background-color: ${statusColor}">
              ${occPct}%
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([shelter.location.lat, shelter.location.lng], { icon: shelterIcon });
      marker.bindPopup(`
        <div class="p-1.5 font-sans min-w-[240px] text-content-primary">
          <div class="flex items-center justify-between border-b border-border-subtle pb-1">
            <div class="font-bold text-xs text-indigo-300 font-mono">${shelter.name}</div>
            <span class="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold" style="background-color: ${statusColor}25; color: ${statusColor}; border: 1px solid ${statusColor}50">
              ${shelter.status.replace('_', ' ')}
            </span>
          </div>
          <div class="text-[11px] text-content-muted mt-1">
            ${shelter.zoneName} · Lead: ${shelter.assignedDoctorInCharge}
          </div>
          <div class="mt-2 p-1.5 rounded bg-surface-canvas border border-border-subtle text-[10px] font-mono space-y-1">
            <div class="flex justify-between">
              <span>Bed Occupancy:</span>
              <span class="font-bold text-white">${shelter.occupiedBeds} / ${shelter.totalCapacityBeds} (${occPct}%)</span>
            </div>
            <div class="flex justify-between text-amber-400">
              <span>Food Stock:</span>
              <span class="font-bold">${shelter.foodPacketsStock.toLocaleString()} pkts</span>
            </div>
            <div class="flex justify-between text-cyan-400">
              <span>Potable Water:</span>
              <span class="font-bold">${shelter.waterLitresStock.toLocaleString()} L</span>
            </div>
            <div class="flex justify-between text-rose-400">
              <span>Trauma Kits:</span>
              <span class="font-bold">${shelter.medicalKitsStock} kits</span>
            </div>
          </div>
        </div>
      `);

      sheltersLayer.addLayer(marker);
    });
  }, [shelters, showShelters]);

  // Center smoothly on selected incident
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedIncidentId) return;
    const target = incidents.find((i) => i.id === selectedIncidentId);
    if (target) {
      mapInstanceRef.current.panTo([target.location.lat, target.location.lng], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [selectedIncidentId, incidents]);

  return (
    <main className="flex-1 relative h-[calc(100vh-56px)] bg-surface-canvas overflow-hidden select-none">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* TOP-LEFT: Floating Tactical Basemap & Layer Switcher */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="h-8 px-2.5 rounded-md bg-surface-panel/95 backdrop-blur border border-border-strong text-content-primary text-xs font-semibold flex items-center gap-1.5 shadow-lg hover:bg-surface-card transition-all"
            title="Toggle Tactical Overlays & Basemaps"
          >
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span>Map Layers</span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-56 rounded-lg bg-surface-panel/95 backdrop-blur-md border border-border-strong shadow-2xl p-2.5 space-y-2 text-xs text-content-primary z-30">
              {/* Basemap Selection */}
              <div>
                <p className="text-[10px] uppercase font-bold text-content-muted tracking-wider mb-1 font-mono">
                  Basemap Provider
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(['dark', 'satellite', 'street'] as BasemapType[]).map((b) => (
                    <button
                      key={b}
                      onClick={() => setBasemap(b)}
                      className={`px-1.5 py-1 rounded text-[10px] font-mono font-medium transition-all ${
                        basemap === b
                          ? 'bg-sky-500 text-sky-950 font-bold'
                          : 'bg-surface-card hover:bg-surface-hover text-content-secondary'
                      }`}
                    >
                      {b === 'dark' ? 'Dark' : b === 'satellite' ? 'Sat' : 'Topo'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border-subtle" />

              {/* Tactical Overlays */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-content-muted tracking-wider mb-1 font-mono">
                  Tactical Overlays
                </p>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Radio className="h-3.5 w-3.5 text-status-critical" />
                    <span>Incidents ({incidents.length})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showIncidents}
                    onChange={(e) => setShowIncidents(e.target.checked)}
                    className="rounded border-border-strong text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 text-sky-400" />
                    <span>Connecting Routes</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showRoutes}
                    onChange={(e) => setShowRoutes(e.target.checked)}
                    className="rounded border-border-strong text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Fleet Assets ({assets.length})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showAssets}
                    onChange={(e) => setShowAssets(e.target.checked)}
                    className="rounded border-border-strong text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Shelters & Depots ({shelters.length})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showShelters}
                    onChange={(e) => setShowShelters(e.target.checked)}
                    className="rounded border-border-strong text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Crosshair className="h-3.5 w-3.5 text-purple-400" />
                    <span>Uber H3 Hexagons</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showHexagons}
                    onChange={(e) => setShowHexagons(e.target.checked)}
                    className="rounded border-border-strong text-sky-500 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Recenter Bounds Button */}
        <button
          onClick={handleRecenter}
          className="h-8 px-2.5 rounded-md bg-surface-panel/95 backdrop-blur border border-border-strong text-content-primary text-xs font-semibold flex items-center gap-1.5 shadow-lg hover:bg-surface-card transition-all"
          title="Recenter Valley Extents"
        >
          <Maximize2 className="h-3 w-3 text-sky-400" />
          <span className="hidden sm:inline">Recenter</span>
        </button>
      </div>

      {/* BOTTOM-LEFT: High-Density Tactical Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-lg bg-surface-panel/90 backdrop-blur-md border border-border-subtle shadow-2xl text-[11px] font-mono space-y-1.5 hidden md:block max-w-xs">
        <p className="font-bold text-content-primary uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-sky-400" />
          <span>Operational Node Legend</span>
        </p>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-status-critical shrink-0" />
            <span className="text-content-secondary">Critical Urgency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-status-high shrink-0" />
            <span className="text-content-secondary">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-status-forgotten shrink-0" />
            <span className="text-purple-300 font-bold">Forgotten Pocket</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-sky-400 shrink-0" />
            <span className="text-content-secondary">Active Dispatch</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-indigo-500 shrink-0" />
            <span className="text-indigo-300 font-bold">Relief Shelter</span>
          </div>
        </div>

        {isHighwayCut && (
          <div className="flex items-center gap-1.5 text-status-critical pt-1 border-t border-border-subtle font-bold">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>NH-07 Blocked at Helang Bridge Km 18</span>
          </div>
        )}
      </div>

      {/* BOTTOM-RIGHT: Tactical Cursor Coordinates & Zoom HUD */}
      <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md bg-surface-panel/90 backdrop-blur-md border border-border-subtle shadow-xl text-[10px] font-mono text-content-muted flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-sky-400" />
          <span className="text-content-secondary font-medium">
            {cursorCoords ? `${cursorCoords.lat}°N, ${cursorCoords.lng}°E` : 'Garhwal Valley'}
          </span>
        </div>
        <div className="h-3 w-px bg-border-subtle" />
        <div>
          Zoom: <span className="text-content-primary font-bold">{zoomLevel}x</span>
        </div>
      </div>
    </main>
  );
};
