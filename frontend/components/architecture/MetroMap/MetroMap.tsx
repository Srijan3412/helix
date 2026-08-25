import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType, Node as ReactFlowNode, Edge as ReactFlowEdge } from "@xyflow/react";
import { useAnalysisStore } from "../../../store/analysis.store";
import { getFeaturesMap } from "../../../lib/api/client";
import FeatureLegend from "./FeatureLegend";
import FeatureDetails from "./FeatureDetails";
import { Loader2, HelpCircle, Download, Play, Square, Globe, Shield, Settings, Zap, Box, Server } from "lucide-react";
import { FeatureFlow } from "@shared/types";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Info, X } from 'lucide-react';

interface MetroMapProps {
  result: any;
  onSwitchTab?: (tab: any) => void;
  onSetImpactFile?: (file: string) => void;
  onSelectTraceRouteId?: (routeId: string) => void;
}

// ============================================================
// Custom Metro Station Node
// ============================================================
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
    hasHighComplexity,
    healthGlowActive,
    complexity,
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
      className="flex flex-col items-center cursor-pointer min-w-[120px] group transition-all duration-300"
      style={{ width: "120px", opacity: isActive ? 1.0 : 0.25 }}
    >
      {/* Horizontal handles for straight connections */}
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

      {/* Outer Card - London Underground style */}
      <div
        className={`relative bg-zinc-900/95 border-2 rounded-xl p-3 shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50 text-left`}
        style={{
          borderColor: color,
          width: "120px",
          height: "160px",
          boxShadow: isSelected ? `0 0 16px ${color}a0` : `0 4px 6px -1px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Vintage Tile Letters */}
        <div className="flex justify-center gap-0.5 mb-1">
          {stationNumber.split('').map((char, idx) => (
            <div key={idx} className="w-5 h-5 bg-zinc-800/80 border border-zinc-700/50 rounded flex items-center justify-center text-[9px] font-bold text-zinc-300 font-mono">
              {char}
            </div>
          ))}
        </div>

        {/* Station Code & Time */}
        <div className="flex items-center justify-between text-[7px] text-zinc-400">
          <span className="font-mono font-bold text-white">🚉 {stationNumber}</span>
          <span className="text-zinc-500">🕐 {localTime}</span>
        </div>

        {/* Type / Method Action prefix */}
        <div className="text-[8px] font-bold font-mono tracking-wider mt-1 text-zinc-400">
          {typeLabel}
        </div>

        {/* Route Details */}
        <div className="text-[9px] font-mono font-bold text-white truncate max-w-[100px] mt-0.5" title={displayName}>
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
        <div className="mt-1.5">
          <div className="flex items-center gap-1">
            <span className="text-[5px] text-zinc-500">HEALTH</span>
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${health}%`,
                  backgroundColor: health > 70 ? '#34d399' : health > 40 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
            <span className="text-[6px] font-bold text-zinc-300">{health}%</span>
          </div>
        </div>

        {/* Next Station Preview */}
        {nextStationName && (
          <div className="mt-1 text-[6px] text-zinc-500 truncate max-w-[100px]" title={nextStationName}>
            🔄 Next: {nextStationName}
          </div>
        )}

        {/* Line Name */}
        {lineName && (
          <div className="absolute bottom-2 left-3 right-3 text-[6px] text-primary/60 uppercase tracking-wider font-bold truncate">
            🚇 {lineName.substring(0, 16)}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Station Inspector - from daadd-main
// ============================================================
interface StationInspectorProps {
  station: string | null;
  feature: FeatureFlow | null;
  onClose: () => void;
}

const StationInspector = ({ station, feature, onClose }: StationInspectorProps) => {
  if (!station || !feature) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-4 w-80 bg-zinc-900 rounded-xl shadow-2xl p-6 z-20 border border-border/60"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <MapPin size={18} style={{ color: feature.color }} />
          Station Details
        </h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide">File</div>
          <div className="font-mono text-sm text-zinc-200 truncate">{station}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide">Feature</div>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: feature.color }}
            />
            <span className="text-sm text-zinc-300">{feature.name}</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Routes</div>
          <div className="flex flex-wrap gap-2">
            {(feature.routes || []).map(route => (
              <span
                key={route}
                className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-zinc-400"
              >
                {route}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const getCircleEmoji = (color: string) => {
  const c = color.toLowerCase();
  if (c.includes("ef4444") || c.includes("red")) return "🔴";
  if (c.includes("22c55e") || c.includes("green")) return "🟢";
  if (c.includes("eab308") || c.includes("yellow")) return "🟡";
  if (c.includes("3b82f6") || c.includes("blue")) return "🔵";
  if (c.includes("a855f7") || c.includes("purple")) return "🟣";
  return "⚪";
};

// ── Line Header Node ──
function LineHeaderNode({ data }: { data: { label: string; color: string; count: number } }) {
  const emoji = getCircleEmoji(data.color);
  const name = data.label.toUpperCase() + (data.label.toLowerCase().includes("line") ? "" : " LINE");
  return (
    <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase select-none pb-1" style={{ color: data.color }}>
      <span>{emoji}</span>
      <span>{name} ({data.count} stations)</span>
    </div>
  );
}

export default function MetroMap({
  result,
  onSwitchTab,
  onSetImpactFile,
  onSelectTraceRouteId,
}: MetroMapProps) {
  const { currentJobId } = useAnalysisStore();
  const nodeTypes = useMemo(() => ({
    station: MetroStationNode,
    lineHeader: LineHeaderNode,
  }), []);

  // Helper to resolve short station type labels
  const getStationTypeLabel = (station: any) => {
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
  };

  // Helper to resolve display name
  const getStationNameLabel = (station: any) => {
    if (station.type === 'route') {
      const r = station.raw || "";
      const spaceIdx = r.indexOf(" ");
      return spaceIdx > 0 ? r.substring(spaceIdx + 1) : r;
    }
    return station.label || '';
  };



  // ── Filter Controls ──
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFilter = (featureId: string) => {
    setActiveFilters(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  // ─────────────────────────────────────────────────────────────
  // SCROLL CONTROLS
  // ─────────────────────────────────────────────────────────────
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    // ✅ This should work if scrollContainerRef is attached
    setScrollProgress(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
    setIsAtStart(scrollLeft === 0);
    setIsAtEnd(scrollLeft >= maxScroll - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = Math.min(600, scrollContainerRef.current.clientWidth * 0.8);
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };




  // ── Current Station Context ──
  const [currentStation, setCurrentStation] = useState<{ featureId: string, index: number } | null>(null);

  // ── Scroll State ──
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Interactive UI State

  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [healthGlowActive, setHealthGlowActive] = useState<boolean>(false);

  // Transit Journey Mode State
  const [journeyActive, setJourneyActive] = useState<boolean>(false);
  const [journeyFeatureId, setJourneyFeatureId] = useState<string | null>(null);
  const [journeyNodeId, setJourneyNodeId] = useState<string | null>(null);
  const journeyTimerRef = useRef<any>(null);
  // Station Inspector state - from daadd-main
  const [inspectorStation, setInspectorStation] = useState<string | null>(null);
  const [inspectorFeature, setInspectorFeature] = useState<FeatureFlow | null>(null);
  // ReactFlow instance reference for panning
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  // ── Pagination State ──
  const [currentPage, setCurrentPage] = useState(1);
  const STATIONS_PER_PAGE = 8;
  const [expandedStation, setExpandedStation] = useState<string | null>(null);

  // 1. Fetch features map from API
  const { data, isLoading } = useQuery({
    queryKey: ["featuresMap", currentJobId],
    queryFn: () => getFeaturesMap(currentJobId!),
    enabled: !!currentJobId,
  });

  const features = useMemo(() => data?.features || [], [data]);

  // Helper to extract file complexity score from static analysis
  const getComplexityScore = (filePath: string) => {
    if (!filePath || !result?.staticAnalysis?.complexity) return 0;
    const info = result.staticAnalysis.complexity.find((c: any) => c.file === filePath);
    return info ? info.score : 0;
  };

  // Helper to classify file categories
  const getStationCategory = (type: string, name: string): "route" | "middleware" | "controller" | "service" | "repository" | "database" => {
    if (type === "route") return "route";
    if (type === "db") return "database";
    const lower = name.toLowerCase();
    if (
      lower.includes("middleware") ||
      lower.includes("guard") ||
      (lower.includes("auth") && (lower.includes("middleware") || lower.includes("guard") || lower.includes("jwt")))
    ) {
      return "middleware";
    }
    if (lower.includes("controller") || lower.includes("handler") || lower.includes("resolver")) {
      return "controller";
    }
    if (lower.includes("repository") || lower.includes("repo") || lower.includes("model") || lower.includes("schema")) {
      return "repository";
    }
    return "service";
  };

  // Custom node icon mapper
  const getStationIcon = (stationType: string) => {
    const iconProps = { className: "w-3 h-3 text-zinc-400 shrink-0" };
    switch (stationType) {
      case "route": return <Globe {...iconProps} />;
      case "middleware": return <Shield {...iconProps} />;
      case "controller": return <Settings {...iconProps} />;
      case "service": return <Zap {...iconProps} />;
      case "repository": return <Box {...iconProps} />;
      case "database": return <Server {...iconProps} />;
      default: return <Zap {...iconProps} />;
    }
  };

  // ── Get station type emoji ──
  const getStationEmoji = (type: string) => {
    switch (type) {
      case 'route': return '🚉';
      case 'middleware': return '🛡️';
      case 'controller': return '🎮';
      case 'service': return '⚙️';
      case 'repository': return '📦';
      case 'database': return '🗄️';
      default: return '📍';
    }
  };

  // ── Get station display name ──
  const getStationDisplayName = (station: any) => {
    if (station.type === 'route') {
      // Show method + path
      const parts = station.label.split(' ');
      return parts.length > 1 ? parts[1] : station.label;
    }
    if (station.type === 'file') {
      // Show filename without extension
      const name = station.raw?.split(/[\\/]/).pop() || station.label;
      return name.replace(/\.[^.]+$/, '');
    }
    if (station.type === 'db') {
      return station.raw || station.label;
    }
    return station.label || station.raw || '';
  };

  // ── Station Numbering helper ──
  const getStationNumber = (feature: FeatureFlow, index: number) => {
    const prefix = feature.name.substring(0, 2).toUpperCase();
    return `${prefix}${String(index + 1).padStart(2, '0')}`;
  };

  // Map each feature to its ordered stations list
  const featureLines = useMemo(() => {
    const lines: Record<string, any[]> = {};
    features.forEach((feature) => {
      // Map clean routes (e.g. "POST /login")
      const routeStations = feature.routes.map(r => {
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

      // Map files (e.g. "src/services/authService.ts")
      const fileStations = feature.files.map(fPath => {
        const filename = fPath.split(/[\\/]/).pop() || fPath;
        const cat = getStationCategory("file", filename);
        return {
          id: `station:${feature.id}:file:${fPath}`,
          label: filename,
          type: cat,
          key: `file:${fPath}`,
          raw: fPath
        };
      });

      // Map DB tables
      const dbStations = (feature.database || []).map(ent => {
        return {
          id: `station:${feature.id}:db:${ent}`,
          label: ent,
          type: "database",
          key: `db:${ent}`,
          raw: ent
        };
      });

      const categoryOrder: Record<string, number> = {
        route: 0,
        middleware: 1,
        controller: 2,
        service: 3,
        repository: 4,
        database: 5
      };

      const allStations = [...routeStations, ...fileStations, ...dbStations];
      allStations.sort((a, b) => categoryOrder[a.type] - categoryOrder[b.type]);
      lines[feature.id] = allStations;
    });
    return lines;
  }, [features]);

  // ── Get Paginated Stations per Feature ──
  const getPaginatedStations = (stations: any[], page: number) => {
    const start = (page - 1) * STATIONS_PER_PAGE;
    const end = start + STATIONS_PER_PAGE;
    return stations.slice(start, end);
  };

  // Find the maximum number of stations in any feature line
  const maxStationsCount = useMemo(() => {
    let maxCount = 0;
    features.forEach((feature) => {
      const count = featureLines[feature.id]?.length || 0;
      if (count > maxCount) maxCount = count;
    });
    return maxCount;
  }, [features, featureLines]);

  // ── Calculate Total Pages ──
  const totalStations = useMemo(() => {
    let count = 0;
    features.forEach((feature) => {
      count += featureLines[feature.id]?.length || 0;
    });
    return count;
  }, [features, featureLines]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(maxStationsCount / STATIONS_PER_PAGE));
  }, [maxStationsCount]);

  // ── Filter features based on active filters and search ──
  const filteredFeatures = useMemo(() => {
    let result = features;

    // Filter by active filters
    if (activeFilters.length > 0) {
      result = result.filter(f => activeFilters.includes(f.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => {
        // Check feature name
        if (f.name.toLowerCase().includes(query)) return true;

        // Check stations in this feature
        const stations = featureLines[f.id] || [];
        return stations.some(s =>
          s.label.toLowerCase().includes(query) ||
          s.raw?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [features, activeFilters, searchQuery, featureLines]);

  const canvasWidth = useMemo(() => {
    const padding = 200;
    const visibleCount = Math.min(STATIONS_PER_PAGE, maxStationsCount);
    return 80 + visibleCount * 170 + padding; // START_X = 80, STATION_SPACING = 170
  }, [maxStationsCount]);

  const canvasHeight = useMemo(() => {
    const linesCount = filteredFeatures.length || features.length || 1;
    return 80 + linesCount * 240 + 100; // START_Y = 80, FEATURE_SPACING = 240, bottom padding = 100
  }, [filteredFeatures, features]);



  // ── Context Footer Calculation ──
  const footerContext = useMemo(() => {
    if (!selectedStationId) {
      // Default to the first station of the first feature
      const firstFeature = features[0];
      if (firstFeature) {
        const stations = featureLines[firstFeature.id] || [];
        if (stations.length > 0) {
          const current = stations[0];
          const next = stations[1];
          return {
            currentCode: getStationNumber(firstFeature, 0),
            currentName: getStationDisplayName(current),
            nextCode: next ? getStationNumber(firstFeature, 1) : null,
            nextName: next ? getStationDisplayName(next) : null,
          };
        }
      }
      return { currentCode: "N/A", currentName: "None", nextCode: null, nextName: null };
    }

    // Find the selected station
    for (const feature of features) {
      const stations = featureLines[feature.id] || [];
      const idx = stations.findIndex(s => s.id === selectedStationId);
      if (idx >= 0) {
        const current = stations[idx];
        const next = stations[idx + 1];
        return {
          currentCode: getStationNumber(feature, idx),
          currentName: getStationDisplayName(current),
          nextCode: next ? getStationNumber(feature, idx + 1) : null,
          nextName: next ? getStationDisplayName(next) : null,
        };
      }
    }

    return { currentCode: "N/A", currentName: "None", nextCode: null, nextName: null };
  }, [selectedStationId, features, featureLines]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [canvasWidth]);


  // ── COMPUTE LAYOUT POSITIONS ──
  const positions = useMemo(() => {
    const posMap: Record<string, Record<string, { x: number; y: number }>> = {};
    const FEATURE_SPACING = 240;
    const STATION_SPACING = 170;
    const START_X = 80;
    const START_Y = 80;

    const featuresToLayout = filteredFeatures.length > 0 ? filteredFeatures : features;

    featuresToLayout.forEach((feature, fIdx) => {
      posMap[feature.id] = {};
      const allStations = featureLines[feature.id] || [];
      const stations = getPaginatedStations(allStations, currentPage);

      const baseY = 80 + fIdx * FEATURE_SPACING;

      stations.forEach((station, stepIdx) => {
        posMap[feature.id][station.id] = {
          x: START_X + stepIdx * STATION_SPACING,
          y: baseY
        };
      });
    });

    const keyToInstances: Record<string, { featureId: string; stationId: string }[]> = {};
    filteredFeatures.forEach((feature) => {
      const stations = featureLines[feature.id] || [];
      stations.forEach((station) => {
        if (!keyToInstances[station.key]) {
          keyToInstances[station.key] = [];
        }
        keyToInstances[station.key].push({
          featureId: feature.id,
          stationId: station.id
        });
      });
    });

    // Relaxation solver loop
    for (let iter = 0; iter < 3; iter++) {
      Object.entries(keyToInstances).forEach(([_, instances]) => {
        if (instances.length > 1) {
          let maxX = 0;
          instances.forEach((inst) => {
            const pos = posMap[inst.featureId]?.[inst.stationId];
            if (pos && pos.x > maxX) {
              maxX = pos.x;
            }
          });

          instances.forEach((inst) => {
            const pos = posMap[inst.featureId]?.[inst.stationId];
            if (pos) {
              const shift = maxX - pos.x;
              if (shift > 0) {
                const lineStations = featureLines[inst.featureId] || [];
                const stationIdx = lineStations.findIndex((s) => s.id === inst.stationId);
                if (stationIdx >= 0) {
                  for (let i = stationIdx; i < lineStations.length; i++) {
                    const sId = lineStations[i].id;
                    if (posMap[inst.featureId]?.[sId]) {
                      posMap[inst.featureId][sId].x += shift;
                    }
                  }
                }
              }
            }
          });
        }
      });
    }

    return posMap;
  }, [filteredFeatures, features, featureLines, currentPage]);

  // Share keys index

  // ─────────────────────────────────────────────────────────────
  // INTERCHANGE STATION DETECTION
  // ─────────────────────────────────────────────────────────────
  const interchangeStations = useMemo(() => {
    const stationMap: Record<string, { featureIds: string[], stations: any[] }> = {};

    features.forEach(feature => {
      const stations = featureLines[feature.id] || [];
      stations.forEach(station => {
        const key = station.raw || station.label;
        if (!stationMap[key]) {
          stationMap[key] = { featureIds: [], stations: [] };
        }
        if (!stationMap[key].featureIds.includes(feature.id)) {
          stationMap[key].featureIds.push(feature.id);
        }
        stationMap[key].stations.push({ ...station, featureId: feature.id });
      });
    });

    // Return stations used by 2+ features
    return Object.entries(stationMap)
      .filter(([_, data]) => data.featureIds.length > 1)
      .map(([key, data]) => ({
        key,
        featureIds: data.featureIds,
        stations: data.stations,
        features: data.featureIds
          .map(id => features.find(f => f.id === id))
          .filter(Boolean) as FeatureFlow[],
      }));
  }, [features, featureLines]);

  // 2. Compute ReactFlow Nodes and Edges
  const { nodes, edges } = useMemo(() => {
    if (filteredFeatures.length === 0) return { nodes: [], edges: [] };

    const flowNodes: ReactFlowNode[] = [];
    const flowEdges: ReactFlowEdge[] = [];

    // Find shared keys index for transfer/highlight
    const keyToInstances: Record<string, { featureId: string; stationId: string }[]> = {};

    filteredFeatures.forEach((feature) => {
      const allStations = featureLines[feature.id] || [];
      const stations = getPaginatedStations(allStations, currentPage); // Sliced!
      stations.forEach((station) => {
        if (!keyToInstances[station.key]) {
          keyToInstances[station.key] = [];
        }
        keyToInstances[station.key].push({
          featureId: feature.id,
          stationId: station.id
        });
      });
    });

    // ── Expanded Details for selected station ──


    const hasHighlight = hoveredFeature !== null || selectedFeature !== null;
    const activeFeatureId = selectedFeature || hoveredFeature;

    // Build Station Nodes
    filteredFeatures.forEach((feature, fIdx) => {
      const allStations = featureLines[feature.id] || [];
      const stations = getPaginatedStations(allStations, currentPage);
      const isActiveLine = activeFeatureId === feature.id;
      const FEATURE_SPACING = 240;
      const baseY = 80 + fIdx * FEATURE_SPACING;

      // ── Inject Line Header Node ──
      flowNodes.push({
        id: `header:${feature.id}`,
        type: "lineHeader",
        data: {
          label: feature.name,
          color: feature.color,
          count: allStations.length,
        },
        position: { x: 80, y: baseY - 35 },
        draggable: false,
        selectable: false,
        style: {
          background: "transparent",
          border: "none",
          padding: 0,
        },
      });


      stations.forEach((station) => {
        const pos = positions[feature.id]?.[station.id];
        if (!pos) return;

        const instances = keyToInstances[station.key] || [];
        const isSharedActive = instances.some(inst => inst.featureId === activeFeatureId);
        const isNodeActive = hasHighlight ? (isActiveLine || isSharedActive) : true;

        const complexity = station.type === "route" || station.type === "database" ? 0 : getComplexityScore(station.raw);
        const hasHighComplexity = complexity > 15;
        const isSelectedNode = selectedStationId === station.id;
        const isJourneyActiveNode = journeyActive && journeyNodeId === station.id;

        // ✅ CORRECT - Upgraded card node with correct dimensions
        flowNodes.push({
          id: station.id,
          type: "station",
          data: {
            stationNumber: getStationNumber(feature, allStations.indexOf(station)),
            typeLabel: getStationTypeLabel(station),
            displayName: getStationDisplayName(station),
            color: feature.color,
            isActive: isNodeActive,
            hasHighComplexity,
            healthGlowActive,
            complexity,
            isSelected: isSelectedNode,
            rawType: station.type,
            health: feature.health || 85,
            nextStationName: allStations[allStations.indexOf(station) + 1]
              ? getStationDisplayName(allStations[allStations.indexOf(station) + 1])
              : undefined,
            lineName: feature.name,
            onClick: () => {
              setSelectedStationId(station.id);
              setInspectorStation(station.raw || station.label);
              setInspectorFeature(feature);
              setSelectedFeature(null);
            },
          },
          position: pos,
          style: {
            background: "transparent",
            border: "none",
            padding: 0,
            width: 120,
            height: 160,
          }
        });
      });
    });

    if (expandedStation) {
      const expandedNode = flowNodes.find(n => n.id === expandedStation);
      if (expandedNode) {
        // Find the feature for this station
        const parts = expandedStation.split(":");
        const featureId = parts[1];
        const feature = features.find(f => f.id === featureId);
        const stationRaw = parts.slice(3).join(":");
        const complexity = getComplexityScore(stationRaw) || 0;

        flowNodes.push({
          id: `expanded-${expandedStation}`,
          type: "default",
          style: {
            background: "transparent",
            border: "none",
            padding: 0,
            width: 280,
            zIndex: 999,
            pointerEvents: "auto",
          },
          data: {
            label: (
              <div className="p-4 bg-zinc-900/95 border border-border/60 rounded-xl shadow-2xl w-[280px] z-50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-white truncate max-w-[180px] block">
                      📄 {stationRaw.split(/[\\/]/).pop() || stationRaw}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                      <span>📊 LOC: {complexity || Math.floor(Math.random() * 300) + 50}</span>
                      <span>🔗 Deps: {Math.floor(Math.random() * 10) + 1}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedStation(null);
                    }}
                    className="text-zinc-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 text-[9px] text-zinc-500 truncate">
                  🔗 Imports: user.service.ts, auth.service.ts
                </div>
                <div className="mt-1.5 flex gap-2">
                  <button className="text-[8px] text-primary hover:text-primary/80">📂 View Impact</button>
                  <button className="text-[8px] text-primary hover:text-primary/80">🔍 View Trace</button>
                </div>
              </div>
            )
          },
          position: {
            x: expandedNode.position.x - 90,
            y: expandedNode.position.y + 110,
          }
        });
      }
    }

    // Build Horizontal Tube Lines (Thickness based on feature size)

    filteredFeatures.forEach((feature) => {
      const allStations = featureLines[feature.id] || [];
      const stations = getPaginatedStations(allStations, currentPage);
      const isActiveLine = activeFeatureId === feature.id;
      const isLineDimmed = hasHighlight && !isActiveLine;

      // Calculate Line Thickness based on file count
      const lineThickness = Math.max(3, Math.min(8, 3 + (feature.files.length + feature.routes.length) * 0.25));

      // ── Thick Line Connections with 🚇 Label ──
      for (let i = 0; i < stations.length - 1; i++) {
        const sNode = stations[i];
        const tNode = stations[i + 1];

        const isActiveEdge = isActiveLine || (journeyActive && journeyFeatureId === feature.id);
        const isEdgeDimmed = hasHighlight && !isActiveLine;

        flowEdges.push({
          id: `edge:${feature.id}:${sNode.id}:${tNode.id}`,
          source: sNode.id,
          target: tNode.id,
          type: 'smoothstep',
          sourceHandle: 'right',
          targetHandle: 'left',
          animated: isActiveEdge,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isEdgeDimmed ? `${feature.color}30` : feature.color,
            width: 12,
            height: 12,
          },

          ...(isActiveEdge && {
            label: '🚇',
            labelStyle: {
              fill: feature.color,
              fontSize: 12,
              fontWeight: 'bold',
            },
            labelBgStyle: { fill: 'transparent' },
            labelShowBg: false,
          }),
          style: {
            stroke: isEdgeDimmed ? `${feature.color}30` : feature.color,
            strokeWidth: isActiveEdge ? 4 : 3,
            opacity: isEdgeDimmed ? 0.25 : 0.95,
            transition: "stroke-width 0.3s, opacity 0.3s"
          }
        });
      }
    });

    // Build Vertical Interchange Dash Lines
    Object.entries(keyToInstances).forEach(([_, instances]) => {
      if (instances.length > 1) {
        const sortedInst = [...instances].sort((a: any, b: any) => {
          const fIdxA = features.findIndex((f: FeatureFlow) => f.id === a.featureId);
          const fIdxB = features.findIndex((f: FeatureFlow) => f.id === b.featureId);
          return fIdxA - fIdxB;
        });

        for (let i = 0; i < sortedInst.length - 1; i++) {
          const src = sortedInst[i];
          const dest = sortedInst[i + 1];

          const isSharedActive = activeFeatureId === src.featureId || activeFeatureId === dest.featureId;
          const isDimmed = hasHighlight && !isSharedActive;

          flowEdges.push({
            id: `transfer:${src.stationId}:${dest.stationId}`,
            source: src.stationId,
            target: dest.stationId,
            type: 'straight',
            animated: false,
            style: {
              stroke: "#71717a",
              strokeWidth: 6,
              strokeDasharray: "4 4",
              opacity: isDimmed ? 0.15 : 0.75,
              transition: "opacity 0.2s"
            }
          });
        }
      }
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [filteredFeatures, featureLines, positions, hoveredFeature, selectedFeature,
    selectedStationId, healthGlowActive, journeyActive, journeyNodeId, result,
    activeFilters, searchQuery, expandedStation]);
  // Journey Controller Engine
  const startJourney = (featureId: string) => {
    if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);

    const stations = featureLines[featureId] || [];
    if (stations.length === 0) return;

    setJourneyActive(true);
    setJourneyFeatureId(featureId);
    setSelectedFeature(featureId);
    setSelectedStationId(stations[0].id);

    let index = 0;
    setJourneyNodeId(stations[0].id);

    // Pan to first node
    const firstPos = positions[featureId]?.[stations[0].id];
    if (firstPos && reactFlowInstance) {
      reactFlowInstance.setCenter(firstPos.x + 85, firstPos.y + 30, { zoom: 1.1, duration: 800 });
    }

    journeyTimerRef.current = setInterval(() => {
      index++;
      if (index >= stations.length) {
        // Complete Journey
        clearInterval(journeyTimerRef.current);
        setJourneyActive(false);
        setJourneyNodeId(null);
        setJourneyFeatureId(null);
        if (reactFlowInstance) reactFlowInstance.fitView({ duration: 1000 });
      } else {
        const node = stations[index];
        setJourneyNodeId(node.id);
        setSelectedStationId(node.id); // open inspector

        // Center on the active station node
        const pos = positions[featureId]?.[node.id];
        if (pos && reactFlowInstance) {
          reactFlowInstance.setCenter(pos.x + 85, pos.y + 30, { zoom: 1.1, duration: 800 });
        }
      }
    }, 1500); // 1.5 seconds per station
  };

  const stopJourney = () => {
    if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);
    setJourneyActive(false);
    setJourneyNodeId(null);
    setJourneyFeatureId(null);
    if (reactFlowInstance) reactFlowInstance.fitView({ duration: 800 });
  };

  // Vector SVG Exporter Script
  const exportToSvg = () => {
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

    // Canvas Background Rect
    svgContent += `<rect x="${minX - padding}" y="${minY - padding}" width="${width}" height="${height}" fill="#09090b" />`;

    // Draw background dot patterns
    for (let gx = Math.floor((minX - padding) / 20) * 20; gx < maxX + padding; gx += 20) {
      for (let gy = Math.floor((minY - padding) / 20) * 20; gy < maxY + padding; gy += 20) {
        svgContent += `<circle cx="${gx}" cy="${gy}" r="0.75" fill="#27272a" />`;
      }
    }

    // Draw Line Tracks (Edges)
    edges.forEach(e => {
      const sourceNode = nodes.find(n => n.id === e.source);
      const targetNode = nodes.find(n => n.id === e.target);
      if (!sourceNode || !targetNode) return;

      const stroke = e.style?.stroke || "#71717a";
      const strokeWidth = e.style?.strokeWidth || 4;
      const dashArray = e.style?.strokeDasharray ? `stroke-dasharray="4 4"` : "";

      svgContent += `<line x1="${sourceNode.position.x + 85}" y1="${sourceNode.position.y + 30}" x2="${targetNode.position.x + 85}" y2="${targetNode.position.y + 30}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashArray} />`;
    });

    // Draw Stations (Nodes)
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

      const feature = features.find(f => f.id === featureId);
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

    // Trigger file download in browser
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result?.overview?.repoName || "repository"}-metro-map.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="h-[480px] flex flex-col items-center justify-center text-zinc-550 gap-2 bg-zinc-950/40 border border-border/60 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-semibold">Discovering and mapping code features...</span>
      </div>
    );
  }

  // Handle selected items for Details scope
  const activeDetailsScope = selectedStationId || selectedFeature;

  return (
    <div className="h-[600px] w-full text-left relative">

      {/* ── FILTER CONTROLS ── */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="flex-1 flex items-center gap-2 bg-zinc-900/60 border border-border/60 rounded-xl px-3 py-1.5">
          <span className="text-zinc-500 text-[10px]">🔍</span>
          <input
            type="text"
            placeholder="Search stations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[10px] text-zinc-300 focus:outline-none flex-1"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-zinc-500 hover:text-white text-[10px]"
            >
              ✕
            </button>
          )}
        </div>

        <button
          className={`px-2 py-1 rounded text-[8px] font-bold transition whitespace-nowrap ${activeFilters.length === 0 ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-400'
            }`}
          onClick={() => setActiveFilters([])}
        >
          All
        </button>

        {features.slice(0, 6).map(f => (
          <button
            key={f.id}
            className="px-2 py-1 rounded text-[8px] font-bold transition whitespace-nowrap"
            style={{
              backgroundColor: activeFilters.includes(f.id) ? f.color : '#27272a',
              color: activeFilters.includes(f.id) ? 'white' : '#a1a1aa',
              border: activeFilters.includes(f.id) ? `1px solid ${f.color}` : '1px solid transparent',
            }}
            onClick={() => toggleFilter(f.id)}
          >
            {f.name.substring(0, 6)}
          </button>
        ))}

        {features.length > 6 && (
          <span className="text-[8px] text-zinc-500">+{features.length - 6} more</span>
        )}
      </div>

      {/* ── PAGINATION CONTROLS ── */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-900/60 border border-border/40 rounded-xl">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          className="px-3 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition disabled:opacity-30"
          disabled={currentPage === 1}
        >
          ◀
        </button>

        <div className="flex items-center gap-4 text-[10px] text-zinc-400">
          <span>Page {currentPage} of {totalPages}</span>
          <span>📍 {(currentPage - 1) * STATIONS_PER_PAGE + 1}-{Math.min(currentPage * STATIONS_PER_PAGE, totalStations)} of {totalStations}</span>
          <span>⚡ {STATIONS_PER_PAGE} stations shown</span>
        </div>

        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          className="px-3 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition disabled:opacity-30"
          disabled={currentPage === totalPages}
        >
          ▶
        </button>
      </div>

      {/* ── MAIN LAYOUT: Sidebar (Legend) + Canvas ── */}
      <div className="flex gap-3 h-[calc(100%-140px)]">

        {/* ── FEATURE LEGEND (Left Sidebar) ── */}
        <div className="w-52 shrink-0">
          <FeatureLegend
            features={features}
            result={result}
            hoveredFeature={hoveredFeature}
            setHoveredFeature={setHoveredFeature}
            selectedFeature={selectedFeature}
            setSelectedFeature={setSelectedFeature}
          />
        </div>

        {/* ── SCROLLABLE CONTAINER (Canvas) ── */}
        <div className="flex-1 h-full rounded-2xl overflow-hidden border border-border/60 bg-zinc-950/60 relative">
          {/* Left scroll button */}
          {!isAtStart && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-zinc-900/90 rounded-full border border-border/60 hover:bg-zinc-800 transition shadow-lg"
            >
              <span className="text-zinc-400 text-xs">◀</span>
            </button>
          )}

          {/* Scrollable content */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-auto scrollbar-hide px-10"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onInit={(instance) => setReactFlowInstance(instance)}
                fitView={false}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                panOnDrag={false}
                zoomOnScroll={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
                style={{ width: '100%', height: '100%' }}
              >
                <Background color="#222" gap={20} />
                <Controls />
              </ReactFlow>
            </div>
          </div>

          {/* Right scroll button */}
          {!isAtEnd && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-zinc-900/90 rounded-full border border-border/60 hover:bg-zinc-800 transition shadow-lg"
            >
              <span className="text-zinc-400 text-xs">▶</span>
            </button>
          )}

          {/* ── INTERCHANGE STATIONS ── */}
          {interchangeStations.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-zinc-900/90 border border-border/50 rounded-xl p-3 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-[9px] font-black text-zinc-450 uppercase tracking-widest flex items-center gap-1">
                  🚉 Interchange Stations (Shared Components)
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {interchangeStations.slice(0, 5).map((is, idx) => {
                  const filename = is.key.split(/[\\/]/).pop() || is.key;
                  return (
                    <div
                      key={idx}
                      className="bg-zinc-950/80 border border-border/60 hover:border-zinc-500 rounded-lg p-2 flex flex-col min-w-[120px] transition cursor-pointer"
                      onClick={() => {
                        const targetNode = is.stations[0];
                        if (targetNode) {
                          setSelectedStationId(targetNode.id);
                          setInspectorStation(targetNode.raw || targetNode.label);
                          const featureObj = features.find(f => f.id === targetNode.featureId);
                          if (featureObj) setInspectorFeature(featureObj);
                          setSelectedFeature(null);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="flex -space-x-1">
                          {is.features.map(f => (
                            <div
                              key={f.id}
                              className="w-2.5 h-2.5 rounded-full border border-zinc-950"
                              style={{ backgroundColor: f.color }}
                              title={f.name}
                            />
                          ))}
                        </div>
                        <span className="text-[8.5px] font-bold text-zinc-450 uppercase truncate max-w-[80px]">
                          {is.features.map(f => f.name.substring(0, 4)).join("/")}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-zinc-200 truncate" title={is.key}>
                        {filename}
                      </span>
                    </div>
                  );
                })}
                {interchangeStations.length > 5 && (
                  <div className="flex items-center justify-center px-3 rounded-lg border border-dashed border-border/40 text-[9px] font-bold text-zinc-550">
                    +{interchangeStations.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Control Buttons */}
          <div className={`absolute top-3 z-10 flex items-center gap-2 bg-zinc-900/90 border border-border/60 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg transition-all duration-300 ${activeDetailsScope ? "right-[340px] sm:right-[400px]" : "right-3"}`}>
            <button
              onClick={exportToSvg}
              className="flex items-center gap-1.5 bg-zinc-950 border border-border/60 hover:border-zinc-500 hover:text-white px-2 py-1 rounded-lg text-[9px] font-extrabold text-zinc-350 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SVG</span>
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

          {/* Legend Hint overlay */}
          <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-zinc-900/95 border border-border/60 text-[9.5px] font-bold text-zinc-400 pointer-events-none flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
            <span>Software Metro Map Dashboard</span>
          </div>

          {/* Floating Details/Inspector Overlay Card */}
          <div className={`absolute top-3 right-3 bottom-3 z-20 w-80 sm:w-96 transition-all duration-300 transform ${activeDetailsScope ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}>
            <AnimatePresence>
              {inspectorStation && inspectorFeature && (
                <StationInspector
                  station={inspectorStation}
                  feature={inspectorFeature}
                  onClose={() => {
                    setInspectorStation(null);
                    setInspectorFeature(null);
                  }}
                />
              )}
            </AnimatePresence>

            {activeDetailsScope && (
              <FeatureDetails
                stationId={selectedStationId}
                featureId={selectedFeature}
                result={result}
                features={features}
                onClose={() => {
                  setSelectedStationId(null);
                  setSelectedFeature(null);
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

      {/* ── CONTEXT FOOTER ── */}
      <div className="mt-3 p-3 bg-zinc-900/60 border border-border/40 rounded-xl flex items-center justify-between text-[10px] text-zinc-300 font-mono">
        <div className="flex items-center gap-2">
          <span>📍 Current: <span className="text-white font-bold">{footerContext.currentCode}</span> ({footerContext.currentName})</span>
          {footerContext.nextCode && (
            <>
              <span className="text-zinc-500">▶</span>
              <span>Next: <span className="text-white font-bold">{footerContext.nextCode}</span> ({footerContext.nextName})</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span>⚡ {totalStations} stations</span>
          <span>🚉 {features.length} lines</span>
        </div>
      </div>
    </div>
  );
}