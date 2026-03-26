'use client';

import { useState, useDeferredValue, useMemo, useRef, useEffect, memo } from 'react';

interface SearchFeature {
  name: string;
  lng: number;
  lat: number;
  layer: string;
  properties: Record<string, unknown>;
}

interface SearchBarProps {
  features: SearchFeature[];
  onSelect: (lng: number, lat: number) => void;
}

export default memo(function SearchBar({ features, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!deferredQuery.trim() || deferredQuery.length < 2) return [];
    const q = deferredQuery.toLowerCase();
    return features
      .filter(f => f.name.toLowerCase().includes(q))
      .slice(0, 10);
  }, [deferredQuery, features]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search ponds, buildings..."
        className="w-full bg-white/90 backdrop-blur-md border border-white/40 rounded-xl shadow-lg px-4 py-2.5 text-[13px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600/50 transition-all duration-300"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100/50 max-h-72 overflow-y-auto z-50">
          {results.map((f, i) => (
            <button
              key={`${f.name}-${i}`}
              onClick={() => {
                onSelect(f.lng, f.lat);
                setQuery(f.name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
            >
              <span className="text-xs font-medium text-gray-800">{f.name}</span>
              <span className="text-[10px] text-gray-400 ml-auto">{f.layer}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
})
