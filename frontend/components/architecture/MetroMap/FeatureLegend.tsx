import React from 'react';
import { Layers, Activity, Shield, ChevronRight } from 'lucide-react';
import { FeatureCluster } from './types';

interface FeatureLegendProps {
  features: FeatureCluster[];
  selectedFeatures: string[];
  onToggleFeature: (featureId: string) => void;
  onSelectAll: () => void;
  hoveredFeature?: string | null;
  onHoverFeature?: (featureId: string | null) => void;
}

export function FeatureLegend({
  features,
  selectedFeatures,
  onToggleFeature,
  onSelectAll,
  hoveredFeature,
  onHoverFeature
}: FeatureLegendProps) {
  const isAllSelected = selectedFeatures.length === 0;

  return (
    <div className="flex flex-col h-full text-left select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 uppercase tracking-wider">
            <Layers size={13} className="text-primary" />
            <span>Feature Lines</span>
          </div>
          <button
            onClick={onSelectAll}
            className={`px-2 py-0.5 rounded text-[9.5px] font-bold transition ${
              isAllSelected
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All Lines
          </button>
        </div>
        <p className="text-[10px] text-zinc-500 leading-normal">
          Toggle features to filter subway tracks
        </p>
      </div>

      {/* Feature Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {features.map((feat) => {
          const isSelected = selectedFeatures.includes(feat.id);
          const isHovered = hoveredFeature === feat.id;

          return (
            <div
              key={feat.id}
              onClick={() => onToggleFeature(feat.id)}
              onMouseEnter={() => onHoverFeature?.(feat.id)}
              onMouseLeave={() => onHoverFeature?.(null)}
              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected || isAllSelected
                  ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-600'
                  : 'bg-zinc-950/40 border-zinc-900/80 opacity-40 hover:opacity-70'
              } ${isHovered ? 'ring-1 ring-primary/40 border-primary/50' : ''}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 ring-2 ring-zinc-950"
                    style={{ backgroundColor: feat.color }}
                  />
                  <span className="text-xs font-bold text-zinc-100 truncate">
                    {feat.name}
                  </span>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isSelected || isAllSelected ? feat.color : '#52525b'
                  }}
                />
              </div>

              {/* Metrics */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                <span className="font-mono">{feat.files?.length || 0} stations</span>
                {feat.health !== undefined && (
                  <span className="flex items-center gap-1 font-mono font-bold text-zinc-300">
                    <Activity size={10} className="text-emerald-400" />
                    {feat.health}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
