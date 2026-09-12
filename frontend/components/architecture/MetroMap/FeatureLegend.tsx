// frontend/components/architecture/MetroMap/FeatureLegend.tsx

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  Info,
  SlidersHorizontal,
  Route,
  Shield,
  Cog,
  Database,
  Box,
  Globe,
  Wrench,
} from 'lucide-react';
import { FeatureCluster, SubwayStationData } from './types';
import { getFeatureDescription } from './useMetroLayout';

interface FeatureLegendProps {
  features: FeatureCluster[];
  selectedFeatures: string[];
  onToggleFeature: (featureId: string) => void;
  onSelectAll: () => void;
  hoveredFeature?: string | null;
  onHoverFeature?: (featureId: string | null) => void;
  onCenterFeature?: (featureId: string) => void;
  onSelectStationType?: (type: string | null) => void;
  selectedStationType?: string | null;
}

export const STATION_TYPES_CONFIG = [
  { id: 'route', label: 'API Endpoint', color: '#16C7A1', icon: Route },
  { id: 'middleware', label: 'Middleware', color: '#8B5CF6', icon: Shield },
  { id: 'service', label: 'Service', color: '#F5B800', icon: Cog },
  { id: 'database', label: 'Database', color: '#9B5CFF', icon: Database },
  { id: 'repository', label: 'External API', color: '#00B8D9', icon: Globe },
];

export function FeatureLegend({
  features,
  selectedFeatures,
  onToggleFeature,
  onSelectAll,
  hoveredFeature,
  onHoverFeature,
  onCenterFeature,
  onSelectStationType,
  selectedStationType,
}: FeatureLegendProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');

  const isAllSelected = selectedFeatures.length === 0;

  // Filtered & Sorted Feature Lines
  const processedFeatures = useMemo(() => {
    let result = [...features];

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          String(f?.name || '').toLowerCase().includes(q) ||
          getFeatureDescription(f?.name || '').toLowerCase().includes(q)
      );
    }

    // Tab Filter
    if (activeTab === 'active') {
      result = result.filter((f) => isAllSelected || selectedFeatures.includes(f.id));
    }

    return result;
  }, [features, searchQuery, activeTab, selectedFeatures, isAllSelected]);

  return (
    <div className="flex flex-col h-full text-left select-none bg-[#08171C] w-[260px] shrink-0 border-r border-[rgba(80,180,200,0.14)] overflow-hidden">
      {/* ── 1. Header: FEATURE LINES ── */}
      <div className="p-3 pb-2 border-b border-[rgba(80,180,200,0.12)] shrink-0 bg-[#071219]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-bold text-[#F4F7F7] font-mono tracking-wider uppercase">
            Feature Lines
          </h2>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#16C7A3]/15 text-[#16C7A3]">
            {features.length}
          </span>
        </div>

        {/* ── Search Input ── */}
        <div className="relative mb-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#718287] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feature lines..."
            className="w-full bg-[#0B171B] border border-[rgba(80,180,200,0.15)] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#F4F7F7] placeholder-[#718287] focus:outline-none focus:border-[#16C7A3] transition"
          />
        </div>

        {/* ── Segmented Filter: All Lines / Active ── */}
        <div className="grid grid-cols-2 gap-1 bg-[#0B171B] p-0.5 rounded-lg border border-[rgba(80,180,200,0.12)] text-[10.5px] font-semibold font-mono">
          <button
            onClick={() => {
              setActiveTab('all');
              onSelectAll();
            }}
            className={`py-1 rounded-md transition text-center cursor-pointer ${
              activeTab === 'all' && isAllSelected
                ? 'bg-[#16C7A3] text-[#061318] font-bold'
                : 'text-[#9FB0B4] hover:text-[#F4F7F7]'
            }`}
          >
            All Lines
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`py-1 rounded-md transition text-center cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#16C7A3] text-[#061318] font-bold'
                : 'text-[#9FB0B4] hover:text-[#F4F7F7]'
            }`}
          >
            Active
          </button>
        </div>
      </div>

      {/* ── 2. Compact Feature Line Cards List (height 62-72px) ── */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-0">
        {processedFeatures.map((feat) => {
          const isVisible = isAllSelected || selectedFeatures.includes(feat.id);
          const isHovered = hoveredFeature === feat.id;
          const flowCount = feat.flowGroups?.length || 4;
          const stationCount = feat.files?.length || 14;

          const safeName = String(feat?.name || '').toLowerCase();
          const persistentColor =
            safeName.includes('auth')
              ? '#F43F8C'
              : safeName.includes('user')
                ? '#2F80ED'
                : safeName.includes('admin')
                  ? '#A855F7'
                  : safeName.includes('analytic') || safeName.includes('billing')
                    ? '#F5A623'
                    : safeName.includes('notif')
                      ? '#16C7A3'
                      : safeName.includes('core')
                        ? '#64748B'
                        : feat.color || '#2F80ED';

          return (
            <div
              key={feat.id}
              onClick={() => onToggleFeature(feat.id)}
              onMouseEnter={() => onHoverFeature?.(feat.id)}
              onMouseLeave={() => onHoverFeature?.(null)}
              className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer min-h-[64px] flex flex-col justify-between ${
                isVisible
                  ? 'bg-[#0E1B20] border-[rgba(80,180,200,0.18)] hover:border-[#16C7A3]/50 shadow-sm'
                  : 'bg-[#071219]/60 border-white/5 opacity-40 hover:opacity-60'
              } ${isHovered ? 'ring-1 ring-[#16C7A3]/50' : ''}`}
              style={{
                borderLeftWidth: '3.5px',
                borderLeftColor: persistentColor,
              }}
            >
              {/* Row 1: Dot Indicator + Name */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: persistentColor }}
                  />
                  <span className="text-xs font-bold text-[#F4F7F7] font-mono truncate">
                    {feat.name}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCenterFeature?.(feat.id);
                  }}
                  className="text-[#718287] hover:text-[#16C7A3] p-0.5 rounded transition"
                  title="Center on map"
                >
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Row 2: Flow and Station counts */}
              <div className="text-[10px] text-[#9FB0B4] font-mono mt-1 flex items-center justify-between">
                <span>{flowCount} flows · {stationCount} stations</span>
                <span className="text-[9px] font-bold text-[#16C7A3]">{feat.health || 95}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FeatureLegend;
