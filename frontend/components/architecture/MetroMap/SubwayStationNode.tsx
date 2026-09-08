// frontend/components/architecture/MetroMap/SubwayStationNode.tsx

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  FileText,
  Lock,
  AlertTriangle,
  CheckCircle2,
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

const METHOD_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'bg-[#16C7A1]', text: 'text-[#06100C]', border: 'border-[#16C7A1]' },
  POST: { bg: 'bg-[#2F80ED]', text: 'text-white', border: 'border-[#2F80ED]' },
  DELETE: { bg: 'bg-[#FF3B4E]', text: 'text-white', border: 'border-[#FF3B4E]' },
  PUT: { bg: 'bg-[#F5B800]', text: 'text-zinc-950', border: 'border-[#F5B800]' },
  PATCH: { bg: 'bg-[#FF8A00]', text: 'text-white', border: 'border-[#FF8A00]' },
};

const TYPE_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  database: { label: 'DB', bg: 'bg-[#9B5CFF]/20', text: 'text-[#9B5CFF]', border: 'border-[#9B5CFF]/40' },
  service: { label: 'SRV', bg: 'bg-[#F5B800]/20', text: 'text-[#F5B800]', border: 'border-[#F5B800]/40' },
  controller: { label: 'CTRL', bg: 'bg-[#2F80ED]/20', text: 'text-[#2F80ED]', border: 'border-[#2F80ED]/40' },
  middleware: { label: 'MID', bg: 'bg-[#8B5CF6]/20', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/40' },
  repository: { label: 'REPO', bg: 'bg-[#00B8D9]/20', text: 'text-[#00B8D9]', border: 'border-[#00B8D9]/40' },
  route: { label: 'API', bg: 'bg-[#16C7A1]/20', text: 'text-[#16C7A1]', border: 'border-[#16C7A1]/40' },
};

export interface SubwayStationNodeProps {
  data: SubwayStationData & {
    color?: string;
    lineName?: string;
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
    rawPath,
    color = '#2F80ED',
    focused,
    type = 'route',
    isJourneyActive = false,
    health = 'healthy',
    healthScore,
    httpMethod,
    isAuthRequired,
    stationNumber,
    isAggregated,
    hiddenCount,
    onClick
  } = data;

  if (isAggregated) {
    return (
      <motion.div
        whileHover={{ scale: 1.03, y: -1 }}
        transition={{ duration: 0.15 }}
        onClick={onClick}
        className="relative select-none group cursor-pointer flex flex-col items-center"
        style={{ width: '142px' }}
      >
        <Handle type="target" position={Position.Left} id="left" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 !border-none" style={{ top: '41px', zIndex: 10 }} />
        <Handle type="source" position={Position.Right} id="right" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 !border-none" style={{ top: '41px', zIndex: 10 }} />
        <Handle type="target" position={Position.Top} id="top" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 !border-none" style={{ left: '50%', zIndex: 10 }} />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 !border-none" style={{ left: '50%', bottom: '0px', zIndex: 10 }} />

        <div
          className="relative bg-[#0D1728] border border-dashed rounded-[9px] p-2 text-left w-[142px] h-[82px] flex flex-col justify-between transition-all hover:bg-[#101D2D]"
          style={{ borderColor: color, boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }}
        >
          <div className="flex items-center gap-1.5">
            <Package size={12} className="text-[#16C7A1]" />
            <span className="text-[11px] font-bold text-[#F7FAFA] truncate">+{hiddenCount || 'More'} Stations</span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#A5B0BA]">
            <span>Click to expand</span>
            <ChevronRight size={10} className="text-[#16C7A1]" />
          </div>
        </div>
      </motion.div>
    );
  }

  const opacity = focused === undefined ? 1 : focused ? 1 : 0.25;
  const isSelected = selected || data.selected || isJourneyActive;

  // Calculate Health Score
  const calculatedPercent = healthScore !== undefined ? healthScore : (health === 'healthy' ? 95 : health === 'warning' ? 65 : 35);

  // Method / Type Badge
  const methodUpper = httpMethod?.toUpperCase() || (type === 'route' ? 'GET' : null);
  const methodBadge = methodUpper ? METHOD_BADGES[methodUpper] : null;
  const typeBadge = !methodBadge ? (TYPE_BADGES[type] || TYPE_BADGES.route) : null;

  // Primary Title
  const mainTitle = displayName || name || label || rawPath || 'Station';
  
  // Source File Extracted
  const sourceFilename = (rawPath || name || label || '').split(/[\\/]/).pop() || 'index.ts';

  // Station Number String
  const stationNumStr = stationNumber ? `Station ${stationNumber}` : 'Station 01';

  // Border Color
  const borderColor = isSelected
    ? 'border-[#60A5FA] ring-2 ring-[#60A5FA]/30'
    : isAuthRequired
      ? 'border-[#1F6FEB]'
      : methodUpper === 'DELETE'
        ? 'border-[#FF3B4E]/40'
        : methodUpper === 'POST'
          ? 'border-[#2F80ED]/40'
          : methodUpper === 'GET'
            ? 'border-[#16C7A1]/30'
            : type === 'database'
              ? 'border-[#9B5CFF]/40'
              : type === 'service'
                ? 'border-[#F5B800]/40'
                : 'border-[#22304A]';

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -1 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="relative select-none group cursor-pointer flex flex-col items-center"
      style={{ opacity, width: '142px', transition: 'opacity 0.2s ease-in-out' }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Left} id="left" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 hover:opacity-100 !border-none" style={{ top: '41px', zIndex: 10 }} />
      <Handle type="source" position={Position.Right} id="right" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 hover:opacity-100 !border-none" style={{ top: '41px', zIndex: 10 }} />
      <Handle type="target" position={Position.Top} id="top" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 hover:opacity-100 !border-none" style={{ left: '50%', zIndex: 10 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-[6px] !h-[6px] !bg-[#8792A0] opacity-60 hover:opacity-100 !border-none" style={{ left: '50%', bottom: '0px', zIndex: 10 }} />

      {/* Main Station Card */}
      <div
        className={`relative bg-[#0D1728] hover:bg-[#101D2D] rounded-[9px] p-2 text-left w-[142px] h-[82px] flex flex-col justify-between border ${borderColor} transition-colors duration-200`}
        style={{
          boxShadow: isSelected ? '0 0 14px rgba(96, 165, 250, 0.35)' : '0 4px 10px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Row 1: Station Number + Type/Method Badge */}
        <div className="flex items-center justify-between gap-1 leading-none">
          <span className="text-[9.5px] uppercase font-mono font-bold text-[#A5B0BA] tracking-wider truncate">
            {stationNumStr}
          </span>
          {methodBadge ? (
            <span className={`h-[18px] px-1.5 rounded-[4px] text-[9.5px] font-bold flex items-center justify-center shrink-0 ${methodBadge.bg} ${methodBadge.text}`}>
              {methodUpper}
            </span>
          ) : typeBadge ? (
            <span className={`h-[18px] px-1.5 rounded-[4px] text-[9px] font-bold border flex items-center justify-center shrink-0 ${typeBadge.bg} ${typeBadge.text} ${typeBadge.border}`}>
              {typeBadge.label}
            </span>
          ) : null}
        </div>

        {/* Row 2: Main Route/File Title */}
        <div className="my-0.5">
          <span 
            className="text-[12px] font-semibold text-[#F7FAFA] truncate font-mono block leading-tight"
            title={mainTitle}
          >
            {mainTitle}
          </span>
        </div>

        {/* Row 3: Source File + Health */}
        <div className="flex items-center justify-between text-[10px] text-[#A5B0BA] gap-1 min-w-0">
          <div className="flex items-center gap-1 truncate min-w-0 flex-1">
            <FileText size={10} className="text-[#8792A0] shrink-0" />
            <span className="truncate font-sans text-[9.5px]" title={sourceFilename}>
              {sourceFilename}
            </span>
          </div>
          <span className="text-[9.5px] font-mono font-bold text-[#16C7A1] shrink-0">
            {calculatedPercent}%
          </span>
        </div>

        {/* Row 4: Auth / Status */}
        <div className="flex items-center justify-between text-[9px] font-semibold pt-0.5 border-t border-white/5">
          {isAuthRequired ? (
            <span className="text-[#16C7A1] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A1]" />
              <span>Protected</span>
            </span>
          ) : (
            <span className="text-[#F5B800] flex items-center gap-1">
              <AlertTriangle size={9} />
              <span>No Auth</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const SubwayStationNode = memo(SubwayStationNodeComponent);
export default SubwayStationNode;
