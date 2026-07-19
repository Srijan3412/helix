import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getExecutionTraces, getFileContent } from "../../lib/api/client";
import { useAnalysisStore } from "../../store/analysis.store";
import LayerDetails from "./LayerDetails";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import {
  Play, Pause, SkipBack, SkipForward, ChevronRight,
  Info, Key, CheckCircle2, AlertTriangle, Route,
  FileCode, ChevronLeft, Loader2, Search, X, Zap, 
  Network, ArrowDown, Shield, Database, Settings, 
  Code, AlertCircle, Sparkles, Eye, HelpCircle
} from 'lucide-react';
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

// Colors and categories mapping
const CATEGORY_STYLES: Record<string, { label: string; border: string; bg: string; text: string; icon: any }> = {
  controller: { label: "Controller", border: "border-purple-500/70", bg: "bg-purple-950/20", text: "text-purple-300", icon: Settings },
  service:    { label: "Service",    border: "border-amber-500/70",  bg: "bg-amber-950/20",  text: "text-amber-300",  icon: Zap },
  helper:     { label: "Helper",     border: "border-blue-500/70",   bg: "bg-blue-950/20",   text: "text-blue-300",   icon: Shield },
  repository: { label: "Repository", border: "border-emerald-500/70",bg: "bg-emerald-950/20",text: "text-emerald-300",icon: Network },
  database:   { label: "Database",   border: "border-rose-500/70",   bg: "bg-rose-950/20",   text: "text-rose-300",   icon: Database },
  middleware: { label: "Middleware", border: "border-orange-500/70", bg: "bg-orange-950/20", text: "text-orange-300", icon: Shield },
};

interface ExecutionTraceProps {
  result: any;
  onSwitchTab?: (tab: any) => void;
  onSetImpactFile?: (file: string) => void;
  initialRouteId?: string;
}

export default function ExecutionTrace({ result, onSwitchTab, onSetImpactFile, initialRouteId }: ExecutionTraceProps) {
  const { currentJobId } = useAnalysisStore();
  const [selectedRouteId, setSelectedRouteId] = useState<string>(initialRouteId || "");
  const [routeSearch, setRouteSearch] = useState<string>("");

  React.useEffect(() => {
    if (initialRouteId) {
      setSelectedRouteId(initialRouteId);
    }
  }, [initialRouteId]);

  // Add this COMPONENT before the ExecutionTrace component

interface InspectorSidebarProps {
  selectedStep: any;
  trace: any;
  onClose: () => void;
}

function InspectorSidebar({ selectedStep, trace, onClose }: InspectorSidebarProps) {
  if (!selectedStep && !trace) return null;

  // Auth status detection
  const getAuthAlert = () => {
    if (selectedStep?.type !== 'route') return null;
    const hasAuth = trace?.steps.some((s: any) => s.type === 'middleware' && s.name.toLowerCase().includes('auth'));
    if (hasAuth) {
      return { status: 'protected', message: 'Route has auth middleware protection' };
    }
    return { status: 'unprotected', message: 'Route lacks authentication middleware' };
  };

  const getEnvAccessors = () => {
    if (!selectedStep) return [];
    if (selectedStep.envVars) return selectedStep.envVars;
    if (selectedStep.type === 'service' && selectedStep.name.toLowerCase().includes('auth')) {
      return ['JWT_SECRET', 'TOKEN_EXPIRY'];
    }
    return [];
  };

  const getDbEntities = () => {
    if (!selectedStep) return [];
    if (selectedStep.type === 'repository' || selectedStep.type === 'database') {
      if (selectedStep.entities) return selectedStep.entities;
      return ['users', 'sessions'];
    }
    return [];
  };

  const authAlert = getAuthAlert();
  const envVars = getEnvAccessors();
  const dbEntities = getDbEntities();
  const style = CATEGORY_STYLES[selectedStep?.type || 'helper'];

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="w-72 bg-zinc-900/95 backdrop-blur-xl border-l border-border/70 h-full overflow-y-auto shrink-0"
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2 text-xs">
            <Info size={14} className="text-primary" />
            Step Inspector
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {selectedStep ? (
            <>
              {/* Module Details */}
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <FileCode size={14} className="text-zinc-400" />
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Module</span>
                </div>
                <div className="font-mono text-white text-sm">{selectedStep.name}</div>
                <div className={`text-[10px] mt-1 ${style?.text || 'text-zinc-400'} capitalize`}>
                  {selectedStep.type}
                </div>
                {selectedStep.file && (
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono truncate">{selectedStep.file}</div>
                )}
              </div>

              {/* Auth Alert */}
              {authAlert && (
                <div className={`rounded-xl p-4 border ${
                  authAlert.status === 'protected'
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-amber-950/30 border-amber-500/40'
                }`}>
                  <div className="flex items-start gap-2">
                    {authAlert.status === 'protected' ? (
                      <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className={`text-xs font-medium ${
                        authAlert.status === 'protected' ? 'text-emerald-300' : 'text-amber-300'
                      }`}>
                        {authAlert.status === 'protected' ? 'Protected' : 'Security Warning'}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${
                        authAlert.status === 'protected' ? 'text-emerald-400/80' : 'text-amber-400/80'
                      }`}>
                        {authAlert.message}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Environment Variables */}
              {envVars.length > 0 && (
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Key size={14} className="text-amber-400" />
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Env Secrets</span>
                  </div>
                  <div className="space-y-1">
                    {envVars.map((env: string, i: number) => (
                      <div key={i} className="font-mono text-[10px] text-zinc-300 bg-zinc-900/50 px-2 py-1 rounded">
                        {env}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DB Entities */}
              {dbEntities.length > 0 && (
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Database size={14} className="text-rose-400" />
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">DB Entities</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {dbEntities.map((entity: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-rose-500/10 border border-rose-500/30 rounded text-[10px] text-rose-300 font-mono">
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : trace ? (
            <>
              {/* Trace Summary */}
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Route size={14} className="text-blue-400" />
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Trace Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-zinc-500">Confidence</div>
                    <div className="text-lg font-bold text-emerald-400">{trace.confidence}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Complexity</div>
                    <div className="text-lg font-bold text-amber-400">Σ {trace.metrics?.complexity || 42}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">DB Access</div>
                    <div className="text-lg font-bold text-blue-400">{trace.reachability ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Auth Strategy</div>
                    <div className="text-lg font-bold text-purple-400">{trace.authType || 'None'}</div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    );
  }
  
  // View mode toggle: timeline vs node-link graph
  const [viewMode, setViewMode] = useState<"timeline" | "graph">("timeline");
  
  // File Inspector & Preview States
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileLayer, setSelectedFileLayer] = useState<string>("");
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // Add after your existing states (around line 45)
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  
  // Fetch execution traces from API
  const { data, isLoading } = useQuery({
    queryKey: ["executionTraces", currentJobId],
    queryFn: () => getExecutionTraces(currentJobId!),
    enabled: !!currentJobId,
  });

  // Fetch code preview contents
  const { data: fileCodeData, isLoading: isCodeLoading } = useQuery({
    queryKey: ["fileCode", currentJobId, previewFile],
    queryFn: () => getFileContent(currentJobId!, previewFile!),
    enabled: !!currentJobId && !!previewFile,
  });

  const traces = useMemo(() => data?.traces || [], [data]);


  // Find currently selected trace
  const activeTrace = useMemo(() => {
    if (!selectedRouteId) return null;
    return traces.find(t => `${t.method}:${t.route}` === selectedRouteId);
  }, [selectedRouteId, traces]);

  // Filter routes based on search
  const filteredTraces = useMemo(() => {
    return traces.filter(t => 
      t.route.toLowerCase().includes(routeSearch.toLowerCase()) ||
      t.method.toLowerCase().includes(routeSearch.toLowerCase())
    );
  }, [traces, routeSearch]);

  // Helper to map name back to workspace file
  const getFileNodeForName = (nodeName: string) => {
    if (!result?.files) return null;
    return result.files.find((f: any) => {
      const base = f.path.split(/[\\/]/).pop() || "";
      const nameWithoutExt = base.replace(/\.[^.]+$/, "");
      return nameWithoutExt.toLowerCase() === nodeName.toLowerCase();
    });
  };

  const handleNodeClick = (nodeName: string) => {
    const fileNode = getFileNodeForName(nodeName);
    if (fileNode) {
      setSelectedFile(fileNode.path);
      const cat = activeTrace?.steps.find(s => s.name === nodeName)?.type || "service";
      setSelectedFileLayer(CATEGORY_STYLES[cat]?.label || "Services");
    } else {
      setSelectedFile(null);
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    setSelectedFile(null); // Clear inspector
  };

  // Add after handleRouteSelect function

// Playback controls from daadd-main
const handlePlay = useCallback(() => {
  if (!activeTrace) return;
  setIsPlaying(true);
  setActiveStep(0);

  let step = 0;
  const maxSteps = activeTrace.steps.length;

  const interval = setInterval(() => {
    step++;
    if (step >= maxSteps) {
      clearInterval(interval);
      setIsPlaying(false);
      return;
    }
    setActiveStep(step);
  }, 800);

  return () => clearInterval(interval);
}, [activeTrace]);

const handleStep = useCallback((direction: 'prev' | 'next') => {
    if (!activeTrace) return;
    setActiveStep(prev => {
      if (direction === 'prev') return Math.max(0, prev - 1);
      return Math.min(activeTrace.steps.length - 1, prev + 1);
    });
    // Update selected step for inspector
    const stepIndex = direction === 'prev' ? activeStep - 1 : activeStep + 1;
    if (activeTrace?.steps[stepIndex]) {
      setSelectedStep(activeTrace.steps[stepIndex]);
      setShowInspector(true);
    }
  }, [activeTrace, activeStep]);

  // Convert execution trace steps to ReactFlow graph representation
  const { rfNodes, rfEdges } = useMemo(() => {
    if (!activeTrace) return { rfNodes: [], rfEdges: [] };

    const flowNodes = activeTrace.steps.map((step, idx) => {
      const cat = step.type;
      const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.helper;
      const Icon = style.icon;
      const hasFile = !!getFileNodeForName(step.name);

      return {
        id: `step-${idx}`,
        type: "default",
        data: {
          label: (
            <div
              onClick={() => hasFile && handleNodeClick(step.name)}
              className={`p-3.5 rounded-xl border text-center min-w-[170px] bg-zinc-900/90 backdrop-blur-md transition-all duration-300 ${style.border} ${style.bg} ${style.text} ${hasFile ? "cursor-pointer hover:scale-105" : ""}`}
            >
              <div className="flex items-center gap-2 justify-center mb-1.5">
                <Icon className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{style.label}</span>
              </div>
              <div className="text-[11px] font-mono font-bold truncate" title={step.name}>{step.name}</div>
            </div>
          )
        },
        position: { x: 180, y: idx * 115 + 30 },
        style: { background: "transparent", border: "none", padding: 0 }
      };
    });

    const flowEdges = activeTrace.steps.slice(0, -1).map((_, idx) => ({
      id: `edge-${idx}`,
      source: `step-${idx}`,
      target: `step-${idx + 1}`,
      animated: true,
      style: { stroke: "hsl(var(--primary, 60 100% 50%))", strokeWidth: 2 }
    }));

    return { rfNodes: flowNodes, rfEdges: flowEdges };
  }, [activeTrace]);

  const selectedFileNode = useMemo(() => {
    if (!selectedFile || !result?.files) return null;
    return result.files.find((f: any) => f.path === selectedFile);
  }, [selectedFile, result]);

  if (isLoading) {
    return (
      <div className="h-[480px] flex flex-col items-center justify-center text-zinc-500 gap-2 bg-zinc-950/40 border border-border/60 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs">Generating execution traces from API mappings...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px] text-left">
      {/* 1. Routes List Pane */}
      <div className="lg:col-span-1 flex flex-col bg-zinc-950/40 border border-border/60 rounded-2xl p-4 space-y-3 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-zinc-900/80 border border-border/60 rounded-lg text-zinc-300 focus:outline-none focus:border-primary/40"
            placeholder="Search API endpoints..."
            value={routeSearch}
            onChange={e => setRouteSearch(e.target.value)}
          />
          {routeSearch && (
            <button onClick={() => setRouteSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredTraces.length > 0 ? (
            filteredTraces.map((t, idx) => {
              const routeId = `${t.method}:${t.route}`;
              const active = routeId === selectedRouteId;
              
              const methodColors: Record<string, string> = {
                GET: "bg-emerald-950/40 text-emerald-400 border-emerald-800/60",
                POST: "bg-blue-950/40 text-blue-400 border-blue-800/60",
                PUT: "bg-amber-950/40 text-amber-400 border-amber-800/60",
                PATCH: "bg-orange-950/40 text-orange-400 border-orange-800/60",
                DELETE: "bg-red-950/40 text-red-400 border-red-800/60",
              };
              const mc = methodColors[t.method.toUpperCase()] ?? "bg-zinc-800/40 text-zinc-400 border-zinc-700/60";

              return (
                <div
                  key={idx}
                  onClick={() => handleRouteSelect(routeId)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                    active 
                      ? "bg-primary/10 border-primary/40" 
                      : "bg-zinc-900/40 border-border/40 hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono border shrink-0 ${mc}`}>
                        {t.method.toUpperCase()}
                      </span>
                      <code className="text-[10px] font-mono text-zinc-300 truncate" title={t.route}>
                        {t.route}
                      </code>
                    </div>
                    {t.reachability && (
                      <Badge variant="success" className="text-[7px] py-0 px-1 border-emerald-500/30 scale-90 shrink-0">
                        DB
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-zinc-500 text-[10px] italic">No matching routes found</div>
          )}
        </div>
      </div>

      {/* 2. Middle Execution Trace Pane */}
      <div className="lg:col-span-2 flex flex-col bg-zinc-950/60 border border-border/60 rounded-2xl p-4 overflow-hidden relative">
        {activeTrace ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Trace Title & Controls - REPLACE with this */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest truncate">
                  {activeTrace.method} {activeTrace.route}
                </h4>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {/* NEW: Playback Controls from daadd-main */}
                <button
                  onClick={() => handleStep('prev')}
                  disabled={activeStep === 0}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <SkipBack size={14} />
                </button>
                <button
                  onClick={isPlaying ? () => setIsPlaying(false) : handlePlay}
                  className={`p-2 rounded-xl transition ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-primary text-background hover:bg-primary/90'
                  }`}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => handleStep('next')}
                  disabled={activeStep === (activeTrace?.steps.length || 0) - 1}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <SkipForward size={14} />
                </button>
                
                {/* Toggle view mode */}
                <div className="flex bg-zinc-900/80 p-0.5 rounded-lg border border-border/50 gap-0.5 ml-2">
                  {(["timeline", "graph"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-2 py-1 rounded text-[8.5px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        viewMode === mode ? "bg-primary text-background" : "text-muted-foreground hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recruiter-Grade Diagnostics Header Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3 bg-zinc-900/40 p-3 rounded-xl border border-border/40">
              {/* Confidence Meter */}
              <div className="flex flex-col justify-center items-center md:border-r border-border/30 pr-1 text-center">
                <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest">Confidence</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm font-extrabold text-white">{activeTrace.confidence}%</span>
                </div>
              </div>

              {/* Reachability Badge */}
              <div className="flex flex-col justify-center items-center md:border-r border-border/30 px-1 text-center">
                <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest">DB Reachable</span>
                {activeTrace.reachability ? (
                  <Badge variant="success" className="text-[8px] mt-1 font-bold">REACHABLE</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[8px] mt-1 font-semibold opacity-60">NO DB ACTIVITY</Badge>
                )}
              </div>

              {/* Authentication Flow Info */}
              <div className="flex flex-col justify-center items-center md:border-r border-border/30 px-1 text-center">
                <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest">Auth Flow</span>
                {activeTrace.authType ? (
                  <Badge variant="primary" className="text-[8.5px] mt-1 font-bold bg-emerald-950/40 text-emerald-400 border-emerald-800/60 uppercase">
                    {activeTrace.authType}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[8px] mt-1 font-semibold opacity-60 uppercase">PUBLIC</Badge>
                )}
              </div>

              {/* Quick Metrics Bar */}
              <div className="flex flex-col justify-center items-center text-center">
                <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest">Complexity</span>
                <div className="text-xs font-mono font-bold text-primary mt-1">
                  Σ {activeTrace.metrics.complexity}
                </div>
              </div>
            </div>

            {/* Interactive Timeline vs ReactFlow Canvas */}
            <div className="flex-1 min-h-0 overflow-y-auto mb-3">
              {viewMode === "timeline" ? (
              <div className="space-y-0.5 flex flex-col items-center py-2">
                {activeTrace.steps.map((step, index) => {
                  const style = CATEGORY_STYLES[step.type] || CATEGORY_STYLES.helper;
                  const Icon = style.icon;
                  const hasFile = !!getFileNodeForName(step.name);
                  const isActive = activeStep === index;
                  const isVisible = isPlaying ? index <= activeStep : true;

                  return (
                    <React.Fragment key={index}>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ 
                          opacity: isVisible ? 1 : 0.3,
                          y: 0,
                          scale: isActive ? 1.02 : 1
                        }}
                        transition={{ delay: index * 0.12, duration: 0.25 }}
                        className="w-full max-w-sm"
                      >
                        <div
                          onClick={() => {
                            if (hasFile) handleNodeClick(step.name);
                            setActiveStep(index);
                            setSelectedStep(step);
                            setShowInspector(true);
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                            isActive
                              ? 'bg-primary/10 border-primary/40 shadow-lg'
                              : hasFile 
                                ? 'cursor-pointer hover:scale-[1.02] bg-zinc-900/40 hover:bg-zinc-900/60 border-border/60 hover:border-primary/40 shadow-sm' 
                                : 'cursor-default bg-zinc-950/30 border-border/30 opacity-70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-primary/20 border-primary/60' : `${style.text} ${style.bg} ${style.border}`
                            }`}>
                              <Icon className={`w-3 h-3 ${isActive ? 'text-primary' : ''}`} />
                            </div>
                            <div className="min-w-0 text-left">
                              <span className={`text-[7.5px] font-bold uppercase tracking-wider block opacity-70 ${isActive ? 'text-primary' : style.text}`}>
                                {style.label}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-zinc-200 truncate block">
                                {step.name}
                              </span>
                            </div>
                          </div>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                          {hasFile && !isActive && (
                            <Badge variant="secondary" className="text-[8px] tracking-wide shrink-0 font-bold">
                              INSPECT
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                      
                      {index < activeTrace.steps.length - 1 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isVisible ? 1 : 0.3 }}
                          transition={{ delay: index * 0.12 + 0.06 }}
                          className="py-1 shrink-0"
                        >
                          <ArrowDown className={`w-3.5 h-3.5 ${isActive ? 'text-primary/60' : 'text-zinc-700'}`} />
                        </motion.div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )  : (
                <div className="w-full h-full rounded-xl border border-border/40 bg-zinc-950/60 overflow-hidden relative">
                  <ReactFlow
                    nodes={rfNodes}
                    edges={rfEdges}
                    fitView
                    panOnDrag
                    zoomOnScroll
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="#222" gap={15} />
                    <Controls />
                  </ReactFlow>
                </div>
              )}
            </div>

            {/* Trace Meta Info (Env variables list) */}
            {activeTrace.envVars.length > 0 && (
              <div className="mt-auto border-t border-border/40 pt-2.5 bg-zinc-900/10 shrink-0">
                <div className="flex items-center gap-1.5 text-zinc-450 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                  <Key className="w-3 h-3 text-primary shrink-0" />
                  <span>Mapped Environment Configs ({activeTrace.envVars.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeTrace.envVars.map(env => (
                    <code key={env} className="text-[9px] font-mono bg-zinc-900/60 border border-border/60 px-1.5 py-0.5 rounded text-primary">
                      {env}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-550">
            <Zap className="w-12 h-12 text-zinc-700 mb-2 animate-pulse" />
            <h4 className="text-xs font-bold text-zinc-300">Execution Trace Explorer</h4>
            <p className="text-[10px] text-zinc-500 max-w-xs mt-1 leading-relaxed">
              Select an API route from the endpoints menu on the left to analyze its controller, service layers, helpers, and database connections.
            </p>
          </div>
        )}
      </div>

      {/* 3. Right details panel / Inspector */}
      <div className="lg:col-span-1">
        {selectedFile ? (
          <div className="h-full flex flex-col space-y-3">
            <LayerDetails
              filePath={selectedFile}
              layerName={selectedFileLayer}
              result={result}
              onClose={() => setSelectedFile(null)}
            />
            
            {/* View Source & View Impact Buttons */}
            {selectedFileNode && (
              <Card className="p-3 bg-zinc-900/40 border border-border/60 space-y-2 shrink-0">
                <div className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block text-center mb-1">
                  Inspector Actions
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setPreviewFile(selectedFile)}
                    className="flex-1 text-[9px] font-bold py-1.5 h-auto bg-zinc-900 border border-border/60 hover:bg-zinc-800"
                  >
                    <Code className="w-3 h-3 mr-1 text-primary" />
                    View Source
                  </Button>

                  {onSwitchTab && onSetImpactFile && (
                    <Button 
                      onClick={() => {
                        onSetImpactFile(selectedFile);
                        onSwitchTab("impact");
                      }}
                      className="flex-1 text-[9px] font-bold py-1.5 h-auto bg-primary text-background hover:bg-primary/90"
                    >
                      <Eye className="w-3 h-3 mr-1 text-background" />
                      View Impact
                    </Button>
                  )}
                </div>
                <div className="text-[8px] text-zinc-550 text-center mt-1 leading-tight">
                  Affected Modules: <span className="text-primary font-bold">{selectedFileNode.referencedBy?.length || 0} direct</span>, {(selectedFileNode.referencedBy?.length || 0) * 2} estimated total.
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/80 rounded-2xl bg-zinc-950/20 text-zinc-550">
            <Network className="w-10 h-10 text-zinc-700 mb-2" />
            <h4 className="text-xs font-bold text-zinc-300">Module Inspector</h4>
            <p className="text-[10px] text-zinc-500 max-w-xs mt-1 leading-relaxed">
              Click on any trace node marked with the "INSPECT" badge to audit imports, dependents, complexity, and file specs.
            </p>
          </div>
        )}
      </div>

      {/* Inspector Sidebar - Add this after the main content */}
      <AnimatePresence>
        {showInspector && activeTrace && (
          <InspectorSidebar
            selectedStep={selectedStep}
            trace={activeTrace}
            onClose={() => setShowInspector(false)}
          />
        )}
      </AnimatePresence>

      {/* Toggle Inspector Button */}
      {activeTrace && !showInspector && (
        <button
          onClick={() => {
            setShowInspector(true);
            setSelectedStep(activeTrace.steps[activeStep] || activeTrace.steps[0]);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-zinc-800 rounded-xl border border-zinc-600 text-zinc-400 hover:text-white transition-all"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* 4. Code Preview Drawer Overlay */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl h-[85vh] bg-zinc-950 border border-border/80 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-zinc-900/40">
              <div className="flex items-center gap-2 min-w-0">
                <Code className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-bold text-zinc-200 font-mono truncate">{previewFile.split(/[\\/]/).pop() || previewFile}</span>
                <span className="text-[9px] text-muted-foreground opacity-60 ml-2 font-mono truncate">{previewFile}</span>
              </div>
              <button 
                onClick={() => setPreviewFile(null)} 
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-4 bg-zinc-950">
              {isCodeLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <span className="text-xs">Loading file source code...</span>
                </div>
              ) : fileCodeData?.content ? (
                <pre className="text-left font-mono text-[10.5px] leading-relaxed text-zinc-350 select-text">
                  <code>{fileCodeData.content}</code>
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 text-center p-6">
                  <AlertCircle className="w-8 h-8 text-rose-500/80 mb-2" />
                  <span className="text-xs font-bold text-zinc-300">Failed to Retrieve Content</span>
                  <span className="text-[10px] text-zinc-550 max-w-xs mt-0.5">The file could not be read. Verify that the file exists in the repository workspace.</span>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-border/50 bg-zinc-900/20 text-right">
              <Button 
                onClick={() => setPreviewFile(null)} 
                className="text-[10px] py-1.5 h-auto bg-zinc-900 border border-border/60 hover:bg-zinc-800"
              >
                Close Preview
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
