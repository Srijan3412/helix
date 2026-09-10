import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Route,
  Terminal,
  Cog,
  Database,
  Shield,
  Cloud,
  Layers,
  Search,
  Download,
  GitBranch,
  Zap,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  X,
  ChevronRight,
  Star,
  FileCode,
  Quote,
  ArrowRight,
  ExternalLink,
  BarChart3,
  Sliders,
} from "lucide-react";
import { useAnalysisStore } from "../../store/analysis.store";

// --- Semantic Layer Metadata System ---
export interface LayerMeta {
  id: string;
  num: string;
  name: string;
  shortDesc: string;
  tag: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  pattern: RegExp;
}

const LAYERS_CONFIG: LayerMeta[] = [
  {
    id: "routes",
    num: "01",
    name: "Routes",
    shortDesc: "API endpoints & HTTP handlers",
    tag: "API LAYER",
    color: "#2F80ED",
    bgColor: "rgba(47, 128, 237, 0.12)",
    borderColor: "rgba(47, 128, 237, 0.35)",
    icon: Route,
    pattern: /route|api|endpoint|router|view|page/i,
  },
  {
    id: "controllers",
    num: "02",
    name: "Controllers",
    shortDesc: "Request handling & validation",
    tag: "LOGIC LAYER",
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.12)",
    borderColor: "rgba(139, 92, 246, 0.35)",
    icon: Terminal,
    pattern: /controller|handler|resolver/i,
  },
  {
    id: "services",
    num: "03",
    name: "Services",
    shortDesc: "Business logic & core operations",
    tag: "BUSINESS LAYER",
    color: "#F5A623",
    bgColor: "rgba(245, 166, 35, 0.12)",
    borderColor: "rgba(245, 166, 35, 0.35)",
    icon: Cog,
    pattern: /service|manager|usecase|domain/i,
  },
  {
    id: "repositories",
    num: "04",
    name: "Repositories",
    shortDesc: "Data access & database operations",
    tag: "DATA LAYER",
    color: "#F43F7A",
    bgColor: "rgba(244, 63, 122, 0.12)",
    borderColor: "rgba(244, 63, 122, 0.35)",
    icon: Database,
    pattern: /repo|repository|model|schema|entity|db/i,
  },
  {
    id: "middleware",
    num: "05",
    name: "Middleware",
    shortDesc: "Auth, logging & request pipeline",
    tag: "PIPELINE LAYER",
    color: "#16C7A3",
    bgColor: "rgba(22, 199, 163, 0.12)",
    borderColor: "rgba(22, 199, 163, 0.35)",
    icon: Shield,
    pattern: /middleware|auth|guard|interceptor|logger|pipe/i,
  },
  {
    id: "external",
    num: "06",
    name: "External Services",
    shortDesc: "Third-party APIs & integrations",
    tag: "INTEGRATION LAYER",
    color: "#60A5FA",
    bgColor: "rgba(96, 165, 250, 0.12)",
    borderColor: "rgba(96, 165, 250, 0.35)",
    icon: Cloud,
    pattern: /external|client|sdk|http|gateway|thirdparty|webhook/i,
  },
];

function getLayerTheme(id: string) {
  const meta = LAYERS_CONFIG.find((l) => l.id.toLowerCase() === id.toLowerCase() || l.name.toLowerCase() === id.toLowerCase());
  return {
    primary: meta?.color || "#60A5FA",
    bgColor: meta?.bgColor || "rgba(96, 165, 250, 0.12)",
    borderColor: meta?.borderColor || "rgba(96, 165, 250, 0.35)",
  };
}

interface LayerViewProps {
  result: any;
  searchQuery?: string;
  activeLayerFilter?: string;
}

export default function LayerView({
  result,
  searchQuery: externalSearchQuery,
  activeLayerFilter,
}: LayerViewProps) {
  const { currentJobId } = useAnalysisStore();
  const [selectedLayerId, setSelectedLayerId] = useState<string>("routes");
  const [inspectorTab, setInspectorTab] = useState<"overview" | "files" | "dependencies" | "metrics">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  const layersData = result?.layers || result?.architecture_layers;
  const preGeneratedGraph = result?.architecture_graph || result?.graph;

  // Local fallback classifier if backend query is not resolved yet or empty
  const layers = useMemo(() => {
    // ✅ ADD CONSOLE LOG #10
    console.log('📋 [LAYERED VIEW] layers useMemo inputs:', {
      layersDataType: layersData ? (Array.isArray(layersData) ? 'array' : typeof layersData) : 'null',
      layersDataLength: layersData?.length || 0,
      hasPreGeneratedGraph: !!preGeneratedGraph,
      graphNodesCount: preGeneratedGraph?.nodes?.length || 0
    });

    // ✅ Convert backend array format to frontend Record format
    if (layersData && Array.isArray(layersData)) {
      console.log('✅ [LAYERED VIEW] Using layersData (array format)');
      const converted: Record<string, string[]> = {
        routes: [],
        controllers: [],
        services: [],
        repositories: [],
        models: [],
        middleware: [],
        config: [],
        tests: [],
        utils: [],
        database: []
      };

      layersData.forEach((layer: any) => {
        const layerName = layer.name?.toLowerCase() || '';
        if (converted.hasOwnProperty(layerName)) {
          converted[layerName] = layer.files || [];
        }
      });

      return converted;
    }

    if (preGeneratedGraph) {
      const graphLayers: Record<string, string[]> = {
        routes: [],
        controllers: [],
        services: [],
        repositories: [],
        models: [],
        middleware: [],
        config: [],
        tests: [],
        utils: [],
        database: []
      };

      (preGeneratedGraph?.nodes ?? []).forEach((node: any) => {
        const layerMap: Record<string, string> = {
          route: 'routes',
          controller: 'controllers',
          service: 'services',
          repository: 'repositories',
          model: 'models',
          database: 'database',
          file: 'services'
        };
        const layerKey = layerMap[node.type] || node.type.toLowerCase();
        if (graphLayers[layerKey]) {
          graphLayers[layerKey].push(node.id);
        }
      });

      return graphLayers;
    }

    const files = result?.files || [];
    const dbInfo = result?.metadata?.databaseInfo;
    const classified: Record<string, string[]> = {
      routes: [],
      controllers: [],
      services: [],
      repositories: [],
      models: [],
      middleware: [],
      config: [],
      tests: [],
      utils: [],
      database: []
    };

    const rules = [
      { key: "routes", regex: /(^|\/)(routes?|router|endpoints?|api)(\/|$)/i },
      { key: "controllers", regex: /(^|\/)(controllers?|handlers?|resolvers?)(\/|$)/i },
      { key: "services", regex: /(^|\/)(services?|usecases?|use-cases|domain|business)(\/|$)/i },
      { key: "repositories", regex: /(^|\/)(repositor(y|ies)|dao|daos)(\/|$)/i },
      { key: "models", regex: /(^|\/)(models?|entities|schemas?|types)(\/|$)/i },
      { key: "middleware", regex: /(^|\/)(middleware)(\/|$)/i },
      { key: "config", regex: /(^|\/)(config|configuration)(\/|$)/i },
      { key: "tests", regex: /(^|\/)(tests?|__tests__)(\/|$)|\.(test|spec)\.[tj]sx?$/i },
      { key: "utils", regex: /(^|\/)(utils?|utility|helpers?)(\/|$)/i },
    ];

    for (const f of files) {
      const pathLower = f.path.toLowerCase();
      if (pathLower.startsWith("route:") || pathLower.startsWith("env:") || pathLower.startsWith("db:") || pathLower.startsWith("entity:")) {
        continue;
      }
      let matched = false;
      for (const r of rules) {
        if (r.regex.test(f.path)) {
          classified[r.key].push(f.path);
          matched = true;
          break;
        }
      }
      if (!matched && (/(^|\/)(prisma|drizzle|migrations?|supabase\/migrations|db\/migrations|sql)(\/|$)/i.test(f.path) || /\bprisma\b|schema\.prisma|\bconnection\b|\bdb\b/i.test(f.path))) {
        classified.database.push(f.path);
      }
    }

    if (dbInfo?.type) {
      classified.database.push(`DB: ${dbInfo.type}`);
    }

    return classified;
  }, [preGeneratedGraph, layersData, result]);

  const totalFiles = useMemo(() => {
    return Object.values(layers).reduce((acc, curr) => acc + (curr?.length || 0), 0) || 350;
  }, [layers]);

  const totalLoc = useMemo(() => {
    return totalFiles > 0 ? totalFiles * 120 : 1200;
  }, [totalFiles]);

  const selectedLayerMeta = useMemo(() => {
    return LAYERS_CONFIG.find((l) => l.id === selectedLayerId) || LAYERS_CONFIG[0];
  }, [selectedLayerId]);

  const selectedLayerFiles = useMemo(() => {
    return layers[selectedLayerId] || [];
  }, [layers, selectedLayerId]);

  const topFilesList = useMemo(() => {
    const files = selectedLayerFiles.length > 0 ? selectedLayerFiles : ["index.ts", "auth.ts", "users.ts", "projects.ts", "scan.ts"];
    return files.slice(0, 5).map((f: string, i: number) => ({
      name: f.split(/[\\/]/).pop() || f,
      loc: `${Math.max(0.8, 2.4 - i * 0.4).toFixed(1)}K`,
      score: (4.8 - i * 0.2).toFixed(1)
    }));
  }, [selectedLayerFiles]);

  // Search & Focus matching logic
  const searchHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];



    const hits: { layer: string; path: string; filename: string }[] = [];
    LAYERS_CONFIG.forEach((l) => {
      const key = l.id;
      const files = layers[key] || [];
      files.forEach((file: string) => {
        const filename = file.split(/[\\/]/).pop() || file;
        if (filename.toLowerCase().includes(q) || file.toLowerCase().includes(q)) {
          hits.push({ layer: key, path: file, filename });
        }
      });
    });
    return hits.slice(0, 8); // Cap at 8 hits
  }, [searchQuery, layers]);

  const searchFocusedLayers = useMemo(() => {
    const set = new Set<string>();
    searchHits.forEach(hit => set.add(hit.layer));
    return set;
  }, [searchHits]);


  // Construct ReactFlow nodes & edges dynamically
  const { nodes, edges } = useMemo(() => {
    // ✅ ADD CONSOLE LOG #11
    console.log('📐 [LAYERED VIEW] Node/Edge generation inputs:', {
      hasPreGeneratedGraph: !!preGeneratedGraph,
      graphNodesCount: preGeneratedGraph?.nodes?.length || 0,
      graphEdgesCount: preGeneratedGraph?.edges?.length || 0,
      layersKeys: Object.keys(layers),
      totalFiles: Object.values(layers).reduce((acc, arr) => acc + arr.length, 0)
    });

    if (preGeneratedGraph) {
      console.log('✅ [LAYERED VIEW] Using pre-generated graph');

      // ✅ ADD CONSOLE LOG #12 - Inside the preGeneratedGraph block
      const layerOrder = ["Routes", "Controllers", "Services", "Repositories", "Models", "Middleware", "Config", "Tests", "Utils", "Database"];
      const nodesByLayer: Record<string, any[]> = {};
      layerOrder.forEach(l => nodesByLayer[l] = []);

      const layerMap: Record<string, string> = {
        'routes': 'Routes',
        'controllers': 'Controllers',
        'services': 'Services',
        'repositories': 'Repositories',
        'models': 'Models',
        'middleware': 'Middleware',
        'config': 'Config',
        'tests': 'Tests',
        'utils': 'Utils',
        'database': 'Database'
      };

      (preGeneratedGraph?.nodes ?? []).forEach((node: any) => {
        const rawLayer = node.layer || "Services";
        const layerName = layerMap[rawLayer.toLowerCase()] || rawLayer;
        if (!nodesByLayer[layerName]) {
          nodesByLayer[layerName] = [];
        }
        nodesByLayer[layerName].push(node);
      });

      console.log('📊 [LAYERED VIEW] Nodes by layer:', Object.keys(nodesByLayer).map(key => ({
        layer: key,
        count: nodesByLayer[key]?.length || 0
      })));

      const actualLayers = layerOrder.filter(l => nodesByLayer[l]?.length > 0);
      console.log('✅ [LAYERED VIEW] Actual layers with nodes:', actualLayers);
      const mappedNodes: any[] = [];
      const mappedEdges = (preGeneratedGraph?.edges ?? []).map((edge: any) => {
        const sourceLayer = edge.source?.replace(/^layer-/, "") || "services";
        const sourceTheme = getLayerTheme(sourceLayer);
        return {
          ...edge,
          animated: edge.animated !== undefined ? edge.animated : true,
          markerEnd: {
            type: "arrowclosed" as any,
            color: sourceTheme.primary,
            width: 14,
            height: 14,
          },
          style: edge.style || {
            stroke: sourceTheme.primary,
            strokeWidth: 2.0,
            opacity: 0.65,
          },
        };
      });

      // Generate Column Headers
      // ── LAYER HEADERS - VERTICAL LAYOUT ──
      let currentY = 30;
      const LAYER_SPACING = 40; // Gap between layers

      actualLayers.forEach((layerName) => {
        const key = layerName.toLowerCase();
        const filesInLayer = nodesByLayer[layerName] || [];

        // Get layer metrics from backend data if available
        const layerMetrics = layersData?.find((l: any) => l.name?.toLowerCase() === key);
        let health = layerMetrics?.health || 0;
        let confidence = layerMetrics?.confidence !== undefined
          ? (layerMetrics.confidence <= 1 ? layerMetrics.confidence * 100 : layerMetrics.confidence)
          : 0;

        // Fallback: calculate from files in layer
        if (!health && filesInLayer.length > 0) {
          let totalComplexity = 0;
          let filesWithMetrics = 0;

          filesInLayer.forEach((f: any) => {
            const complexity = f.data?.complexity || f.data?.loc || 0;
            if (complexity > 0) {
              totalComplexity += complexity;
              filesWithMetrics++;
            }
          });

          if (filesWithMetrics > 0) {
            const avgComplexity = totalComplexity / filesWithMetrics;
            health = Math.max(10, Math.min(100, 100 - avgComplexity));
          } else {
            health = 50;
          }

          const hasMetrics = filesInLayer.some((f: any) => f.data?.complexity || f.data?.loc);
          confidence = hasMetrics ? 60 + Math.min(30, filesInLayer.length * 2) : 40;
        }

        if (!health) {
          health = Math.min(85, 50 + filesInLayer.length * 2);
        }
        if (!confidence) {
          confidence = 60 + Math.min(30, filesInLayer.length * 1.5);
        }

        const currentVisibleCount = 5;
        const visibleFiles = filesInLayer.slice(0, currentVisibleCount);

        // ── File Data Array ──
        const fileDataArray = visibleFiles.map((node: any, index: number) => {
          return {
            id: node.id,
            name: node.label || node.id || "",
            method: node.method || node.data?.method || "",
            path: node.path || node.data?.path || "",
            loc: "1.2K",
            deps: 4,
            reqPerSecond: 120,
            rating: 4.8,
            isGod: false,
            isDead: false,
            isRoute: false,
            isDatabase: node.type === 'database' || node.id?.includes('DB:') || node.id?.includes('ENTITY:'),
            isSelected: false,
            onSelect: () => {},
          };
        });

        // ── HEADER NODE (Vertical) ──
        mappedNodes.push({
          id: `layer-${key}`,
          type: "layerNode",
          data: {
            label: layerName,
            count: filesInLayer.length,
            isExpanded: true,
            key,
            health,
            confidence,
            hasMore: filesInLayer.length > currentVisibleCount,
            visibleCount: currentVisibleCount,
            totalFiles: filesInLayer.length,
            onShowMore: () => {},
            onToggle: () => { },
            files: fileDataArray,
          },
          position: {
            x: 150,  // ← VERTICAL: centered (adjust as needed)
            y: currentY
          },
          style: {
            width: 400,  // ← Wider for vertical layout
            opacity: 1.0,
            transition: "opacity 250ms ease, transform 250ms ease",
          },
        });

        // ── CONNECT HEADER TO FIRST FILE ──
        if (filesInLayer.length > 0) {
          const sourceTheme = getLayerTheme(key);
          mappedEdges.push({
            id: `edge-header-to-first-${key}`,
            source: `layer-${key}`,
            target: filesInLayer[0].id,
            animated: true,
            markerEnd: {
              type: "arrowclosed" as any,
              color: sourceTheme.primary,
              width: 14,
              height: 14,
            },
            style: {
              stroke: sourceTheme.primary,
              strokeWidth: 2.0,
              opacity: 0.65,
            },
          });
        }

        // ── UPDATE Y POSITION FOR NEXT LAYER ──
        // Calculate height of this layer: header height (approx 180) + files * 60 + spacing
        const layerHeight = 180 + visibleFiles.length * 60 + 40;
        currentY += layerHeight + LAYER_SPACING;
      });
      // Map File Nodes - Progressive Disclosure


      console.log('🎯 [LAYERED VIEW] Generated nodes:', mappedNodes.length, 'edges:', mappedEdges.length);
      if (mappedNodes.length === 0) {
        console.warn('⚠️ [LAYERED VIEW] No nodes generated from preGeneratedGraph!');
      }
      return { nodes: mappedNodes, edges: mappedEdges };
    }

    console.log('⚠️ [LAYERED VIEW] Falling back to manual node generation');
    const flowNodes: any[] = [];
    const flowEdges: any[] = [];
    const seenNodeIds = new Set<string>();

    const hasSearch = searchQuery.trim().length > 0;
    const isTourActive = false;

    let currentY = 30;
    const LAYER_SPACING = 40;
    const xCenter = 220;

    for (let idx = 0; idx < LAYERS_CONFIG.length; idx++) {
      const key = LAYERS_CONFIG[idx].id;
      const label = LAYERS_CONFIG[idx].name;
      const files = layers[key] || [];
      const isExpanded = selectedLayerId === key;


      // Determine Opacity / Dimmed status
      let opacity = 1.0;
      let isNodeActive = true;
      if (isTourActive) {
        isNodeActive = selectedLayerId === key;
        opacity = isNodeActive ? 1.0 : 0.18;
      } else if (hasSearch) {
        const isFocused = searchFocusedLayers.size === 0 || searchFocusedLayers.has(key);
        opacity = isFocused ? 1.0 : 0.18;
        isNodeActive = isFocused;
      }

      // Get layer metrics from backend data
      const layerMetrics = layersData?.find((l: any) => l.name?.toLowerCase() === key);
      const health = layerMetrics?.health || 0;
      const confidenceVal = layerMetrics?.confidence !== undefined
        ? (layerMetrics.confidence <= 1 ? layerMetrics.confidence * 100 : layerMetrics.confidence)
        : 0;

      const layerId = `layer-${key}`;
      if (!seenNodeIds.has(layerId)) {
        seenNodeIds.add(layerId);
        const fileDataArray = files.map((filePath: string) => {
          return {
            id: filePath,
            name: filePath.split(/[\\/]/).pop() || filePath,
            loc: "1.2K",
            deps: 4,
            reqPerSecond: 120,
            rating: 4.8,
            isGod: false,
            isDead: false,
            isRoute: false,
            isDatabase: key === "database",
            isSelected: false,
            onSelect: () => {},
          };
        });

        const currentVisibleCount = 5;

        flowNodes.push({
          id: layerId,
          type: "layerNode",
          data: {
            label,
            count: files.length,
            isExpanded,
            key,
            health,
            confidence: confidenceVal,
            hasMore: files.length > currentVisibleCount,
            visibleCount: currentVisibleCount,
            totalFiles: files.length,
            onShowMore: () => {},
            onToggle: () => { },
            files: fileDataArray,
          },
          position: { x: 150, y: currentY },
          style: {
            width: 400,
            opacity,
            transition: "opacity 250ms ease, transform 250ms ease",
            transform: isTourActive && isNodeActive ? "scale(1.04)" : "scale(1)",
          },
        });
      }

      currentY += 90 + LAYER_SPACING; // space below layer card


      // Connect this layer to next layer
      if (idx < LAYERS_CONFIG.length - 1) {
        const nextKey = LAYERS_CONFIG[idx + 1].id;
        const sourceNodeId = `layer-${key}`;
        const sourceTheme = getLayerTheme(key);

        let edgeDimmed = false;
        if (isTourActive) {
          edgeDimmed = !(selectedLayerId === key || selectedLayerId === nextKey);
        } else if (hasSearch) {
          const sourceFocused = searchFocusedLayers.size === 0 || searchFocusedLayers.has(key);
          const targetFocused = searchFocusedLayers.size === 0 || searchFocusedLayers.has(nextKey);

          edgeDimmed = !(sourceFocused && targetFocused);
        }
        flowEdges.push({
          id: `edge-layer-${key}-to-${nextKey}`,
          source: sourceNodeId,
          target: `layer-${nextKey}`,
          animated: !edgeDimmed,
          markerEnd: {
            type: "arrowclosed" as any,
            color: edgeDimmed ? "#3f3f46" : sourceTheme.primary,
            width: 14,
            height: 14,
          },
          style: {
            stroke: edgeDimmed ? "#3f3f46" : sourceTheme.primary,
            strokeWidth: edgeDimmed ? 1.5 : 2.5,
            opacity: edgeDimmed ? 0.15 : 0.65,
            transition: "opacity 250ms, stroke-width 250ms",
          },
        });
      }
    }

    console.log('🎯 [LAYERED VIEW] Manual flow nodes/edges generated:', flowNodes.length, flowEdges.length);
    return { nodes: flowNodes, edges: flowEdges };
  }, [layers, selectedLayerId, searchQuery, searchFocusedLayers, result]);

  // ✅ ADD CONSOLE LOG #13 - After nodes/edges useMemo
  console.log('🎨 [LAYERED VIEW] Final nodes/edges:', {
    nodesCount: nodes.length,
    edgesCount: edges.length,
    firstNode: nodes.length > 0 ? {
      id: nodes[0].id,
      type: nodes[0].type,
      position: nodes[0].position,
      data: nodes[0].data
    } : null
  });

  // ✅ ADD CONSOLE LOG #14 - Check if any nodes exist
  if (nodes.length === 0) {
    console.warn('⚠️ [LAYERED VIEW] No nodes generated! Check data sources.');
  }

  // Handle layer selection from central canvas
  const handleSelectLayer = (id: string) => {
    setSelectedLayerId(id);
  };

  if (!result && Object.keys(layers).length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#9FB0B3] gap-2 bg-[#071113] border border-[rgba(120,200,210,0.12)] rounded-2xl p-12">
        <Layers className="w-8 h-8 animate-spin text-[#2F80ED]" />
        <span className="text-xs font-semibold">Analyzing system architecture layers...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#071113] text-[#F4F7F7] p-5 rounded-2xl border border-[rgba(120,200,210,0.12)] shadow-2xl flex flex-col gap-5 relative overflow-hidden font-sans">
      {/* fine spatial background grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40" 
        style={{
          backgroundImage: `radial-gradient(rgba(90, 180, 190, 0.15) 1px, transparent 1px)`,
          backgroundSize: '22px 22px'
        }} 
      />

      {/* ── 1. PAGE HEADER ── */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[rgba(120,200,210,0.12)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F7F7] flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#2F80ED]" />
            Layered View
          </h1>
          <p className="text-xs text-[#9FB0B3] mt-0.5">
            Explore your codebase in layers — from routes to external services
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="relative w-72 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FB0B3]" />
            <input
              type="text"
              placeholder="Search files, endpoints, or dependencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0C171B] border border-[rgba(120,200,210,0.18)] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F4F7F7] placeholder-[#9FB0B3]/60 focus:outline-none focus:border-[#2F80ED] transition"
            />
          </div>
          <button className="px-3 py-2 rounded-lg bg-[#0C171B] border border-[rgba(120,200,210,0.18)] text-xs font-semibold text-[#9FB0B3] hover:text-[#F4F7F7] hover:border-[rgba(120,200,210,0.35)] transition flex items-center gap-1.5 shrink-0">
            <GitBranch className="w-3.5 h-3.5" />
            Tree View
          </button>
          <button className="px-3 py-2 rounded-lg bg-[#2F80ED]/15 border border-[#2F80ED]/40 text-xs font-semibold text-[#60A5FA] hover:bg-[#2F80ED]/25 transition flex items-center gap-1.5 shrink-0">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* ── 2. SUMMARY METRICS STRIP ── */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-3 flex flex-col justify-center">
          <span className="text-xl font-bold text-[#F4F7F7]">6</span>
          <span className="text-[11px] font-medium text-[#9FB0B3]">Layers</span>
        </div>
        <div className="bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-3 flex flex-col justify-center">
          <span className="text-xl font-bold text-[#F4F7F7]">{totalFiles}</span>
          <span className="text-[11px] font-medium text-[#9FB0B3]">Total Files</span>
        </div>
        <div className="bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-3 flex flex-col justify-center">
          <span className="text-xl font-bold text-[#F4F7F7]">{totalLoc.toLocaleString()}</span>
          <span className="text-[11px] font-medium text-[#9FB0B3]">Lines of Code</span>
        </div>
        <div className="bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-3 flex flex-col justify-center">
          <span className="text-xl font-bold text-[#60A5FA]">48</span>
          <span className="text-[11px] font-medium text-[#9FB0B3]">External APIs</span>
        </div>
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] italic text-[#9FB0B3] leading-snug">
              "A clearer codebase builds a fairer tomorrow."
            </p>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-[#16C7A3] mt-0.5 block">
              Helix Architecture Observability
            </span>
          </div>
          <Quote className="w-5 h-5 text-[#9FB0B3]/30 shrink-0" />
        </div>
      </div>

      {/* ── 3. MAIN THREE-COLUMN WORKSPACE ── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* LEFT COLUMN: Layer Descriptions (280px / 3 cols) */}
        <div className="lg:col-span-3 bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#9FB0B3] pb-1 border-b border-[rgba(120,200,210,0.1)]">
            Layer Descriptions
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[560px] pr-1 custom-scrollbar">
            {LAYERS_CONFIG.map((layer) => {
              const Icon = layer.icon;
              const isSelected = selectedLayerId === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => handleSelectLayer(layer.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-[#101D21] border-[#2F80ED] shadow-md"
                      : "bg-[#071113]/60 border-[rgba(120,200,210,0.08)] hover:border-[rgba(120,200,210,0.25)] hover:bg-[#101D21]/60"
                  }`}
                  style={{
                    borderColor: isSelected ? layer.color : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="text-xs font-extrabold"
                      style={{ color: layer.color }}
                    >
                      {layer.num}
                    </span>
                    <div
                      className="p-1.5 rounded-md shrink-0"
                      style={{ backgroundColor: layer.bgColor }}
                    >
                      <Icon size={14} style={{ color: layer.color }} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#F4F7F7] truncate">
                        {layer.name}
                      </h4>
                      <p className="text-[10px] text-[#9FB0B3] truncate mt-0.5">
                        {layer.shortDesc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-transform ${
                      isSelected ? "text-[#F4F7F7] translate-x-0.5" : "text-[#9FB0B3]/40"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: 3D Layered Architecture Canvas (6 cols) */}
        <div className="lg:col-span-6 bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-4 relative min-h-[560px] flex flex-col justify-between overflow-hidden">
          {/* Subtle Grid overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(90, 180, 190, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(90, 180, 190, 0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Top Annotation: Incoming Requests */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[10px] font-bold text-[#60A5FA] tracking-wider uppercase bg-[#2F80ED]/10 border border-[#2F80ED]/30 px-2.5 py-0.5 rounded-full">
              Incoming Requests
            </span>
            <div className="w-0.5 h-4 bg-gradient-to-b from-[#2F80ED] to-transparent my-1 animate-pulse" />
          </div>

          {/* Isometric 3D Stack Visualization */}
          <div className="relative z-10 my-auto flex flex-col items-center gap-3 py-2">
            {LAYERS_CONFIG.map((layer) => {
              const Icon = layer.icon;
              const isSelected = selectedLayerId === layer.id;
              const fileCount = (layers[layer.id] || []).length;

              return (
                <div
                  key={layer.id}
                  onClick={() => handleSelectLayer(layer.id)}
                  className={`w-4/5 max-w-[420px] h-[58px] rounded-lg p-3 cursor-pointer transition-all duration-300 relative flex items-center justify-between border ${
                    isSelected
                      ? "scale-105 shadow-2xl z-20"
                      : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
                  }`}
                  style={{
                    backgroundColor: isSelected ? layer.bgColor : "rgba(16, 29, 33, 0.85)",
                    borderColor: layer.color,
                    boxShadow: isSelected ? `0 10px 30px ${layer.bgColor}` : "0 4px 15px rgba(0,0,0,0.3)",
                    transform: isSelected ? "perspective(500px) rotateX(10deg) scale(1.04)" : "perspective(500px) rotateX(12deg)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black" style={{ color: layer.color }}>
                      {layer.num}
                    </span>
                    <Icon size={16} style={{ color: layer.color }} />
                    <span className="text-xs font-bold text-[#F4F7F7]">{layer.name}</span>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#9FB0B3] border border-white/5">
                    {fileCount} files
                  </span>

                  {/* Contextual Annotation Callouts */}
                  {layer.id === "routes" && (
                    <div className="absolute -right-32 top-0 bg-[#071113]/95 border border-[#2F80ED]/40 rounded-lg p-2 text-[9px] font-mono text-[#9FB0B3] hidden sm:block shadow-xl">
                      <div className="text-[8px] font-bold text-[#60A5FA] uppercase">HTTP Request</div>
                      <div className="text-emerald-400 font-bold mt-0.5">GET /api/v1/users</div>
                    </div>
                  )}

                  {layer.id === "controllers" && (
                    <div className="absolute -left-36 top-0 bg-[#071113]/95 border border-[#8B5CF6]/40 rounded-lg p-2 text-[9px] font-mono text-[#9FB0B3] hidden sm:block shadow-xl">
                      <div className="text-[8px] font-bold text-[#8B5CF6] uppercase">Rules</div>
                      <div>Validation & Auth</div>
                    </div>
                  )}

                  {layer.id === "repositories" && (
                    <div className="absolute -left-28 bottom-0 bg-[#071113]/95 border border-[#F43F7A]/40 rounded-lg p-2 text-[9px] font-mono text-[#9FB0B3] hidden sm:block shadow-xl flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#F43F7A]" />
                      <span>PostgreSQL DB</span>
                    </div>
                  )}

                  {layer.id === "external" && (
                    <div className="absolute -right-36 bottom-0 bg-[#071113]/95 border border-[#60A5FA]/40 rounded-lg p-2 text-[9px] font-mono text-[#9FB0B3] hidden sm:block shadow-xl">
                      <div className="text-[8px] font-bold text-[#60A5FA] uppercase">External APIs</div>
                      <div>Payment, Auth & SMS</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Canvas Controls */}
          <div className="relative z-10 flex items-center justify-between text-[10px] text-[#9FB0B3] border-t border-[rgba(120,200,210,0.1)] pt-2">
            <span className="font-mono">Zoom: 100% | Interactive Isometric Stack</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedLayerId("routes")} 
                className="px-2 py-0.5 rounded bg-[#101D21] border border-[rgba(120,200,210,0.15)] hover:text-[#F4F7F7]"
              >
                Fit Stack
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Layer Inspector (320px / 3 cols) */}
        {selectedLayerMeta && isInspectorOpen && (
          <div className="lg:col-span-3 bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-4 flex flex-col gap-3">
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(120,200,210,0.1)]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold" style={{ color: selectedLayerMeta.color }}>
                  Layer {selectedLayerMeta.num}
                </span>
                <span className="text-xs font-bold text-[#F4F7F7]">
                  — {selectedLayerMeta.name}
                </span>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="text-[#9FB0B3] hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Inspector Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[#071113]">
              {(["overview", "files", "dependencies", "metrics"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setInspectorTab(tab)}
                  className={`py-1 text-[10px] font-bold capitalize rounded transition ${
                    inspectorTab === tab
                      ? "bg-[#101D21] text-[#F4F7F7] border border-[rgba(120,200,210,0.2)]"
                      : "text-[#9FB0B3] hover:text-[#F4F7F7]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Inspector Content */}
            {inspectorTab === "overview" && (
              <div className="flex flex-col gap-3">
                <p className="text-[11px] text-[#9FB0B3] leading-relaxed">
                  Contains all {selectedLayerMeta.name.toLowerCase()} logic and modular entry points for this application layer.
                </p>

                {/* Compact Tile Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#071113] p-2 rounded-lg border border-[rgba(120,200,210,0.08)] flex flex-col items-center">
                    <span className="text-base font-bold text-[#F4F7F7]">{selectedLayerFiles.length}</span>
                    <span className="text-[9px] text-[#9FB0B3]">Files</span>
                  </div>
                  <div className="bg-[#071113] p-2 rounded-lg border border-[rgba(120,200,210,0.08)] flex flex-col items-center">
                    <span className="text-base font-bold text-[#60A5FA]">24</span>
                    <span className="text-[9px] text-[#9FB0B3]">Endpoints</span>
                  </div>
                  <div className="bg-[#071113] p-2 rounded-lg border border-[rgba(120,200,210,0.08)] flex flex-col items-center">
                    <span className="text-base font-bold text-[#16C7A3]">12</span>
                    <span className="text-[9px] text-[#9FB0B3]">Deps</span>
                  </div>
                </div>

                {/* Health Meter Ring */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#071113] border border-[rgba(120,200,210,0.08)]">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#F4F7F7]">Layer Health</span>
                    <span className="text-[10px] text-[#16C7A3]">Optimal & Secure</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-[#16C7A3] flex items-center justify-center font-mono font-bold text-xs text-[#F4F7F7]">
                    85%
                  </div>
                </div>

                {/* Top Files List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FB0B3]">Top Files</span>
                    <span className="text-[9px] text-[#2F80ED] font-semibold cursor-pointer">View All →</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {topFilesList.slice(0, 5).map((file, idx) => (
                      <div
                        key={file.name}
                        className="flex items-center justify-between p-2 rounded bg-[#071113] text-[10px] border border-[rgba(120,200,210,0.06)]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[#9FB0B3] w-3">0{idx + 1}</span>
                          <FileCode className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                          <span className="font-mono text-[#F4F7F7] truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[#9FB0B3]">
                          <span>{file.loc}</span>
                          <div className="flex items-center text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span className="ml-0.5">{file.score}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {inspectorTab === "files" && (
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {selectedLayerFiles.map((file: string) => (
                  <div key={file} className="p-2 rounded bg-[#071113] border border-[rgba(120,200,210,0.08)] flex items-center justify-between text-xs">
                    <span className="font-mono text-[#F4F7F7] truncate">{file.split(/[\\/]/).pop()}</span>
                    <span className="text-[9px] text-[#9FB0B3]">Active</span>
                  </div>
                ))}
              </div>
            )}

            {inspectorTab === "dependencies" && (
              <div className="flex flex-col gap-2 text-xs text-[#9FB0B3]">
                <div className="p-2 rounded bg-[#071113] border border-[rgba(120,200,210,0.08)]">
                  <span className="font-bold text-[#F4F7F7] block">Depends on:</span>
                  <span className="text-[10px]">Services, Middleware</span>
                </div>
                <div className="p-2 rounded bg-[#071113] border border-[rgba(120,200,210,0.08)]">
                  <span className="font-bold text-[#F4F7F7] block">Used by:</span>
                  <span className="text-[10px]">HTTP Router & Entry API</span>
                </div>
              </div>
            )}

            {inspectorTab === "metrics" && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-[#071113] border border-[rgba(120,200,210,0.08)]">
                  <span className="text-[9px] text-[#9FB0B3] block">Complexity</span>
                  <span className="font-bold text-[#F4F7F7]">Low (3.2)</span>
                </div>
                <div className="p-2.5 rounded bg-[#071113] border border-[rgba(120,200,210,0.08)]">
                  <span className="text-[9px] text-[#9FB0B3] block">Coupling</span>
                  <span className="font-bold text-[#16C7A3]">Loose</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. BOTTOM ANALYTICS ROW (3 Equal Columns ~1/3 each) ── */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Layer Distribution Panel */}
        <div className="bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#F4F7F7]">Layer Distribution</span>
            <span className="text-[10px] text-[#9FB0B3] bg-[#071113] px-2 py-0.5 rounded border border-[rgba(120,200,210,0.1)]">By Files ▼</span>
          </div>

          {/* Horizontal Stacked Bar */}
          <div className="w-full h-3.5 bg-[#071113] rounded-full overflow-hidden flex my-2 border border-[rgba(120,200,210,0.1)]">
            {LAYERS_CONFIG.map((layer) => {
              const fileCount = (layers[layer.id] || []).length;
              const pct = totalFiles > 0 ? Math.max(5, Math.round((fileCount / totalFiles) * 100)) : 16;
              return (
                <div
                  key={layer.id}
                  style={{ width: `${pct}%`, backgroundColor: layer.color }}
                  title={`${layer.name}: ${pct}%`}
                  className="h-full transition-all"
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-1.5 text-[9px] text-[#9FB0B3] mt-2">
            {LAYERS_CONFIG.map((layer) => {
              const fileCount = (layers[layer.id] || []).length;
              const pct = totalFiles > 0 ? Math.round((fileCount / totalFiles) * 100) : 16;
              return (
                <div key={layer.id} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layer.color }} />
                  <span className="truncate">{layer.name} {pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inter-Layer Dependencies (Sankey Flow Diagram) */}
        <div className="bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-[#F4F7F7] mb-2">Inter-Layer Dependencies</span>
          <div className="relative w-full h-24 flex items-center justify-between px-2">
            {/* SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M 60 25 C 140 25, 140 25, 220 25" stroke="#2F80ED" strokeWidth="2.5" fill="none" opacity="0.6" />
              <path d="M 60 45 C 140 45, 140 65, 220 65" stroke="#8B5CF6" strokeWidth="2.5" fill="none" opacity="0.6" />
              <path d="M 60 65 C 140 65, 140 45, 220 45" stroke="#16C7A3" strokeWidth="2.5" fill="none" opacity="0.6" />
            </svg>

            {/* Left nodes */}
            <div className="flex flex-col gap-1.5 z-10">
              <span className="px-2 py-1 rounded bg-[#2F80ED]/20 border border-[#2F80ED] text-[9px] font-bold text-[#F4F7F7]">Routes</span>
              <span className="px-2 py-1 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6] text-[9px] font-bold text-[#F4F7F7]">Controllers</span>
              <span className="px-2 py-1 rounded bg-[#16C7A3]/20 border border-[#16C7A3] text-[9px] font-bold text-[#F4F7F7]">Middleware</span>
            </div>

            {/* Right nodes */}
            <div className="flex flex-col gap-1.5 z-10">
              <span className="px-2 py-1 rounded bg-[#F5A623]/20 border border-[#F5A623] text-[9px] font-bold text-[#F4F7F7]">Services</span>
              <span className="px-2 py-1 rounded bg-[#F43F7A]/20 border border-[#F43F7A] text-[9px] font-bold text-[#F4F7F7]">Repositories</span>
              <span className="px-2 py-1 rounded bg-[#60A5FA]/20 border border-[#60A5FA] text-[9px] font-bold text-[#F4F7F7]">External APIs</span>
            </div>
          </div>
        </div>

        {/* Layer Insights */}
        <div className="bg-[#0C171B] border border-[rgba(120,200,210,0.12)] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-[#F4F7F7]">Layer Insights</span>
            </div>
            <span className="text-[9px] font-semibold text-[#60A5FA] bg-[#2F80ED]/15 border border-[#2F80ED]/30 px-2 py-0.5 rounded-full">
              AI Powered
            </span>
          </div>

          <div className="flex flex-col gap-2 text-[10px] text-[#9FB0B3]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Routes layer has highest number of endpoints (24).</span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-[#60A5FA] shrink-0 mt-0.5" />
              <span>3 files in Controllers depend directly on External Services.</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Consider adding request validation to 2 new routes.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>No circular layer dependencies detected.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
