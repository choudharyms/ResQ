import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { cellToBoundary } from 'h3-js';
import {
  Layers,
  Radio,
  Navigation,
  Crosshair,
  Maximize2,
  Clock,
  Shield,
  AlertTriangle,
  Building2,
  Flame,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';
import { getAgencyConfig } from '../utils/agencyConfig';

type BasemapType = 'dark' | 'satellite' | 'street';

interface BasemapConfig {
  baseUrl: string;
  referenceUrl?: string;
  transportationUrl?: string;
  className?: string;
  attribution: string;
  label: string;
}

// Basemap Tile Providers (100% free, zero API key required, zero watermarks)
const BASEMAP_CONFIGS: Record<BasemapType, BasemapConfig> = {
  dark: {
    baseUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    className: 'tactical-dark-osm-tiles',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: 'Dark Tactical',
  },
  satellite: {
    baseUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    referenceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    transportationUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    className: 'leaflet-satellite-tiles',
    attribution: '&copy; Esri &copy; Earthstar Geographics',
    label: 'Satellite Recon',
  },
  street: {
    baseUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap contributors',
    label: 'Topo Physical',
  },
};

// Authentic Uttarakhand Disaster District Boundaries (Garhwal Region)
interface DistrictBoundary {
  id: string;
  name: string;
  role: string;
  color: string;
  coords: [number, number][];
  center: [number, number];
}

const DISTRICT_BOUNDARIES: DistrictBoundary[] = [
  {
    id: 'dist-rudraprayag',
    name: 'RUDRAPRAYAG DISTRICT',
    role: 'PRIMARY IMPACT THEATER',
    color: '#EF4444', // Crimson
    coords: [
      [30.7600, 79.0700], // Kedarnath / Mandakini Headwaters
      [30.6400, 79.1600], // Madhyamaheshwar Valley
      [30.5200, 79.2200], // Tungnath / Chopta Ridge (Border with Chamoli)
      [30.3800, 79.1800], // Mohankhal
      [30.2600, 79.0200], // Rudraprayag Sangam
      [30.2800, 78.9200], // Jakholi Ridge
      [30.4500, 78.9000], // Ghansali Border
      [30.6200, 78.9800], // Kedarnath Sanctuary Western Ridge
    ],
    center: [30.4400, 79.0500],
  },
  {
    id: 'dist-chamoli',
    name: 'CHAMOLI DISTRICT',
    role: 'UPPER VALLEY & SURGE BASIN',
    color: '#F59E0B', // Amber
    coords: [
      [30.7800, 79.4800], // Badrinath / Mana Pass
      [30.6800, 79.7600], // Malari / Nanda Devi Biosphere
      [30.4800, 79.8200], // Rishi Ganga / Raini Gorge
      [30.2800, 79.5200], // Tharali / Pindar Basin
      [30.2200, 79.2400], // Karnaprayag Confluence
      [30.3500, 79.3200], // Nandaprayag
      [30.4400, 79.3300], // Gopeshwar Chamoli
      [30.5600, 79.3000], // Mandal Ridge (Border with Rudraprayag)
    ],
    center: [30.4800, 79.5200],
  },
  {
    id: 'dist-pauri',
    name: 'PAURI GARHWAL DISTRICT',
    role: 'LOGISTICS & MEDICAL EVAC CORRIDOR',
    color: '#38BDF8', // Cyan
    coords: [
      [30.2400, 78.7600], // Srinagar Garhwal South Bank
      [30.2600, 79.0200], // Rudraprayag Southern Border
      [30.1200, 79.1000], // Thalisain / Khirsu
      [29.9800, 78.8500], // Lansdowne Ridge
      [30.0800, 78.6000], // Ganga Gorge / Vyasi
      [30.1500, 78.6000], // Devprayag Confluence
    ],
    center: [30.1200, 78.8200],
  },
  {
    id: 'dist-tehri',
    name: 'TEHRI GARHWAL DISTRICT',
    role: 'WESTERN RESERVE CORRIDOR',
    color: '#A855F7', // Purple
    coords: [
      [30.5500, 78.5000], // Tehri Dam / Uttarkashi Ridge
      [30.4800, 78.7200], // Ghansali / Bhilangana Valley
      [30.2600, 78.7800], // Kirtinagar North Bank
      [30.1500, 78.6000], // Devprayag North Bank
      [30.2800, 78.3800], // Chamba Heights
    ],
    center: [30.3600, 78.5600],
  },
];

// Helper function to get clean crisis icon SVG
function getCrisisIconSvg(eventType: string, color: string): string {
  if (eventType === 'FLOOD' || eventType === 'FLASH_FLOOD' || eventType === 'RIVER_SWELL') {
    return `<svg class="w-4 h-4" style="color: ${color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6.5 1.2.8 2 .8s1.4-.3 2-.8"/><path d="M2 17c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6.5 1.2.8 2 .8s1.4-.3 2-.8"/></svg>`;
  }
  if (eventType === 'LANDSLIDE' || eventType === 'ROCKFALL' || eventType === 'MUDSLIDE') {
    return `<svg class="w-4 h-4" style="color: ${color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;
  }
  if (eventType === 'BUILDING_COLLAPSE' || eventType === 'STRUCTURAL_COLLAPSE' || eventType === 'BRIDGE_COLLAPSE') {
    return `<svg class="w-4 h-4" style="color: ${color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`;
  }
  if (eventType === 'MEDICAL_SURGE' || eventType === 'EPIDEMIC') {
    return `<svg class="w-4 h-4" style="color: ${color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
  }
  return `<svg class="w-4 h-4" style="color: ${color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
}

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
  const referenceTileLayerRef = useRef<L.TileLayer | null>(null);
  const transportationTileLayerRef = useRef<L.TileLayer | null>(null);
  const heatmapLayerRef = useRef<any>(null);

  const layersRef = useRef<{
    sectorsLayer: L.LayerGroup;
    hexagonsLayer: L.LayerGroup;
    routesLayer: L.LayerGroup;
    incidentsLayer: L.LayerGroup;
    assetsLayer: L.LayerGroup;
    sheltersLayer: L.LayerGroup;
    blockageLayer: L.LayerGroup;
  } | null>(null);

  const {
    incidents,
    assets,
    shelters,
    activePlan,
    selectedIncidentId,
    selectIncident,
    isHighwayCut,
  } = useDisasterStore();

  const [basemap, setBasemap] = useState<BasemapType>('dark');
  const [showIncidents, setShowIncidents] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showHexagons, setShowHexagons] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showSectors, setShowSectors] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
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

    // Default: Esri World Dark Gray Base + Reference Overlay
    const cfg = BASEMAP_CONFIGS.dark;
    const initialBase = L.tileLayer(cfg.baseUrl, {
      maxZoom: 18,
      attribution: cfg.attribution,
    }).addTo(map);

    tileLayerRef.current = initialBase;

    if (cfg.referenceUrl) {
      const initialRef = L.tileLayer(cfg.referenceUrl, {
        maxZoom: 18,
      }).addTo(map);
      referenceTileLayerRef.current = initialRef;
    }

    // Layer Groups
    const sectorsLayer = L.layerGroup().addTo(map);
    const hexagonsLayer = L.layerGroup().addTo(map);
    const routesLayer = L.layerGroup().addTo(map);
    const incidentsLayer = L.layerGroup().addTo(map);
    const assetsLayer = L.layerGroup().addTo(map);
    const sheltersLayer = L.layerGroup().addTo(map);
    const blockageLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      sectorsLayer,
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

  // Handle Basemap Switch with Multi-Layer Boundaries & Transportation Support
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }
    if (referenceTileLayerRef.current) {
      referenceTileLayerRef.current.remove();
      referenceTileLayerRef.current = null;
    }
    if (transportationTileLayerRef.current) {
      transportationTileLayerRef.current.remove();
      transportationTileLayerRef.current = null;
    }

    const cfg = BASEMAP_CONFIGS[basemap];

    // 1. Base Layer (with satellite brightness class if applicable)
    const newBase = L.tileLayer(cfg.baseUrl, {
      maxZoom: 18,
      attribution: cfg.attribution,
      className: cfg.className,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newBase;

    // 2. Transportation Overlays (Roads, Passes & Bridges over Satellite)
    if (cfg.transportationUrl) {
      const newTrans = L.tileLayer(cfg.transportationUrl, {
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
      transportationTileLayerRef.current = newTrans;
    }

    // 3. Boundaries and Places Overlays (Highways, Town & District Labels)
    if (cfg.referenceUrl) {
      const newRef = L.tileLayer(cfg.referenceUrl, {
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
      referenceTileLayerRef.current = newRef;
    }
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
      padding: [60, 60],
      maxZoom: 12,
      animate: true,
    });
  }, [incidents, assets]);

  // Quick Preset Jumps
  const handlePresetJump = (coords: [number, number], zoom = 11) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(coords, zoom, { duration: 0.8 });
  };

  // Sync Defined District Boundaries (Prominently Rendered with Boundaries and Names)
  useEffect(() => {
    if (!layersRef.current) return;
    const { sectorsLayer } = layersRef.current;
    sectorsLayer.clearLayers();

    if (!showSectors) return;

    DISTRICT_BOUNDARIES.forEach((dist) => {
      // 1. District Perimeter Boundary Line
      const polygon = L.polygon(dist.coords, {
        color: dist.color,
        weight: 1.8,
        dashArray: '6, 6',
        fillColor: dist.color,
        fillOpacity: 0.04,
      });

      polygon.bindTooltip(
        `<div class="font-mono text-xs p-1"><b style="color: ${dist.color}">${dist.name}</b><div class="text-slate-300 text-[10px] mt-0.5">${dist.role}</div></div>`,
        { permanent: false, direction: 'center' }
      );

      sectorsLayer.addLayer(polygon);

      // 2. High-Contrast District Name Watermark Badge at Center
      const labelHtml = `
        <div class="pointer-events-none select-none -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-950/90 border border-slate-700/80 backdrop-blur-md shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
          <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${dist.color}"></span>
          <span class="font-mono font-bold text-[10px] tracking-wider text-slate-100 uppercase">${dist.name}</span>
        </div>
      `;

      const labelIcon = L.divIcon({
        html: labelHtml,
        className: 'district-center-label',
        iconSize: [170, 24],
        iconAnchor: [85, 12],
      });

      const labelMarker = L.marker(dist.center, {
        icon: labelIcon,
        interactive: false,
      });

      sectorsLayer.addLayer(labelMarker);
    });
  }, [showSectors]);

  // Sync Priority Distress Heatmap Layer (Vibrant Thermal Plumes Across Disaster Zones)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.remove();
      heatmapLayerRef.current = null;
    }

    if (!showHeatmap || incidents.length === 0) return;

    // Generate weighted thermal distress points
    const heatPoints: [number, number, number][] = incidents.flatMap((inc) => {
      const intensity = Math.min(Math.max(inc.assessment.priorityScore / 100, 0.45), 1.0);
      const points: [number, number, number][] = [[inc.location.lat, inc.location.lng, intensity]];

      // If high casualties or critical priority, generate subtle local thermal dispersion plume
      if (inc.assessment.priorityScore >= 80 || inc.casualties.affected > 40) {
        const radius = 0.014;
        const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
        angles.forEach((ang) => {
          points.push([
            inc.location.lat + Math.sin(ang) * radius,
            inc.location.lng + Math.cos(ang) * radius,
            intensity * 0.7,
          ]);
        });
      }

      return points;
    });

    try {
      const heat = (L as any).heatLayer(heatPoints, {
        radius: 46,
        blur: 28,
        maxZoom: 13,
        max: 1.0,
        minOpacity: 0.32,
        gradient: {
          0.2: '#0284C7', // Sky Blue (Low)
          0.4: '#10B981', // Emerald (Moderate)
          0.6: '#F59E0B', // Amber (Elevated)
          0.8: '#F97316', // Orange (Severe)
          1.0: '#EF4444', // Crimson (Life Critical)
        },
      }).addTo(mapInstanceRef.current);

      heatmapLayerRef.current = heat;
    } catch {
      // Fallback if heat layer fails
    }
  }, [incidents, showHeatmap]);

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
          dashArray: isSelected ? '4, 4' : '2, 4',
          fillColor: color,
          fillOpacity: isSelected ? 0.30 : 0.10,
        });

        polygon.bindTooltip(
          `
          <div class="font-mono text-xs p-1.5 min-w-[210px]">
            <div class="font-bold text-white flex items-center justify-between border-b border-gray-700/80 pb-1">
              <span>${incident.zoneName}</span>
              <span class="text-amber-400 font-black">Priority ${Math.round(incident.assessment.priorityScore)}</span>
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
                <span>Trauma Medics:</span>
                <span class="font-bold">${incident.demandVector.medicalResponders} units</span>
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

  // Sync Connecting Nodes (Curved Dispatch Trajectories with Minimalist Waypoint Dots, Zero Clutter Text)
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
          opacity: isRouteSelected ? 0.45 : 0.25,
          lineCap: 'round',
        });

        // 2. Inner Active Core Trajectory (Static High-Contrast Route)
        const corePolyline = L.polyline(curvedPoints, {
          color: isRouteSelected ? '#FFFFFF' : routeColor,
          weight: isRouteSelected ? 2.5 : 1.8,
          dashArray: '6, 6',
          opacity: isRouteSelected ? 0.95 : 0.85,
        });

        const tooltipContent = `
          <div class="p-1 font-mono text-xs">
            <div class="font-bold text-sky-300">${asg.assetCode} ➔ ${asg.zoneName}</div>
            <div class="text-gray-300">${asg.needType} · ${asg.travelMinutes}m ETA (${asg.distanceKm} km)</div>
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

        // 3. Minimalist Waypoint Dot (Zero Text Clutter, Sleek 6px Glowing Node)
        const midIndex = Math.floor(curvedPoints.length / 2);
        const midCoord = curvedPoints[midIndex];

        const midDotHtml = `
          <div class="cursor-pointer group flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <span class="h-2 w-2 rounded-full shadow-lg transition-transform group-hover:scale-150 ${
              asg.isEquityForced ? 'bg-purple-400 shadow-purple-500/50' : 'bg-sky-400 shadow-sky-500/50'
            }"></span>
          </div>
        `;

        const midIcon = L.divIcon({
          html: midDotHtml,
          className: 'tactical-route-waypoint-dot',
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        });

        const midMarker = L.marker(midCoord, { icon: midIcon });
        midMarker.on('click', handleRouteClick);
        midMarker.bindTooltip(tooltipContent, { direction: 'top' });

        routesLayer.addLayer(midMarker);
      }
    });
  }, [activePlan, assets, incidents, selectedIncidentId, showRoutes, selectIncident]);

  // Sync Destination Crisis Nodes (Icon Only, Zero Text Clutter on Canvas, Full Details in Tooltip & Popup)
  useEffect(() => {
    if (!layersRef.current) return;
    const { incidentsLayer } = layersRef.current;
    incidentsLayer.clearLayers();

    if (!showIncidents) return;

    incidents.forEach((incident) => {
      const isSelected = incident.id === selectedIncidentId;
      const isCritical = incident.assessment.priorityScore >= 80;

      const accentColor = incident.isSilentPocket
        ? '#A855F7'
        : isCritical
        ? '#EF4444'
        : '#F59E0B';

      const eventTypeLabel = incident.eventType.replace('_', ' ');

      // Icon Only Tactical Beacon (Zero Text Labels Floating on Canvas)
      const markerHtml = `
        <div class="tactical-incident-marker group relative cursor-pointer select-none -translate-x-1/2 -translate-y-1/2">
          <!-- Reticle Bracket when Selected -->
          ${
            isSelected
              ? `
              <div class="absolute -inset-2.5 pointer-events-none z-10">
                <div class="w-full h-full border border-sky-400 rounded relative">
                  <span class="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-sky-400"></span>
                  <span class="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-sky-400"></span>
                  <span class="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-sky-400"></span>
                  <span class="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-sky-400"></span>
                </div>
              </div>
            `
              : ''
          }

          <!-- Pure Crisis Icon Beacon with Glowing Ring -->
          <div class="h-7 w-7 rounded-full bg-slate-950 border-2 shadow-2xl flex items-center justify-center transition-transform group-hover:scale-125" style="border-color: ${accentColor}; box-shadow: 0 0 10px ${accentColor}50">
            ${getCrisisIconSvg(incident.eventType, accentColor)}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'tactical-incident-container',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([incident.location.lat, incident.location.lng], {
        icon: customIcon,
      });

      // Hover Tooltip: Zone, Crisis Type, Priority & Casualties
      marker.bindTooltip(`
        <div class="p-1 font-mono text-xs">
          <div class="font-bold text-white">${incident.zoneName}</div>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="font-bold uppercase text-[10px]" style="color: ${accentColor}">${eventTypeLabel}</span>
            <span class="text-slate-400">·</span>
            <span class="text-white font-bold text-[10px]">Priority ${Math.round(incident.assessment.priorityScore)}</span>
            <span class="text-slate-400">·</span>
            <span class="text-amber-400 text-[10px]">${incident.casualties.trapped} trapped</span>
          </div>
        </div>
      `, { direction: 'top', offset: [0, -16] });

      // Click: Rich Interactive Popup
      marker.bindPopup(`
        <div class="p-1 space-y-1.5 font-sans min-w-[210px]">
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

  // Sync Origin Dispatch Nodes (Fleet Asset Vehicle Icons, Zero Text Clutter on Canvas)
  useEffect(() => {
    if (!layersRef.current) return;
    const { assetsLayer } = layersRef.current;
    assetsLayer.clearLayers();

    if (!showAssets) return;

    assets.forEach((asset) => {
      const isDispatched = asset.status === 'EN_ROUTE' || asset.status === 'ON_SITE';
      const agencyCfg = getAgencyConfig(asset.agency);
      const agencyIconSrc = agencyCfg.icon;
      const agencyColor = agencyCfg.hex;

      // Compact Circular Vehicle Token with Agency Logo & Live Status Dot
      const assetHtml = `
        <div class="tactical-asset-marker group relative cursor-pointer select-none -translate-x-1/2 -translate-y-1/2">
          <div class="h-6 w-6 rounded-full bg-slate-950 border-2 flex items-center justify-center shadow-xl transition-transform group-hover:scale-125 relative" style="border-color: ${agencyColor}; box-shadow: 0 0 8px ${agencyColor}40">
            <img src="${agencyIconSrc}" alt="${asset.agency}" class="w-3.5 h-3.5 object-contain" />
            <!-- Live status indicator dot -->
            <span class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-slate-950 ${
              isDispatched ? 'bg-sky-400 ring-1 ring-sky-400' : 'bg-emerald-400'
            }"></span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: assetHtml,
        className: 'tactical-asset-container',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([asset.currentLocation.lat, asset.currentLocation.lng], { icon });

      // Hover Tooltip: Code, Agency, Name & Status
      marker.bindTooltip(`
        <div class="p-1 font-mono text-xs">
          <div class="font-bold text-white">${asset.assetCode} · ${asset.name}</div>
          <div class="text-[10px] text-gray-300 mt-0.5">${asset.agency} · <span class="${isDispatched ? 'text-sky-400 font-bold' : 'text-emerald-400 font-bold'}">${asset.status}</span></div>
        </div>
      `, { direction: 'top', offset: [0, -14] });

      marker.bindPopup(`
        <div class="p-1 space-y-1.5 font-sans min-w-[200px]">
          <div class="flex items-center justify-between gap-2 border-b border-gray-700 pb-1">
            <div class="flex items-center gap-1.5">
              <img src="${agencyIconSrc}" class="h-4 w-4 rounded-sm object-contain" />
              <span class="font-mono text-xs font-bold text-white">${asset.assetCode}</span>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${agencyCfg.chipClass} font-mono">${agencyCfg.shortName}</span>
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

  // Sync Environmental Blockages (Helang Bridge Km 18 Washout, Clean Hazard Icon)
  useEffect(() => {
    if (!layersRef.current) return;
    const { blockageLayer } = layersRef.current;
    blockageLayer.clearLayers();

    if (!isHighwayCut) return;

    const bridgeCoords: [number, number] = [30.5278, 79.522];
    const cutHtml = `
      <div class="relative flex items-center justify-center cursor-pointer select-none -translate-x-1/2 -translate-y-1/2">
        <div class="h-6 w-6 rounded-full bg-rose-950 border-2 border-rose-500 flex items-center justify-center shadow-2xl hover:scale-125 transition-transform text-xs">
          ⛔
        </div>
      </div>
    `;

    const cutIcon = L.divIcon({
      html: cutHtml,
      className: 'highway-cut-pin',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const cutMarker = L.marker(bridgeCoords, { icon: cutIcon });

    cutMarker.bindTooltip(`
      <div class="p-1 font-mono text-xs">
        <div class="font-bold text-rose-400">⚠️ NH-07 HELANG BLOCKED</div>
        <div class="text-[10px] text-slate-300">Bridge washout · Detour via Chopta Pass (+24 min)</div>
      </div>
    `, { direction: 'top', offset: [0, -14] });

    cutMarker.bindPopup(`
      <div class="p-1.5 font-sans min-w-[220px]">
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

  // Sync Shelters Layer (Distinct Tent Icon Only, Zero Text Clutter on Canvas)
  useEffect(() => {
    if (!layersRef.current) return;
    const { sheltersLayer } = layersRef.current;
    sheltersLayer.clearLayers();

    if (!showShelters) return;

    shelters.forEach((shelter) => {
      const occPct = Math.round((shelter.occupiedBeds / shelter.totalCapacityBeds) * 100);
      const isCriticalCapacity = occPct >= 90;
      const statusColor = isCriticalCapacity ? '#EF4444' : occPct >= 75 ? '#F59E0B' : '#10B981';

      // Offset slightly to prevent direct stacking on incidents
      const offsetLat = shelter.location.lat + 0.007;
      const offsetLng = shelter.location.lng + 0.007;

      const shelterIcon = L.divIcon({
        className: 'shelter-marker-container',
        html: `
          <div class="tactical-shelter-marker group relative cursor-pointer select-none -translate-x-1/2 -translate-y-1/2">
            <div class="h-6 w-6 rounded-full bg-indigo-950 border-2 border-indigo-400 flex items-center justify-center shadow-xl transition-transform group-hover:scale-125 relative">
              <svg class="w-3.5 h-3.5 text-indigo-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 21 12 3l8.5 18H3.5Z"/><path d="m12 3 5 18"/><path d="M12 14v7"/></svg>
              <!-- Capacity status indicator dot -->
              <span class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-slate-950" style="background-color: ${statusColor}"></span>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([offsetLat, offsetLng], { icon: shelterIcon });

      // Hover Tooltip
      marker.bindTooltip(`
        <div class="p-1 font-mono text-xs">
          <div class="font-bold text-indigo-300">${shelter.name}</div>
          <div class="text-[10px] text-slate-300 mt-0.5">${shelter.occupiedBeds}/${shelter.totalCapacityBeds} beds (${occPct}% occupied)</div>
        </div>
      `, { direction: 'top', offset: [0, -14] });

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
    <main className="flex-1 relative h-[calc(100vh-56px)] bg-slate-950 overflow-hidden select-none">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* TOP-LEFT: Floating Tactical Basemap & Layer Switcher */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="h-8 px-3 rounded-md bg-slate-900/90 backdrop-blur border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl hover:bg-slate-800 transition-all font-mono"
            title="Toggle Tactical Overlays & Basemaps"
          >
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span>Map Layers</span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-lg bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl p-3 space-y-2.5 text-xs text-white z-30 font-mono">
              {/* Basemap Selection */}
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                  Basemap Provider
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(['dark', 'satellite', 'street'] as BasemapType[]).map((b) => (
                    <button
                      key={b}
                      onClick={() => setBasemap(b)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                        basemap === b
                          ? 'bg-sky-500 text-sky-950 font-black shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {b === 'dark' ? 'Dark GIS' : b === 'satellite' ? 'Satellite' : 'Topo'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-800" />

              {/* Tactical Overlays */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                  Tactical Overlays
                </p>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    <span>Distress Heatmap</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Radio className="h-3.5 w-3.5 text-rose-500" />
                    <span>Incidents ({incidents.length})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showIncidents}
                    onChange={(e) => setShowIncidents(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 text-sky-400" />
                    <span>Connecting Routes</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showRoutes}
                    onChange={(e) => setShowRoutes(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Fleet Assets ({assets.length})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showAssets}
                    onChange={(e) => setShowAssets(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Shelters ({shelters.length})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showShelters}
                    onChange={(e) => setShowShelters(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Crosshair className="h-3.5 w-3.5 text-purple-400" />
                    <span>Sector Boundaries</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showSectors}
                    onChange={(e) => setShowSectors(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Crosshair className="h-3.5 w-3.5 text-slate-400" />
                    <span>H3 Hexagons</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showHexagons}
                    onChange={(e) => setShowHexagons(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>
              </div>

              <div className="h-px bg-slate-800" />

              {/* Quick Valley Focus */}
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                  Focus Mountain Sector
                </p>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      handlePresetJump([30.2854, 78.9812], 12);
                      setIsLayerMenuOpen(false);
                    }}
                    className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200"
                  >
                    Rudraprayag
                  </button>
                  <button
                    onClick={() => {
                      handlePresetJump([30.2227, 78.7844], 12);
                      setIsLayerMenuOpen(false);
                    }}
                    className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200"
                  >
                    Srinagar
                  </button>
                  <button
                    onClick={() => {
                      handlePresetJump([30.5564, 79.5668], 12);
                      setIsLayerMenuOpen(false);
                    }}
                    className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200"
                  >
                    Joshimath
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Basemap Toggle */}
        <div className="hidden sm:flex items-center rounded-md bg-slate-900/90 backdrop-blur border border-slate-700/80 p-0.5 text-[10px] font-mono shadow-xl">
          <button
            onClick={() => setBasemap('dark')}
            className={`px-2 py-1 rounded transition-all ${
              basemap === 'dark' ? 'bg-sky-500 text-sky-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setBasemap('satellite')}
            className={`px-2 py-1 rounded transition-all ${
              basemap === 'satellite' ? 'bg-sky-500 text-sky-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sat
          </button>
          <button
            onClick={() => setBasemap('street')}
            className={`px-2 py-1 rounded transition-all ${
              basemap === 'street' ? 'bg-sky-500 text-sky-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Topo
          </button>
        </div>

        {/* 1-Click Heatmap Toggle Pill */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`h-8 px-2.5 rounded-md backdrop-blur border text-xs font-semibold flex items-center gap-1.5 shadow-xl transition-all font-mono ${
            showHeatmap
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-white'
          }`}
          title="Toggle Thermal Distress Heatmap"
        >
          <Flame className="h-3 w-3 text-amber-400" />
          <span className="hidden md:inline">Heatmap</span>
        </button>

        {/* Recenter Bounds Button */}
        <button
          onClick={handleRecenter}
          className="h-8 px-2.5 rounded-md bg-slate-900/90 backdrop-blur border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl hover:bg-slate-800 transition-all font-mono"
          title="Recenter Valley Extents"
        >
          <Maximize2 className="h-3 w-3 text-sky-400" />
          <span className="hidden sm:inline">Recenter</span>
        </button>
      </div>

      {/* BOTTOM-LEFT: Streamlined Tactical Legend Strip */}
      <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-md bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow-2xl text-[10px] font-mono text-slate-300 flex items-center gap-3.5 hidden md:flex">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span className="text-white font-bold">T1 Critical (≥80)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>T2 High (60-79)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-purple-300 font-semibold">Silent Hamlet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-sky-400" />
          <span>Fleet Unit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-indigo-500" />
          <span className="text-indigo-300">Relief Shelter</span>
        </div>
        {showHeatmap && (
          <div className="flex items-center gap-1 text-amber-300 border-l border-slate-700 pl-2.5">
            <Flame className="h-2.5 w-2.5 text-amber-400" />
            <span>Thermal Plume Active</span>
          </div>
        )}
        {isHighwayCut && (
          <div className="flex items-center gap-1 text-rose-400 font-bold border-l border-slate-700 pl-2.5">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>NH-07 Blocked</span>
          </div>
        )}
      </div>

      {/* BOTTOM-RIGHT: Tactical Cursor Coordinates & Zoom HUD */}
      <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow-xl text-[10px] font-mono text-slate-400 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-sky-400" />
          <span className="text-slate-200 font-medium">
            {cursorCoords ? `${cursorCoords.lat}°N, ${cursorCoords.lng}°E` : 'Garhwal Valley'}
          </span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div>
          Zoom: <span className="text-white font-bold">{zoomLevel}x</span>
        </div>
      </div>
    </main>
  );
};
