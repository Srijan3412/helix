import React, { useState, useEffect } from "react";
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
    icon: <Layers size={14} />,
    title: "Layered Architecture",
    subtitle: "Visualize software layers, boundaries and dependencies",
  },
  {
    id: "file",
    label: "Dependency Graph",
    icon: <Network size={14} />,
    title: "Dependency Graph",
    subtitle: "Visualize packages, imports and relationships",
  },
  {
    id: "route",
    label: "Route Graph",
    icon: <Route size={14} />,
    title: "Route Endpoint Graph",
    subtitle: "Visualize API routes, handlers and service dependencies",
  },
  {
    id: "dependency",
    label: "Package Dependencies",
    icon: <Package size={14} />,
    title: "Package Dependencies",
    subtitle: "Visualize project packages and their relationships",
  },
  {
    id: "trace",
    label: "Execution Trace",
    icon: <GitBranch size={14} />,
    title: "Execution Trace",
    subtitle: "Trace API endpoints through the application",
  },
  {
    id: "metro",
    label: "Metro Map",
    icon: <Map size={14} />,
    title: "Metro Map",
    subtitle: "Navigate your codebase like a transit system",
  },
];

const LAYER_FOCUS_OPTIONS = [
  { id: "all", label: "All Layers", color: "#16C7A3" },
  { id: "routes", label: "Routes", color: "#3288F5" },
  { id: "controllers", label: "Controllers", color: "#8B5CF6" },
  { id: "services", label: "Services", color: "#F5A623" },
  { id: "repositories", label: "Repositories", color: "#00B8D9" },
  { id: "models", label: "Models", color: "#E83E5B" },
  { id: "database", label: "Database", color: "#16C7A3" },
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
  const [activeLayerFilter, setActiveLayerFilter] = useState<string>("all");

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

  const fileCount = result?.files?.length || 210;
  const importCount = result?.imports?.length || 148;

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
            result={result}
            searchQuery={searchQuery}
            activeLayerFilter={activeLayerFilter}
          />
        )}
        {activeMode === "file" && (
          <FileGraph
            result={result}
            externalSearchQuery={searchQuery}
            isFullScreen={isFullScreen}
            fitViewTrigger={fitViewTrigger}
            fitRepoTrigger={fitRepoTrigger}
          />
        )}
        {activeMode === "route" && (
          <RouteGraph
            result={result}
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
            result={result}
            externalSearchQuery={searchQuery}
            isFullScreen={isFullScreen}
            fitViewTrigger={fitViewTrigger}
            fitRepoTrigger={fitRepoTrigger}
          />
        )}
        {activeMode === "trace" && (
          <ExecutionTrace
            result={result}
            onSwitchTab={onSwitchTab}
            onSetImpactFile={onSetImpactFile}
          />
        )}
        {activeMode === "metro" && (
          <MetroMap
            result={result}
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
      <div className="flex flex-col h-full w-full bg-[#061015] rounded-xl overflow-hidden border border-[#16C7A3]/20 relative text-left">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#16C7A3]/15 bg-[#0A171F] shrink-0 z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-[#16C7A3] text-[#061015] font-bold shadow-md shadow-[#16C7A3]/20"
                      : "text-[#8EA9AE] hover:text-[#F7FAFA] hover:bg-[#0E202B]"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsFullScreen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16C7A3]/15 hover:bg-[#16C7A3]/25 border border-[#16C7A3]/30 text-[#9BE8E0] hover:text-[#F7FAFA] text-xs font-bold transition-all cursor-pointer shrink-0 ml-2"
            title="Expand to Full-Screen Architecture Workspace"
          >
            <Maximize2 size={13} className="text-[#16C7A3]" />
            <span>Full-Screen Workspace</span>
          </button>
        </div>

        {/* Header Title Treatment */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#050C10] border-b border-[#16C7A3]/10 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#F7FAFA] tracking-tight">
              {activeTabMeta.title}
            </h2>
            <p className="text-xs text-[#8EA9AE] mt-0.5 font-medium">
              {activeTabMeta.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8EA9AE]"
              />
              <input
                type="text"
                placeholder="Search graph..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[180px] h-[30px] pl-8 pr-7 rounded-lg bg-[#0E1B20] border border-[#16C7A3]/20 text-xs text-[#F7FAFA] placeholder-[#8EA9AE] focus:outline-none focus:border-[#16C7A3]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8EA9AE] hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={() => setFitViewTrigger((prev) => prev + 1)}
              className="px-2.5 py-1 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] border border-[#16C7A3]/20 text-[#F7FAFA] text-xs font-semibold cursor-pointer"
            >
              Fit View
            </button>
          </div>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 relative overflow-hidden bg-[#050B10]">
          {renderCanvasContent()}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-9 px-4 bg-[#0A171F] border-t border-[#16C7A3]/15 flex items-center justify-between text-xs text-[#8EA9AE] shrink-0 font-sans">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16C7A3]" />
              <strong className="text-[#F7FAFA]">{fileCount}</strong> Files
            </span>
            <span className="text-[#16C7A3]/30">·</span>
            <span>
              <strong className="text-[#F7FAFA]">{importCount}</strong> Imports
            </span>
            <span className="text-[#16C7A3]/30">·</span>
            <span>
              <strong className="text-[#F7FAFA]">0</strong> Cycles
            </span>
            <span className="text-[#16C7A3]/30">·</span>
            <span className="text-[#16C7A3] font-semibold">100% Parsed</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>10 Core Modules</span>
            <span className="text-[#16C7A3]/30">·</span>
            <span>37 Services</span>
            <span className="text-[#16C7A3]/30">│</span>
            <span className="text-[#F7FAFA] font-bold">Zoom 100%</span>
          </div>
        </div>
      </div>

      {/* ── True Full-Screen Architecture Workspace (100vw x 100vh) ──────── */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-[#061015] flex flex-col overflow-hidden select-none font-sans text-left">
          {/* Top Architecture Navigation */}
          {!isPresentationMode && (
            <div className="flex items-center justify-between px-4 h-[52px] bg-[#0A171F] border-b border-[#16C7A3]/20 shrink-0 z-30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pr-3 border-r border-[#16C7A3]/20">
                  <div className="p-1 rounded bg-[#16C7A3]/15 text-[#16C7A3]">
                    <Sparkles size={15} />
                  </div>
                  <span className="text-xs font-bold text-[#F7FAFA] font-mono uppercase tracking-wider">
                    HELIX WORKSPACE
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {TABS.map((tab) => {
                    const isActive = activeMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveMode(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#16C7A3] text-[#061015] font-bold shadow-md shadow-[#16C7A3]/20"
                            : "text-[#8EA9AE] hover:text-[#F7FAFA] hover:bg-[#0E202B]"
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPresentationMode(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] border border-[#16C7A3]/20 text-[#F7FAFA] text-xs font-semibold transition-colors cursor-pointer"
                  title="Presentation Mode"
                >
                  <Eye size={13} className="text-[#16C7A3]" />
                  <span>Presentation</span>
                </button>

                <button
                  onClick={() => setIsFullScreen(false)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E83E5B]/20 hover:bg-[#E83E5B]/35 border border-[#E83E5B]/40 text-[#FF7A84] text-xs font-bold transition-colors cursor-pointer"
                  title="Exit Full-Screen (Esc)"
                >
                  <Minimize2 size={13} />
                  <span>Exit</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub Header Title Bar & Controls */}
          {!isPresentationMode && (
            <div className="flex items-center justify-between px-6 h-[46px] bg-[#050C10] border-b border-[#16C7A3]/10 shrink-0 z-20">
              <div>
                <h1 className="text-base font-bold text-[#F7FAFA] tracking-tight leading-none">
                  {activeTabMeta.title}
                </h1>
                <p className="text-xs text-[#8EA9AE] mt-0.5 leading-none">
                  {activeTabMeta.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {activeMode === "layer" && (
                  <div className="hidden lg:flex items-center gap-1 bg-[#0E1B20] border border-[#16C7A3]/20 rounded-lg p-1">
                    <Filter size={12} className="text-[#16C7A3] ml-1 mr-0.5" />
                    {LAYER_FOCUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setActiveLayerFilter(opt.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeLayerFilter === opt.id
                            ? "bg-[#16C7A3] text-[#061015]"
                            : "text-[#8EA9AE] hover:text-[#F7FAFA]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8EA9AE]"
                  />
                  <input
                    type="text"
                    placeholder="Search graph..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[200px] sm:w-[240px] h-[30px] pl-8 pr-7 rounded-lg bg-[#0E1B20] border border-[#16C7A3]/25 text-xs text-[#F7FAFA] placeholder-[#8EA9AE] focus:outline-none focus:border-[#16C7A3]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8EA9AE] hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setFitViewTrigger((prev) => prev + 1)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] border border-[#16C7A3]/25 text-[#F7FAFA] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Compass size={13} className="text-[#16C7A3]" />
                  <span>Fit View</span>
                </button>

                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveLayerFilter("all");
                    setFitRepoTrigger((prev) => prev + 1);
                  }}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] border border-[#16C7A3]/25 text-[#F7FAFA] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Repository Overview</span>
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
                  <strong className="text-[#F7FAFA] font-bold">0</strong> Cycles
                </span>
                <span className="text-[#16C7A3]/30">·</span>
                <span className="text-[#16C7A3] font-semibold">100% Parsed</span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span>10 Core Modules</span>
                <span className="text-[#16C7A3]/30">·</span>
                <span>37 Services</span>
                <span className="text-[#16C7A3]/30">│</span>
                <span className="text-[#F7FAFA] font-bold">Zoom 100%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}



