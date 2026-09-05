import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  Route,
  Settings,
  Cog,
  Shield,
  Box,
  Database,
  Train
} from 'lucide-react';
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
  data: SubwayStationData;
  selected?: boolean;
}

const SubwayStationNodeComponent = ({ data, selected }: SubwayStationNodeProps) => {
  const Icon = stationIconMap[data.type] || Route;
  const baseColor = stationColorMap[data.type] || '#6B7280';
  const isInterchange = data.isInterchange || (data.features && data.features.length > 1);
  const opacity = data.focused === undefined ? 1 : data.focused ? 1 : 0.15;
  const isSelected = selected || data.selected || data.isJourneyActive;

  return (
    <motion.div
      whileHover={{ scale: 1.06, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="relative select-none group cursor-pointer"
      style={{ opacity, transition: 'opacity 0.2s ease-in-out' }}
    >
      {/* Horizontal Track Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-zinc-900"
      />

      {/* Vertical Interchange Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-purple-400 !border-2 !border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-purple-400 !border-2 !border-zinc-900"
      />

      {/* Main Station Card */}
      <div
        className={`relative px-3 py-2.5 rounded-xl shadow-xl border-2 backdrop-blur-md transition-all duration-300 min-w-[155px] max-w-[195px] ${
          healthClasses[data.health || 'healthy']
        } ${
          isSelected
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-zinc-950 shadow-primary/40 border-primary'
            : 'hover:border-zinc-400'
        }`}
        style={{
          boxShadow: isSelected
            ? `0 0 20px ${data.color}80`
            : '0 4px 12px rgba(0, 0, 0, 0.45)'
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Station Role Icon Badge */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:rotate-6"
            style={{ backgroundColor: baseColor }}
          >
            <Icon size={15} className="text-white drop-shadow-sm" />
          </div>

          {/* Name & Role Label */}
          <div className="min-w-0 flex-1">
            <div
              className="text-[11.5px] font-semibold text-zinc-100 truncate leading-snug"
              title={data.displayName || data.name || data.label}
            >
              {data.displayName || data.name || data.label}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] uppercase tracking-wider font-mono font-medium text-zinc-400">
                {data.type}
              </span>
              {isInterchange && (
                <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 font-bold rounded-full border border-purple-500/30">
                  <Train size={8} className="text-purple-400" />
                  Junction
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feature Dots & Line Name Footer */}
        {data.features && data.features.length > 0 && (
          <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-zinc-800/80">
            <span className="text-[8px] text-zinc-500 font-medium mr-0.5">Line:</span>
            {data.features.map((f, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full ring-1 ring-zinc-900 shrink-0"
                style={{ backgroundColor: data.color || '#CBD5E1' }}
                title={f}
              />
            ))}
            <span className="text-[8.5px] text-zinc-400 truncate max-w-[100px] ml-1 font-mono">
              {data.lineName || data.features[0]}
            </span>
          </div>
        )}

        {/* Complexity Score Badge */}
        {data.complexity !== undefined && data.complexity > 0 && (
          <div className="absolute -top-2 -right-2 bg-zinc-800 border border-zinc-700 text-zinc-200 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full shadow-md">
            {data.complexity}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const SubwayStationNode = memo(SubwayStationNodeComponent);
