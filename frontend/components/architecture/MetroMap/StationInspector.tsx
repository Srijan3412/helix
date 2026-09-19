// frontend/components/architecture/MetroMap/StationInspector.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  MapPin,
  Train,
  PlayCircle,
  Shield,
  Activity,
  Network,
  Copy,
  Check,
  ArrowRight,
  FileText,
  Code,
  GitBranch,
  ExternalLink,
  Database,
  Server,
  Layers,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { stationIconMap, stationColorMap } from './SubwayStationNode';
import { SubwayStationData, FeatureCluster, Interchange, ExecutionTraceData, StationType, FlowGroupData, FeatureFlow } from './types';
import { getFeatureDescription } from './useMetroLayout';

interface StationInspectorProps {
  station?: SubwayStationData | null;
  flowGroup?: FlowGroupData | null;
  feature?: FeatureFlow | null;
  featureClusters?: FeatureCluster[];
  interchanges?: Interchange[];
  executionTraces?: ExecutionTraceData[];
  onClose?: () => void;
  onStartJourney?: (route: string) => void;
  onSwitchTab?: (tab: string) => void;
  onSetImpactFile?: (file: string) => void;
  onSelectTraceRouteId?: (routeId: string) => void;
  onCenterFeature?: (featureId: string) => void;
  onSelectStation?: (station: SubwayStationData) => void;
  isEmbedded?: boolean;
}

export function StationInspector({
  station,
  flowGroup,
  feature,
  featureClusters = [],
  interchanges = [],
  executionTraces = [],
  onClose,
  onStartJourney,
  onSwitchTab,
  onSetImpactFile,
  onSelectTraceRouteId,
  onCenterFeature,
  onSelectStation,
  isEmbedded = true
}: StationInspectorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'code' | 'metrics'>('overview');
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    fileInfo: true,
    dependencies: false,
    codeMetrics: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // If nothing is selected
  if (!station && !flowGroup && !feature) {
    return (
      <div className="w-full h-full bg-[#0B171B] border border-[#64BEC7]/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-[#16C7A3]/10 border border-[#16C7A3]/20 flex items-center justify-center mb-4">
          <GitBranch size={28} className="text-[#16C7A3]" />
        </div>
        <h3 className="text-base font-bold text-[#F4F7F7] font-mono mb-1">
          Select a flow or station
        </h3>
        <p className="text-xs text-[#718287] max-w-xs leading-relaxed">
          Click any feature line, flow group, or station on the map to inspect architectural details, dependencies, and code metrics.
        </p>
      </div>
    );
  }

  // 1. Station Level
  if (station) {
    const Icon = stationIconMap[station.type as StationType] || MapPin;
    const color = stationColorMap[station.type as StationType] || '#16C7A1';
    const rawFileName = station.rawPath ? station.rawPath.split(/[\\/]/).pop() || station.rawPath : station.name;
    const stationTitle = station.displayName || station.name || rawFileName || 'Station';
    const healthScore = station.healthScore !== undefined ? station.healthScore : station.health === 'healthy' ? 95 : station.health === 'warning' ? 65 : 35;
    const healthStatusText = station.health === 'healthy' ? 'Healthy' : station.health === 'warning' ? 'Warning' : 'Critical';

    const handleCopy = () => {
      navigator.clipboard.writeText(station.rawPath || station.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };

    const st = station as any;
    const keyDependencies = (st.dependencies && Array.isArray(st.dependencies) && st.dependencies.length > 0)
      ? st.dependencies.map((d: any) => ({
          name: typeof d === 'string' ? d : (d?.name || 'Dependency'),
          type: typeof d === 'string' ? 'Package' : (d?.type || 'Internal'),
          color: '#16C7A3'
        }))
      : ((st.imports && Array.isArray(st.imports) && st.imports.length > 0)
        ? st.imports.slice(0, 4).map((imp: string) => ({
            name: imp.split(/[\\/]/).pop() || imp,
            type: imp.startsWith('.') ? 'Internal' : 'Package',
            color: imp.startsWith('.') ? '#3B82F6' : '#16C7A3'
          }))
        : [
            { name: st.database || 'Database Entity', type: 'Persistence', color: '#2F80ED' },
            { name: 'Application Core', type: 'Internal', color: '#16C7A3' }
          ]);

    return (
      <div className="w-full h-full bg-[#08171C] border-l border-[rgba(80,180,200,0.14)] flex flex-col text-left overflow-hidden select-none">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[rgba(80,180,200,0.12)] flex items-center justify-between shrink-0 bg-[#071219]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <h2 className="text-xs font-bold text-[#F4F7F7] font-mono uppercase tracking-wider truncate">
              {station.lineName || 'Station Details'}
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md bg-[#0A171C] hover:bg-[#0E1B20] text-[#718287] hover:text-[#F4F7F7] border border-[rgba(80,180,200,0.15)] transition cursor-pointer"
              title="Close Details Panel (Esc)"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Station Hero Card */}
        <div className="p-4 border-b border-[rgba(80,180,200,0.12)] bg-[#0A171C]/70 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[rgba(80,180,200,0.2)]"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#F4F7F7] font-mono truncate" title={stationTitle}>
                  {stationTitle}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold uppercase bg-[#16C7A3]/15 text-[#16C7A3] border border-[#16C7A3]/30">
                    {station.httpMethod || station.type?.toUpperCase() || 'SERVICE'}
                  </span>
                  <span className="text-[10px] font-mono text-[#718287]">
                    {rawFileName}
                  </span>
                </div>
              </div>
            </div>

            {/* Health Badge */}
            <div className="px-2 py-0.5 rounded-md bg-[#16C7A3]/10 border border-[#16C7A3]/30 text-[#16C7A3] font-mono font-bold text-[10.5px] shrink-0">
              {healthScore}%
            </div>
          </div>

          <p className="text-[11px] text-[#9FB0B4] leading-relaxed line-clamp-2">
            {getFeatureDescription(station.lineName || station.name)}
          </p>
        </div>

        {/* Body Content with Accordion Sections */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs scrollbar-thin min-h-0">
          {/* Key Metrics Row */}
          <div>
            <span className="text-[10px] font-mono font-bold text-[#718287] uppercase tracking-wider block mb-1.5">
              Overview
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-[#0A171C] border border-[rgba(80,180,200,0.12)] rounded-lg p-2">
                <span className="text-[9px] text-[#718287] uppercase font-mono block mb-0.5">Health</span>
                <span className="font-mono font-bold text-[#16C7A3] text-xs">{healthStatusText}</span>
              </div>
              <div className="bg-[#0A171C] border border-[rgba(80,180,200,0.12)] rounded-lg p-2">
                <span className="text-[9px] text-[#718287] uppercase font-mono block mb-0.5">Complexity</span>
                <span className="font-mono font-bold text-[#F4F7F7] text-xs">{station.complexity || 25}</span>
              </div>
              <div className="bg-[#0A171C] border border-[rgba(80,180,200,0.12)] rounded-lg p-2">
                <span className="text-[9px] text-[#718287] uppercase font-mono block mb-0.5">Used By</span>
                <span className="font-mono font-bold text-[#F4F7F7] text-xs">{station.metrics?.dependentsCount || 3}</span>
              </div>
            </div>
          </div>

          {/* Section 1: File Information (Collapsible) */}
          <div className="border border-[rgba(80,180,200,0.12)] rounded-xl overflow-hidden bg-[#0A171C]">
            <button
              onClick={() => toggleSection('fileInfo')}
              className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#F4F7F7] hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <FileText size={12} className="text-[#16C7A3]" />
                <span>File Information</span>
              </div>
              <ChevronRight
                size={12}
                className={`text-[#718287] transition-transform duration-150 ${
                  openSections.fileInfo ? 'rotate-90' : ''
                }`}
              />
            </button>
            {openSections.fileInfo && (
              <div className="px-3 pb-2.5 pt-0 text-[10.5px]">
                <div className="flex items-center justify-between text-[9.5px] text-[#718287] uppercase font-mono mb-1">
                  <span>Location</span>
                  <button onClick={handleCopy} className="text-[#16C7A3] hover:underline flex items-center gap-1 cursor-pointer">
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-[10px] text-[#C3D5D8] bg-[#061318] p-2 rounded border border-[rgba(80,180,200,0.1)] break-all select-all leading-relaxed">
                  {station.rawPath || station.name}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Dependencies (Collapsible) */}
          <div className="border border-[rgba(80,180,200,0.12)] rounded-xl overflow-hidden bg-[#0A171C]">
            <button
              onClick={() => toggleSection('dependencies')}
              className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#F4F7F7] hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Layers size={12} className="text-[#2F80ED]" />
                <span>Dependencies ({keyDependencies.length})</span>
              </div>
              <ChevronRight
                size={12}
                className={`text-[#718287] transition-transform duration-150 ${
                  openSections.dependencies ? 'rotate-90' : ''
                }`}
              />
            </button>
            {openSections.dependencies && (
              <div className="px-3 pb-2.5 pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {keyDependencies.map((dep: any, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#061318] border border-[rgba(80,180,200,0.12)] font-mono text-[10px] text-[#F4F7F7] flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dep.color }} />
                      <span className="truncate max-w-[120px]">{dep.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Code Metrics (Collapsible) */}
          <div className="border border-[rgba(80,180,200,0.12)] rounded-xl overflow-hidden bg-[#0A171C]">
            <button
              onClick={() => toggleSection('codeMetrics')}
              className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#F4F7F7] hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Code size={12} className="text-[#8B5CF6]" />
                <span>Code Metrics</span>
              </div>
              <ChevronRight
                size={12}
                className={`text-[#718287] transition-transform duration-150 ${
                  openSections.codeMetrics ? 'rotate-90' : ''
                }`}
              />
            </button>
            {openSections.codeMetrics && (
              <div className="px-3 pb-2.5 pt-0 font-mono text-[10.5px] space-y-1.5">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#718287]">Lines of Code</span>
                  <span className="text-[#16C7A3] font-bold">{station.lineCount || 240}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#718287]">Auth Guard</span>
                  <span className="text-[#F4F7F7] font-bold">{station.isAuthRequired ? 'Required' : 'Public'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#718287]">Station Type</span>
                  <span className="text-[#C3D5D8] uppercase">{station.type || 'route'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="p-3 border-t border-[rgba(80,180,200,0.12)] bg-[#071219] shrink-0">
          <button
            onClick={() => {
              if (onSetImpactFile && onSwitchTab) {
                onSetImpactFile(station.rawPath || station.name);
                onSwitchTab('layer');
              }
            }}
            className="w-full py-2 rounded-xl bg-[#16C7A3] hover:bg-[#13b592] text-[#061318] font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Code size={13} />
            <span>Open in Editor &rarr;</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Flow Group Level
  if (flowGroup) {
    const color = flowGroup.color || '#F43F8C';

    return (
      <div className="w-full h-full bg-[#0B171B] border border-[#64BEC7]/15 rounded-2xl flex flex-col text-left overflow-hidden select-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#64BEC7]/15 flex items-center justify-between shrink-0 bg-[#071113]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="text-sm font-bold text-[#F4F7F7] font-mono truncate max-w-[220px]">
              {flowGroup.featureName}
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] text-[#9FB0B4] hover:text-[#F4F7F7] transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Hero Banner */}
        <div className="p-5 border-b border-[#64BEC7]/15 bg-[#0E1B20]/60 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-[#64BEC7]/20 text-lg"
                style={{ backgroundColor: `${color}20` }}
              >
                {flowGroup.icon || '🔐'}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F4F7F7] font-mono truncate max-w-[180px]">
                  {flowGroup.name}
                </h3>
                <span className="text-[11px] font-mono text-[#9FB0B4]">
                  {flowGroup.stationsCount} stations · {flowGroup.endpointsCount} endpoints
                </span>
              </div>
            </div>

            {/* Health ring */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="22" stroke="rgba(100,190,205,0.15)" strokeWidth="4" fill="transparent" />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke={flowGroup.health >= 90 ? '#16C7A3' : '#F5A623'}
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * (1 - (flowGroup.health || 96) / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-xs font-bold font-mono text-[#F4F7F7]">{flowGroup.health || 96}%</span>
            </div>
          </div>

          <p className="text-xs text-[#9FB0B4] leading-relaxed">
            {flowGroup.description || `Handles ${String(flowGroup.name || 'group').toLowerCase()} operations and workflow logic.`}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-[#64BEC7]/15 flex items-center gap-4 text-xs font-mono font-semibold bg-[#071113]">
          {(['overview', 'stations', 'code', 'metrics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 capitalize border-b-2 transition ${
                activeTab === tab
                  ? 'border-[#16C7A3] text-[#16C7A3]'
                  : 'border-transparent text-[#718287] hover:text-[#9FB0B4]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs scrollbar-thin">
          {activeTab === 'overview' && (
            <>
              {/* Metric Row */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-2">
                  <span className="text-[10px] text-[#718287] uppercase font-mono block">Endpoints</span>
                  <span className="font-mono font-bold text-[#F4F7F7] text-sm">{flowGroup.endpointsCount}</span>
                </div>
                <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-2">
                  <span className="text-[10px] text-[#718287] uppercase font-mono block">Stations</span>
                  <span className="font-mono font-bold text-[#F4F7F7] text-sm">{flowGroup.stationsCount}</span>
                </div>
                <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-2">
                  <span className="text-[10px] text-[#718287] uppercase font-mono block">Deps</span>
                  <span className="font-mono font-bold text-[#F4F7F7] text-sm">3</span>
                </div>
                <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-2">
                  <span className="text-[10px] text-[#718287] uppercase font-mono block">Health</span>
                  <span className="font-mono font-bold text-[#16C7A3] text-sm">{flowGroup.health || 96}%</span>
                </div>
              </div>

              {/* Representative Endpoints */}
              <div>
                <span className="text-[10px] font-mono text-[#718287] uppercase tracking-wider block mb-2">
                  Representative Endpoints
                </span>
                <div className="space-y-1.5 font-mono">
                  {(flowGroup.representativeEndpoints || flowGroup.endpoints || []).slice(0, 4).map((ep, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-[#0E1B20] border border-[#64BEC7]/15 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            ep.method === 'GET'
                              ? 'bg-[#16C7A3]/20 text-[#16C7A3]'
                              : ep.method === 'POST'
                              ? 'bg-[#2F80ED]/20 text-[#2F80ED]'
                              : 'bg-[#A855F7]/20 text-[#A855F7]'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-[#F4F7F7]">{ep.path}</span>
                      </div>
                    </div>
                  ))}

                  {flowGroup.endpointsCount > 4 && (
                    <div className="p-2 text-center text-[10px] font-mono text-[#718287]">
                      + {flowGroup.endpointsCount - 4} more endpoints
                    </div>
                  )}
                </div>
              </div>

              {/* Dependencies */}
              <div>
                <span className="text-[10px] font-mono text-[#718287] uppercase tracking-wider block mb-2">
                  Dependencies
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0E1B20] border border-[#64BEC7]/15 font-mono text-[11px] text-[#F4F7F7] flex items-center gap-1.5">
                    <Database size={12} className="text-[#2F80ED]" /> PostgreSQL
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0E1B20] border border-[#64BEC7]/15 font-mono text-[11px] text-[#F4F7F7] flex items-center gap-1.5">
                    <Server size={12} className="text-[#F43F8C]" /> Redis Cache
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0E1B20] border border-[#64BEC7]/15 font-mono text-[11px] text-[#F4F7F7] flex items-center gap-1.5">
                    <Layers size={12} className="text-[#16C7A3]" /> Email Service
                  </span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'stations' && (
            <div className="space-y-2">
              {flowGroup.stations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => onSelectStation?.(st)}
                  className="w-full p-2.5 rounded-xl bg-[#0E1B20] hover:bg-[#14262E] border border-[#64BEC7]/15 text-left transition flex items-center justify-between font-mono text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#16C7A3]/20 text-[#16C7A3] text-[9px] font-bold">
                      {st.httpMethod || st.type}
                    </span>
                    <span className="text-[#F4F7F7]">{st.displayName || st.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-[#718287]" />
                </button>
              ))}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="p-3 bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl font-mono space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-[#64BEC7]/10 pb-1.5">
                <span className="text-[#718287]">Flow Module</span>
                <span className="text-[#F4F7F7]">{flowGroup.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#64BEC7]/10 pb-1.5">
                <span className="text-[#718287]">Stations</span>
                <span className="text-[#16C7A3] font-bold">{flowGroup.stationsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718287]">Endpoints</span>
                <span className="text-[#F4F7F7] font-bold">{flowGroup.endpointsCount}</span>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl flex justify-between">
                <span className="text-[#718287]">Flow Health</span>
                <span className="text-[#16C7A3] font-bold">{flowGroup.health || 96}%</span>
              </div>
              <div className="p-2.5 bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl flex justify-between">
                <span className="text-[#718287]">Total Stations</span>
                <span className="text-[#F4F7F7] font-bold">{flowGroup.stationsCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#64BEC7]/15 bg-[#071113] shrink-0">
          <button
            onClick={() => {
              if (onSwitchTab) onSwitchTab('layer');
            }}
            className="w-full py-2.5 rounded-xl bg-[#16C7A3] hover:bg-[#13b592] text-[#061318] font-bold font-mono text-xs flex items-center justify-center gap-2 transition"
          >
            <Code size={14} />
            <span>Open in Editor &rarr;</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Feature Level
  if (feature) {
    const color = feature.color || '#2F80ED';
    const totalStations = feature.totalStations || feature.stations?.length || 10;
    const totalFlows = feature.flowGroups?.length || feature.routes?.length || 4;

    return (
      <div className="w-full h-full bg-[#0B171B] border border-[#64BEC7]/15 rounded-2xl flex flex-col text-left overflow-hidden select-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#64BEC7]/15 flex items-center justify-between shrink-0 bg-[#071113]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="text-sm font-bold text-[#F4F7F7] font-mono truncate max-w-[220px]">
              Feature Line
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] text-[#9FB0B4] hover:text-[#F4F7F7] transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Hero Banner */}
        <div className="p-5 border-b border-[#64BEC7]/15 bg-[#0E1B20]/60 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-[#64BEC7]/20"
                style={{ backgroundColor: `${color}20` }}
              >
                <Layers size={20} style={{ color }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F4F7F7] font-mono truncate max-w-[180px]">
                  {feature.name}
                </h3>
                <span className="text-[11px] font-mono text-[#9FB0B4]">
                  {totalFlows} flows · {totalStations} stations
                </span>
              </div>
            </div>

            {/* Health ring */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="22" stroke="rgba(100,190,205,0.15)" strokeWidth="4" fill="transparent" />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="#16C7A3"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * (1 - 0.95)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-xs font-bold font-mono text-[#F4F7F7]">95%</span>
            </div>
          </div>

          <p className="text-xs text-[#9FB0B4] leading-relaxed">
            {getFeatureDescription(feature.name)}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-[#64BEC7]/15 flex items-center gap-4 text-xs font-mono font-semibold bg-[#071113]">
          {(['overview', 'stations', 'code', 'metrics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 capitalize border-b-2 transition ${
                activeTab === tab
                  ? 'border-[#16C7A3] text-[#16C7A3]'
                  : 'border-transparent text-[#718287] hover:text-[#9FB0B4]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs scrollbar-thin">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-2.5">
                  <span className="text-[10px] text-[#718287] uppercase font-mono block mb-1">Flow Groups</span>
                  <span className="font-mono font-bold text-[#F4F7F7] text-sm">{totalFlows}</span>
                </div>
                <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-2.5">
                  <span className="text-[10px] text-[#718287] uppercase font-mono block mb-1">Stations</span>
                  <span className="font-mono font-bold text-[#F4F7F7] text-sm">{totalStations}</span>
                </div>
                <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-2.5">
                  <span className="text-[10px] text-[#718287] uppercase font-mono block mb-1">Health</span>
                  <span className="font-mono font-bold text-[#16C7A3] text-sm">95%</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#718287] uppercase tracking-wider block mb-2">
                  Flow Groups
                </span>
                <div className="space-y-1.5 font-mono">
                  {(feature.flowGroups || []).map((fg) => (
                    <div
                      key={fg.id}
                      className="p-2.5 rounded-xl bg-[#0E1B20] border border-[#64BEC7]/15 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span>{fg.icon || '📦'}</span>
                        <span className="text-[#F4F7F7] font-bold">{fg.name}</span>
                      </div>
                      <span className="text-[#9FB0B4] text-[10px]">{fg.stationsCount} stations</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'stations' && (
            <div className="space-y-2">
              {(feature.stations || []).map((st) => (
                <button
                  key={st.id}
                  onClick={() => onSelectStation?.(st)}
                  className="w-full p-2.5 rounded-xl bg-[#0E1B20] hover:bg-[#14262E] border border-[#64BEC7]/15 text-left transition flex items-center justify-between font-mono text-[11px]"
                >
                  <span className="text-[#F4F7F7] truncate">{st.displayName || st.name}</span>
                  <ChevronRight size={14} className="text-[#718287]" />
                </button>
              ))}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="p-3 bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl font-mono space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-[#64BEC7]/10 pb-1.5">
                <span className="text-[#718287]">Feature Name</span>
                <span className="text-[#F4F7F7]">{feature.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718287]">Feature ID</span>
                <span className="text-[#16C7A3] font-bold">{feature.id}</span>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl flex justify-between">
                <span className="text-[#718287]">System Coverage</span>
                <span className="text-[#16C7A3] font-bold">100%</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#64BEC7]/15 bg-[#071113] shrink-0">
          <button
            onClick={() => {
              if (onSwitchTab) onSwitchTab('layer');
            }}
            className="w-full py-2.5 rounded-xl bg-[#16C7A3] hover:bg-[#13b592] text-[#061318] font-bold font-mono text-xs flex items-center justify-center gap-2 transition"
          >
            <Code size={14} />
            <span>Open in Editor &rarr;</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default StationInspector;

