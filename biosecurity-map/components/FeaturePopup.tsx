'use client';

import { ZONE_COLORS } from '@/config/map-styles';

interface FeaturePopupProps {
  feature: {
    properties: Record<string, unknown>;
    layerId: string;
    lngLat: [number, number];
  };
  onClose: () => void;
}

export default function FeaturePopup({ feature, onClose }: FeaturePopupProps) {
  const { properties, layerId } = feature;

  // Determine which fields to show based on layer
  const fields = getFieldsForLayer(layerId, properties);
  const title = (properties['Name'] || properties['Pond Name'] || 'Feature Details') as string;
  const riskLevel = properties['Risk Level'] as number | undefined;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-sm md:absolute md:bottom-auto md:left-auto md:right-4 md:top-20 md:translate-x-0">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            backgroundColor: riskLevel ? ZONE_COLORS[riskLevel]?.fill + '20' : '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {riskLevel && (
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 border border-white"
                style={{ backgroundColor: ZONE_COLORS[riskLevel]?.fill }}
              />
            )}
            <h3 className="font-semibold text-sm text-gray-900 truncate">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 -mr-1 flex-shrink-0"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2">
          {fields.map(({ label, value }) => (
            value != null && value !== '' && (
              <div key={label} className="flex gap-2">
                <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide min-w-[70px] flex-shrink-0 pt-0.5">
                  {label}
                </span>
                <span className="text-xs text-gray-800">
                  {label === 'Risk Level' ? <RiskBadge level={value as number} /> : String(value)}
                </span>
              </div>
            )
          ))}
          {fields.length === 0 && (
            <p className="text-xs text-gray-400">No details available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: number }) {
  const color = ZONE_COLORS[level];
  if (!color) return <span>{level}</span>;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: color.fill + '25', color: color.border }}
    >
      Level {level}
    </span>
  );
}

function getFieldsForLayer(layerId: string, props: Record<string, unknown>) {
  // Define which fields matter per layer type
  const fieldSets: Record<string, string[]> = {
    'zones-fill': ['Name', 'Risk Level', 'Department', 'Protocol', 'Status', 'Purpose', 'Manager'],
    'ponds': ['Pond Name', 'Area(m.sq)', 'Status', 'Purpose', 'Manager', 'Supervisor'],
    'infrastructure': ['Name', 'Manager', 'Access', 'Risk Level', 'Protocol'],
    'washrooms': ['Name'],
    'utilities-electrical': ['Name', 'Length'],
    'utilities-water': ['Name', 'Length'],
    'boundary': ['Name'],
  };

  const lookupId = layerId.startsWith('zone-level-') ? 'zones-fill' : layerId;
  const fields = fieldSets[lookupId] || Object.keys(props).filter(k => !k.startsWith('_'));

  return fields
    .filter(key => props[key] != null && props[key] !== '')
    .map(key => ({ label: key, value: props[key] }));
}
