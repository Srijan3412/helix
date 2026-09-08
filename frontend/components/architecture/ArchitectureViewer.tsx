"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getArchitectureLayers } from "../../lib/api/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Network,
  Route,
  Package,
  GitBranch,
  Train,
  Map,
  Activity,
  ChevronRight,
  AlertTriangle,
  Folder,
  BarChart2,
  ArrowRight,
} from "lucide-react";

import LayerView from "./LayerView";
import FileGraph from "./FileGraph";
import RouteGraph from "./RouteGraph";
import PackageGraph from "./PackageGraph";
import ExecutionTrace from "./ExecutionTrace";
import MetroMap from "./MetroMap/MetroMap";

type ArchMode = "layer" | "file" | "route" | "dependency" | "trace" | "metro";

const TABS: { id: ArchMode; label: string; icon: React.ReactNode }[] = [
  { id: "layer",      label: "Layered View",       icon: <Layers size={14} /> },
  { id: "file",       label: "Dependency Graph",    icon: <Network size={14} /> },
  { id: "route",      label: "Route Graph",         icon: <Route size={14} /> },
  { id: "dependency", label: "Package Dependencies",icon: <Package size={14} /> },
  { id: "trace",      label: "Execution Trace",     icon: <GitBranch size={14} /> },
  { id: "metro",      label: "Metro Map",           icon: <Map size={14} /> },
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
  const [activeMode, setActiveMode] = useState<ArchMode>("layer");

  // Fetch categorized layers and pre-generated graph from backend
  const { data: architectureData } = useQuery({
    queryKey: ["architecture", currentJobId],
    queryFn: () => getArchitectureLayers(currentJobId),
    enabled: !!currentJobId,
  });

  const layerColors: Record<string, string> = {
    routes: "#2F80ED",       // blue
    controllers: "#9B5CFF",  // purple
    services: "#F5B800",     // yellow
    repositories: "#00B8D9", // cyan
    models: "#FF4D5E",       // coral/red
    database: "#16C7A1",     // green
    middleware: "#EC4899",   // pink
    config: "#8B5CF6",       // violet
    tests: "#34D399",        // emerald
    utils: "#F97316"         // orange
  };

  // Derive sidebar info from result
  const features: { name: string; color: string; fileCount: number; health: number; confidence: number }[] =
    React.useMemo(() => {
      if (activeMode === "layer") {
        const layers = architectureData?.layers || [];
        if (layers.length > 0) {
          return layers.map((layer: any) => ({
            name: typeof layer === 'string' ? layer : layer.name || layer.id,
            color: layerColors[typeof layer === 'string' ? layer.toLowerCase() : (layer.name?.toLowerCase() || '')] || "#16C7A1",
            fileCount: typeof layer === 'string' ? 0 : layer.files?.length || layer.fileCount || 0,
            health: typeof layer === 'string' ? 0 : layer.health ?? 0,
            confidence: typeof layer === 'string' ? 0 : layer.confidence ?? 0,
            isLayer: true,
          }));
        }
      }

      const raw = result?.architecture?.features || result?.features || [];
      if (raw.length > 0) {
        return raw.map((f: any) => ({
          name: f.name || f.id,
          color: f.color || "#16C7A1",
          fileCount: f.files?.length || f.fileCount || 0,
          health: f.health ?? 0,
          confidence: f.confidence ?? 0,
          isLayer: false,
        }));
      }

      if (activeMode === "layer") {
        const defaultLayers = ["routes", "controllers", "services", "repositories", "models", "database"];
        return defaultLayers.map(name => ({
          name,
          color: layerColors[name.toLowerCase()] || "#16C7A1",
          fileCount: 0,
          health: 0,
          confidence: 0,
          isLayer: true,
        }));
      }

      const files: any[] = result?.files || [];
      const groups: Record<string, string[]> = {};
      for (const f of files) {
        const path: string = f.path || "";
        if (path.startsWith("ROUTE:") || path.startsWith("ENV:") || path.startsWith("DB:") || path.startsWith("ENTITY:")) continue;
        const seg = path.split("/");
        const domain = seg.length > 2 ? seg[1] : seg[0] || "Core";
        if (!groups[domain]) groups[domain] = [];
        groups[domain].push(path);
      }

      const palette = ["#3B82F6", "#8B5CF6", "#06B6D4", "#2DD4BF", "#22C55E", "#F5B800", "#F472B6", "#F97316"];
      return Object.entries(groups).slice(0, 8).map(([name, fs], i) => ({
        name,
        color: palette[i % palette.length],
        fileCount: fs.length,
        health: Math.max(10, 100 - fs.length * 2),
        confidence: 0,
        isLayer: false,
      }));
    }, [result, activeMode, architectureData]);

  const sidebarTitle = activeMode === "layer"
    ? "ARCHITECTURE LAYERS"
    : "CODEBASE FEATURES";

  const sidebarDesc = activeMode === "layer"
    ? "Click a layer to expand file listings or start a tier tour."
    : "Click any node to inspect file details and dependencies.";

  // PageRank — top files by incoming reference count
  const topFiles = React.useMemo(() => {
    const files: any[] = (result?.files || []).filter((f: any) => {
      const p = f.path || "";
      return !p.startsWith("ROUTE:") && !p.startsWith("ENV:") && !p.startsWith("DB:") && !p.startsWith("ENTITY:");
    });
    return files
      .map((f: any) => ({
        name: (f.path || "").split("/").pop() || f.path,
        score: (f.referencedBy?.length || 0) * 10 + (f.lineCount || 0) / 10,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [result]);

  return (
    <div className="flex flex-col h-full w-full bg-[#063D48] rounded-2xl overflow-hidden border border-[#16C7A1]/20 relative">
      {/* Decorative ambient background glows */}
      <div className="absolute top-12 left-8 w-72 h-72 bg-[#FF3344]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-96 h-96 bg-[#16C7A1]/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Tab Navigation ───────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 px-4 py-2 border-b border-[#16C7A1]/20 bg-[#062F38]/90 backdrop-blur-md shrink-0 z-10">
        {TABS.map((tab) => {
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#16C7A1] text-[#062F38] shadow-md shadow-[#16C7A1]/20 font-bold"
                  : "text-[#8EA9AE] hover:text-[#F7FAFA] hover:bg-[#084C58]/60"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Body: Sidebar + Canvas ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4 bg-[#063D48] relative z-10">

        {/* Left Analysis Workspace Panel */}
        {activeMode !== "metro" && (
          <aside
            className="w-[280px] shrink-0 h-full rounded-[14px] bg-[#062F38] border border-[#16C7A1]/20 shadow-xl overflow-y-auto analysis-scrollbar flex flex-col p-4 select-none"
            style={{
              scrollbarGutter: "stable",
            }}
          >
            {/* Header Block */}
            <div className="mb-4 shrink-0">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-1 rounded-md bg-[#16C7A1]/10 text-[#16C7A1] shrink-0">
                  <Activity size={20} className="text-[#16C7A1]" />
                </div>
                <div>
                  <h2 className="dash-section-heading text-sm font-bold leading-tight tracking-wider text-[#9BE8E0] uppercase font-sans">
                    {sidebarTitle === "ARCHITECTURE LAYERS" ? (
                      <>
                        ARCHITECTURE LAYERS
                      </>
                    ) : (
                      sidebarTitle
                    )}
                  </h2>
                  <div className="w-5 h-0.5 bg-[#FF3344] rounded-full mt-1" />
                </div>
              </div>
              <p className="dash-subtitle text-xs text-[#C3D5D8] leading-relaxed mt-2">
                {sidebarDesc}
              </p>
            </div>

            {/* Layer Cards */}
            <div className="space-y-2 flex-1">
              {features.map((feat, i) => {
                const healthBad = feat.health > 0 && feat.health < 40;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="w-full bg-[#084C58]/55 border border-[#0F8E94]/30 rounded-xl p-3 cursor-pointer hover:border-[#16C7A1]/50 hover:bg-[#084C58]/80 transition-all duration-200 flex flex-col gap-1.5"
                    style={{
                      borderLeftWidth: "3.5px",
                      borderLeftColor: feat.color,
                    }}
                  >
                    {/* Top Row: Colored Marker + Layer Title + Chevron */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{
                            backgroundColor: feat.color,
                            boxShadow: `0 0 6px ${feat.color}40`,
                          }}
                        />
                        <span className="dash-card-title text-sm font-bold text-[#F7FAFA] lowercase tracking-tight">
                          {feat.name.toLowerCase()}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-[#9BE8E0]/70" />
                    </div>

                    {/* Middle Row: Metrics */}
                    <div className="flex items-center gap-2.5 my-0.5 text-xs">
                      <div className="flex items-center gap-1">
                        {healthBad && <AlertTriangle size={13} className="text-[#FF3344] shrink-0" />}
                        <span className={`dash-value text-xs font-bold ${healthBad ? "text-[#FF3344]" : "text-[#F7FAFA]"}`}>
                          {feat.health}
                        </span>
                        <span className="dash-metadata text-[11px] text-[#8EA9AE]">Health</span>
                      </div>
                      <span className="text-[#0F8E94]/40 font-light text-[11px]">│</span>
                      <div className="flex items-center gap-1">
                        <span className="dash-value text-xs font-bold text-[#F7FAFA]">
                          {Math.round(feat.confidence <= 1 ? feat.confidence * 100 : feat.confidence)}%
                        </span>
                        <span className="dash-metadata text-[11px] text-[#8EA9AE]">Conf</span>
                      </div>
                    </div>

                    {/* Bottom Row: File Count */}
                    <div className="flex items-center gap-1.5 text-xs text-[#C3D5D8]">
                      <Folder size={14} className="text-[#16C7A1] shrink-0" />
                      <span className="dash-body text-xs">{feat.fileCount} files</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* PageRank Importance Section */}
            {topFiles.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#16C7A1]/20 shrink-0">
                <div>
                  <h4 className="dash-eyebrow text-xs font-bold tracking-wider text-[#9BE8E0] uppercase font-sans">
                    PAGERANK IMPORTANCE
                  </h4>
                  <div className="w-5 h-0.5 bg-[#FF3344] rounded-full mt-1" />
                </div>
                <div className="space-y-1.5 mt-2.5">
                  {topFiles.map((f, i) => (
                    <div
                      key={i}
                      className="h-8 flex items-center justify-between px-2.5 rounded-lg bg-[#084C58]/30 border border-[#0F8E94]/20 hover:border-[#16C7A1]/40 transition-colors text-xs"
                    >
                      <span className="text-[#16C7A1] font-bold text-xs w-4">
                        {i + 1}
                      </span>
                      <span className="dash-filepath text-xs text-[#F7FAFA] font-medium truncate flex-1 px-2">
                        {f.name}
                      </span>
                      <div
                        className={`px-2 py-0.5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          i === 0
                            ? "bg-[#FF3344]/22 text-[#FF7A84] border border-[#FF3344]/40 shadow-sm"
                            : "bg-[#9BE8E0]/12 text-[#B8E9E6] border border-[#9BE8E0]/20"
                        }`}
                      >
                        {Math.round(f.score)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* View Full Rankings Button */}
                <button
                  onClick={() => {
                    setActiveMode("file");
                  }}
                  className="w-full h-8 mt-2.5 rounded-lg flex items-center justify-center gap-2 bg-[#16C7A1]/12 hover:bg-[#16C7A1]/22 border border-[#16C7A1]/30 hover:border-[#16C7A1]/60 text-[#9BE8E0] hover:text-[#F7FAFA] font-semibold text-xs transition-all duration-200 shadow-md group cursor-pointer"
                >
                  <BarChart2 size={14} className="text-[#16C7A1] group-hover:scale-110 transition-transform" />
                  <span className="dash-btn-sm">View Full Rankings</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </aside>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-[#03242B]/80 rounded-[18px] border border-[#16C7A1]/15">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
            >
              {activeMode === "layer" && <LayerView result={result} />}
              {activeMode === "file" && <FileGraph result={result} />}
              {activeMode === "route" && <RouteGraph result={result} />}
              {activeMode === "dependency" && <PackageGraph result={result} />}
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
        </div>
      </div>
    </div>
  );
}

