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

    const keyDependencies = [
      { name: 'PostgreSQL', type: 'Database', color: '#2F80ED' },
      { name: 'Redis', type: 'Cache', color: '#F43F8C' },
      { name: 'Email Service', type: 'External', color: '#16C7A3' }
    ];

    const content = (
      <div className="w-full h-full bg-[#0B171B] border border-[#64BEC7]/15 rounded-2xl flex flex-col text-left overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#64BEC7]/15 flex items-center justify-between shrink-0 bg-[#071113]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="text-sm font-bold text-[#F4F7F7] font-mono truncate max-w-[220px]">
              {station.lineName || 'Feature Station'}
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

        {/* Station Hero Card */}
        <div className="p-5 border-b border-[#64BEC7]/15 bg-[#0E1B20]/60 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-[#64BEC7]/20"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F4F7F7] font-mono truncate max-w-[180px]">
                  {stationTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#16C7A3]/15 text-[#16C7A3] border border-[#16C7A3]/30">
                    {station.httpMethod || station.type || 'GET'}
                  </span>
                  <span className="text-[11px] font-mono text-[#9FB0B4]">
                    {station.stationNumber || 'ST-01'}
                  </span>
                </div>
              </div>
            </div>

            {/* Circular Health Meter */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="22" stroke="rgba(100,190,205,0.15)" strokeWidth="4" fill="transparent" />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke={healthScore >= 90 ? '#16C7A3' : healthScore >= 70 ? '#F5A623' : '#FF3B4E'}
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * (1 - healthScore / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-xs font-bold font-mono text-[#F4F7F7]">{healthScore}%</span>
            </div>
          </div>

          <p className="text-xs text-[#9FB0B4] leading-relaxed line-clamp-2">
            {getFeatureDescription(station.lineName || station.name)}
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
                  <span className="text-[10px] text-[#718287] uppercase font-mono block mb-1">Health</span>
                  <span className="font-mono font-bold text-[#16C7A3]">{healthStatusText}</span>
                </div>
                <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-2.5">
                  <span className="text-[10px] text-[#718287] uppercase font-mono block mb-1">Complexity</span>
                  <span className="font-mono font-bold text-[#F4F7F7]">{station.complexity || 36}</span>
                </div>
                <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-2.5">
                  <span className="text-[10px] text-[#718287] uppercase font-mono block mb-1">Used By</span>
                  <span className="font-mono font-bold text-[#F4F7F7]">{station.metrics?.dependentsCount || 3}</span>
                </div>
              </div>

              {/* File Location */}
              <div className="bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl p-3">
                <div className="flex items-center justify-between text-[10px] text-[#718287] uppercase font-mono mb-1.5">
                  <span>File Location</span>
                  <button onClick={handleCopy} className="text-[#16C7A3] hover:underline flex items-center gap-1">
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-[#F4F7F7] bg-[#061318] p-2 rounded border border-[#64BEC7]/10 break-all select-all">
                  {station.rawPath || station.name}
                </div>
              </div>

              {/* Dependencies */}
              <div>
                <span className="text-[10px] font-mono text-[#718287] uppercase tracking-wider block mb-2">Dependencies</span>
                <div className="flex flex-wrap gap-2">
                  {keyDependencies.map((dep, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#0E1B20] border border-[#64BEC7]/15 font-mono text-[11px] text-[#F4F7F7] flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dep.color }} />
                      {dep.name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'stations' && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#0E1B20] border border-[#64BEC7]/15 flex items-center justify-between">
                <span className="font-mono text-[#F4F7F7] font-bold">{stationTitle}</span>
                <span className="text-[10px] font-mono text-[#16C7A3]">Active Station</span>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="p-3 bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl font-mono space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-[#64BEC7]/10 pb-1.5">
                <span className="text-[#718287]">Source File</span>
                <span className="text-[#F4F7F7] truncate max-w-[160px]">{rawFileName}</span>
              </div>
              <div className="flex justify-between border-b border-[#64BEC7]/10 pb-1.5">
                <span className="text-[#718287]">Lines of Code</span>
                <span className="text-[#16C7A3] font-bold">{station.lineCount || 240}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718287]">Auth Guard</span>
                <span className="text-[#F4F7F7] font-bold">{station.isAuthRequired ? 'Required' : 'Public'}</span>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl flex justify-between">
                <span className="text-[#718287]">Health Score</span>
                <span className="text-[#16C7A3] font-bold">{healthScore}%</span>
              </div>
              <div className="p-2.5 bg-[#0E1B20] border border-[#64BEC7]/15 rounded-xl flex justify-between">
                <span className="text-[#718287]">Complexity Index</span>
                <span className="text-[#F4F7F7] font-bold">{station.complexity || 36}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#64BEC7]/15 bg-[#071113] shrink-0">
          <button
            onClick={() => {
              if (onSetImpactFile && onSwitchTab) {
                onSetImpactFile(station.rawPath || station.name);
                onSwitchTab('layer');
              }
            }}
            className="w-full py-2.5 rounded-xl bg-[#16C7A3] hover:bg-[#13b592] text-[#061318] font-bold font-mono text-xs flex items-center justify-center gap-2 transition"
          >
            <Code size={14} />
            <span>Open in Editor &rarr;</span>
          </button>
        </div>
      </div>
    );

    return content;
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

