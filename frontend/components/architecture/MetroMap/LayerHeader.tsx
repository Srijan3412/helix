// frontend/components/architecture/MetroMap/LayerHeader.tsx

import React from 'react';
import { LayerType, LAYER_CONFIG } from './layerDetector';

export interface LayerHeaderProps {
  layer: LayerType;
  stationCount: number;
  color: string;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  isHovered?: boolean;
}

export function LayerHeader({ 
  layer, 
  stationCount, 
  color, 
  className = '',
  onClick,
  isActive = false,
  isHovered = false
}: LayerHeaderProps) {
  const config = LAYER_CONFIG[layer] || LAYER_CONFIG.utility;
  
  if (!config) {
    return null;
  }

  const isHighlighted = isActive || isHovered;

  return (
    <div 
      className={`
        flex items-center gap-3 px-3 py-1.5 rounded-lg border 
        bg-zinc-950/80 select-none transition-all duration-200
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
        ${isHighlighted ? 'shadow-lg scale-[1.02]' : ''}
        ${className}
      `}
      style={{ 
        borderColor: isHighlighted ? color : `${color}60`,
        minWidth: '180px',
        boxShadow: isHighlighted ? `0 0 20px ${color}30` : 'none',
      }}
      onClick={onClick}
    >
      {/* Layer Emoji */}
      <span className="text-sm shrink-0">{config.emoji}</span>
      
      {/* Layer Label */}
      <span className="text-[10px] font-bold text-white uppercase tracking-wide truncate">
        {config.label}
      </span>
      
      {/* Station Count Badge */}
      <span 
        className="text-[8px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-auto"
        style={{ 
          backgroundColor: `${color}30`,
          color: color,
        }}
      >
        {stationCount}
      </span>

      {/* Active Indicator */}
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
      )}
    </div>
  );
}

// ── LayerHeader Group Component ──
export interface LayerHeaderGroupProps {
  layers: Array<{
    layer: LayerType;
    count: number;
    color: string;
  }>;
  activeLayer?: LayerType | null;
  onLayerClick?: (layer: LayerType | null) => void;
  className?: string;
}

export function LayerHeaderGroup({ 
  layers, 
  activeLayer, 
  onLayerClick,
  className = ''
}: LayerHeaderGroupProps) {
  // Sort layers by order
  const sortedLayers = [...layers].sort((a, b) => {
    const orderA = LAYER_CONFIG[a.layer]?.order ?? 99;
    const orderB = LAYER_CONFIG[b.layer]?.order ?? 99;
    return orderA - orderB;
  });

  // Calculate total stations
  const totalStations = sortedLayers.reduce((sum, l) => sum + l.count, 0);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* All Layers Header */}
      <LayerHeader
        layer="api"  // Dummy layer for "All" badge
        stationCount={totalStations}
        color="#8b8b8b"
        className="border-zinc-700/50"
        isActive={!activeLayer}
        onClick={() => onLayerClick?.(null)}
      />

      {/* Individual Layer Headers */}
      {sortedLayers.map(({ layer, count, color }) => (
        <LayerHeader
          key={layer}
          layer={layer}
          stationCount={count}
          color={color}
          isActive={activeLayer === layer}
          onClick={() => onLayerClick?.(layer)}
        />
      ))}
    </div>
  );
}

// ── LayerFilter Component ──
export interface LayerFilterProps {
  layers: Array<{
    layer: LayerType;
    count: number;
    color: string;
  }>;
  activeLayer?: LayerType | null;
  onLayerChange?: (layer: LayerType | null) => void;
  className?: string;
}

export function LayerFilter({ 
  layers, 
  activeLayer, 
  onLayerChange,
  className = ''
}: LayerFilterProps) {
  const sortedLayers = [...layers].sort((a, b) => {
    const orderA = LAYER_CONFIG[a.layer]?.order ?? 99;
    const orderB = LAYER_CONFIG[b.layer]?.order ?? 99;
    return orderA - orderB;
  });

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
        Layer:
      </span>
      
      <button
        className={`px-2 py-0.5 rounded text-[8px] font-bold transition border ${
          !activeLayer 
            ? 'bg-primary/20 text-primary border-primary/30' 
            : 'bg-zinc-800/60 text-zinc-400 border-transparent hover:border-white/10'
        }`}
        onClick={() => onLayerChange?.(null)}
      >
        All
      </button>

      {sortedLayers.map(({ layer, count, color }) => (
        <button
          key={layer}
          className={`px-2 py-0.5 rounded text-[8px] font-bold transition border flex items-center gap-1 ${
            activeLayer === layer
              ? 'bg-zinc-800/80 text-white border-zinc-600'
              : 'bg-zinc-800/30 text-zinc-400 border-transparent hover:border-white/10'
          }`}
          onClick={() => onLayerChange?.(layer)}
          style={{
            borderColor: activeLayer === layer ? color : 'transparent',
          }}
        >
          <span>{LAYER_CONFIG[layer]?.emoji}</span>
          <span>{LAYER_CONFIG[layer]?.label.split(' ')[0]}</span>
          <span className="text-[7px] opacity-60">{count}</span>
        </button>
      ))}
    </div>
  );
}

// ── LayerLegend Component ──
export interface LayerLegendProps {
  layers: Array<{
    layer: LayerType;
    count: number;
    color: string;
  }>;
  className?: string;
}

export function LayerLegend({ layers, className = '' }: LayerLegendProps) {
  const sortedLayers = [...layers].sort((a, b) => {
    const orderA = LAYER_CONFIG[a.layer]?.order ?? 99;
    const orderB = LAYER_CONFIG[b.layer]?.order ?? 99;
    return orderA - orderB;
  });

  return (
    <div className={`flex flex-wrap items-center gap-2 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60 ${className}`}>
      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
        Layers:
      </span>
      
      {sortedLayers.map(({ layer, count, color }) => (
        <div
          key={layer}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950/60 border border-zinc-800/60"
        >
          <span className="text-[10px]">{LAYER_CONFIG[layer]?.emoji}</span>
          <span className="text-[8px] font-medium text-zinc-300">
            {LAYER_CONFIG[layer]?.label}
          </span>
          <span 
            className="text-[7px] font-bold px-1 rounded"
            style={{ 
              backgroundColor: `${color}30`,
              color: color,
            }}
          >
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}
