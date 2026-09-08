import React, { useState, useMemo, useCallback } from "react";
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
const CATEGORY_STYLES: Record<string, { label: string; border: string; bg: string; text: string; color: string; bgSoft: string; icon: any }> = {
  controller: { label: "CONTROLLER", border: "border-[#16C7A1]", bg: "bg-[#16C7A1]/8", text: "text-[#16C7A1]", color: "#16C7A1", bgSoft: "rgba(22,199,161,0.08)", icon: Settings },
  service:    { label: "SERVICE",    border: "border-[#F5B800]/30", bg: "bg-[#F5B800]/5", text: "text-[#F5B800]", color: "#F5B800", bgSoft: "rgba(245,184,0,0.05)", icon: Zap },
  helper:     { label: "HELPER",     border: "border-[#2F80ED]/30", bg: "bg-[#2F80ED]/5", text: "text-[#2F80ED]", color: "#2F80ED", bgSoft: "rgba(47,128,237,0.05)", icon: Shield },
  repository: { label: "REPOSITORY", border: "border-[#00B8D9]/30", bg: "bg-[#00B8D9]/5", text: "text-[#00B8D9]", color: "#00B8D9", bgSoft: "rgba(0,184,217,0.05)", icon: Network },
  database:   { label: "DATABASE",   border: "border-[#FF4D5E]/30", bg: "bg-[#FF4D5E]/5", text: "text-[#FF4D5E]", color: "#FF4D5E", bgSoft: "rgba(255,77,94,0.05)", icon: Database },
  middleware: { label: "MIDDLEWARE", border: "border-[#FF8A00]/30", bg: "bg-[#FF8A00]/5", text: "text-[#FF8A00]", color: "#FF8A00", bgSoft: "rgba(255,138,0,0.05)", icon: Shield },
  route:      { label: "ROUTE",      border: "border-[#2F80ED]/30", bg: "bg-[#2F80ED]/5", text: "text-[#2F80ED]", color: "#2F80ED", bgSoft: "rgba(47,128,237,0.05)", icon: Route },
};

function formatRoutePath(rawPath: string): string {
  if (!rawPath) return "/";
  let p = rawPath.trim();
  p = p.replace(/^[`"']|[`"']$/g, "");
  p = p.replace(/\$\{([^}]+)\}/g, ":$1");
  p = p.replace(/\/([a-zA-Z0-9_-]+)::?([a-zA-Z0-9_]+):/g, "/$1/:$2/");
  p = p.replace(/\/([a-zA-Z0-9_-]+)::?([a-zA-Z0-9_]+)\//g, "/$1/:$2/");
  p = p.replace(/\/([a-zA-Z0-9_-]+)::([a-zA-Z0-9_]+)$/g, "/$1/:$2");
  p = p.replace(/\/+/g, "/");
  if (!p.startsWith("/")) p = "/" + p;
  return p;
}

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
        <h3 className="dash-card-title text-white flex items-center gap-2">
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
                <span className="dash-sidebar-cat text-zinc-400">Module</span>
              </div>
              <div className="dash-filepath-medium text-white">{selectedStep.name}</div>
              <div className={`dash-metadata mt-1 ${style?.text || 'text-zinc-400'} capitalize`}>
                {selectedStep.type}
              </div>
              {selectedStep.file && (
                <div className="dash-filepath text-zinc-500 mt-1 truncate">{selectedStep.file}</div>
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
                    <div className={`dash-card-title ${
                      authAlert.status === 'protected' ? 'text-emerald-300' : 'text-amber-300'
                    }`}>
                      {authAlert.status === 'protected' ? 'Protected' : 'Security Warning'}
                    </div>
                    <div className={`dash-body mt-0.5 ${
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
                  <span className="dash-sidebar-cat text-zinc-400">Env Secrets</span>
                </div>
                <div className="space-y-1">
                  {envVars.map((env: string, i: number) => (
                    <div key={i} className="dash-filepath text-zinc-300 bg-zinc-900/50 px-2 py-1 rounded">
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
                  <span className="dash-sidebar-cat text-zinc-400">DB Entities</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {dbEntities.map((entity: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-rose-500/10 border border-rose-500/30 rounded dash-filepath text-rose-300">
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
                <span className="dash-sidebar-cat text-zinc-400">Trace Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="dash-metadata text-zinc-500">Confidence</div>
                  <div className="dash-card-title text-emerald-400">{trace.confidence <= 1 ? Math.round(trace.confidence * 100) : Math.round(trace.confidence)}%</div>
                </div>
                <div>
                  <div className="dash-metadata text-zinc-500">Complexity</div>
                  <div className="dash-card-title text-amber-400">Σ {trace.metrics?.complexity || 42}</div>
                </div>
                <div>
                  <div className="dash-metadata text-zinc-500">DB Access</div>
                  <div className="dash-card-title text-blue-400">{trace.reachability ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="dash-metadata text-zinc-500">Auth Strategy</div>
                  <div className="dash-card-title text-purple-400">{trace.authType || 'None'}</div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}

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
                <span className="dash-sidebar-cat opacity-70">{style.label}</span>
              </div>
              <div className="dash-filepath-medium truncate" title={step.name}>{step.name}</div>
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
        <span className="dash-metadata">Generating execution traces from API mappings...</span>
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
            className="w-full pl-8 pr-8 py-1.5 dash-metadata bg-zinc-900/80 border border-border/60 rounded-lg text-zinc-300 focus:outline-none focus:border-primary/40"
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
                      <span className={`px-1.5 py-0.5 rounded dash-badge border shrink-0 ${mc}`}>
                        {t.method.toUpperCase()}
                      </span>
                      <code className="dash-filepath text-zinc-300 truncate" title={formatRoutePath(t.route)}>
                        {formatRoutePath(t.route)}
                      </code>
                    </div>
                    {t.reachability && (
                      <Badge variant="success" className="dash-badge py-0 px-1 border-emerald-500/30 shrink-0">
                        DB
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-zinc-500 dash-metadata italic">No matching routes found</div>
          )}
        </div>
      </div>

      {/* 2. Middle Execution Trace Pane */}
      <div className="lg:col-span-2 flex flex-col bg-[#090B0D] border border-white/10 rounded-[18px] p-5 overflow-hidden relative shadow-2xl">
        {activeTrace ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Trace Title & Controls - Single-line Header (~58px) */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3.5 min-h-[58px] shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <Zap className="w-6 h-6 text-[#16C7A1] shrink-0" />
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase shrink-0 ${
                  activeTrace.method?.toUpperCase() === 'POST' ? 'bg-[#16C7A1] text-zinc-950' :
                  activeTrace.method?.toUpperCase() === 'PUT' ? 'bg-[#F5B800] text-zinc-950' :
                  activeTrace.method?.toUpperCase() === 'DELETE' ? 'bg-[#FF4D5E] text-white' :
                  activeTrace.method?.toUpperCase() === 'PATCH' ? 'bg-[#FF8A00] text-white' :
                  'bg-[#2F80ED] text-white'
                }`}>
                  {activeTrace.method}
                </span>
                <h3 className="text-[19px] md:text-[20px] font-bold text-[#F7FAFA] truncate font-sans tracking-tight">
                  {formatRoutePath(activeTrace.route)}
                </h3>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleStep('prev')}
                  disabled={activeStep === 0}
                  className="w-9 h-9 rounded-lg bg-[#1B1D20] border border-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                  title="Previous Step"
                >
                  <SkipBack size={15} />
                </button>
                <button
                  onClick={isPlaying ? () => setIsPlaying(false) : handlePlay}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition shadow-md ${
                    isPlaying
                      ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                      : 'bg-[#16C7A1] text-[#090B0D] hover:bg-[#16C7A1]/90 shadow-[0_0_15px_rgba(22,199,161,0.25)]'
                  }`}
                  title={isPlaying ? "Pause Trace" : "Play Trace"}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
                <button
                  onClick={() => handleStep('next')}
                  disabled={activeStep === (activeTrace?.steps.length || 0) - 1}
                  className="w-9 h-9 rounded-lg bg-[#1B1D20] border border-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                  title="Next Step"
                >
                  <SkipForward size={15} />
                </button>
                
                {/* Toggle view mode */}
                <div className="flex bg-[#1B1D20] p-1 rounded-lg border border-white/5 gap-1 ml-1.5">
                  {(["timeline", "graph"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-all duration-200 ${
                        viewMode === mode ? "bg-[#16C7A1] text-[#090B0D]" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics Strip (4 columns) */}
            <div className="grid grid-cols-4 divide-x divide-white/5 bg-[#101214] border border-white/5 rounded-xl p-3.5 mb-4 text-center items-center shrink-0">
              {/* Confidence */}
              <div className="flex flex-col justify-center items-center px-1">
                <span className="text-[11px] font-medium tracking-wider text-[#8F9298] uppercase mb-1">Confidence</span>
                <div className="flex items-center gap-1 text-[16px] md:text-[18px] font-bold text-[#16C7A1]">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{activeTrace.confidence <= 1 ? Math.round(activeTrace.confidence * 100) : Math.round(activeTrace.confidence)}%</span>
                </div>
              </div>

              {/* DB Reachable */}
              <div className="flex flex-col justify-center items-center px-1">
                <span className="text-[11px] font-medium tracking-wider text-[#8F9298] uppercase mb-1">DB Reachable</span>
                {activeTrace.reachability ? (
                  <span className="bg-[#1B1D20] border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full uppercase">
                    REACHABLE
                  </span>
                ) : (
                  <span className="bg-[#1B1D20] border border-white/5 text-[#8F9298] text-xs font-semibold px-3 py-1 rounded-full uppercase">
                    NO DB ACTIVITY
                  </span>
                )}
              </div>

              {/* Auth Flow */}
              <div className="flex flex-col justify-center items-center px-1">
                <span className="text-[11px] font-medium tracking-wider text-[#8F9298] uppercase mb-1">Auth Flow</span>
                <span className="bg-[#1B1D20] border border-white/5 text-[#8F9298] text-xs font-semibold px-3 py-1 rounded-full uppercase">
                  {activeTrace.authType ? activeTrace.authType.toUpperCase() : "PUBLIC"}
                </span>
              </div>

              {/* Complexity */}
              <div className="flex flex-col justify-center items-center px-1">
                <span className="text-[11px] font-medium tracking-wider text-[#8F9298] uppercase mb-1">Complexity</span>
                <div className="text-[16px] md:text-[18px] font-bold">
                  <span className="text-[#16C7A1] mr-1">Σ</span>
                  <span className="text-[#F7FAFA]">{activeTrace.metrics?.complexity ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Interactive Timeline vs ReactFlow Canvas */}
            <div className="flex-1 min-h-0 overflow-y-auto mb-3">
              {viewMode === "timeline" ? (
                <div className="space-y-0 flex flex-col items-center py-2 w-full">
                  {activeTrace.steps.map((step, index) => {
                    const style = CATEGORY_STYLES[step.type] || CATEGORY_STYLES.helper;
                    const Icon = style.icon;
                    const hasFile = !!getFileNodeForName(step.name);
                    const isActive = activeStep === index;
                    const isVisible = isPlaying ? index <= activeStep : true;
                    const displayName = step.name.split("/").pop() || step.name;

                    return (
                      <React.Fragment key={index}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ 
                            opacity: isVisible ? 1 : 0.3,
                            y: 0,
                          }}
                          transition={{ delay: index * 0.08, duration: 0.2 }}
                          className="w-[90%] max-w-[520px]"
                        >
                          <div
                            onClick={() => {
                              if (hasFile) handleNodeClick(step.name);
                              setActiveStep(index);
                              setSelectedStep(step);
                              setShowInspector(true);
                            }}
                            className={`min-h-[72px] h-[74px] rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-200 cursor-pointer ${
                              isActive
                                ? 'bg-[#16C7A1]/10 border-2 border-[#16C7A1] shadow-[0_0_15px_rgba(22,199,161,0.15)]'
                                : `${style.bg} border ${style.border} hover:border-[#16C7A1]/50`
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: isActive ? 'rgba(22,199,161,0.15)' : style.bgSoft,
                                  color: isActive ? '#16C7A1' : style.color
                                }}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 text-left">
                                <span 
                                  className="text-[11px] md:text-[12px] font-bold uppercase tracking-wider block"
                                  style={{ color: isActive ? '#16C7A1' : style.color }}
                                >
                                  {style.label}
                                </span>
                                <span className="text-[14px] md:text-[15px] font-semibold text-[#F7FAFA] truncate block leading-snug">
                                  {displayName}
                                </span>
                              </div>
                            </div>
                            {isActive && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#16C7A1] shrink-0 animate-pulse shadow-[0_0_8px_#16C7A1]" />
                            )}
                            {hasFile && !isActive && (
                              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                                INSPECT
                              </span>
                            )}
                          </div>
                        </motion.div>
                        
                        {index < activeTrace.steps.length - 1 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isVisible ? 1 : 0.3 }}
                            transition={{ delay: index * 0.08 + 0.04 }}
                            className="h-[26px] flex items-center justify-center text-[#16C7A1] shrink-0 my-0.5"
                          >
                            <ArrowDown className={`w-3.5 h-3.5 ${isActive ? 'text-[#16C7A1]' : 'text-[#16C7A1]/60'}`} />
                          </motion.div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full h-full rounded-xl border border-white/10 bg-[#090B0D] overflow-hidden relative">
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
            {activeTrace.envVars && activeTrace.envVars.length > 0 && (
              <div className="mt-auto border-t border-white/10 pt-2.5 bg-[#101214]/50 shrink-0">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1.5 font-medium">
                  <Key className="w-3 h-3 text-[#16C7A1] shrink-0" />
                  <span>Mapped Environment Configs ({activeTrace.envVars.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeTrace.envVars.map(env => (
                    <code key={env} className="dash-filepath bg-[#1B1D20] border border-white/5 px-2 py-0.5 rounded text-[#16C7A1] text-xs">
                      {env}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <Zap className="w-10 h-10 text-[#16C7A1]/40 mb-2 animate-pulse" />
            <h4 className="text-base font-bold text-zinc-200">Execution Trace Explorer</h4>
            <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
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
                <div className="dash-sidebar-cat text-zinc-400 block text-center mb-1">
                  Inspector Actions
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setPreviewFile(selectedFile)}
                    className="flex-1 dash-btn-sm py-1.5 h-auto bg-zinc-900 border border-border/60 hover:bg-zinc-800"
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
                      className="flex-1 dash-btn-sm py-1.5 h-auto bg-primary text-background hover:bg-primary/90"
                    >
                      <Eye className="w-3 h-3 mr-1 text-background" />
                      View Impact
                    </Button>
                  )}
                </div>
                <div className="dash-metadata text-zinc-500 text-center mt-1">
                  Affected Modules: <span className="text-primary font-bold">{selectedFileNode.referencedBy?.length || 0} direct</span>, {(selectedFileNode.referencedBy?.length || 0) * 2} estimated total.
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/80 rounded-2xl bg-zinc-950/20 text-zinc-500">
            <Network className="w-10 h-10 text-zinc-700 mb-2" />
            <h4 className="dash-card-title text-zinc-300">Module Inspector</h4>
            <p className="dash-body text-zinc-500 max-w-xs mt-1 leading-relaxed">
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
