"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Network,
  FileCode,
  Layers,
  Terminal,
  Database,
  Code2,
  Shield,
  Settings,
  X,
  ArrowRight,
  ArrowLeft,
  Search,
  Maximize2,
  Activity,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Semantic Category Definitions & Colors ---
export type DependencyCategory = "Core" | "Feature" | "Service" | "Utility" | "Config";

interface CategoryMeta {
  label: DependencyCategory;
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  role: string;
}

const CATEGORY_MAP: Record<DependencyCategory, CategoryMeta> = {
  Core: {
    label: "Core",
    color: "#16C7A3",
    bg: "rgba(22, 199, 163, 0.15)",
    border: "rgba(22, 199, 163, 0.45)",
    icon: FolderGit2,
    role: "Application Entry & Core Orchestration",
  },
  Feature: {
    label: "Feature",
    color: "#3288F5",
    bg: "rgba(50, 136, 245, 0.15)",
    border: "rgba(50, 136, 245, 0.45)",
    icon: Network,
    role: "Route Endpoints & User Feature Boundaries",
  },
  Service: {
    label: "Service",
    color: "#8B5CF6",
    bg: "rgba(139, 92, 246, 0.15)",
    border: "rgba(139, 92, 246, 0.45)",
    icon: Layers,
    role: "Business Domain Logic & Controllers",
  },
  Utility: {
    label: "Utility",
    color: "#F5A623",
    bg: "rgba(245, 166, 35, 0.15)",
    border: "rgba(245, 166, 35, 0.45)",
    icon: Code2,
    role: "Repositories, Models & Shared Helpers",
  },
  Config: {
    label: "Config",
    color: "#E83E5B",
    bg: "rgba(232, 62, 91, 0.15)",
    border: "rgba(232, 62, 91, 0.45)",
    icon: Settings,
    role: "Environment, Database & Infrastructure Config",
  },
};

function inferCategoryAndLevel(filename: string): { category: DependencyCategory; level: number } {
  const lower = filename.toLowerCase();

  // Level 1: Core / Root Entrypoints
  if (
    lower.includes("app.") ||
    lower.includes("server.") ||
    lower.includes("main.") ||
    lower.includes("index.") ||
    lower.includes("client.") ||
    lower.includes("bootstrap.")
  ) {
    return { category: "Core", level: 0 };
  }

  // Level 2: Features / Routes / APIs
  if (
    lower.includes("route") ||
    lower.includes("api") ||
    lower.includes("view") ||
    lower.includes("page") ||
    lower.includes("endpoint") ||
    lower.includes("router")
  ) {
    return { category: "Feature", level: 1 };
  }

  // Level 3: Services / Controllers / Handlers / Middleware
  if (
    lower.includes("controller") ||
    lower.includes("service") ||
    lower.includes("handler") ||
    lower.includes("manager") ||
    lower.includes("middleware") ||
    lower.includes("auth")
  ) {
    return { category: "Service", level: 2 };
  }

  // Level 4: Repositories / Models / Schemas
  if (
    lower.includes("repo") ||
    lower.includes("repository") ||
    lower.includes("model") ||
    lower.includes("schema") ||
    lower.includes("entity") ||
    lower.includes("dto") ||
    lower.includes("type")
  ) {
    return { category: "Utility", level: 3 };
  }

  // Level 5: Utilities / Config / Database
  if (
    lower.includes("config") ||
    lower.includes("env") ||
    lower.includes("setting")
  ) {
    return { category: "Config", level: 4 };
  }

  return { category: "Utility", level: 4 };
}

function getFileExtensionBadge(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "tsx":
      return { label: "TSX", color: "#16C7A3", bg: "rgba(22, 199, 163, 0.15)", border: "rgba(22, 199, 163, 0.45)" };
    case "ts":
      return { label: "TS", color: "#3288F5", bg: "rgba(50, 136, 245, 0.15)", border: "rgba(50, 136, 245, 0.45)" };
    case "jsx":
      return { label: "JSX", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.45)" };
    case "js":
    case "mjs":
    case "cjs":
      return { label: "JS", color: "#F5A623", bg: "rgba(245, 166, 35, 0.15)", border: "rgba(245, 166, 35, 0.45)" };
    case "json":
      return { label: "JSON", color: "#00B8D9", bg: "rgba(0, 184, 217, 0.15)", border: "rgba(0, 184, 217, 0.45)" };
    case "sql":
      return { label: "SQL", color: "#E83E5B", bg: "rgba(232, 62, 91, 0.15)", border: "rgba(232, 62, 91, 0.45)" };
    default:
      return { label: ext.toUpperCase() || "FILE", color: "#91A7AA", bg: "rgba(145, 167, 170, 0.15)", border: "rgba(145, 167, 170, 0.45)" };
  }
}

// --- Node Data Interface ---
interface DependencyNodeData {
  id: string;
  name: string;
  path: string;
  loc: number;
  complexity: number;
  imports: string[];
  importedBy: string[];
  category: DependencyCategory;
  level: number;
  isSelected?: boolean;
  isDimmed?: boolean;
  isNeighborhood?: boolean;
  onSelectNode?: (id: string) => void;
}

// --- Custom Node Component (~300px × 160px) ---
function HierarchicalDependencyNode({ data }: { data: DependencyNodeData }) {
  const meta = CATEGORY_MAP[data.category] || CATEGORY_MAP.Utility;
  const extBadge = getFileExtensionBadge(data.name);
  const Icon = meta.icon;

  const opacity = data.isDimmed ? 0.22 : 1;
  const isSelected = data.isSelected;
  const isNeighborhood = data.isNeighborhood;

  return (
    <div
      onClick={() => data.onSelectNode?.(data.id)}
      className="group relative w-[300px] min-h-[160px] rounded-[16px] p-4 text-left transition-all duration-200 select-none cursor-pointer"
      style={{
        opacity,
        backgroundColor: "#101A1E",
        border: isSelected
          ? `2px solid ${meta.color}`
          : isNeighborhood
          ? `1.5px solid ${meta.color}99`
          : `1px solid ${meta.color}50`,
        boxShadow: isSelected
          ? `0 0 25px -2px ${meta.color}60, 0 10px 25px -5px rgba(0, 0, 0, 0.8)`
          : `0 8px 24px -6px rgba(0, 0, 0, 0.6)`,
      }}
    >
      {/* Discreet 7px Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-[7px] !h-[7px] !rounded-full !bg-[#071113] !border !top-[-4px] opacity-40 group-hover:opacity-100 transition-opacity"
        style={{ borderColor: meta.color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-[7px] !h-[7px] !rounded-full !bg-[#071113] !border !bottom-[-4px] opacity-40 group-hover:opacity-100 transition-opacity"
        style={{ borderColor: meta.color }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-[7px] !h-[7px] !rounded-full !bg-[#071113] !border !left-[-4px] opacity-40 group-hover:opacity-100 transition-opacity"
        style={{ borderColor: meta.color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-[7px] !h-[7px] !rounded-full !bg-[#071113] !border !right-[-4px] opacity-40 group-hover:opacity-100 transition-opacity"
        style={{ borderColor: meta.color }}
      />

      {/* Top Section: 48px Icon + Filename (Highest Priority) + Extension Badge */}
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105"
          style={{
            backgroundColor: meta.bg,
            border: `1px solid ${meta.border}`,
          }}
        >
          <Icon size={22} style={{ color: meta.color }} />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div
            className="text-[18px] font-bold text-[#F4F7F7] truncate font-mono tracking-tight leading-snug"
            title={data.name}
          >
            {data.name}
          </div>
          {/* Medium Priority: LOC */}
          <div className="text-[14px] font-medium text-[#91A7AA] mt-0.5">
            {data.loc} LOC
          </div>
        </div>

        {/* Small Top-Right Extension Badge */}
        <div
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase shrink-0"
          style={{
            backgroundColor: extBadge.bg,
            border: `1px solid ${extBadge.border}`,
            color: extBadge.color,
          }}
        >
          {extBadge.label}
        </div>
      </div>

      {/* Bottom Section: Low Priority Metrics */}
      <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[12px] text-[#91A7AA]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#F4F7F7] font-semibold">{data.complexity}</span> complexity
        </div>
        <span className="text-white/20">·</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[#3288F5] font-semibold">{data.imports.length}</span> imports
        </div>
        <span className="text-white/20">·</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[#16C7A3] font-semibold">{data.importedBy.length}</span> callers
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  dependencyNode: HierarchicalDependencyNode,
};

// --- Bottom Zoom / Metric Helper ---
function ViewportZoom() {
  const { zoom } = useViewport();
  return <span>Zoom {Math.round(zoom * 100)}%</span>;
}

function FileGraphInternal({ result }: { result: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const { setCenter } = useReactFlow();

  // 1. Process files and derive hierarchical dependency metadata
  const fileNodes = useMemo(() => {
    const rawFiles = result?.files || [];
    return rawFiles
      .filter(
        (f: any) =>
          !f.path.startsWith("ROUTE:") &&
          !f.path.startsWith("ENV:") &&
          !f.path.startsWith("DB:") &&
          !f.path.startsWith("ENTITY:")
      )
      .map((f: any) => {
        const complexityInfo = result?.staticAnalysis?.complexity?.find(
          (c: any) => c.file === f.path
        );
        const complexity = complexityInfo?.score || Math.max(1, Math.round((f.lineCount || 50) / 35));
        const loc = f.lineCount || 45;
        const imports = f.internalImports || f.dependencies || [];
        const importedBy = f.referencedBy || [];
        const name = f.path.split(/[\\/]/).pop() || f.path;
        const { category, level } = inferCategoryAndLevel(name);

        return {
          id: f.path,
          name,
          path: f.path,
          loc,
          complexity,
          imports,
          importedBy,
          category,
          level,
        };
      });
  }, [result]);

  // 2. Build neighborhood sets for interactive isolation
  const neighborhood = useMemo(() => {
    if (!selectedNodeId) return null;
    const selected = fileNodes.find((f: any) => f.id === selectedNodeId);
    if (!selected) return null;

    const directTargets = new Set(selected.imports);
    const directSources = new Set(selected.importedBy);
    const allConnected = new Set([selectedNodeId, ...selected.imports, ...selected.importedBy]);

    return {
      selectedId: selectedNodeId,
      targets: directTargets,
      sources: directSources,
      allConnected,
    };
  }, [selectedNodeId, fileNodes]);

  // 3. Hierarchical Layout (5 Levels)
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Group nodes by architectural level
    const levelGroups: Record<number, typeof fileNodes> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
    };

    fileNodes.forEach((node: any) => {
      const lvl = Math.min(4, Math.max(0, node.level));
      levelGroups[lvl].push(node);
    });

    const cardWidth = 300;
    const colSpacing = 370; // cardWidth + 70px gap
    const rowSpacing = 240; // cardHeight + 80px gap
    const startY = 100;

    // Find max column count to center narrower tiers
    const maxCols = Math.max(
      1,
      ...Object.values(levelGroups).map((group) => group.length)
    );
    const totalCanvasWidth = maxCols * colSpacing;

    Object.entries(levelGroups).forEach(([levelStr, group]) => {
      const level = parseInt(levelStr, 10);
      const rowY = startY + level * rowSpacing;
      const rowWidth = group.length * colSpacing;
      const startX = Math.max(60, (totalCanvasWidth - rowWidth) / 2 + 60);

      group.forEach((node: any, colIdx: number) => {
        const x = startX + colIdx * colSpacing;
        const y = rowY;

        nodes.push({
          id: node.id,
          type: "dependencyNode",
          position: { x, y },
          data: {
            ...node,
            onSelectNode: (id: string) => setSelectedNodeId((prev) => (prev === id ? null : id)),
          },
        });
      });
    });

    // Generate quiet SVG edges
    fileNodes.forEach((node: any) => {
      node.imports.forEach((targetId: string) => {
        const targetNode = fileNodes.find((f: any) => f.id === targetId);
        if (!targetNode) return;

        // Determine if this is a secondary / horizontal or bottom dependency
        const isSecondary = targetNode.level <= node.level;
        const edgeColor = CATEGORY_MAP[node.category as DependencyCategory]?.color || "#91A7AA";

        edges.push({
          id: `edge-${node.id}-${targetId}`,
          source: node.id,
          sourceHandle: isSecondary ? "right" : "bottom",
          target: targetId,
          targetHandle: isSecondary ? "left" : "top",
          type: "smoothstep",
          style: {
            stroke: "rgba(145, 167, 170, 0.45)",
            strokeWidth: 2,
            strokeDasharray: isSecondary ? "5,5" : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 7,
            height: 7,
            color: "rgba(145, 167, 170, 0.65)",
          },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [fileNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronization guards
  const lastSyncedNodeIds = useRef<string>("");
  const lastSyncedEdgeIds = useRef<string>("");

  useEffect(() => {
    const newIds = initialNodes.map((n) => n.id).join(",");
    if (newIds !== lastSyncedNodeIds.current) {
      lastSyncedNodeIds.current = newIds;
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    const newIds = initialEdges.map((e) => e.id).join(",");
    if (newIds !== lastSyncedEdgeIds.current) {
      lastSyncedEdgeIds.current = newIds;
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  // Apply Search, Category Filters, and Neighborhood Highlighting
  const displayNodes = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();

    return nodes.map((node: Node) => {
      const nodeData = node.data as unknown as DependencyNodeData;
      const isSelected = selectedNodeId === node.id;
      const inNeighborhood = neighborhood ? neighborhood.allConnected.has(node.id) : true;
      const matchesSearch = searchLower ? nodeData.name.toLowerCase().includes(searchLower) : true;
      const matchesCategory = selectedCategoryFilter
        ? nodeData.category === selectedCategoryFilter
        : true;

      const isDimmed =
        (selectedNodeId && !inNeighborhood) ||
        (searchLower && !matchesSearch) ||
        (selectedCategoryFilter && !matchesCategory);

      return {
        ...node,
        data: {
          ...node.data,
          isSelected,
          isNeighborhood: neighborhood && inNeighborhood && !isSelected,
          isDimmed,
        },
      };
    });
  }, [nodes, selectedNodeId, neighborhood, searchQuery, selectedCategoryFilter]);

  // Update edges with highlighted neighborhood styling
  const displayEdges = useMemo(() => {
    if (!selectedNodeId) return edges;

    return edges.map((edge: Edge) => {
      const isOutbound = edge.source === selectedNodeId;
      const isInbound = edge.target === selectedNodeId;
      const isConnected = isOutbound || isInbound;

      if (isConnected) {
        const color = isOutbound ? "#3288F5" : "#16C7A3";
        return {
          ...edge,
          animated: true,
          style: {
            stroke: color,
            strokeWidth: 2.5,
            opacity: 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 8,
            height: 8,
            color,
          },
        };
      }

      return {
        ...edge,
        style: {
          stroke: "rgba(145, 167, 170, 0.15)",
          strokeWidth: 1.5,
          opacity: 0.18,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 6,
          height: 6,
          color: "rgba(145, 167, 170, 0.2)",
        },
      };
    });
  }, [edges, selectedNodeId]);

  // Selected file details for the right inspector
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    return fileNodes.find((f: any) => f.id === selectedNodeId) || null;
  }, [selectedNodeId, fileNodes]);

  const selectedCategoryMeta = useMemo(() => {
    if (!selectedNodeData) return null;
    const cat = selectedNodeData.category as DependencyCategory;
    return CATEGORY_MAP[cat] || CATEGORY_MAP.Utility;
  }, [selectedNodeData]);

  // Counts for status bar & legend
  const stats = useMemo(() => {
    const totalFiles = fileNodes.length;
    const totalImports = fileNodes.reduce((acc: number, f: any) => acc + f.imports.length, 0);
    const coreCount = fileNodes.filter((f: any) => f.category === "Core").length;
    const serviceCount = fileNodes.filter((f: any) => f.category === "Service").length;
    return { totalFiles, totalImports, coreCount, serviceCount };
  }, [fileNodes]);

  return (
    <div className="h-full w-full relative bg-[#071113] overflow-hidden flex flex-col font-sans select-none">
      {/* ── Top Bar: Header + Legend (No center logo!) ───────────────────── */}
      <div className="absolute top-4 left-5 right-5 z-20 flex items-center justify-between gap-4 pointer-events-none">
        {/* Left: Branding & Subtitle */}
        <div className="bg-[#0B1518]/92 backdrop-blur-xl rounded-2xl px-5 py-3.5 border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#16C7A3]/15 border border-[#16C7A3]/40 flex items-center justify-center shrink-0">
            <Network size={22} className="text-[#16C7A3]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">
              <span className="text-[#F7FAFA]">Dependency </span>
              <span className="text-[#16C7A3]">Graph</span>
            </h1>
            <p className="text-[13px] text-[#91A7AA] mt-0.5">
              Visualize packages, imports and relationships
            </p>
          </div>
        </div>

        {/* Right: Search + Compact Category Legend */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Quick Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91A7AA]" />
            <input
              type="text"
              placeholder="Filter files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-9 pr-8 py-2 rounded-xl bg-[#0B1518]/92 backdrop-blur-xl border border-white/10 text-xs text-[#F4F7F7] placeholder-[#91A7AA] focus:outline-none focus:border-[#16C7A3]/50 focus:w-64 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#91A7AA] hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Compact Legend Pills */}
          <div className="bg-[#0B1518]/92 backdrop-blur-xl rounded-xl px-3.5 py-2 border border-white/10 shadow-xl flex items-center gap-2">
            {(Object.keys(CATEGORY_MAP) as DependencyCategory[]).map((cat) => {
              const item = CATEGORY_MAP[cat];
              const isSelected = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategoryFilter((prev) => (prev === cat ? null : cat))
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-white/15 text-white shadow-sm ring-1 ring-white/30"
                      : "text-[#91A7AA] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Graph Canvas ────────────────────────────────────────────── */}
      <div className="flex-1 w-full h-full relative" onClick={() => setSelectedNodeId(null)}>
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.12}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Controls className="!bg-[#0B1518] !border-white/10 !fill-[#F4F7F7] !text-[#F4F7F7] rounded-xl shadow-2xl !left-5 !bottom-16" />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-[#0B1518] !border-white/10 rounded-2xl overflow-hidden shadow-2xl !right-5 !bottom-16"
            nodeColor={(n) => {
              const cat = (n.data as any)?.category as DependencyCategory;
              return CATEGORY_MAP[cat]?.color || "#16C7A3";
            }}
            maskColor="rgba(7, 17, 19, 0.8)"
          />
          <Background gap={26} size={1.2} color="rgba(255, 255, 255, 0.04)" />
        </ReactFlow>

        {/* ── Right-Side Inspector Drawer ───────────────────────────────── */}
        <AnimatePresence>
          {selectedNodeData && selectedCategoryMeta && (
            <motion.div
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-20 right-5 bottom-16 w-[360px] bg-[#0B1518]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl p-5 z-30 flex flex-col overflow-y-auto text-left select-text"
            >
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                    style={{
                      backgroundColor: selectedCategoryMeta.bg,
                      border: `1px solid ${selectedCategoryMeta.border}`,
                    }}
                  >
                    {React.createElement(selectedCategoryMeta.icon, {
                      size: 22,
                      style: { color: selectedCategoryMeta.color },
                    })}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[17px] font-bold text-[#F4F7F7] truncate font-mono">
                      {selectedNodeData.name}
                    </div>
                    <div className="text-[11px] font-semibold text-[#16C7A3] uppercase tracking-wider mt-0.5">
                      {selectedCategoryMeta.label} Layer
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#91A7AA] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Full Path */}
              <div className="mt-3.5 px-3 py-2 rounded-lg bg-[#132126] border border-white/5 font-mono text-[11px] text-[#91A7AA] truncate">
                {selectedNodeData.path}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div className="p-3 rounded-xl bg-[#132126] border border-white/5">
                  <div className="text-[11px] text-[#91A7AA]">Lines of Code</div>
                  <div className="text-[19px] font-bold text-[#F4F7F7] mt-0.5 font-mono">
                    {selectedNodeData.loc}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#132126] border border-white/5">
                  <div className="text-[11px] text-[#91A7AA]">Complexity</div>
                  <div className="text-[19px] font-bold text-[#F4F7F7] mt-0.5 font-mono">
                    {selectedNodeData.complexity}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#132126] border border-white/5">
                  <div className="text-[11px] text-[#91A7AA]">Outbound Imports</div>
                  <div className="text-[19px] font-bold text-[#3288F5] mt-0.5 font-mono">
                    {selectedNodeData.imports.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#132126] border border-white/5">
                  <div className="text-[11px] text-[#91A7AA]">Inbound Callers</div>
                  <div className="text-[19px] font-bold text-[#16C7A3] mt-0.5 font-mono">
                    {selectedNodeData.importedBy.length}
                  </div>
                </div>
              </div>

              {/* Architectural Role */}
              <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[11px] font-bold text-[#91A7AA] uppercase tracking-wider mb-1">
                  Architectural Role
                </div>
                <div className="text-[13px] text-[#F4F7F7] leading-relaxed">
                  {selectedCategoryMeta.role}
                </div>
              </div>

              {/* DEPENDS ON (Imports list) */}
              <div className="mt-4 flex-1">
                <div className="text-[11px] font-bold text-[#91A7AA] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Depends On ({selectedNodeData.imports.length})</span>
                  <ArrowRight size={14} className="text-[#3288F5]" />
                </div>
                {selectedNodeData.imports.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedNodeData.imports.map((imp: string) => {
                      const impName = imp.split(/[\\/]/).pop() || imp;
                      return (
                        <div
                          key={imp}
                          onClick={() => setSelectedNodeId(imp)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#132126] border border-white/5 hover:border-[#3288F5]/50 transition-colors cursor-pointer text-xs font-mono text-[#F4F7F7]"
                        >
                          <span className="truncate">{impName}</span>
                          <ArrowRight size={12} className="text-[#91A7AA] shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-[#91A7AA] italic py-2">
                    No internal dependencies (Leaf node)
                  </div>
                )}
              </div>

              {/* REFERENCED BY (Callers list) */}
              <div className="mt-4">
                <div className="text-[11px] font-bold text-[#91A7AA] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Referenced By ({selectedNodeData.importedBy.length})</span>
                  <ArrowLeft size={14} className="text-[#16C7A3]" />
                </div>
                {selectedNodeData.importedBy.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedNodeData.importedBy.map((ref: string) => {
                      const refName = ref.split(/[\\/]/).pop() || ref;
                      return (
                        <div
                          key={ref}
                          onClick={() => setSelectedNodeId(ref)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#132126] border border-white/5 hover:border-[#16C7A3]/50 transition-colors cursor-pointer text-xs font-mono text-[#F4F7F7]"
                        >
                          <span className="truncate">{refName}</span>
                          <ArrowLeft size={12} className="text-[#91A7AA] shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-[#91A7AA] italic py-2">
                    No incoming internal callers
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Status Bar ────────────────────────────────────────────── */}
      <div className="h-10 bg-[#0B1518]/95 backdrop-blur-xl border-t border-white/10 px-5 flex items-center justify-between text-xs text-[#91A7AA] shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16C7A3]" />
            <strong className="text-[#F4F7F7] font-semibold">{stats.totalFiles}</strong> Files
          </span>
          <span className="text-white/20">·</span>
          <span>
            <strong className="text-[#F4F7F7] font-semibold">{stats.totalImports}</strong> Imports
          </span>
          <span className="text-white/20">·</span>
          <span>
            <strong className="text-[#F4F7F7] font-semibold">0</strong> Cycles
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[#16C7A3] font-medium">100% Parsed</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span className="text-[#F4F7F7] font-semibold">{stats.coreCount}</span> Core Modules
            <span className="text-white/20">·</span>
            <span className="text-[#F4F7F7] font-semibold">{stats.serviceCount}</span> Services
          </div>
          <span className="text-white/20 hidden sm:inline">│</span>
          <div className="font-mono text-xs text-[#F4F7F7]">
            <ViewportZoom />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FileGraph({ result }: { result: any }) {
  return (
    <ReactFlowProvider>
      <FileGraphInternal result={result} />
    </ReactFlowProvider>
  );
}

