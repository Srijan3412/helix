// frontend/components/architecture/MetroMap/SubwayStationNode.tsx

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  FileText,
  AlertTriangle,
  Package,
  ChevronRight,
  Route,
  Settings,
  Cog,
  Shield,
  Box,
  Database
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
  route: '#16C7A1',
  controller: '#2F80ED',
  service: '#F5B800',
  middleware: '#8B5CF6',
  repository: '#00B8D9',
  database: '#9B5CFF'
};

const METHOD_BADGES: Record<string, { bg: string; text: string }> = {
  GET: { bg: 'bg-[#16C7A1]/20 text-[#16C7A1] border-[#16C7A1]/40', text: 'text-[#16C7A1]' },
  POST: { bg: 'bg-[#2F80ED]/20 text-[#2F80ED] border-[#2F80ED]/40', text: 'text-[#2F80ED]' },
  DELETE: { bg: 'bg-[#FF3B4E]/20 text-[#FF3B4E] border-[#FF3B4E]/40', text: 'text-[#FF3B4E]' },
  PUT: { bg: 'bg-[#F5B800]/20 text-[#F5B800] border-[#F5B800]/40', text: 'text-[#F5B800]' },
  PATCH: { bg: 'bg-[#FF8A00]/20 text-[#FF8A00] border-[#FF8A00]/40', text: 'text-[#FF8A00]' },
};

const TYPE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  database: { label: 'DB', bg: 'bg-[#9B5CFF]/20 text-[#9B5CFF] border-[#9B5CFF]/40', text: 'text-[#9B5CFF]' },
  service: { label: 'SRV', bg: 'bg-[#F5B800]/20 text-[#F5B800] border-[#F5B800]/40', text: 'text-[#F5B800]' },
  controller: { label: 'CTRL', bg: 'bg-[#2F80ED]/20 text-[#2F80ED] border-[#2F80ED]/40', text: 'text-[#2F80ED]' },
  middleware: { label: 'MID', bg: 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40', text: 'text-[#8B5CF6]' },
  repository: { label: 'REPO', bg: 'bg-[#00B8D9]/20 text-[#00B8D9] border-[#00B8D9]/40', text: 'text-[#00B8D9]' },
  route: { label: 'API', bg: 'bg-[#16C7A1]/20 text-[#16C7A1] border-[#16C7A1]/40', text: 'text-[#16C7A1]' },
};

export interface SubwayStationNodeProps {
  data: SubwayStationData & {
    color?: string;
    lineName?: string;
    isHub?: boolean;
    hubTitle?: string;
    connectedCount?: number;
    onClick?: () => void;
  };
  selected?: boolean;
}

const SubwayStationNodeComponent = ({ data, selected }: SubwayStationNodeProps) => {
  const {
    displayName,
    name,
    label,
    rawPath,
    color = '#2F80ED',
    focused,
    type = 'route',
    isJourneyActive = false,
    httpMethod,
    isAuthRequired,
    stationNumber,
    isAggregated,
    hiddenCount,
    isInterchange,
    isHub,
    hubTitle,
    connectedCount,
    onClick
  } = data as any;

  const handles = (
    <>
      <Handle type="target" position={Position.Left} id="left" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 hover:opacity-100 !border-none" style={{ top: '50%', zIndex: 10 }} />
      <Handle type="source" position={Position.Right} id="right" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 hover:opacity-100 !border-none" style={{ top: '50%', zIndex: 10 }} />
      <Handle type="target" position={Position.Top} id="top" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 hover:opacity-100 !border-none" style={{ left: '50%', zIndex: 10 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 hover:opacity-100 !border-none" style={{ left: '50%', zIndex: 10 }} />
    </>
  );

  // 1. Core Hub Station Render (Central Infrastructure Hub)
  if (isHub) {
    const isSelected = selected || data.selected;
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        onClick={onClick}
        className="relative select-none group cursor-pointer flex flex-col items-center justify-center"
        style={{ width: '135px', height: '65px' }}
      >
        {handles}
        <div
          className={`relative bg-[#071322]/95 backdrop-blur-md rounded-2xl px-3 py-2 border-2 flex items-center gap-2.5 shadow-2xl transition-all ${
            isSelected ? 'border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.4)]' : 'border-[#38BDF8]/70 hover:border-[#38BDF8]'
          }`}
        >
          <div className="relative w-7 h-7 rounded-full border-2 border-[#38BDF8] flex items-center justify-center shrink-0 bg-[#0F2847]">
            <div className="w-3 h-3 rounded-full bg-[#38BDF8] animate-pulse" />
          </div>
          <div className="flex flex-col text-left leading-tight min-w-0">
            <span className="text-[11px] font-extrabold text-white font-mono tracking-wide truncate">
              {hubTitle || name || 'Core Hub'}
            </span>
            <span className="text-[9px] text-[#38BDF8] font-semibold font-mono">
              {connectedCount ? `${connectedCount} lines connected` : 'Core Hub'}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. Interchange Station Render (Multi-line junction ◎)
  if (isInterchange) {
    const isSelected = selected || data.selected || isJourneyActive;
    const mainTitle = displayName || name || label || 'Interchange';
    return (
      <motion.div
        whileHover={{ scale: 1.04 }}
        onClick={onClick}
        className="relative select-none group cursor-pointer flex flex-col items-center"
        style={{ width: '110px' }}
      >
        {handles}
        <div
          className={`relative bg-[#0B1526]/90 backdrop-blur-md rounded-xl p-2 w-[110px] border flex flex-col items-center text-center transition-all ${
            isSelected ? 'border-[#A855F7] ring-2 ring-[#A855F7]/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-[#A855F7]/50 hover:border-[#A855F7]'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-4 h-4 rounded-full border border-[#A855F7] bg-[#A855F7]/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
            </div>
            <span className="text-[9px] font-bold text-[#C084FC] uppercase font-mono tracking-wider">
              {stationNumber || 'INT'}
            </span>
          </div>
          <span className="text-[10.5px] font-bold text-white font-mono truncate w-full" title={mainTitle}>
            {mainTitle}
          </span>
          <span className="text-[8.5px] text-[#A5B0BA] font-sans truncate w-full mt-0.5">
            Interchange Station
          </span>
        </div>
      </motion.div>
    );
  }

  // 3. Aggregated Stations Node
  if (isAggregated) {
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        onClick={onClick}
        className="relative select-none group cursor-pointer flex flex-col items-center"
        style={{ width: '100px' }}
      >
        {handles}
        <div
          className="relative bg-[#0D1728] border border-dashed rounded-lg p-2 text-left w-[100px] h-[50px] flex flex-col justify-between transition-all hover:bg-[#101D2D]"
          style={{ borderColor: color, boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }}
        >
          <div className="flex items-center gap-1">
            <Package size={11} className="text-[#16C7A1]" />
            <span className="text-[10px] font-bold text-[#F7FAFA] truncate">+{hiddenCount || 'More'}</span>
          </div>
          <div className="flex items-center justify-between text-[8.5px] text-[#A5B0BA]">
            <span>Expand</span>
            <ChevronRight size={9} className="text-[#16C7A1]" />
          </div>
        </div>
      </motion.div>
    );
  }

  // 4. Standard Subway Station Compact Node
  const opacity = focused === undefined ? 1 : focused ? 1 : 0.25;
  const isSelected = selected || data.selected || isJourneyActive;

  const methodUpper = httpMethod?.toUpperCase() || (type === 'route' ? 'GET' : null);
  const methodBadge = methodUpper ? METHOD_BADGES[methodUpper] : null;
  const typeBadge = !methodBadge ? (TYPE_BADGES[type] || TYPE_BADGES.route) : null;

  const mainTitle = displayName || name || label || rawPath || 'Station';
  const stationID = stationNumber || 'A1';

  const borderColor = isSelected
    ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/40 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
    : 'border-white/10 hover:border-white/25';

  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -1 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="relative select-none group cursor-pointer flex flex-col items-start"
      style={{ opacity, width: '102px', transition: 'opacity 0.2s ease-in-out' }}
    >
      {handles}

      {/* Station ID Tag sitting clean above or next to station */}
      <div className="flex items-center justify-between w-full px-0.5 mb-1 leading-none">
        <span className="text-[9px] font-extrabold font-mono tracking-wide" style={{ color: color || '#38BDF8' }}>
          {stationID}
        </span>
        {methodBadge ? (
          <span className={`px-1 py-0.5 rounded text-[8px] font-bold border ${methodBadge.bg}`}>
            {methodUpper}
          </span>
        ) : typeBadge ? (
          <span className={`px-1 py-0.5 rounded text-[8px] font-bold border ${typeBadge.bg}`}>
            {typeBadge.label}
          </span>
        ) : null}
      </div>

      {/* Main Compact Station Card (~102px wide x 48px high) */}
      <div
        className={`relative bg-[#0B1526]/95 hover:bg-[#0F1E36] rounded-lg p-2 text-left w-[102px] h-[48px] flex flex-col justify-between border ${borderColor} backdrop-blur-md transition-all duration-200 shadow-md`}
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: color || '#2F80ED'
        }}
      >
        <div className="w-full">
          <span
            className="text-[11px] font-semibold text-[#F7FAFA] truncate font-mono block leading-snug"
            title={mainTitle}
          >
            {mainTitle}
          </span>
        </div>

        {/* Bottom indicator row */}
        <div className="flex items-center justify-between text-[8.5px] text-[#A5B0BA]">
          <span className="truncate max-w-[70px] font-sans text-[8.5px] opacity-80" title={rawPath || name}>
            {(rawPath || name || '').split(/[\\/]/).pop()}
          </span>
          {isAuthRequired ? (
            <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A1]" title="Auth Protected" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5B800]/70" title="Public" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const SubwayStationNode = memo(SubwayStationNodeComponent);
export default SubwayStationNode;

