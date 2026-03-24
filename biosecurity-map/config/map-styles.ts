// Victory Farms brand colors and biosecurity zone styling
// Single source of truth for all map layer visual config

export const VF_BRAND = {
  green: '#00822c',
  blue: '#00BDF0',
  darkGreen: '#005e1f',
  white: '#ffffff',
  lightGray: '#f5f5f5',
} as const;

// Biosecurity zone colors by risk level (1 = lowest, 5 = highest)
export const ZONE_COLORS: Record<number, { fill: string; border: string; opacity: number }> = {
  1: { fill: '#00822c', border: '#005e1f', opacity: 0.54 },
  2: { fill: '#006159', border: '#004840', opacity: 0.58 },
  3: { fill: '#FFFF00', border: '#cccc00', opacity: 0.53 },
  4: { fill: '#FF7F00', border: '#cc6600', opacity: 0.38 },
  5: { fill: '#E31A1C', border: '#b01417', opacity: 0.62 },
};

export const ZONE_LABELS: Record<number, string> = {
  1: 'Level 1 – Low Risk',
  2: 'Level 2 – Medium-Low',
  3: 'Level 3 – Medium',
  4: 'Level 4 – High',
  5: 'Level 5 – Highest',
};

// Layer definitions for loading and toggling
export interface LayerConfig {
  id: string;
  label: string;
  file: string;
  type: 'fill' | 'line' | 'circle';
  group: string;
  visible: boolean;
  paint: Record<string, unknown>;
}

export const LAYER_CONFIGS: LayerConfig[] = [
  // --- Boundary ---
  {
    id: 'boundary',
    label: 'Farm Boundary',
    file: '/geojson/boundary.geojson',
    type: 'line',
    group: 'Overlays',
    visible: true,
    paint: {
      'line-color': '#FFDF00',
      'line-width': 2,
    },
  },
  // --- Biosecurity Zones (rendered as one source with data-driven styling) ---
  // Zones are handled separately via data-driven styling, not individual configs.
  // But we still define one entry for the toggle.
  {
    id: 'zones-fill',
    label: 'Biosecurity Zones',
    file: '/geojson/zones.geojson',
    type: 'fill',
    group: 'Biosecurity Zones',
    visible: true,
    paint: {
      'fill-color': [
        'match', ['get', 'Risk Level'],
        1, '#00822c',
        2, '#006159',
        3, '#FFFF00',
        4, '#FF7F00',
        5, '#E31A1C',
        '#888888',
      ],
      'fill-opacity': [
        'match', ['get', 'Risk Level'],
        1, 0.54,
        2, 0.58,
        3, 0.53,
        4, 0.38,
        5, 0.62,
        0.4,
      ],
    },
  },
  // --- Ponds ---
  {
    id: 'ponds',
    label: 'Ponds',
    file: '/geojson/ponds.geojson',
    type: 'line',
    group: 'Facilities',
    visible: true,
    paint: {
      'line-color': '#FF7F00',
      'line-width': 2,
    },
  },
  // --- Infrastructure ---
  {
    id: 'infrastructure',
    label: 'Key Infrastructure',
    file: '/geojson/infrastructure.geojson',
    type: 'circle',
    group: 'Facilities',
    visible: true,
    paint: {
      'circle-radius': 5,
      'circle-color': VF_BRAND.green,
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1.5,
    },
  },
  // --- Washrooms ---
  {
    id: 'washrooms',
    label: 'Washrooms',
    file: '/geojson/washrooms.geojson',
    type: 'circle',
    group: 'Facilities',
    visible: true,
    paint: {
      'circle-radius': 5,
      'circle-color': '#00BDF0',
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1.5,
    },
  },
  // --- Utilities ---
  {
    id: 'utilities-electrical',
    label: 'Electrical Lines',
    file: '/geojson/utilities.geojson',
    type: 'line',
    group: 'Utilities',
    visible: false,
    paint: {
      'line-color': '#E31A1C',
      'line-width': 2,
    },
  },
  {
    id: 'utilities-water',
    label: 'Water Pipes',
    file: '/geojson/utilities.geojson',
    type: 'line',
    group: 'Utilities',
    visible: false,
    paint: {
      'line-color': '#0BD5FF',
      'line-width': 2,
    },
  },
];

// Farm bounding box [sw_lng, sw_lat, ne_lng, ne_lat]
export const FARM_BOUNDS: [number, number, number, number] = [
  34.1194, -0.5508, 34.1238, -0.5476,
];

// Drone orthophoto tile bounds (from QGIS export)
export const ORTHO_BOUNDS: [[number, number], [number, number]] = [
  [34.116250623, -0.570056202],
  [34.138308102, -0.545719934],
];
