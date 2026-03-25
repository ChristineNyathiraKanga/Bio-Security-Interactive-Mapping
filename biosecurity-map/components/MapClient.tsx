'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import mapboxgl from 'mapbox-gl';
import { LAYER_CONFIGS, ORTHO_BOUNDS, ZONE_COLORS } from '@/config/map-styles';

const ZONE_LEVELS = [1, 2, 3, 4, 5] as const;
import LayerPanel from './LayerPanel';
import FeaturePopup from './FeaturePopup'
import SearchBar from './SearchBar';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface FeatureInfo {
  properties: Record<string, unknown>;
  layerId: string;
  lngLat: [number, number];
}

export default function MapClient() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>(() => {
    const vis: Record<string, boolean> = {};
    for (const cfg of LAYER_CONFIGS) {
      vis[cfg.id] = cfg.visible;
    }
    // Per-level zone visibility (replaces single zones-fill toggle)
    for (const lvl of ZONE_LEVELS) {
      vis[`zone-level-${lvl}`] = true;
    }
    vis['drone-ortho'] = true;
    return vis;
  });
  const [selectedFeature, setSelectedFeature] = useState<FeatureInfo | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [searchFeatures, setSearchFeatures] = useState<Array<{ name: string; lng: number; lat: number; layer: string; properties: Record<string, unknown> }>>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [34.1216, -0.5492], // Center of FARM_BOUNDS
      zoom: 16,
      maxZoom: 22,
      minZoom: 14,
    });

    map.current = m;

    m.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    m.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'bottom-right'
    );
    m.addControl(new mapboxgl.ScaleControl({ maxWidth: 150 }), 'bottom-left');

    m.on('load', () => {
      console.log('[MapClient] Map loaded successfully');
      m.resize();
      setMapLoaded(true);
    });

    m.on('error', (e) => {
      console.error('[MapClient] Map error:', e.error?.message || e);
    });

    return () => {
      setMapLoaded(false);
      m.remove();
      map.current = null;
    };
  }, []);

  // Load layers once map is ready
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    const m = map.current;

    const allFeatures: Array<{ name: string; lng: number; lat: number; layer: string; properties: Record<string, unknown> }> = [];

    async function loadLayers() {
      // Add drone orthophoto raster tile layer (renders below vector layers)
      try {
        m.addSource('drone-ortho-src', {
          type: 'raster',
          tiles: [window.location.origin + '/tiles/ortho/{z}/{x}/{y}.png'],
          tileSize: 256,
          bounds: [ORTHO_BOUNDS[0][0], ORTHO_BOUNDS[0][1], ORTHO_BOUNDS[1][0], ORTHO_BOUNDS[1][1]],
          minzoom: 14,
          maxzoom: 19,
        });
        m.addLayer({
          id: 'drone-ortho',
          type: 'raster',
          source: 'drone-ortho-src',
          paint: { 'raster-opacity': 0.9 },
          layout: { visibility: 'visible' },
        });
        console.log('[MapClient] Drone ortho tile layer added');
      } catch (err) {
        console.error('[MapClient] Failed to add drone ortho layer:', err);
      }

      for (const cfg of LAYER_CONFIGS) {
        try {
          const res = await fetch(cfg.file);
          const geojson = await res.json();

          const sourceId = cfg.id + '-src';

          // For utilities, we use the same file but filter by type
          let filterExpr: unknown[] | undefined;
          if (cfg.id === 'utilities-electrical') {
            filterExpr = ['==', ['get', 'utility_type'], 'electrical'];
          } else if (cfg.id === 'utilities-water') {
            filterExpr = ['==', ['get', 'utility_type'], 'water'];
          }

          // Add source (reuse if already added for utilities)
          if (!m.getSource(sourceId)) {
            m.addSource(sourceId, { type: 'geojson', data: geojson });
          }

          // Build layer
          const layerDef: mapboxgl.AnyLayer = {
            id: cfg.id,
            source: sourceId,
            type: cfg.type as 'fill' | 'line' | 'circle',
            paint: cfg.paint as Record<string, unknown>,
            layout: {
              visibility: cfg.visible ? 'visible' : 'none',
            },
          } as mapboxgl.AnyLayer;

          if (filterExpr) {
            (layerDef as Record<string, unknown>).filter = filterExpr;
          }

          // For zones, create per-level layers instead of one monolithic layer
          if (cfg.id === 'zones-fill') {
            for (const lvl of ZONE_LEVELS) {
              const zc = ZONE_COLORS[lvl];
              m.addLayer({
                id: `zone-level-${lvl}`,
                source: sourceId,
                type: 'fill',
                filter: ['==', ['get', 'Risk Level'], lvl],
                paint: {
                  'fill-color': zc.fill,
                  'fill-opacity': zc.opacity,
                },
                layout: { visibility: 'visible' },
              } as mapboxgl.AnyLayer);
              m.addLayer({
                id: `zone-level-${lvl}-outline`,
                source: sourceId,
                type: 'line',
                filter: ['==', ['get', 'Risk Level'], lvl],
                paint: {
                  'line-color': zc.border,
                  'line-width': 1.5,
                },
                layout: { visibility: 'visible' },
              } as mapboxgl.AnyLayer);
            }
          } else {
            m.addLayer(layerDef);
          }

          // Add infrastructure labels
          if (cfg.id === 'infrastructure') {
            m.addLayer({
              id: 'infrastructure-labels',
              source: sourceId,
              type: 'symbol',
              layout: {
                'text-field': ['get', 'Name'],
                'text-size': 10,
                'text-offset': [0, -1.5],
                'text-anchor': 'bottom',
                visibility: cfg.visible ? 'visible' : 'none',
              },
              paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1,
              },
            } as mapboxgl.AnyLayer);
          }

          // Collect searchable features
          if (geojson.features) {
            for (const f of geojson.features) {
              const name = f.properties?.['Name'] || f.properties?.['Pond Name'];
              if (!name) continue;

              let lng = 0, lat = 0;
              const geom = f.geometry;
              if (geom.type === 'Point') {
                [lng, lat] = geom.coordinates;
              } else if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
                // Use centroid approximation (average of first ring)
                const ring = geom.type === 'MultiPolygon' ? geom.coordinates[0][0] : geom.coordinates[0];
                const sum = ring.reduce(
                  (acc: [number, number], c: [number, number]) => [acc[0] + c[0], acc[1] + c[1]],
                  [0, 0]
                );
                lng = sum[0] / ring.length;
                lat = sum[1] / ring.length;
              } else if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
                const coords = geom.type === 'MultiLineString' ? geom.coordinates[0] : geom.coordinates;
                const mid = coords[Math.floor(coords.length / 2)];
                [lng, lat] = mid;
              }

              allFeatures.push({ name, lng, lat, layer: cfg.label, properties: f.properties });
            }
          }
        } catch (err) {
          console.error(`Failed to load layer ${cfg.id}:`, err);
        }
      }

      setSearchFeatures(allFeatures);
      console.log(`[MapClient] All layers loaded. ${allFeatures.length} searchable features.`);
    }

    loadLayers();
  }, [mapLoaded]);

  // Handle layer visibility toggles
  const handleToggleLayer = useCallback((layerId: string) => {
    setLayerVisibility(prev => {
      const next = { ...prev };

      // "zones-fill" acts as master toggle for all zone levels
      if (layerId === 'zones-fill') {
        const allOn = ZONE_LEVELS.every(l => prev[`zone-level-${l}`]);
        const newState = !allOn;
        for (const lvl of ZONE_LEVELS) {
          next[`zone-level-${lvl}`] = newState;
        }
        next['zones-fill'] = newState;
        if (map.current) {
          const vis = newState ? 'visible' : 'none';
          for (const lvl of ZONE_LEVELS) {
            if (map.current.getLayer(`zone-level-${lvl}`)) map.current.setLayoutProperty(`zone-level-${lvl}`, 'visibility', vis);
            if (map.current.getLayer(`zone-level-${lvl}-outline`)) map.current.setLayoutProperty(`zone-level-${lvl}-outline`, 'visibility', vis);
          }
        }
        return next;
      }

      // Individual zone level toggle
      const zoneLevelMatch = layerId.match(/^zone-level-(\d)$/);
      if (zoneLevelMatch) {
        next[layerId] = !prev[layerId];
        const vis = next[layerId] ? 'visible' : 'none';
        if (map.current) {
          if (map.current.getLayer(layerId)) map.current.setLayoutProperty(layerId, 'visibility', vis);
          if (map.current.getLayer(`${layerId}-outline`)) map.current.setLayoutProperty(`${layerId}-outline`, 'visibility', vis);
        }
        // Update master toggle state
        next['zones-fill'] = ZONE_LEVELS.every(l => next[`zone-level-${l}`]);
        return next;
      }

      // Generic toggle
      next[layerId] = !prev[layerId];
      if (map.current) {
        const visibility = next[layerId] ? 'visible' : 'none';
        if (map.current.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', visibility);
        }
        if (layerId === 'infrastructure' && map.current.getLayer('infrastructure-labels')) {
          map.current.setLayoutProperty('infrastructure-labels', 'visibility', visibility);
        }
      }
      return next;
    });
  }, []);

  // Handle map clicks for popups
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    const m = map.current;

    const clickableLayerIds = [
      ...ZONE_LEVELS.map(l => `zone-level-${l}`),
      ...LAYER_CONFIGS.filter(c => c.id !== 'zones-fill').map(c => c.id),
    ];

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      // Query all clickable layers at the click point
      const features = m.queryRenderedFeatures(e.point, { layers: clickableLayerIds.filter(id => m.getLayer(id)) });
      if (features.length > 0) {
        const f = features[0];
        setSelectedFeature({
          properties: f.properties as Record<string, unknown>,
          layerId: f.layer?.id ?? '',
          lngLat: [e.lngLat.lng, e.lngLat.lat],
        });
      } else {
        setSelectedFeature(null);
      }
    };

    // Change cursor on hover
    const handleMouseEnter = () => { m.getCanvas().style.cursor = 'pointer'; };
    const handleMouseLeave = () => { m.getCanvas().style.cursor = ''; };

    m.on('click', handleClick);
    for (const id of clickableLayerIds) {
      if (m.getLayer(id)) {
        m.on('mouseenter', id, handleMouseEnter);
        m.on('mouseleave', id, handleMouseLeave);
      }
    }

    return () => {
      m.off('click', handleClick);
      for (const id of clickableLayerIds) {
        if (m.getLayer(id)) {
          m.off('mouseenter', id, handleMouseEnter);
          m.off('mouseleave', id, handleMouseLeave);
        }
      }
    };
  }, [mapLoaded]);

  // Fly to on search select
  const handleSearchSelect = useCallback((lng: number, lat: number) => {
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 19, duration: 1200 });
    }
  }, []);

  return (
    <div className="fixed inset-0">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none h-16">
        <div className="flex items-center gap-3 p-3 pointer-events-auto">
          {/* Menu toggle for mobile */}
          <button
            onClick={() => setPanelOpen(o => !o)}
            className="md:hidden bg-white/90 backdrop-blur-md border border-white/40 rounded-xl shadow-lg p-2.5 flex-shrink-0 hover:bg-white/100 transition-colors"
            aria-label="Toggle layers"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="#333" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Logo + Title */}
          <div className="bg-transparent flex items-center gap-3 flex-shrink-0">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 flex-shrink-0 bg-white">
              <Image src="/logo.jpg" alt="Victory Farms" fill className="object-cover" sizes="48px" />
            </div>
            <div className="">
              <h1 className="font-extrabold text-[18px] text-white leading-tight tracking-wide">Victory Farms</h1>
              <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em] leading-tight mt-0.5">Biosecurity Map</p>
            </div>
          </div>

          {/* Search — desktop only (mobile search is in LayerPanel bottom sheet) */}
          <div className="hidden md:block flex-1 max-w-xs pointer-events-auto ml-auto">
            <SearchBar features={searchFeatures} onSelect={handleSearchSelect} />
          </div>
        </div>
      </div>

      {/* Layer Panel */}
      <LayerPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        visibility={layerVisibility}
        onToggle={handleToggleLayer}
        searchFeatures={searchFeatures}
        onSearchSelect={handleSearchSelect}
      />

      {/* Feature Popup */}
      {selectedFeature && (
        <FeaturePopup
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </div>
  );
}
