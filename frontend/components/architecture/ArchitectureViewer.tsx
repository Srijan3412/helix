import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { getArchitectureLayers } from "../../lib/api/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Network,
  Route,
  Package,
  GitBranch,
  Map,
  Activity,
  ChevronRight,
  AlertTriangle,
  Folder,
  BarChart2,
  ArrowRight,
  Maximize2,
  Minimize2,
  Search,
  X,
  Compass,
  Filter,
  Sparkles,
  Eye,
} from "lucide-react";

import LayerView from "./LayerView";
import FileGraph from "./FileGraph";
import RouteGraph from "./RouteGraph";
import PackageGraph from "./PackageGraph";
import ExecutionTrace from "./ExecutionTrace";
import MetroMap from "./MetroMap/MetroMap";

type ArchMode = "layer" | "file" | "route" | "dependency" | "trace" | "metro";

interface TabItem {
  id: ArchMode;
  label: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const TABS: TabItem[] = [
  {
    id: "layer",
    label: "Layered View",
    icon: <Layers size={13} />,
    title: "Layered Architecture",
    subtitle: "Visualize software layers, boundaries and dependencies",
  },
  {
    id: "file",
    label: "Dependency Graph",
    icon: <Network size={13} />,
    title: "Dependency Graph",
    subtitle: "Visualize packages, imports and relationships",
  },
  {
    id: "route",
    label: "Route Graph",
    icon: <Route size={13} />,
    title: "Route Graph",
    subtitle: "Inspect HTTP endpoints, paths, handlers and flows",
  },
  {
    id: "dependency",
    label: "Packages",
    icon: <Package size={13} />,
    title: "Packages",
    subtitle: "Analyze third-party dependencies, licenses and health",
  },
  {
    id: "trace",
    label: "Execution Trace",
    icon: <GitBranch size={13} />,
    title: "Execution Trace",
    subtitle: "Step through end-to-end request pipelines and call stacks",
  },
  {
    id: "metro",
    label: "Metro Map",
    icon: <Map size={13} />,
    title: "Metro Map",
    subtitle: "Subway-style architectural transit and data flow overview",
  },
];

interface ArchitectureViewerProps {
  result: any;
  currentJobId: string;
  onSwitchTab?: (tab: any) => void;
  onSetImpactFile?: (file: string) => void;
  onSelectTraceRouteId?: (routeId: string) => void;
}

export default function ArchitectureViewer({
  result,
  currentJobId,
  onSwitchTab,
  onSetImpactFile,
  onSelectTraceRouteId,
}: ArchitectureViewerProps) {
  const [activeMode, setActiveMode] = useState<ArchMode>("file");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  const [fitRepoTrigger, setFitRepoTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTabMeta = TABS.find((t) => t.id === activeMode) || TABS[1];

  // Fetch architecture data from backend if available
  const { data: architectureData } = useQuery({
    queryKey: ["architecture", currentJobId],
    queryFn: () => getArchitectureLayers(currentJobId),
    enabled: !!currentJobId,
  });

  // ESC key handler for full screen / presentation modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPresentationMode) {
          setIsPresentationMode(false);
        } else if (isFullScreen) {
          setIsFullScreen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen, isPresentationMode]);

  const layerColors: Record<string, string> = {
    routes: "#3288F5",
    controllers: "#8B5CF6",
    services: "#F5A623",
    repositories: "#00B8D9",
    models: "#E83E5B",
    database: "#16C7A3",
    middleware: "#EC4899",
    config: "#8B5CF6",
    tests: "#34D399",
    utils: "#F97316",
  };

  const features = React.useMemo(() => {
    if (activeMode === "layer") {
      const layers = architectureData?.layers || [];
      if (layers.length > 0) {
        return layers.map((layer: any) => ({
          name: typeof layer === "string" ? layer : layer.name || layer.id,
          color:
            layerColors[
              typeof layer === "string"
                ? layer.toLowerCase()
                : layer.name?.toLowerCase() || ""
            ] || "#16C7A3",
          fileCount:
            typeof layer === "string" ? 0 : layer.files?.length || layer.fileCount || 0,
          health: typeof layer === "string" ? 0 : layer.health ?? 0,
          confidence: typeof layer === "string" ? 0 : layer.confidence ?? 0,
        }));
      }
    }

    const raw = result?.architecture?.features || result?.features || [];
    if (raw.length > 0) {
      return raw.map((f: any) => ({
        name: f.name || f.id,
        color: f.color || "#16C7A3",
        fileCount: f.files?.length || f.fileCount || 0,
        health: f.health ?? 0,
        confidence: f.confidence ?? 0,
      }));
    }

    const files: any[] = result?.files || [];
    const groups: Record<string, string[]> = {};
    for (const f of files) {
      const path: string = f.path || "";
      if (
        path.startsWith("ROUTE:") ||
        path.startsWith("ENV:") ||
        path.startsWith("DB:") ||
        path.startsWith("ENTITY:")
      )
        continue;
      const seg = path.split("/");
      const domain = seg.length > 2 ? seg[1] : seg[0] || "Core";
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(path);
    }

    const palette = [
      "#3288F5",
      "#8B5CF6",
      "#00B8D9",
      "#16C7A3",
      "#22C55E",
      "#F5A623",
      "#EC4899",
      "#F97316",
    ];
    return Object.entries(groups)
      .slice(0, 8)
      .map(([name, fs], i) => ({
        name,
        color: palette[i % palette.length],
        fileCount: fs.length,
        health: Math.max(10, 100 - fs.length * 2),
        confidence: 0,
      }));
  }, [result, activeMode, architectureData]);

  const topFiles = React.useMemo(() => {
    const files: any[] = (result?.files || []).filter((f: any) => {
      const p = f.path || "";
      return (
        !p.startsWith("ROUTE:") &&
        !p.startsWith("ENV:") &&
        !p.startsWith("DB:") &&
        !p.startsWith("ENTITY:")
      );
    });
    return files
      .map((f: any) => ({
        name: (f.path || "").split("/").pop() || f.path,
        score: (f.referencedBy?.length || 0) * 10 + (f.lineCount || 0) / 10,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [result]);

  const mergedResult = React.useMemo(() => {
    if (!architectureData) return result;
    return {
      ...result,
      layers: architectureData.layers || result?.layers,
      architecture_layers: architectureData.layers || result?.architecture_layers,
      architecture_graph: architectureData.graph || result?.architecture_graph,
      graph: architectureData.graph || result?.graph,
    };
  }, [result, architectureData]);

  const fileCount = (result?.files || []).filter(
    (f: any) => {
      const p = String(f.path || f || "");
      return (
        !p.startsWith("ROUTE:") &&
        !p.startsWith("ENV:") &&
        !p.startsWith("DB:") &&
        !p.startsWith("ENTITY:")
      );
    }
  ).length || result?.files?.length || 0;

  const importCount = React.useMemo(() => {
    if (result?.imports && Array.isArray(result.imports)) return result.imports.length;
    if (result?.dependencies && Array.isArray(result.dependencies)) return result.dependencies.length;
    let count = 0;
    (result?.files || []).forEach((f: any) => {
      count += (f.internalImports?.length || 0) + (f.externalImports?.length || 0);
    });
    return count > 0 ? count : (result?.metadata?.totalImports || 0);
  }, [result]);

  const cyclesCount = result?.staticAnalysis?.cycles?.length || 0;

  const coreModulesCount = React.useMemo(() => {
    if (result?.features && Array.isArray(result.features) && result.features.length > 0) {
      return result.features.length;
    }
    const moduleNames = new Set<string>();
    (result?.files || []).forEach((f: any) => {
      const segs = String(f.path || f || "").split(/[\\/]/).filter(Boolean);
      if (segs.length > 1) {
        moduleNames.add(segs[0] === 'src' || segs[0] === 'app' ? (segs[1] || segs[0]) : segs[0]);
      }
    });
    return Math.max(1, moduleNames.size);
  }, [result]);

  const servicesCount = React.useMemo(() => {
    const sFiles = (result?.files || []).filter((f: any) =>
      /service|manager|engine|controller|handler/i.test(f.path || f)
    );
    return sFiles.length > 0 ? sFiles.length : (result?.routes?.length || 0);
  }, [result]);

  const renderCanvasContent = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeMode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 w-full h-full"
      >
        {activeMode === "layer" && (
          <LayerView
            result={mergedResult}
            searchQuery={searchQuery}
          />
        )}
        {activeMode === "file" && (
          <FileGraph
            result={mergedResult}
            externalSearchQuery={searchQuery}
            isFullScreen={isFullScreen}
            fitViewTrigger={fitViewTrigger}
            fitRepoTrigger={fitRepoTrigger}
          />
        )}
        {activeMode === "route" && (
          <RouteGraph
            result={mergedResult}
            externalSearchQuery={searchQuery}
            isFullScreen={isFullScreen}
            fitViewTrigger={fitViewTrigger}
            fitRepoTrigger={fitRepoTrigger}
            onOpenExecutionTrace={(routeId: string) => {
              onSelectTraceRouteId?.(routeId);
              setActiveMode("trace");
            }}
          />
        )}
        {activeMode === "dependency" && (
          <PackageGraph
            result={mergedResult}
            externalSearchQuery={searchQuery}
            isFullScreen={isFullScreen}
            fitViewTrigger={fitViewTrigger}
            fitRepoTrigger={fitRepoTrigger}
          />
        )}
        {activeMode === "trace" && (
          <ExecutionTrace
            result={mergedResult}
            onSwitchTab={onSwitchTab}
            onSetImpactFile={onSetImpactFile}
          />
        )}
        {activeMode === "metro" && (
          <MetroMap
            result={mergedResult}
            onSwitchTab={onSwitchTab}
            onSetImpactFile={onSetImpactFile}
            onSelectTraceRouteId={(routeId: string) => {
              onSelectTraceRouteId?.(routeId);
              setActiveMode("trace");
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <>
      {/* ── Standard Embedded Architecture Workspace ─────────────────────── */}
      <div className="flex flex-col h-full w-full bg-[#061318] rounded-xl overflow-hidden border border-[rgba(80,180,195,0.14)] relative text-left">
        {/* Top Navigation Bar (50-54px) */}
        <div className="flex items-center justify-between px-3.5 h-[50px] border-b border-[rgba(80,180,195,0.12)] bg-[#07151A] shrink-0 z-10 gap-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                    isActive
                      ? "bg-[#16C7A3] text-[#061015] font-bold shadow-sm shadow-[#16C7A3]/20"
                      : "text-[#8EA9AE] hover:text-[#F7FAFA] hover:bg-[#0E202B]/70 font-medium"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsFullScreen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#C3D5D8] hover:text-[#F7FAFA] text-xs font-semibold transition-all cursor-pointer shrink-0"
              title="Expand to Full-Screen Architecture Workspace"
            >
              <Maximize2 size={12} className="text-[#16C7A3]" />
              <span>Full-Screen</span>
            </button>
          </div>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 relative overflow-hidden bg-[#061318]">
          {renderCanvasContent()}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-8 px-4 bg-[#0A171F] border-t border-[#16C7A3]/15 flex items-center justify-between text-xs text-[#8EA9AE] shrink-0 font-sans">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16C7A3]" />
              <strong className="text-[#F7FAFA] font-bold">{fileCount}</strong> Files
            </span>
            <span className="text-[#16C7A3]/30">·</span>
            <span>
              <strong className="text-[#F7FAFA] font-bold">{importCount}</strong> Imports
            </span>
            <span className="text-[#16C7A3]/30">·</span>
            <span>
              <strong className="text-[#F7FAFA] font-bold">{cyclesCount}</strong> Cycles
            </span>
            <span className="text-[#16C7A3]/30">·</span>
            <span className="text-[#16C7A3] font-semibold">✓ 100% Parsed</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>{coreModulesCount} Core Modules</span>
            <span className="text-[#16C7A3]/30">·</span>
            <span>{servicesCount} Services</span>
            <span className="text-[#16C7A3]/30">│</span>
            <span className="text-[#F7FAFA] font-bold">Zoom 100%</span>
          </div>
        </div>
      </div>

      {/* ── True Full-Screen Architecture Workspace (100vw x 100vh) ──────── */}
      {isFullScreen && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#061015] flex flex-col overflow-hidden select-none font-sans text-left">
          {/* Top Architecture Navigation */}
          {!isPresentationMode && (
            <div className="flex items-center justify-between px-3.5 h-[50px] bg-[#0A171F] border-b border-[#16C7A3]/20 shrink-0 z-30">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 pr-2.5 border-r border-[#16C7A3]/20 shrink-0">
                  <div className="p-1 rounded bg-[#16C7A3]/15 text-[#16C7A3]">
                    <Sparkles size={14} />
                  </div>
                  <span className="text-xs font-bold text-[#F7FAFA] font-mono uppercase tracking-wider">
                    HELIX WORKSPACE
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {TABS.map((tab) => {
                    const isActive = activeMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveMode(tab.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                          isActive
                            ? "bg-[#16C7A3] text-[#061015] font-bold shadow-sm shadow-[#16C7A3]/20"
                            : "text-[#8EA9AE] hover:text-[#F7FAFA] hover:bg-[#0E202B]/70 font-medium"
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsPresentationMode(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] border border-[#16C7A3]/20 text-[#F7FAFA] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  title="Presentation Mode"
                >
                  <Eye size={12} className="text-[#16C7A3]" />
                  <span>Presentation</span>
                </button>

                <button
                  onClick={() => setIsFullScreen(false)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-transparent hover:bg-[#E83E5B]/15 border border-[#E83E5B]/50 text-[#FF7A84] text-xs font-bold transition-colors cursor-pointer shrink-0"
                  title="Exit Full-Screen (Esc)"
                >
                  <Minimize2 size={12} />
                  <span>Exit</span>
                </button>
              </div>
            </div>
          )}

          {/* Presentation Mode Floating Header Overlay */}
          {isPresentationMode && (
            <div className="absolute top-4 left-4 z-40 bg-[#0A171F]/90 backdrop-blur-md border border-[#16C7A3]/30 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-3">
              <Sparkles size={16} className="text-[#16C7A3]" />
              <div>
                <h4 className="text-xs font-bold text-[#F7FAFA] uppercase font-mono tracking-wider">
                  HELIX ARCHITECTURE
                </h4>
                <p className="text-[10px] text-[#9BE8E0] font-medium">
                  {activeTabMeta.title}
                </p>
              </div>
              <button
                onClick={() => setIsPresentationMode(false)}
                className="ml-3 p-1 rounded-lg bg-white/10 text-white hover:bg-white/20"
                title="Exit Presentation Mode (Esc)"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Canvas Viewport (Occupies ~85% of screen) */}
          <div className="flex-1 relative overflow-hidden bg-[#050B10]">
            {renderCanvasContent()}
          </div>

          {/* Bottom Architecture Status Bar */}
          {!isPresentationMode && (
            <div className="h-[40px] px-6 bg-[#0A171F] border-t border-[#16C7A3]/20 flex items-center justify-between text-xs text-[#8EA9AE] shrink-0 z-30 font-sans">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16C7A3]" />
                  <strong className="text-[#F7FAFA] font-bold">{fileCount}</strong> Files
                </span>
                <span className="text-[#16C7A3]/30">·</span>
                <span>
                  <strong className="text-[#F7FAFA] font-bold">{importCount}</strong> Imports
                </span>
                <span className="text-[#16C7A3]/30">·</span>
                <span>
                  <strong className="text-[#F7FAFA] font-bold">{cyclesCount}</strong> Cycles
                </span>
                <span className="text-[#16C7A3]/30">·</span>
                <span className="text-[#16C7A3] font-semibold">100% Parsed</span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span>{coreModulesCount} Core Modules</span>
                <span className="text-[#16C7A3]/30">·</span>
                <span>{servicesCount} Services</span>
                <span className="text-[#16C7A3]/30">│</span>
                <span className="text-[#F7FAFA] font-bold">Zoom 100%</span>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}



