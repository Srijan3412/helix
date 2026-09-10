// frontend/components/architecture/MetroMap/StationInspector.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  MapPin,
  Train,
  PlayCircle,
  PauseCircle,
  Play,
  Square,
  Network,
  GitBranch,
  Shield,
  Activity,
  Layers,
  Copy,
  Check,
  Zap,
  ArrowRight,
  FileText,
  Code,
  ExternalLink,
  MoreHorizontal,
  Database,
  Cog,
  Globe,
  Wrench
} from 'lucide-react';
import { stationIconMap, stationColorMap } from './SubwayStationNode';
import { SubwayStationData, FeatureCluster, Interchange, ExecutionTraceData, StationType } from './types';
import { getFeatureDescription } from './useMetroLayout';

interface StationInspectorProps {
  station: SubwayStationData | null;
  featureClusters: FeatureCluster[];
  interchanges: Interchange[];
  executionTraces: ExecutionTraceData[];
  onClose: () => void;
  onStartJourney: (route: string) => void;
  onPauseJourney?: () => void;
  onResumeJourney?: () => void;
  onStopJourney?: () => void;
  journeyActive?: boolean;
  journeyPaused?: boolean;
  activeJourneyRoute?: string | null;
  animationStep?: number;
  onSwitchTab?: (tab: string) => void;
  onSetImpactFile?: (file: string) => void;
  onSelectTraceRouteId?: (routeId: string) => void;
  onCenterFeature?: (featureId: string) => void;
}

export function StationInspector({
  station,
  featureClusters,
  interchanges,
  executionTraces,
  onClose,
  onStartJourney,
  onPauseJourney,
  onResumeJourney,
  onStopJourney,
  journeyActive = false,
  journeyPaused = false,
  activeJourneyRoute = null,
  animationStep = 0,
  onSwitchTab,
  onSetImpactFile,
  onSelectTraceRouteId,
  onCenterFeature
}: StationInspectorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dependencies' | 'code' | 'trace'>('overview');
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (!station) return null;

  const Icon = stationIconMap[station.type as StationType] || MapPin;
  const color = stationColorMap[station.type as StationType] || '#16C7A1';

  const rawFileName = station.rawPath ? station.rawPath.split(/[\\/]/).pop() || station.rawPath : station.name;
  const stationTitle = station.displayName || station.name || rawFileName || 'Station';

  // Connected Feature Lines
  const connectedFeatures = (station.features || [station.lineName]).filter(Boolean);
  const matchingClusters = featureClusters.filter((c) =>
    connectedFeatures.some((f) => f === c.name || f === c.id)
  );

  // Execution Traces
  const relatedTraces = executionTraces.filter((t) =>
    t.chain?.some(
      (s) =>
        s.name === station.name ||
        s.file === station.name ||
        s.file === rawFileName ||
        (s.file && station.rawPath && station.rawPath.includes(s.file))
    )
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(station.rawPath || station.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const healthScore = station.healthScore !== undefined ? station.healthScore : station.health === 'healthy' ? 95 : station.health === 'warning' ? 65 : 35;
  const healthStatusText = station.health === 'healthy' ? 'Healthy' : station.health === 'warning' ? 'Warning' : 'Critical';

  // Key Dependencies (Mock & Discovered)
  const keyDependencies = [
    { name: 'database.ts', type: 'Internal', color: '#16C7A1' },
    { name: '@prisma/client', type: 'External', color: '#2F80ED' },
    { name: 'zod', type: 'Utility', color: '#F5B800' },
    { name: 'Redis', type: 'Database', color: '#9B5CFF' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 md:p-6 bg-black/60 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[780px] h-[90vh] bg-[#08141B]/95 border border-[#16C7A1]/30 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col text-left backdrop-blur-2xl overflow-hidden relative"
      >
        {/* Drawer Handle Indicator */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2.5 shrink-0" />

        {/* ── 1. Header ── */}
        <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between shrink-0 bg-[#08141B]">
          <div>
            <h2 className="text-[26px] font-extrabold text-white leading-tight font-mono tracking-tight">
              Station Details
            </h2>
            <p className="text-[14px] text-zinc-400 font-sans mt-0.5">
              Detailed information about this station
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#0D1E27] hover:bg-[#142B38] border border-white/10 text-zinc-400 hover:text-white transition shadow-md"
            title="Close Inspector"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── 2. Station Hero Section ── */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-6 shrink-0 bg-[#0A1A23]/60">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Hero Icon Box */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl border border-white/20"
              style={{ backgroundColor: `${color}25` }}
            >
              <Icon size={32} style={{ color }} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-[26px] font-extrabold text-white font-mono truncate leading-tight" title={stationTitle}>
                {stationTitle}
              </h1>

              {/* Badges Row */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono border uppercase"
                  style={{
                    backgroundColor: `${color}20`,
                    borderColor: `${color}40`,
                    color
                  }}
                >
                  {station.type}
                </span>

                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-white/10 text-zinc-300 border border-white/10">
                  {station.stationNumber || 'U3'}
                </span>

                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-white/10 text-zinc-400 border border-white/10">
                  LINE {station.lineName ? '02' : '01'}
                </span>
              </div>

              {/* Dynamic Station Description */}
              <p className="text-[13px] text-zinc-400 font-sans leading-relaxed mt-2 line-clamp-2">
                {getFeatureDescription(station.lineName || station.name)}
              </p>
            </div>
          </div>

          {/* Large Circular Health Score Ring */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke={healthScore >= 90 ? '#16C7A1' : healthScore >= 70 ? '#F5B800' : '#FF3B4E'}
                  strokeWidth="7"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * (1 - healthScore / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-xl font-extrabold font-mono text-white">
                {healthScore}%
              </span>
            </div>
            <span className="text-xs font-semibold text-zinc-400 font-mono mt-1">Health</span>
          </div>
        </div>

        {/* ── 3. Navigation Tabs ── */}
        <div className="px-6 border-b border-white/10 shrink-0 bg-[#08141B] flex items-center gap-6 text-sm font-semibold font-mono">
          {(['overview', 'dependencies', 'code', 'trace'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 capitalize transition border-b-2 ${
                activeTab === tab
                  ? 'border-[#16C7A1] text-[#16C7A1] font-bold'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── 4. Scrollable Body Content ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Metric Cards (3 Columns) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0D1F28] border border-white/10 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Activity size={14} className="text-[#16C7A1]" />
                    Health Status
                  </div>
                  <div
                    className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold font-mono mt-1 ${
                      station.health === 'healthy'
                        ? 'bg-[#16C7A1]/20 text-[#16C7A1] border border-[#16C7A1]/40'
                        : station.health === 'warning'
                          ? 'bg-[#F5B800]/20 text-[#F5B800] border border-[#F5B800]/40'
                          : 'bg-[#FF3B4E]/20 text-[#FF3B4E] border border-[#FF3B4E]/40'
                    }`}
                  >
                    {healthStatusText}
                  </div>
                </div>

                <div className="bg-[#0D1F28] border border-white/10 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Shield size={14} className="text-[#38BDF8]" />
                    Complexity
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {station.complexity || 36} <span className="text-xs text-zinc-400 font-normal">Score</span>
                  </div>
                </div>

                <div className="bg-[#0D1F28] border border-white/10 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Network size={14} className="text-[#A855F7]" />
                    Used By
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {station.metrics?.dependentsCount || 3} <span className="text-xs text-zinc-400 font-normal">stations</span>
                  </div>
                </div>
              </div>

              {/* File Location Box */}
              <div className="bg-[#0D1F28] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} className="text-[#16C7A1]" />
                    File Location
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[#16C7A1] hover:text-[#16C7A1]/80 transition font-mono text-xs"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-zinc-200 bg-[#050D10] p-3 rounded-xl border border-white/10 break-all select-all">
                  {station.rawPath || station.name}
                </div>
              </div>

              {/* Endpoint & Feature Line (2 Columns) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0D1F28] border border-white/10 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Endpoint
                  </div>
                  <div className="inline-block bg-[#16C7A1]/10 text-[#16C7A1] border border-[#16C7A1]/30 font-mono text-xs px-2.5 py-1 rounded-lg font-bold">
                    {station.httpMethod || 'GET'} {station.displayName || '/api/users'}
                  </div>
                </div>

                <div className="bg-[#0D1F28] border border-white/10 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Feature Line
                  </div>
                  <button
                    onClick={() => onCenterFeature?.(station.featureId || '')}
                    className="flex items-center gap-2 text-white hover:text-[#16C7A1] font-mono text-xs font-bold transition group"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span>{station.lineName || 'User Management'}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                  </button>
                </div>
              </div>

              {/* Connected Feature Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300 font-mono">
                  <span className="uppercase tracking-wider">Connected Feature Lines</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#16C7A1]/20 text-[#16C7A1] text-[10px]">
                    {matchingClusters.length || 1}
                  </span>
                </div>

                <div className="space-y-2">
                  {(matchingClusters.length > 0 ? matchingClusters : [{ id: '1', name: station.lineName || 'User Management', color }]).map((cluster) => (
                    <button
                      key={cluster.id}
                      onClick={() => onCenterFeature?.(cluster.id)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0D1F28] hover:bg-[#122A37] border border-white/10 transition text-xs font-mono group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cluster.color }} />
                        <span className="font-bold text-white">{cluster.name}</span>
                      </div>
                      <ArrowRight size={14} className="text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Dependencies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300 font-mono">
                  <span className="uppercase tracking-wider">Key Dependencies ({keyDependencies.length})</span>
                  <button
                    onClick={() => setActiveTab('dependencies')}
                    className="text-xs text-[#16C7A1] hover:underline font-bold"
                  >
                    View All &gt;
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {keyDependencies.map((dep, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#0D1F28] border border-white/10 flex flex-col justify-between">
                      <span className="text-xs font-mono font-bold text-white truncate" title={dep.name}>
                        {dep.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono mt-1" style={{ color: dep.color }}>
                        {dep.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: DEPENDENCIES */}
          {activeTab === 'dependencies' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0D1F28] border border-white/10">
                <h4 className="text-xs font-mono font-bold uppercase text-zinc-300 mb-2">Incoming Callers</h4>
                <div className="space-y-2">
                  {matchingClusters.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-[#050D10] text-xs font-mono text-zinc-200 border border-white/10 flex items-center justify-between">
                      <span>{c.name} Controller</span>
                      <span className="text-[10px] text-[#16C7A1]">Caller</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D1F28] border border-white/10">
                <h4 className="text-xs font-mono font-bold uppercase text-zinc-300 mb-2">Outgoing Dependencies</h4>
                <div className="space-y-2">
                  {keyDependencies.map((dep, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-[#050D10] text-xs font-mono text-zinc-200 border border-white/10 flex items-center justify-between">
                      <span>{dep.name}</span>
                      <span className="text-[10px]" style={{ color: dep.color }}>{dep.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0D1F28] border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-zinc-400">File Path</span>
                  <span className="text-white truncate max-w-xs">{station.rawPath || station.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-zinc-400">Lines of Code (LOC)</span>
                  <span className="text-[#16C7A1] font-bold">{station.lineCount || 240}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-zinc-400">Complexity Score</span>
                  <span className="text-white font-bold">{station.complexity || 36}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Auth Guard</span>
                  <span className="text-[#16C7A1] font-bold">{station.isAuthRequired ? 'Required' : 'Public'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRACE */}
          {activeTab === 'trace' && (
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-zinc-300 uppercase mb-2">Discovered Execution Chains</div>
              {relatedTraces.map((trace) => (
                <div key={trace.route} className="p-4 rounded-2xl bg-[#0D1F28] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-white">{trace.method} {trace.route}</span>
                    <button
                      onClick={() => onStartJourney(trace.route)}
                      className="px-3 py-1 rounded-lg bg-[#16C7A1]/20 text-[#16C7A1] border border-[#16C7A1]/40 font-bold flex items-center gap-1 text-xs"
                    >
                      <PlayCircle size={12} />
                      Simulate
                    </button>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                    {trace.chain.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className="px-2 py-1 rounded bg-[#050D10] text-[10px] font-mono text-zinc-300 shrink-0 border border-white/10">
                          {step.name}
                        </span>
                        {idx < trace.chain.length - 1 && <ArrowRight size={12} className="text-zinc-500 shrink-0" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 5. Fixed Bottom Action Bar ── */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-[#08141B] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (onSetImpactFile && onSwitchTab) {
                onSetImpactFile(station.rawPath || station.name);
                onSwitchTab('layer');
              }
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#16C7A1] hover:bg-[#13b592] text-[#06100C] font-bold font-mono text-sm shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Code size={16} />
            <span>View Code &rarr;</span>
          </button>

          {relatedTraces.length > 0 && (
            <button
              onClick={() => {
                if (onSelectTraceRouteId && onSwitchTab) {
                  onSelectTraceRouteId(relatedTraces[0].route);
                  onSwitchTab('trace');
                }
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#0D1F28] hover:bg-[#142C39] border border-white/20 text-white font-bold font-mono text-sm flex items-center justify-center gap-2 transition"
            >
              <GitBranch size={16} className="text-[#16C7A1]" />
              <span>Trace Flow &rarr;</span>
            </button>
          )}

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-3 rounded-2xl bg-[#0D1F28] hover:bg-[#142C39] border border-white/20 text-zinc-300 hover:text-white transition"
            title="More Options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default StationInspector;

