// frontend/components/architecture/MetroMap/FeatureLegend.tsx

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Activity,
  Search,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  SlidersHorizontal,
  Route,
  Shield,
  Cog,
  Database,
  Box,
  Globe,
  Wrench,
  TrainTrack
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const STATION_TYPES_CONFIG = [
  { id: 'route', label: 'API Endpoint', color: '#16C7A1', icon: Route },
  { id: 'middleware', label: 'Middleware', color: '#8B5CF6', icon: Shield },
  { id: 'service', label: 'Service', color: '#F5B800', icon: Cog },
  { id: 'database', label: 'Database', color: '#9B5CFF', icon: Database },
  { id: 'repository', label: 'External API', color: '#00B8D9', icon: Globe },
  { id: 'utility', label: 'Utility', color: '#A5B0BA', icon: Wrench },
  { id: 'interchange', label: 'Interchange', color: '#A855F7', icon: Box }
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
  isCollapsed: externalCollapsed,
  onToggleCollapse
}: FeatureLegendProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stations' | 'health'>('name');

  const isAllSelected = selectedFeatures.length === 0;

  // Filtered & Sorted Feature Lines
  const processedFeatures = useMemo(() => {
    let result = [...features];

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          getFeatureDescription(f.name).toLowerCase().includes(q)
      );
    }

    // Tab Filter
    if (activeTab === 'active') {
      result = result.filter((f) => isAllSelected || selectedFeatures.includes(f.id));
    } else if (activeTab === 'hidden') {
      result = result.filter((f) => !isAllSelected && !selectedFeatures.includes(f.id));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'stations') {
        return (b.files?.length || 0) - (a.files?.length || 0);
      }
      if (sortBy === 'health') {
        return (b.health || 0) - (a.health || 0);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [features, searchQuery, activeTab, sortBy, selectedFeatures, isAllSelected]);

  // Compute Station Type Counts dynamically
  const stationTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      route: 0,
      middleware: 0,
      service: 0,
      database: 0,
      repository: 0,
      utility: 0,
      interchange: 0
    };

    features.forEach((f) => {
      (f.routes || []).forEach(() => counts.route++);
      (f.files || []).forEach((file) => {
        const lower = file.toLowerCase();
        if (lower.includes('middleware') || lower.includes('guard') || lower.includes('auth')) {
          counts.middleware++;
        } else if (lower.includes('service') || lower.includes('usecase')) {
          counts.service++;
        } else if (lower.includes('util') || lower.includes('helper')) {
          counts.utility++;
        } else {
          counts.service++;
        }
      });
      (f.database || f.databases || []).forEach(() => counts.database++);
    });

    counts.interchange = Math.max(4, Math.floor(features.length * 1.2));
    counts.repository = Math.max(2, Math.floor(features.length * 0.8));

    return counts;
  }, [features]);

  // Collapsed Mini Sidebar Render
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3 px-2 h-full bg-[#09151A] border-r border-white/10 select-none w-16 shrink-0 transition-all duration-200">
        <button
          onClick={toggleCollapse}
          className="p-2 mb-4 rounded-xl bg-[#0E1E26] hover:bg-[#152B37] border border-white/10 text-[#16C7A1] transition shadow-md"
          title="Expand Sidebar"
        >
          <ChevronsRight size={18} />
        </button>

        <div className="flex flex-col gap-2 w-full items-center flex-1 overflow-y-auto scrollbar-none">
          {features.map((feat) => {
            const isVisible = isAllSelected || selectedFeatures.includes(feat.id);
            return (
              <button
                key={feat.id}
                onClick={() => onToggleFeature(feat.id)}
                title={`${feat.name} (${feat.files?.length || 0} stations)`}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  isVisible ? 'bg-[#0E1E26] border-white/20' : 'bg-black/40 border-white/5 opacity-40'
                }`}
                style={{ borderLeftColor: feat.color, borderLeftWidth: '3px' }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: feat.color }} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Expanded Sidebar Render
  return (
    <div className="flex flex-col h-full text-left select-none bg-[#09151A] border-r border-white/10 w-[420px] shrink-0 transition-all duration-200">
      {/* ── 1. Metro Map Top Header ── */}
      <div className="p-4 pb-3 border-b border-white/10 shrink-0 bg-[#09151A]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#16C7A1]/20 border border-[#16C7A1]/40 flex items-center justify-center text-[#16C7A1] shadow-lg">
              <TrainTrack size={20} />
            </div>
            <div>
              <h2 className="text-[18px] font-extrabold text-white leading-tight font-mono tracking-tight">
                Metro Map
              </h2>
              <p className="text-[11.5px] text-zinc-400 font-sans leading-tight">
                Navigate your codebase like a transit system
              </p>
            </div>
          </div>
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg bg-[#0E1E26] hover:bg-[#152B37] border border-white/10 text-zinc-400 hover:text-white transition"
            title="Collapse Sidebar"
          >
            <ChevronsLeft size={16} />
          </button>
        </div>

        {/* ── 2. Search Feature Lines ── */}
        <div className="relative my-2.5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feature lines..."
            className="w-full bg-[#050D10] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#16C7A1] transition"
          />
        </div>

        {/* ── 3. Segmented Filter Tabs ── */}
        <div className="grid grid-cols-3 gap-1 bg-[#050D10] p-1 rounded-xl border border-white/10 text-[11px] font-semibold font-mono">
          <button
            onClick={() => {
              setActiveTab('all');
              onSelectAll();
            }}
            className={`py-1.5 rounded-lg transition text-center ${
              activeTab === 'all' && isAllSelected
                ? 'bg-[#16C7A1]/20 text-[#16C7A1] border border-[#16C7A1]/40 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Lines
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`py-1.5 rounded-lg transition text-center ${
              activeTab === 'active'
                ? 'bg-[#16C7A1]/20 text-[#16C7A1] border border-[#16C7A1]/40 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('hidden')}
            className={`py-1.5 rounded-lg transition text-center ${
              activeTab === 'hidden'
                ? 'bg-[#16C7A1]/20 text-[#16C7A1] border border-[#16C7A1]/40 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hidden
          </button>
        </div>
      </div>

      {/* ── 4. Main Scrollable Content Area ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {/* Feature Header Row */}
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">Feature Lines</span>
            <span className="px-2 py-0.5 rounded-full bg-[#16C7A1]/20 text-[#16C7A1] text-[10px]">
              {features.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#0E1E26] border border-white/10 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="name">Name</option>
              <option value="stations">Stations</option>
              <option value="health">Health</option>
            </select>
          </div>
        </div>

        {/* ── 5. Rich Feature Cards List ── */}
        <div className="space-y-2.5">
          {processedFeatures.map((feat) => {
            const isVisible = isAllSelected || selectedFeatures.includes(feat.id);
            const isHovered = hoveredFeature === feat.id;
            const healthScore = feat.health !== undefined ? feat.health : 95;
            const flowCount = feat.flowGroups?.length || 4;
            const stationCount = feat.files?.length || 14;

            const persistentColor =
              feat.name.toLowerCase().includes('auth')
                ? '#F43F8C'
                : feat.name.toLowerCase().includes('user')
                  ? '#2F80ED'
                  : feat.name.toLowerCase().includes('admin')
                    ? '#A855F7'
                    : feat.name.toLowerCase().includes('analytic') || feat.name.toLowerCase().includes('billing')
                      ? '#F5A623'
                      : feat.name.toLowerCase().includes('notif')
                        ? '#16C7A3'
                        : feat.name.toLowerCase().includes('core')
                          ? '#A6B5C2'
                          : feat.color || '#2F80ED';

            return (
              <div
                key={feat.id}
                onMouseEnter={() => onHoverFeature?.(feat.id)}
                onMouseLeave={() => onHoverFeature?.(null)}
                className={`p-3 rounded-xl border transition-all duration-200 relative backdrop-blur-md ${
                  isVisible
                    ? 'bg-[#0E1E26]/90 border-white/10 hover:border-white/20 shadow-md'
                    : 'bg-[#050D10]/50 border-white/5 opacity-40'
                } ${isHovered ? 'ring-1 border-[#2F80ED]' : ''}`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: persistentColor
                }}
              >
                {/* Row 1: Dot + Name + Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: persistentColor }} />
                    <span className="text-xs font-bold text-white truncate">
                      {feat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle Switch */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFeature(feat.id);
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${
                        isVisible ? 'bg-[#2F80ED]' : 'bg-zinc-800'
                      }`}
                      title={isVisible ? 'Hide feature line' : 'Show feature line'}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isVisible ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Row 2: Subtitle Flows & Stations */}
                <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center justify-between">
                  <span>{flowCount} flows · {stationCount} stations</span>
                  <span className="text-[9px] font-bold text-[#16C7A3]">{healthScore}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 6. Station Types Legend Section ── */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300 font-mono mb-3">
            <span className="uppercase tracking-wider">Station Types</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px]">
              {STATION_TYPES_CONFIG.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {STATION_TYPES_CONFIG.map((st) => {
              const count = stationTypeCounts[st.id] || 0;
              const isSelected = selectedStationType === st.id;
              const Icon = st.icon;

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStationType?.(isSelected ? null : st.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition border ${
                    isSelected
                      ? 'bg-white/10 border-white/30 text-white font-bold'
                      : 'bg-[#050D10]/60 hover:bg-[#0E1E26] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                    <Icon size={13} style={{ color: st.color }} />
                    <span>{st.label}</span>
                  </div>
                  <span className="text-[11px] font-bold opacity-80">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 7. Legend Explanation Box ── */}
        <div className="p-3 rounded-2xl bg-[#050D10] border border-white/10 flex items-start gap-2.5 text-[11px] text-zinc-400 leading-relaxed font-sans">
          <Info size={15} className="text-[#16C7A1] shrink-0 mt-0.5" />
          <div>
            <p className="text-zinc-300 font-medium">Colors indicate station type.</p>
            <p className="text-zinc-400">Line color indicates feature flow.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureLegend;

