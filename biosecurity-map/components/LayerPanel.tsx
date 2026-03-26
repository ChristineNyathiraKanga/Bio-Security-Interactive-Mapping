'use client';

import { LAYER_CONFIGS, ZONE_COLORS, ZONE_LABELS } from '@/config/map-styles';
import SearchBar from './SearchBar';

interface SearchFeature {
  name: string;
  lng: number;
  lat: number;
  layer: string;
  properties: Record<string, unknown>;
}

interface LayerPanelProps {
  open: boolean;
  onClose: () => void;
  visibility: Record<string, boolean>;
  onToggle: (layerId: string) => void;
  searchFeatures?: SearchFeature[];
  onSearchSelect?: (lng: number, lat: number) => void;
}

// Sleek Custom Toggle Switch
function ToggleSwitch({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`
        relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600/50
        ${checked ? 'bg-green-600' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 
          transition duration-200 ease-in-out
          ${checked ? 'translate-x-3' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export default function LayerPanel({ open, onClose, visibility, onToggle, searchFeatures, onSearchSelect }: LayerPanelProps) {
  // Group layers by group
  const groups: Record<string, typeof LAYER_CONFIGS> = {};
  for (const cfg of LAYER_CONFIGS) {
    if (!groups[cfg.group]) groups[cfg.group] = [];
    groups[cfg.group].push(cfg);
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-white/20 backdrop-blur-sm z-20 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`
          fixed z-30 bg-white/85 backdrop-blur-2xl shadow-2xl border border-white/50
          transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          
          md:top-[76px] md:left-4 md:bottom-auto md:w-[280px] md:rounded-2xl md:max-h-[calc(100vh-6rem)] md:overflow-y-auto

          bottom-0 left-0 right-0 md:right-auto
          rounded-t-3xl md:rounded-t-2xl
          max-h-[65vh] md:max-h-[calc(100vh-6rem)]
          overflow-y-auto

          ${open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:-translate-x-[120%]'}
        `}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300/80 rounded-full" />
        </div>

        <div className="p-5 space-y-6">
          {/* Mobile search bar — sticky at top of bottom sheet */}
          {searchFeatures && onSearchSelect && (
            <div className="md:hidden -mx-5 -mt-5 px-4 pt-4 pb-3 bg-white/90 backdrop-blur-xl sticky top-0 z-10 border-b border-gray-100/60">
              <SearchBar features={searchFeatures} onSelect={onSearchSelect} />
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[13px] text-gray-800 uppercase tracking-widest">Map Layers</h2>
            <button className="md:hidden p-1 text-gray-400 hover:text-gray-600" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Biosecurity Zone Legend */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-gray-400/80 uppercase tracking-[0.2em]">Biosecurity Zones</h3>
            
            {/* Master toggle — Show All Zones */}
            <div className="flex items-center justify-between py-1 group cursor-pointer" onClick={() => onToggle('zones-fill')}>
              <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Show All Zones</span>
              <ToggleSwitch
                checked={[1,2,3,4,5].every(l => visibility[`zone-level-${l}`] ?? true)}
                onChange={() => onToggle('zones-fill')}
              />
            </div>
            
            {/* Per-level toggles */}
            <div className="ml-1 mt-2 space-y-1.5 bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
              {([5, 4, 3, 2, 1] as const).map(level => (
                <div
                  key={level}
                  className="flex items-center justify-between py-0.5 group cursor-pointer"
                  onClick={() => onToggle(`zone-level-${level}`)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-[4px] shadow-sm flex-shrink-0"
                      style={{ backgroundColor: ZONE_COLORS[level].fill, border: `1px solid ${ZONE_COLORS[level].border}` }}
                    />
                    <span className="text-xs font-medium text-gray-600">{ZONE_LABELS[level]}</span>
                  </div>
                  <ToggleSwitch
                    checked={visibility[`zone-level-${level}`] ?? true}
                    onChange={() => onToggle(`zone-level-${level}`)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Other groups */}
          {Object.entries(groups)
            .filter(([name]) => name !== 'Biosecurity Zones')
            .map(([groupName, layers]) => (
              <div key={groupName} className="space-y-3">
                <div className="h-px w-full bg-gradient-to-r from-gray-200/50 to-transparent my-4" />
                <h3 className="text-[11px] font-bold text-gray-400/80 uppercase tracking-[0.2em]">{groupName}</h3>
                
                <div className="space-y-2">
                  {layers.map(cfg => (
                    <div key={cfg.id} className="flex items-center justify-between py-1 group cursor-pointer" onClick={() => onToggle(cfg.id)}>
                      <div className="flex items-center gap-3">
                        <LayerSwatch config={cfg} />
                        <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{cfg.label}</span>
                      </div>
                      <ToggleSwitch checked={visibility[cfg.id] ?? true} onChange={() => onToggle(cfg.id)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {/* Drone Orthophoto */}
          <div className="space-y-3">
            <div className="h-px w-full bg-gradient-to-r from-gray-200/50 to-transparent my-4" />
            <h3 className="text-[11px] font-bold text-gray-400/80 uppercase tracking-[0.2em]">Imagery</h3>
            
            <div className="flex items-center justify-between py-1 group cursor-pointer" onClick={() => onToggle('drone-ortho')}>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-md shadow-sm border border-gray-200 inline-block flex-shrink-0 bg-gradient-to-br from-green-500 to-blue-500 overflow-hidden">
                   <div className="w-full h-full bg-white/20 backdrop-blur-[2px]" />
                </span>
                <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Drone Orthophoto</span>
              </div>
              <ToggleSwitch checked={visibility['drone-ortho'] ?? true} onChange={() => onToggle('drone-ortho')} />
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}

function LayerSwatch({ config }: { config: typeof LAYER_CONFIGS[number] }) {
  const paint = config.paint;
  let color = '#888';

  if (config.type === 'line') {
    color = paint['line-color'] as string;
  } else if (config.type === 'circle') {
    color = paint['circle-color'] as string;
  } else if (config.type === 'fill') {
    return null;
  }

  if (config.type === 'circle') {
    return (
      <span
        className="w-4 h-4 rounded-full shadow-sm flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: color, border: '1px solid rgba(0,0,0,0.1)' }}
      >
        <span className="w-1.5 h-1.5 bg-white rounded-full opacity-50" />
      </span>
    );
  }

  return (
    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
      <span className="block h-[3px] w-full rounded-full shadow-sm" style={{ backgroundColor: color }} />
    </span>
  );
}
