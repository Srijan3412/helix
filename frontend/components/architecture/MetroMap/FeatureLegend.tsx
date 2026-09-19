// frontend/components/architecture/MetroMap/FeatureLegend.tsx

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Layers,
  SlidersHorizontal,
  Route,
  Shield,
  Cog,
  Database,
  Globe,
  Lock,
  Unlock,
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
  onClose?: () => void;
  isLocked?: boolean;
  onToggleLock?: () => void;
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
  onClose,
  isLocked = false,
  onToggleLock,
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
    <div className="flex flex-col h-full text-left select-none bg-[#08171C] w-full shrink-0 border-r border-[rgba(80,180,200,0.14)] overflow-hidden">
      {/* ── 1. Header: FEATURE LINES + Lock & Close buttons ── */}
      <div className="p-3 pb-2.5 border-b border-[rgba(80,180,200,0.12)] shrink-0 bg-[#071219]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-bold text-[#F4F7F7] font-mono tracking-wider uppercase">
              Feature Lines
            </h2>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#16C7A3]/15 text-[#16C7A3]">
              {features.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onToggleLock && (
              <button
                onClick={onToggleLock}
                className={`p-1 rounded-md transition cursor-pointer flex items-center justify-center ${
                  isLocked
                    ? 'bg-[#16C7A3] text-[#061318] font-bold shadow-xs'
                    : 'bg-[#0A171C] hover:bg-[#0E1B20] text-[#718287] hover:text-[#F4F7F7] border border-[rgba(80,180,200,0.15)]'
                }`}
                title={isLocked ? 'Locked Open (Click to unlock)' : 'Lock Panel Open (Prevent auto-collapse)'}
              >
                {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-md bg-[#0A171C] hover:bg-[#0E1B20] text-[#718287] hover:text-[#F4F7F7] border border-[rgba(80,180,200,0.15)] transition cursor-pointer"
                title="Collapse Feature Lines (←)"
              >
                <ChevronLeft size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Search Input ── */}
        <div className="relative mb-2">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#718287] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feature lines..."
            className="w-full bg-[#0B171B] border border-[rgba(80,180,200,0.15)] rounded-lg pl-8 pr-2.5 py-1 text-xs text-[#F4F7F7] placeholder-[#718287] focus:outline-none focus:border-[#16C7A3] transition"
          />
        </div>

        {/* ── Segmented Filter: All Lines / Active ── */}
        <div className="grid grid-cols-2 gap-1 bg-[#0B171B] p-0.5 rounded-lg border border-[rgba(80,180,200,0.12)] text-[10px] font-semibold font-mono">
          <button
            onClick={() => {
              setActiveTab('all');
              onSelectAll();
            }}
            className={`py-0.5 rounded-md transition text-center cursor-pointer ${
              activeTab === 'all' && isAllSelected
                ? 'bg-[#16C7A3] text-[#061318] font-bold'
                : 'text-[#9FB0B4] hover:text-[#F4F7F7]'
            }`}
          >
            All Lines
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`py-0.5 rounded-md transition text-center cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#16C7A3] text-[#061318] font-bold'
                : 'text-[#9FB0B4] hover:text-[#F4F7F7]'
            }`}
          >
            Active ({selectedFeatures.length || features.length})
          </button>
        </div>
      </div>

      {/* ── 2. Compact Feature Line Cards List (height ~60px) ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
        {processedFeatures.map((feat) => {
          const isVisible = isAllSelected || selectedFeatures.includes(feat.id);
          const isHovered = hoveredFeature === feat.id;
          const flowCount = feat.flowGroups?.length || (feat.routes?.length ? Math.min(feat.routes.length, 3) : 1);
          const stationCount = feat.totalStations || feat.files?.length || 1;

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

          const flowText = flowCount === 1 ? '1 flow' : `${flowCount} flows`;
          const stationText = stationCount === 1 ? '1 station' : `${stationCount} stations`;

          return (
            <div
              key={feat.id}
              onClick={() => onToggleFeature(feat.id)}
              onMouseEnter={() => onHoverFeature?.(feat.id)}
              onMouseLeave={() => onHoverFeature?.(null)}
              className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                isVisible
                  ? 'bg-[#0E1B20] border-[rgba(80,180,200,0.18)] hover:border-[#16C7A3]/50 shadow-sm'
                  : 'bg-[#071219]/60 border-white/5 opacity-40 hover:opacity-60'
              } ${isHovered ? 'ring-1 ring-[#16C7A3]/50' : ''}`}
              style={{
                borderLeftWidth: '3.5px',
                borderLeftColor: persistentColor,
              }}
            >
              {/* Row 1: Dot Indicator + Name + Center Arrow */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: persistentColor }}
                  />
                  <span className="text-[11.5px] font-bold text-[#F4F7F7] font-mono truncate">
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
                  <ChevronRight size={12} />
                </button>
              </div>

              {/* Row 2: Flow and Station counts + Health */}
              <div className="text-[9.5px] text-[#9FB0B4] font-mono mt-1 flex items-center justify-between">
                <span>{flowText} · {stationText}</span>
                <span className="text-[9px] font-bold text-[#16C7A3] bg-[#16C7A3]/10 px-1 py-0.2 rounded border border-[#16C7A3]/20">
                  Health {feat.health || 95}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FeatureLegend;
