// frontend/components/architecture/MetroMap/SubwayStationNode.tsx

import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  Package,
  ChevronRight,
  Route,
  Settings,
  Cog,
  Shield,
  Box,
  Database,
  Train
} from 'lucide-react';
import { LayerType, getLayerColor, getLayerEmoji, LAYER_CONFIG } from './layerDetector';
import { SubwayStationData, StationType } from './types';

export const stationIconMap: Record<StationType, typeof Route> = {
  route: Route,
  controller: Settings,
  service: Cog,
  middleware: Shield,
  repository: Box,
  database: Database
};

export const stationColorMap: Record<StationType, string> = {
  route: '#10B981',
  controller: '#3B82F6',
  service: '#F59E0B',
  middleware: '#A855F7',
  repository: '#EF4444',
  database: '#EC4899'
};

const healthClasses = {
  healthy: 'border-emerald-500/50 bg-zinc-900/95 text-emerald-400 shadow-emerald-950/20',
  warning: 'border-amber-500/50 bg-zinc-900/95 text-amber-400 shadow-amber-950/20',
  critical: 'border-red-500/60 bg-zinc-900/95 text-red-400 shadow-red-950/20'
};

export interface SubwayStationNodeProps {
  data: SubwayStationData & {
    stationNumber?: string;
    typeLabel?: string;
    hasHighComplexity?: boolean;
    healthGlowActive?: boolean;
    nextStationName?: string;
    layerLabel?: string;
    layerEmoji?: string;
    onClick?: () => void;
  };
  selected?: boolean;
}

const SubwayStationNodeComponent = ({ data, selected }: SubwayStationNodeProps) => {
  const {
    id,
    displayName,
    name,
    label,
    color = '#3B82F6',
    complexity = 0,
    features = [],
    isInterchange = false,
    focused,
    isJourneyActive = false,
    lineName = '',
    layer = 'utility',
    type = 'service',
    health = 'healthy',
    isAggregated = false,
    hiddenCount = 0,
    onClick
  } = data;

  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  
  // ── Special Aggregated Node Rendering ──
  if (isAggregated) {
    return (
      <motion.div
        whileHover={{ scale: 1.08, y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={onClick}
        className="relative select-none group cursor-pointer flex flex-col items-center"
        style={{ width: '150px' }}
      >
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-zinc-900"
          style={{ top: '32px', zIndex: 10 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-zinc-900"
          style={{ top: '32px', zIndex: 10 }}
        />

        <div
          className="relative bg-zinc-900/95 border-2 border-dashed border-zinc-600 hover:border-primary rounded-xl p-2.5 shadow-xl transition-all duration-300 text-left w-[150px] bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950"
          style={{
            borderColor: color ? `${color}80` : undefined,
            boxShadow: `0 4px 14px ${color}25`
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: `${color}30`, color: color }}
            >
              <Package size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-zinc-100 truncate">
                +{hiddenCount || 'More'} Files
              </div>
              <div className="text-[7.5px] text-zinc-400 flex items-center gap-0.5">
                <span>Click to expand</span>
                <ChevronRight size={8} className="text-primary" />
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[7px] text-zinc-400 font-mono">
            <span>{lineName || 'Track'}</span>
            <span className="text-primary font-bold">EXPAND</span>
          </div>
        </div>
      </motion.div>
    );
  }

  const stationType = (type as StationType) || 'service';
  const Icon = stationIconMap[stationType] || Route;
  const baseColor = stationColorMap[stationType] || '#6B7280';
  const opacity = focused === undefined ? 1 : focused ? 1 : 0.15;
  const isSelected = selected || data.selected || isJourneyActive;
  const layerColor = getLayerColor(layer);
  const layerEmoji = getLayerEmoji(layer);
  const layerLabel = LAYER_CONFIG[layer]?.label || layer;
  const showLayerBadge = Boolean(layer && layer !== 'utility');

  // Health numeric percentage computation
  const healthPercent = health === 'healthy' ? 92 : health === 'warning' ? 58 : 28;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="relative select-none group cursor-pointer flex flex-col items-center"
      style={{ opacity, width: '150px', transition: 'opacity 0.2s ease-in-out' }}
    >
      {/* ── Left / Right Horizontal Track Handles ── */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-zinc-900"
        style={{ top: '38px', zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-zinc-900"
        style={{ top: '38px', zIndex: 10 }}
      />

      {/* ── Top / Bottom Vertical Step / Transfer Handles ── */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-purple-400 !border-2 !border-zinc-900"
        style={{ left: '50%', zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-purple-400 !border-2 !border-zinc-900"
        style={{ left: '50%', bottom: '0px', zIndex: 10 }}
      />

      {/* ── Main Station Card ── */}
      <div
        className={`relative bg-zinc-900/95 border-2 rounded-xl p-2.5 shadow-xl transition-all duration-300 hover:border-primary/50 text-left w-[150px] ${
          healthClasses[typeof health === 'string' && healthClasses[health as keyof typeof healthClasses] ? (health as keyof typeof healthClasses) : 'healthy']
        } ${
          isSelected
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-zinc-950 shadow-primary/40 border-primary'
            : 'hover:border-zinc-400'
        }`}
        style={{
          borderColor: isSelected ? color : undefined,
          boxShadow: isSelected
            ? `0 0 18px ${color}80`
            : '0 4px 10px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* ── 7. LAYER BADGE (Top Right) ── */}
        {showLayerBadge && (
          <div className="absolute top-1 right-1 z-10">
            <span
              className="text-[7px] px-1 py-0.2 rounded font-bold border flex items-center gap-0.5"
              style={{
                backgroundColor: `${layerColor}25`,
                color: layerColor,
                borderColor: `${layerColor}40`
              }}
              title={layerLabel}
            >
              <span>{layerEmoji}</span>
              <span className="text-[6px]">{layer.toUpperCase()}</span>
            </span>
          </div>
        )}

        {/* ── Header: Icon + Station Title ── */}
        <div className="flex items-center gap-2 mt-0.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:rotate-6"
            style={{ backgroundColor: baseColor }}
          >
            <Icon size={13} className="text-white drop-shadow-sm" />
          </div>

          <div className="min-w-0 flex-1 pr-4">
            <div
              className="text-[10.5px] font-semibold text-zinc-100 truncate leading-tight"
              title={displayName || name || label}
            >
              {displayName || name || label}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[7.5px] uppercase tracking-wider font-mono font-medium text-zinc-400">
                {stationType}
              </span>
              {isInterchange && (
                <span className="inline-flex items-center gap-0.5 text-[6.5px] px-1 py-0.2 bg-purple-500/20 text-purple-300 font-bold rounded-full border border-purple-500/30">
                  <Train size={6.5} className="text-purple-400" />
                  Transfer
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── LIVE Route Indicator ── */}
        {stationType === 'route' && (
          <div className="flex items-center justify-between text-[6.5px] text-zinc-400 font-mono mt-1.5 pt-1 border-t border-zinc-800/80">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
            <span className="text-zinc-500">🕐 {localTime}</span>
          </div>
        )}

        {/* ── Health Bar ── */}
        <div className="mt-1.5 pt-1 border-t border-zinc-800/60">
          <div className="flex items-center gap-1">
            <span className="text-[6px] text-zinc-500 font-mono">HEALTH</span>
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${healthPercent}%`,
                  backgroundColor:
                    healthPercent > 70 ? '#34d399' : healthPercent > 40 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
            <span className="text-[6.5px] font-bold font-mono text-zinc-300">{healthPercent}%</span>
          </div>
        </div>

        {/* ── Footer: Line Tag & Layer Tag ── */}
        <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-zinc-800/80">
          <div className="flex items-center gap-1 truncate">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[7.5px] text-zinc-400 truncate max-w-[80px] font-mono">
              {lineName || features[0] || 'Track'}
            </span>
          </div>

          {/* Complexity Badge */}
          {complexity > 0 && (
            <span className="text-[7px] font-mono font-bold px-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0">
              LOC {complexity}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const SubwayStationNode = memo(SubwayStationNodeComponent);
export default SubwayStationNode;
