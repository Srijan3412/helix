import React from 'react';
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
  ArrowRight
} from 'lucide-react';
import { stationIconMap, stationColorMap } from './SubwayStationNode';
import { SubwayStationData, FeatureCluster, Interchange, ExecutionTraceData, StationType } from './types';

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
}

/**
 * Phase 6: Station Inspector Component
 * Displays file name, role badge, complexity, health status, interchange breakdown,
 * and executable routes with Play/Pause/Stop transit journey controls and cross-tab triggers.
 */
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
  onSelectTraceRouteId
}: StationInspectorProps) {
  const [copied, setCopied] = React.useState(false);

  if (!station) return null;

  const Icon = stationIconMap[station.type as StationType] || MapPin;
  const color = stationColorMap[station.type as StationType] || '#6B7280';

  const rawFileName = station.rawPath ? station.rawPath.split(/[\\/]/).pop() || station.rawPath : station.name;
  const relatedInterchange = interchanges.find(
    (i) => i.file === station.name || i.file === rawFileName || (station.rawPath && i.file.includes(station.name))
  );

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

  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 25 }}
      transition={{ duration: 0.2 }}
      className="absolute right-4 top-4 bottom-4 w-80 sm:w-96 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-2xl p-5 z-20 flex flex-col text-left backdrop-blur-xl overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md"
            style={{ backgroundColor: color }}
          >
            <Icon size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-zinc-100 truncate" title={station.displayName || station.name}>
              {station.displayName || station.name}
            </h3>
            <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
              {station.type} Station
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition"
          title="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        {/* File Path Block with Copy Button */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
            <span>File Location</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-zinc-400 hover:text-primary transition"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-zinc-200 break-all select-all">
            {station.rawPath || station.name}
          </div>
        </div>

        {/* Metrics Grid (Health & Complexity) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Health Status */}
          <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl p-3">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Activity size={11} />
              Health Status
            </div>
            <div
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                station.health === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : station.health === 'warning'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {station.health || 'Healthy'}
            </div>
          </div>

          {/* Complexity Metric */}
          <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl p-3">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Shield size={11} />
              Complexity
            </div>
            <div className="text-sm font-bold font-mono text-zinc-200">
              {station.complexity || 8} <span className="text-[9px] text-zinc-500 font-normal">Score</span>
            </div>
          </div>
        </div>

        {/* Connected Feature Lines */}
        <div className="space-y-1.5">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
            Connected Feature Lines
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(station.features || [station.lineName]).filter(Boolean).map((feat, i) => {
              const cluster = featureClusters.find((c) => c.name === feat || c.id === feat);
              const featColor = cluster?.color || station.color || '#3B82F6';

              return (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: featColor }} />
                  <span>{cluster?.name || feat}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interchange Junction Breakdown */}
        {relatedInterchange && relatedInterchange.features.length > 1 && (
          <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
              <Train size={14} className="text-purple-400" />
              <span>Interchange Junction</span>
            </div>
            <p className="text-[10px] text-purple-200/80 leading-relaxed">
              This component is an architectural bridge shared across {relatedInterchange.features.length} features.
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {relatedInterchange.features.map((f, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[9.5px] font-medium bg-purple-900/40 text-purple-200 border border-purple-700/40"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Executable Routes with Journey Controls */}
        {relatedTraces.length > 0 && (
          <div className="space-y-2">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Execution Routes ({relatedTraces.length})</span>
              <span className="text-primary font-mono text-[8px]">Transit Simulator</span>
            </div>

            <div className="space-y-2">
              {relatedTraces.map((trace) => {
                const isCurrentJourney = journeyActive && activeJourneyRoute === trace.route;

                return (
                  <div
                    key={trace.route}
                    className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {trace.method || 'GET'}
                        </span>
                        <span className="text-xs font-mono font-semibold text-zinc-200 truncate" title={trace.route}>
                          {trace.route}
                        </span>
                      </div>

                      {/* Quick Inspect in Trace */}
                      {onSelectTraceRouteId && onSwitchTab && (
                        <button
                          onClick={() => {
                            onSelectTraceRouteId(trace.route);
                            onSwitchTab('trace');
                          }}
                          className="text-[9.5px] text-primary hover:text-primary/80 font-bold flex items-center gap-0.5 shrink-0"
                          title="Open full trace debugger"
                        >
                          <GitBranch size={10} />
                          <span>Trace</span>
                        </button>
                      )}
                    </div>

                    {/* Transit Controls: Play / Pause / Stop */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                      <span className="text-[9.5px] text-zinc-400 font-mono">
                        {trace.chain?.length || 0} step chain
                        {isCurrentJourney && (
                          <span className="text-primary ml-1.5 animate-pulse font-bold">
                            (Step {animationStep + 1}/{trace.chain.length})
                          </span>
                        )}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isCurrentJourney ? (
                          <>
                            {journeyPaused ? (
                              <button
                                onClick={onResumeJourney}
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition"
                              >
                                <Play size={10} />
                                Resume
                              </button>
                            ) : (
                              <button
                                onClick={onPauseJourney}
                                className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-500/30 transition"
                              >
                                <PauseCircle size={10} />
                                Pause
                              </button>
                            )}

                            <button
                              onClick={onStopJourney}
                              className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-red-500/30 transition"
                            >
                              <Square size={9} className="fill-current" />
                              Stop
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onStartJourney(trace.route)}
                            className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold flex items-center gap-1 hover:bg-primary/30 transition"
                          >
                            <PlayCircle size={12} />
                            <span>Transit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Actions */}
      <div className="pt-3 border-t border-zinc-800/80 shrink-0 grid grid-cols-2 gap-2">
        {onSetImpactFile && onSwitchTab && (
          <button
            onClick={() => {
              onSetImpactFile(station.rawPath || station.name);
              onSwitchTab('layer');
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-semibold text-zinc-200 transition"
          >
            <Zap size={13} className="text-amber-400" />
            <span>Impact Analysis</span>
          </button>
        )}

        {onSelectTraceRouteId && onSwitchTab && relatedTraces.length > 0 && (
          <button
            onClick={() => {
              onSelectTraceRouteId(relatedTraces[0].route);
              onSwitchTab('trace');
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-semibold text-zinc-200 transition"
          >
            <GitBranch size={13} className="text-primary" />
            <span>Open in Trace</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
