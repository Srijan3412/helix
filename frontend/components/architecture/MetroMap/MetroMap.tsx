import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ReactFlow, 
  Background, 
  Handle, 
  Position, 
  PanOnScrollMode 
} from "@xyflow/react";
import { useAnalysisStore } from "../../../store/analysis.store";
import { getFeaturesMap } from "../../../lib/api/client";
import { FeatureFlow } from "@shared/types";
import { Loader2, HelpCircle, Download } from "lucide-react";

// ── Import extracted components and hooks ──
import FeatureLegend from "./FeatureLegend";
import FeatureDetails from "./FeatureDetails";
import { useMetroLayout } from "./useMetroLayout";
import { useMetroGraph } from "./useMetroGraph";
import { TrackHeaders } from "./TrackHeaders";

// ── Constants ──
const HEALTH_GOOD_THRESHOLD = 70;
const HEALTH_WARNING_THRESHOLD = 40;
const STATIONS_PER_PAGE = 9999;

// ── Custom Metro Station Node ──
interface MetroStationNodeProps {
  data: {
    stationNumber: string;
    typeLabel: string;
    displayName: string;
    color: string;
    isActive: boolean;
    hasHighComplexity: boolean;
    healthGlowActive: boolean;
    complexity: number;
    isSelected: boolean;
    onClick: () => void;
    rawType?: string;
    health?: number;
    nextStationName?: string;
    lineName?: string;
  };
}

function MetroStationNode({ data }: MetroStationNodeProps) {
  const {
    stationNumber,
    typeLabel,
    displayName,
    color,
    isActive,
    isSelected,
    onClick,
    rawType = "route",
    health = 50,
    nextStationName,
    lineName = ""
  } = data;

  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer min-w-[140px] group transition-all duration-300"
      style={{ width: "140px", opacity: isActive ? 1.0 : 0.25 }}
    >
      {/* Horizontal handles for track connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ top: "35px", background: color, border: `1.5px solid ${color}`, width: "8px", height: "8px", zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ top: "35px", background: color, border: `1.5px solid ${color}`, width: "8px", height: "8px", zIndex: 10 }}
      />

      {/* Vertical handles for transfer connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ left: "50%", background: "#52525b", border: "1.5px solid #27272a", width: "6px", height: "6px", zIndex: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ left: "50%", bottom: "0px", background: "#52525b", border: "1.5px solid #27272a", width: "6px", height: "6px", zIndex: 10 }}
      />

      {/* Station Card */}
      <div
        className="relative bg-zinc-900/95 border-2 rounded-xl p-3 shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50 text-left"
        style={{
          borderColor: color,
          width: "140px",
          height: "180px",
          boxShadow: isSelected ? `0 0 16px ${color}a0` : `0 4px 6px -1px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Vintage Tile Letters */}
        <div className="flex justify-center gap-0.5 mb-1.5">
          {stationNumber.split('').map((char, idx) => (
            <div key={idx} className="w-5 h-5 bg-zinc-800/80 border border-zinc-700/50 rounded flex items-center justify-center text-[8px] font-bold text-zinc-300 font-mono">
              {char}
            </div>
          ))}
        </div>

        {/* Station Code & Time */}
        <div className="flex items-center justify-between text-[7px] text-zinc-400">
          <span className="font-mono font-bold text-white text-[8px]">🚉 {stationNumber}</span>
          <span className="text-zinc-500 text-[7px]">🕐 {localTime}</span>
        </div>

        {/* Type / Method Action prefix */}
        <div className="text-[9px] font-bold font-mono tracking-wider mt-1.5 text-zinc-400">
          {typeLabel}
        </div>

        {/* Route Details */}
        <div className="text-[10px] font-mono font-bold text-white truncate max-w-[100px] mt-0.5 leading-tight" title={displayName}>
          {displayName}
        </div>

        {/* Route Type */}
        <div className="text-[7px] text-zinc-500 uppercase tracking-wider mt-0.5">
          {rawType === 'route' ? 'ROUTE' : rawType === 'database' ? 'DATABASE' : rawType.toUpperCase()}
        </div>

        {/* LIVE indicator */}
        {rawType === 'route' && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[6px] font-bold text-red-500 animate-pulse">🔴 LIVE</span>
            <span className="text-[6px] text-zinc-500">⚡ {Math.floor(Math.random() * 20) + 5} req/s</span>
          </div>
        )}

        {/* Health Bar */}
        <div className="mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[5px] text-zinc-500">HEALTH</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${health}%`,
                  backgroundColor: health > HEALTH_GOOD_THRESHOLD ? '#34d399' : health > HEALTH_WARNING_THRESHOLD ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
            <span className="text-[7px] font-bold text-zinc-300">{health}%</span>
          </div>
        </div>

        {/* Next Station Preview */}
        {nextStationName && (
          <div className="mt-1.5 text-[7px] text-zinc-500 truncate max-w-[100px]" title={nextStationName}>
            🔄 Next: {nextStationName}
          </div>
        )}

        {/* Line Name */}
        {lineName && (
          <div className="absolute bottom-2 left-3 right-3 text-[7px] text-primary/50 uppercase tracking-wider font-bold truncate">
            🚇 {lineName.substring(0, 16)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main MetroMap Component ──
export default function MetroMap({ 
  result, 
  onSwitchTab, 
  onSetImpactFile, 
  onSelectTraceRouteId 
}: any) {
  const { currentJobId } = useAnalysisStore();
  
  const nodeTypes = useMemo(() => ({
    station: MetroStationNode,
  }), []);

  // ── State ──
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [healthGlowActive, setHealthGlowActive] = useState<boolean>(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [expandedStation, setExpandedStation] = useState<string | null>(null);
  const [journeyActive, setJourneyActive] = useState(false);
  const [journeyNodeId, setJourneyNodeId] = useState<string | null>(null);
  const [journeyFeatureId, setJourneyFeatureId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Fetch Data ──
  const { data, isLoading } = useQuery({
    queryKey: ["featuresMap", currentJobId],
    queryFn: () => getFeaturesMap(currentJobId!),
    enabled: !!currentJobId,
  });

  const features = useMemo(() => data?.features || [], [data]);

  // ── Helper Functions ──
  const getStationTypeLabel = useCallback((station: any) => {
    if (station.type === 'route') {
      const r = station.raw || "";
      const spaceIdx = r.indexOf(" ");
      return spaceIdx > 0 ? r.substring(0, spaceIdx) : "GET";
    }
    if (station.type === 'database') return 'DB';
    if (station.type === 'middleware') return 'MID';
    if (station.type === 'controller') return 'CONT';
    if (station.type === 'repository') return 'REPO';
    if (station.type === 'service') return 'SERV';
    return station.type.toUpperCase();
  }, []);

  const getStationDisplayName = useCallback((station: any) => {
    if (station.type === 'route') {
      const parts = station.label.split(' ');
      return parts.length > 1 ? parts[1] : station.label;
    }
    if (station.type === 'file') {
      const name = station.raw?.split(/[\\/]/).pop() || station.label;
      return name.replace(/\.[^.]+$/, '');
    }
    if (station.type === 'db') {
      return station.raw || station.label;
    }
    return station.label || station.raw || '';
  }, []);

  const getStationNumber = useCallback((feature: FeatureFlow, index: number) => {
    const prefix = feature.name.substring(0, 2).toUpperCase();
    return `${prefix}${String(index + 1).padStart(2, '0')}`;
  }, []);

  const getComplexityScore = useCallback((filePath: string) => {
    if (!filePath || !result?.staticAnalysis?.complexity) return 0;
    const info = result.staticAnalysis.complexity.find((c: any) => c.file === filePath);
    return info ? info.score : 0;
  }, [result]);

  // ── Build Feature Lines ──
  const featureLines = useMemo(() => {
    const lines: Record<string, any[]> = {};
    features.forEach((feature: FeatureFlow) => {
      const routeStations = feature.routes.map((r: string) => {
        const spaceIdx = r.indexOf(" ");
        const method = spaceIdx > 0 ? r.substring(0, spaceIdx) : "GET";
        const path = spaceIdx > 0 ? r.substring(spaceIdx + 1) : r;
        return {
          id: `station:${feature.id}:route:${method}:${path}`,
          label: r,
          type: "route",
          key: `route:${method}:${path}`,
          raw: r
        };
      });

      const fileStations = feature.files.map((fPath: string) => {
        const filename = fPath.split(/[\\/]/).pop() || fPath;
        return {
          id: `station:${feature.id}:file:${fPath}`,
          label: filename,
          type: "file",
          key: `file:${fPath}`,
          raw: fPath
        };
      });

      const dbStations = (feature.database || []).map((ent: string) => ({
        id: `station:${feature.id}:db:${ent}`,
        label: ent,
        type: "database",
        key: `db:${ent}`,
        raw: ent
      }));

      const allStations = [...routeStations, ...fileStations, ...dbStations];
      lines[feature.id] = allStations;
    });
    return lines;
  }, [features]);

  const maxStationsCount = useMemo(() => {
    let maxCount = 0;
    features.forEach((feature: FeatureFlow) => {
      const count = featureLines[feature.id]?.length || 0;
      if (count > maxCount) maxCount = count;
    });
    return maxCount;
  }, [features, featureLines]);

  // ── Filter Features ──
  const filteredFeatures = useMemo(() => {
    if (selectedFeatures.length === 0) {
      return features;
    }
    const matched = features.filter((f: FeatureFlow) => selectedFeatures.includes(f.id));
    return matched.length > 0 ? matched : features;
  }, [features, selectedFeatures]);

  // ── Layout Hook ──
  const { positions, canvasWidth, canvasHeight } = useMetroLayout(
    features,
    filteredFeatures,
    selectedFeatures,
    featureLines,
    maxStationsCount,
    STATIONS_PER_PAGE
  );

  // ── Station Click Handler ──
  const handleStationClick = useCallback((stationId: string, _stationRaw: string, feature: FeatureFlow) => {
    setSelectedStationId(stationId);
    setSelectedFeature(feature.id);
  }, []);

  // ── Graph Hook ──
  const { nodes, edges } = useMetroGraph({
    filteredFeatures,
    features,
    featureLines,
    positions,
    selectedFeatures,
    hoveredFeature,
    selectedStationId,
    healthGlowActive,
    journeyActive,
    journeyNodeId,
    journeyFeatureId,
    getStationTypeLabel,
    getStationDisplayName,
    getStationNumber,
    getComplexityScore,
    onStationClick: handleStationClick,
    expandedStation,
    setExpandedStation,
    result
  });

  // ── Scroll Handling ──
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
      setViewportWidth(scrollContainerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      setViewportWidth(container.clientWidth);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // ── Fit View on Filter Change ──
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.15,
          duration: 300
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedFeatures, nodes.length, reactFlowInstance]);

  // ── Toggle Feature ──
  const toggleFeature = useCallback((featureId: string) => {
    setIsFiltering(true);
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
    setTimeout(() => setIsFiltering(false), 200);
  }, []);

  // ── Export SVG ──
  const exportToSvg = useCallback(() => {
    if (nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      const x = n.position.x;
      const y = n.position.y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });

    const padding = 150;
    const width = (maxX - minX) + padding * 2;
    const height = (maxY - minY) + padding * 2;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${width} ${height}" width="${width}" height="${height}" style="background-color: #09090b; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">`;
    svgContent += `<rect x="${minX - padding}" y="${minY - padding}" width="${width}" height="${height}" fill="#09090b" />`;

    // Background dots
    for (let gx = Math.floor((minX - padding) / 20) * 20; gx < maxX + padding; gx += 20) {
      for (let gy = Math.floor((minY - padding) / 20) * 20; gy < maxY + padding; gy += 20) {
        svgContent += `<circle cx="${gx}" cy="${gy}" r="0.75" fill="#27272a" />`;
      }
    }

    // Edges
    edges.forEach(e => {
      const sourceNode = nodes.find(n => n.id === e.source);
      const targetNode = nodes.find(n => n.id === e.target);
      if (!sourceNode || !targetNode) return;
      const stroke = e.style?.stroke || "#71717a";
      const strokeWidth = e.style?.strokeWidth || 4;
      svgContent += `<line x1="${sourceNode.position.x + 85}" y1="${sourceNode.position.y + 30}" x2="${targetNode.position.x + 85}" y2="${targetNode.position.y + 30}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
    });

    // Nodes
    nodes.forEach(n => {
      const x = n.position.x;
      const y = n.position.y;
      const parts = n.id.split(":");
      const featureId = parts[1];
      const type = parts[2];
      let labelText = "";
      if (type === "route") {
        labelText = `${parts[3]} ${parts.slice(4).join(":")}`;
      } else if (type === "file") {
        labelText = parts.slice(3).join(":").split(/[\\/]/).pop() || "";
      } else {
        labelText = parts.slice(3).join(":");
      }
      const feature = features.find((f: FeatureFlow) => f.id === featureId);
      const color = feature ? feature.color : "#a1a1aa";
      svgContent += `
        <g>
          <rect x="${x}" y="${y}" width="170" height="60" rx="10" fill="#09090b" stroke="${color}" stroke-width="1.5" />
          <circle cx="${x + 18}" cy="${y + 18}" r="3.5" fill="${color}" />
          <text x="${x + 28}" y="${y + 21}" fill="#a1a1aa" font-size="7" font-weight="bold" letter-spacing="1">${type.toUpperCase()}</text>
          <text x="${x + 15}" y="${y + 42}" fill="#e4e4e7" font-size="9" font-weight="bold" font-family="monospace">${labelText}</text>
        </g>
      `;
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result?.overview?.repoName || "repository"}-metro-map.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, features, result]);

  // ── Journey Controls ──
  const startJourney = useCallback((featureId: string) => {
    setJourneyActive(true);
    setJourneyFeatureId(featureId);
    const stations = featureLines[featureId] || [];
    if (stations.length > 0) {
      setJourneyNodeId(stations[0].id);
      setSelectedStationId(stations[0].id);
    }
  }, [featureLines]);

  const stopJourney = useCallback(() => {
    setJourneyActive(false);
    setJourneyNodeId(null);
    setJourneyFeatureId(null);
  }, []);

  // ── Render ──
  if (isLoading) {
    return (
      <div className="h-[480px] flex flex-col items-center justify-center text-zinc-550 gap-2 bg-zinc-950/40 border border-border/60 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-semibold">Discovering and mapping code features...</span>
      </div>
    );
  }

  const activeDetailsScope = selectedStationId || selectedFeature || (selectedFeatures.length === 1 ? selectedFeatures[0] : null);

  return (
    <div className="h-full w-full text-left relative flex flex-col">
      {/* ── FILTER CONTROLS ── */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/40 border-b border-border/30 shrink-0">
        <button
          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap border ${
            selectedFeatures.length === 0
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-zinc-800/60 text-zinc-400 border-transparent hover:border-white/10'
          }`}
          onClick={() => setSelectedFeatures([])}
        >
          All
        </button>

        {features.slice(0, 8).map((f: FeatureFlow) => (
          <button
            key={f.id}
            className="px-3 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap border"
            style={{
              backgroundColor: selectedFeatures.includes(f.id) ? f.color : '#27272a',
              color: selectedFeatures.includes(f.id) ? 'white' : '#a1a1aa',
              borderColor: selectedFeatures.includes(f.id) ? f.color : 'transparent',
            }}
            onClick={() => toggleFeature(f.id)}
          >
            {f.name}
          </button>
        ))}

        {features.length > 8 && (
          <span className="text-[9px] text-zinc-500 ml-1.5 font-semibold">+{features.length - 8} more</span>
        )}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── FEATURE LEGEND ── */}
        <aside className="w-52 shrink-0 flex flex-col border-r border-border/30 bg-zinc-900/60 overflow-hidden">
          <FeatureLegend
            features={features}
            result={result}
            hoveredFeature={hoveredFeature}
            setHoveredFeature={setHoveredFeature}
            selectedFeatures={selectedFeatures}
            setSelectedFeatures={setSelectedFeatures}
          />
        </aside>

        {/* ── CANVAS ── */}
        <div className="flex-1 h-full relative bg-zinc-950/20">
          {/* ── SCROLLABLE CONTAINER ── */}
          <div
            ref={scrollContainerRef}
            className="w-full h-full overflow-auto scrollbar-hide relative"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* ── TRACK HEADERS (Sticky over canvas) ── */}
            <TrackHeaders
              filteredFeatures={filteredFeatures}
              canvasWidth={canvasWidth}
              scrollLeft={scrollLeft}
              viewportWidth={viewportWidth}
            />

            {isFiltering && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            <div style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onInit={setReactFlowInstance}
                fitView={false}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                panOnDrag={[0, 1, 2]}
                panOnScroll={true}
                panOnScrollMode={PanOnScrollMode.Horizontal}
                zoomOnScroll={false}
                minZoom={0.6}
                maxZoom={1.5}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
                style={{ width: '100%', height: '100%' }}
              >
                <Background color="#222" gap={20} />
              </ReactFlow>
            </div>
          </div>

          {/* ── MAP CONTROLS ── */}
          <div className={`absolute top-3 z-10 flex items-center gap-2 bg-zinc-900/90 border border-border/60 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg transition-all duration-300 ${activeDetailsScope ? "right-[340px] sm:right-[400px]" : "right-3"}`}>
            <button
              onClick={exportToSvg}
              className="flex items-center gap-1.5 bg-zinc-950 border border-border/60 hover:border-zinc-500 hover:text-white px-2 py-1 rounded-lg text-[9px] font-extrabold text-zinc-350 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SVG</span>
            </button>

            <div className="w-[1px] h-3.5 bg-border/60" />

            <button
              onClick={() => {
                if (reactFlowInstance) {
                  reactFlowInstance.fitView({ padding: 0.15, duration: 400 });
                }
              }}
              className="flex items-center gap-1.5 bg-zinc-950 border border-border/60 hover:border-zinc-500 hover:text-white px-2 py-1 rounded-lg text-[9px] font-extrabold text-zinc-350 shadow-sm transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Fit View</span>
            </button>

            <div className="w-[1px] h-3.5 bg-border/60" />

            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Health Glow</span>
            <button
              onClick={() => setHealthGlowActive(!healthGlowActive)}
              className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center ${healthGlowActive ? "bg-primary" : "bg-zinc-700"}`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-zinc-950 transition-transform ${healthGlowActive ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          {/* ── LEGEND HINT ── */}
          <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-zinc-900/95 border border-border/60 text-[9.5px] font-bold text-zinc-400 pointer-events-none flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
            <span>Software Metro Map Dashboard</span>
          </div>

          {/* ── FLOATING DETAILS ── */}
          <div className={`absolute top-3 right-3 bottom-3 z-20 w-80 sm:w-96 transition-all duration-300 transform ${activeDetailsScope ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}>
            {activeDetailsScope && (
              <FeatureDetails
                stationId={selectedStationId}
                featureId={selectedFeature || (selectedFeatures.length === 1 ? selectedFeatures[0] : null)}
                result={result}
                features={features}
                onClose={() => {
                  setSelectedStationId(null);
                  setSelectedFeature(null);
                  setSelectedFeatures([]);
                }}
                onSwitchTab={onSwitchTab}
                onSetImpactFile={onSetImpactFile}
                onSelectTraceRouteId={onSelectTraceRouteId}
                onStartJourney={startJourney}
                onStopJourney={stopJourney}
                journeyActive={journeyActive}
                journeyNodeId={journeyNodeId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}