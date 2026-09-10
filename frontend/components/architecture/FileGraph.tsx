"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Node,
  Edge,
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
  X,
  ArrowRight,
  ArrowLeft,
  Search,
  FolderGit2,
  Layers,
  Code2,
  Settings,
  Sparkles,
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
      return { label: "TSX", color: "#16C7A3", bg: "rgba(22, 199, 163, 0.15)" };
    case "ts":
      return { label: "TS", color: "#3288F5", bg: "rgba(50, 136, 245, 0.15)" };
    case "jsx":
      return { label: "JSX", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.15)" };
    case "js":
    case "mjs":
    case "cjs":
      return { label: "JS", color: "#F5A623", bg: "rgba(245, 166, 35, 0.15)" };
    case "json":
      return { label: "JSON", color: "#00B8D9", bg: "rgba(0, 184, 217, 0.15)" };
    case "sql":
      return { label: "SQL", color: "#E83E5B", bg: "rgba(232, 62, 91, 0.15)" };
    default:
      return { label: ext.toUpperCase() || "FILE", color: "#91A0A5", bg: "rgba(145, 160, 165, 0.15)" };
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

// --- Compact Node Component (~105px × 40px) ---
function HierarchicalDependencyNode({ data }: { data: DependencyNodeData }) {
  const meta = CATEGORY_MAP[data.category] || CATEGORY_MAP.Utility;
  const extBadge = getFileExtensionBadge(data.name);

  const opacity = data.isDimmed ? 0.2 : 1;
  const isSelected = data.isSelected;
  const isNeighborhood = data.isNeighborhood;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onSelectNode?.(data.id);
      }}
      className="group relative w-[105px] h-[40px] rounded-[10px] px-2 py-1 text-left transition-all duration-150 select-none cursor-pointer flex flex-col justify-between"
      style={{
        opacity,
        backgroundColor: "#10171B",
        border: isSelected
          ? `2px solid ${meta.color}`
          : isNeighborhood
          ? `1.5px solid ${meta.color}bb`
          : `1px solid rgba(100, 140, 150, 0.18)`,
        boxShadow: isSelected
          ? `0 0 16px -2px ${meta.color}60`
          : `0 4px 12px -4px rgba(0, 0, 0, 0.5)`,
      }}
    >
      {/* Discreet 5px Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-[5px] !h-[5px] !rounded-full !bg-[#070A0C] !border !top-[-3px] opacity-40 group-hover:opacity-100"
        style={{ borderColor: meta.color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-[5px] !h-[5px] !rounded-full !bg-[#070A0C] !border !bottom-[-3px] opacity-40 group-hover:opacity-100"
        style={{ borderColor: meta.color }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-[5px] !h-[5px] !rounded-full !bg-[#070A0C] !border !left-[-3px] opacity-40 group-hover:opacity-100"
        style={{ borderColor: meta.color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-[5px] !h-[5px] !rounded-full !bg-[#070A0C] !border !right-[-3px] opacity-40 group-hover:opacity-100"
        style={{ borderColor: meta.color }}
      />

      {/* Top Row: Color indicator dot + Filename + Extension Badge */}
      <div className="flex items-center justify-between gap-1 w-full min-w-0">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
          <span className="text-[11px] font-bold text-[#F4F7F7] truncate font-mono leading-tight" title={data.name}>
            {data.name}
          </span>
        </div>
        <span
          className="text-[8.5px] font-mono font-bold px-1 py-0.2 rounded shrink-0 uppercase"
          style={{ color: extBadge.color, backgroundColor: extBadge.bg }}
        >
          {extBadge.label}
        </span>
      </div>

      {/* Bottom Row: LOC + Import Count */}
      <div className="flex items-center justify-between text-[9px] text-[#91A0A5] font-mono leading-none">
        <span>{data.loc} L</span>
        <span className="text-[#3288F5]">{data.imports.length} imp</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  dependencyNode: HierarchicalDependencyNode,
};

function ViewportZoom() {
  const { zoom } = useViewport();
  return <span>Zoom {Math.round(zoom * 100)}%</span>;
}

function FileGraphInternal({ result }: { result: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

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

  // 2. Neighborhood isolation
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

  // 3. Compact Hierarchical Layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

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

    const cardWidth = 105;
    const colSpacing = 135; // 105px width + 30px gap
    const rowSpacing = 85;  // 40px height + 45px gap
    const startY = 120;

    const maxCols = Math.max(
      1,
      ...Object.values(levelGroups).map((group) => group.length)
    );
    const totalCanvasWidth = maxCols * colSpacing;

    Object.entries(levelGroups).forEach(([levelStr, group]) => {
      const level = parseInt(levelStr, 10);
      const rowY = startY + level * rowSpacing;
      const rowWidth = group.length * colSpacing;
      const startX = Math.max(40, (totalCanvasWidth - rowWidth) / 2 + 40);

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

    // Quiet dependency SVG edges
    fileNodes.forEach((node: any) => {
      node.imports.forEach((targetId: string) => {
        const targetNode = fileNodes.find((f: any) => f.id === targetId);
        if (!targetNode) return;

        const isSecondary = targetNode.level <= node.level;

        edges.push({
          id: `edge-${node.id}-${targetId}`,
          source: node.id,
          sourceHandle: isSecondary ? "right" : "bottom",
          target: targetId,
          targetHandle: isSecondary ? "left" : "top",
          type: "smoothstep",
          style: {
            stroke: "rgba(145, 160, 165, 0.25)",
            strokeWidth: 1.5,
            strokeDasharray: isSecondary ? "4,4" : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 6,
            height: 6,
            color: "rgba(145, 160, 165, 0.3)",
          },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [fileNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  // Filters & Highlights
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
            strokeWidth: 2,
            opacity: 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 7,
            height: 7,
            color,
          },
        };
      }

      return {
        ...edge,
        style: {
          stroke: "rgba(145, 160, 165, 0.10)",
          strokeWidth: 1,
          opacity: 0.1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 5,
          height: 5,
          color: "rgba(145, 160, 165, 0.15)",
        },
      };
    });
  }, [edges, selectedNodeId]);

  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    return fileNodes.find((f: any) => f.id === selectedNodeId) || null;
  }, [selectedNodeId, fileNodes]);

  const selectedCategoryMeta = useMemo(() => {
    if (!selectedNodeData) return null;
    const cat = selectedNodeData.category as DependencyCategory;
    return CATEGORY_MAP[cat] || CATEGORY_MAP.Utility;
  }, [selectedNodeData]);

  const stats = useMemo(() => {
    const totalFiles = fileNodes.length;
    const totalImports = fileNodes.reduce((acc: number, f: any) => acc + f.imports.length, 0);
    const coreCount = fileNodes.filter((f: any) => f.category === "Core").length;
    const serviceCount = fileNodes.filter((f: any) => f.category === "Service").length;
    return { totalFiles, totalImports, coreCount, serviceCount };
  }, [fileNodes]);

  return (
    <div className="h-full w-full relative bg-[#070A0C] overflow-hidden flex flex-col font-sans select-none">
      {/* ── Top-Left Header Panel ────────────────────────────────────────── */}
      <div className="absolute top-5 left-6 z-20 bg-[#0B1518]/92 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-3.5 w-[385px] h-[74px]">
        <div className="w-10 h-10 rounded-xl bg-[#16C7A3]/15 border border-[#16C7A3]/40 flex items-center justify-center shrink-0">
          <Network size={20} className="text-[#16C7A3]" />
        </div>
        <div>
          <h1 className="text-[17px] font-bold leading-tight tracking-tight text-[#F7FAFA]">
            Dependency Graph
          </h1>
          <p className="text-[11px] text-[#91A0A5] mt-0.5 leading-snug">
            Visualize packages, imports and relationships
          </p>
        </div>
      </div>

      {/* ── Top-Right Search & Legend ────────────────────────────────────── */}
      <div className="absolute top-5 right-6 z-20 flex items-center gap-3 pointer-events-auto">
        {/* Compact Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91A0A5]" />
          <input
            type="text"
            placeholder="Filter files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[190px] h-[34px] pl-8 pr-7 py-1.5 rounded-xl bg-[#0B1518]/92 backdrop-blur-xl border border-white/10 text-xs text-[#F4F7F7] placeholder-[#91A0A5] focus:outline-none focus:border-[#16C7A3]/50 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#91A0A5] hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Legend Pills */}
        <div className="bg-[#0B1518]/92 backdrop-blur-xl rounded-xl px-3 py-1.5 border border-white/10 shadow-xl flex items-center gap-2 h-[34px]">
          {(Object.keys(CATEGORY_MAP) as DependencyCategory[]).map((cat) => {
            const item = CATEGORY_MAP[cat];
            const isSelected = selectedCategoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategoryFilter((prev) => (prev === cat ? null : cat))
                }
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-white/15 text-white shadow-sm ring-1 ring-white/30"
                    : "text-[#91A0A5] hover:text-white hover:bg-white/5"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
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
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <MiniMap
            nodeStrokeWidth={2}
            zoomable
            pannable
            className="!bg-[#0B1518] !border-white/10 rounded-xl overflow-hidden shadow-2xl !right-6 !bottom-14 !w-[200px] !h-[140px]"
            nodeColor={(n) => {
              const cat = (n.data as any)?.category as DependencyCategory;
              return CATEGORY_MAP[cat]?.color || "#16C7A3";
            }}
            maskColor="rgba(7, 10, 12, 0.82)"
          />
          <Background gap={20} size={1} color="rgba(255, 255, 255, 0.04)" />
        </ReactFlow>

        {/* ── Fixed Bottom-Left Graph Controls ────────────────────────── */}
        <div
          className="absolute left-6 bottom-14 z-20 flex items-center gap-1.5 bg-[#0B1518]/92 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => zoomIn()}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => zoomOut()}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => fitView({ padding: 0.2, duration: 500 })}
            className="px-2.5 h-7 rounded-lg bg-[#16C7A3]/15 hover:bg-[#16C7A3]/25 border border-[#16C7A3]/30 text-[#16C7A3] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            title="Fit to View"
          >
            Fit
          </button>
          <button
            onClick={() => fitView({ padding: 0.2, duration: 500 })}
            className="px-2.5 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            title="Auto Layout"
          >
            <Sparkles size={11} className="text-[#16C7A3]" />
            <span>Auto Layout</span>
          </button>
        </div>

        {/* ── Compact Right-Side Inspector Drawer Overlay ─────────────────── */}
        <AnimatePresence>
          {selectedNodeData && selectedCategoryMeta && (
            <motion.div
              initial={{ x: 370, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 370, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-20 right-6 bottom-16 w-[350px] bg-[#0B1518]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl p-4.5 z-30 flex flex-col overflow-y-auto text-left select-text"
            >
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                    style={{
                      backgroundColor: selectedCategoryMeta.bg,
                      border: `1px solid ${selectedCategoryMeta.border}`,
                    }}
                  >
                    {React.createElement(selectedCategoryMeta.icon, {
                      size: 20,
                      style: { color: selectedCategoryMeta.color },
                    })}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[16px] font-bold text-[#F4F7F7] truncate font-mono">
                      {selectedNodeData.name}
                    </div>
                    <div className="text-[10px] font-semibold text-[#16C7A3] uppercase tracking-wider mt-0.5">
                      {selectedCategoryMeta.label} Layer
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#91A0A5] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Full Path */}
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-[#132126] border border-white/5 font-mono text-[10.5px] text-[#91A0A5] truncate">
                {selectedNodeData.path}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <div className="p-2.5 rounded-xl bg-[#132126] border border-white/5">
                  <div className="text-[10px] text-[#91A0A5]">Lines of Code</div>
                  <div className="text-[17px] font-bold text-[#F4F7F7] mt-0.5 font-mono">
                    {selectedNodeData.loc}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#132126] border border-white/5">
                  <div className="text-[10px] text-[#91A0A5]">Complexity</div>
                  <div className="text-[17px] font-bold text-[#F4F7F7] mt-0.5 font-mono">
                    {selectedNodeData.complexity}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#132126] border border-white/5">
                  <div className="text-[10px] text-[#91A0A5]">Outbound Imports</div>
                  <div className="text-[17px] font-bold text-[#3288F5] mt-0.5 font-mono">
                    {selectedNodeData.imports.length}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#132126] border border-white/5">
                  <div className="text-[10px] text-[#91A0A5]">Inbound Callers</div>
                  <div className="text-[17px] font-bold text-[#16C7A3] mt-0.5 font-mono">
                    {selectedNodeData.importedBy.length}
                  </div>
                </div>
              </div>

              {/* Architectural Role */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[10px] font-bold text-[#91A0A5] uppercase tracking-wider mb-1">
                  Architectural Role
                </div>
                <div className="text-[12px] text-[#F4F7F7] leading-relaxed">
                  {selectedCategoryMeta.role}
                </div>
              </div>

              {/* DEPENDS ON (Imports list) */}
              <div className="mt-3.5 flex-1">
                <div className="text-[10px] font-bold text-[#91A0A5] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Depends On ({selectedNodeData.imports.length})</span>
                  <ArrowRight size={13} className="text-[#3288F5]" />
                </div>
                {selectedNodeData.imports.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {selectedNodeData.imports.map((imp: string) => {
                      const impName = imp.split(/[\\/]/).pop() || imp;
                      return (
                        <div
                          key={imp}
                          onClick={() => setSelectedNodeId(imp)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#132126] border border-white/5 hover:border-[#3288F5]/50 transition-colors cursor-pointer text-[11px] font-mono text-[#F4F7F7]"
                        >
                          <span className="truncate">{impName}</span>
                          <ArrowRight size={11} className="text-[#91A0A5] shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#91A0A5] italic py-1.5">
                    No internal dependencies (Leaf node)
                  </div>
                )}
              </div>

              {/* REFERENCED BY (Callers list) */}
              <div className="mt-3">
                <div className="text-[10px] font-bold text-[#91A0A5] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Referenced By ({selectedNodeData.importedBy.length})</span>
                  <ArrowLeft size={13} className="text-[#16C7A3]" />
                </div>
                {selectedNodeData.importedBy.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {selectedNodeData.importedBy.map((ref: string) => {
                      const refName = ref.split(/[\\/]/).pop() || ref;
                      return (
                        <div
                          key={ref}
                          onClick={() => setSelectedNodeId(ref)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#132126] border border-white/5 hover:border-[#16C7A3]/50 transition-colors cursor-pointer text-[11px] font-mono text-[#F4F7F7]"
                        >
                          <span className="truncate">{refName}</span>
                          <ArrowLeft size={11} className="text-[#91A0A5] shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#91A0A5] italic py-1.5">
                    No incoming internal callers
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Fixed Bottom Status Bar ───────────────────────────────────────── */}
      <div className="h-10 bg-[#070A0C]/95 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between text-xs text-[#91A0A5] shrink-0 z-20">
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
