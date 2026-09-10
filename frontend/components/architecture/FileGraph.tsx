"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
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
  FolderGit2,
  Layers,
  Code2,
  Settings,
  Sparkles,
  Lock,
  User,
  Folder,
  BarChart3,
  Radio,
  Shield,
  Database,
  LayoutGrid,
  List,
  GitBranch,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const GROUP_META: Record<string, { icon: any; color: string; label: string }> = {
  "/auth": { icon: Lock, color: "#3288F5", label: "AUTHENTICATION" },
  "/users": { icon: User, color: "#8B5CF6", label: "USER MANAGEMENT" },
  "/projects": { icon: Folder, color: "#00B8D9", label: "PROJECTS" },
  "/analysis": { icon: BarChart3, color: "#F5A623", label: "ANALYSIS" },
  "/scans": { icon: Radio, color: "#E83E5B", label: "SCANS" },
  "/admin": { icon: Shield, color: "#F97316", label: "ADMINISTRATION" },
  "/database": { icon: Database, color: "#16C7A3", label: "SERVICE" },
  "/components": { icon: Layers, color: "#8B5CF6", label: "UI COMPONENTS" },
  "/webhooks": { icon: Network, color: "#06B6D4", label: "WEBHOOKS" },
  "/reports": { icon: BarChart3, color: "#38BDF8", label: "REPORTING" },
  "/settings": { icon: Settings, color: "#A855F7", label: "SETTINGS" },
};

function inferCategoryAndLevel(filename: string): { category: DependencyCategory; level: number } {
  const lower = String(filename || "").toLowerCase();

  if (
    lower.includes("app.") ||
    lower.includes("server.") ||
    lower.includes("main.") ||
    lower.includes("index.") ||
    lower.includes("client.")
  ) {
    return { category: "Core", level: 0 };
  }

  if (
    lower.includes("route") ||
    lower.includes("api") ||
    lower.includes("view") ||
    lower.includes("page")
  ) {
    return { category: "Feature", level: 1 };
  }

  if (
    lower.includes("controller") ||
    lower.includes("service") ||
    lower.includes("handler") ||
    lower.includes("middleware")
  ) {
    return { category: "Service", level: 2 };
  }

  if (
    lower.includes("repo") ||
    lower.includes("model") ||
    lower.includes("schema") ||
    lower.includes("type")
  ) {
    return { category: "Utility", level: 3 };
  }

  return { category: "Utility", level: 4 };
}

function getFileExtensionBadge(filename: string) {
  const ext = String(filename || "").split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "tsx":
      return { label: "TSX", color: "#16C7A3", bg: "rgba(22, 199, 163, 0.15)" };
    case "ts":
      return { label: "TS", color: "#3288F5", bg: "rgba(50, 136, 245, 0.15)" };
    case "jsx":
      return { label: "JSX", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.15)" };
    case "js":
      return { label: "JS", color: "#F5A623", bg: "rgba(245, 166, 35, 0.15)" };
    default:
      return { label: ext.toUpperCase() || "FILE", color: "#8EA9AE", bg: "rgba(142, 169, 174, 0.15)" };
  }
}

interface DependencyGroupNodeData {
  id: string;
  groupName: string;
  fileCount: number;
  files: any[];
  color: string;
  icon: any;
  label: string;
  onExpandGroup?: (groupName: string) => void;
  onSelectGroup?: (groupName: string) => void;
}

function GroupCardNode({ data }: { data: DependencyGroupNodeData }) {
  const IconComponent = data.icon || Folder;
  const previewFiles = data.files.slice(0, 3);
  const remainingCount = Math.max(0, data.files.length - 3);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onSelectGroup?.(data.groupName);
      }}
      className="group relative w-[220px] rounded-xl bg-[#0E1B20] border border-[#16C7A3]/30 hover:border-[#16C7A3]/60 shadow-2xl p-3 select-none cursor-pointer transition-all duration-200"
      style={{
        boxShadow: `0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 0 15px -3px ${data.color}20`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#050B10] !border !border-[#16C7A3] !-top-[3px]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#050B10] !border !border-[#16C7A3] !-bottom-[3px]"
      />

      <div className="flex items-center justify-between pb-2 border-b border-[#16C7A3]/15">
        <div className="flex items-center gap-2 truncate">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: `${data.color}25`, border: `1px solid ${data.color}50` }}
          >
            <IconComponent size={14} style={{ color: data.color }} />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold text-[#F7FAFA] font-mono leading-tight truncate">
              {data.groupName}
            </h3>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#8EA9AE] block mt-0.5">
              {data.label}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-[#8EA9AE] shrink-0 bg-[#050B10] px-1.5 py-0.5 rounded border border-[#16C7A3]/15">
          {data.fileCount} files
        </span>
      </div>

      <div className="mt-2 space-y-1">
        {previewFiles.map((f, i) => {
          const fname = f.name || f.path?.split("/").pop() || f.path;
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 text-[10.5px] font-mono text-[#C3D5D8] truncate py-0.5 px-1 rounded hover:bg-[#14262E]"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
              <span className="truncate flex-1">{fname}</span>
            </div>
          );
        })}
      </div>

      {remainingCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onExpandGroup?.(data.groupName);
          }}
          className="w-full mt-2 pt-1.5 border-t border-[#16C7A3]/10 text-[10px] font-bold text-[#16C7A3] hover:text-white flex items-center justify-between cursor-pointer"
        >
          <span>+ {remainingCount} more files</span>
          <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

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
  onSelectNode?: (id: string) => void;
}

function HierarchicalDependencyNode({ data }: { data: DependencyNodeData }) {
  const meta = CATEGORY_MAP[data.category] || CATEGORY_MAP.Utility;
  const extBadge = getFileExtensionBadge(data.name);

  const opacity = data.isDimmed ? 0.2 : 1;
  const isSelected = data.isSelected;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onSelectNode?.(data.id);
      }}
      className="group relative w-[110px] h-[44px] rounded-lg px-2 py-1 text-left transition-all duration-150 select-none cursor-pointer flex flex-col justify-between"
      style={{
        opacity,
        backgroundColor: "#0E1B20",
        border: isSelected
          ? `2px solid ${meta.color}`
          : `1px solid rgba(22, 199, 163, 0.2)`,
        boxShadow: isSelected
          ? `0 0 16px -2px ${meta.color}60`
          : `0 4px 12px -4px rgba(0, 0, 0, 0.5)`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-[5px] !h-[5px] !rounded-full !bg-[#050B10] !border !top-[-3px]"
        style={{ borderColor: meta.color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-[5px] !h-[5px] !rounded-full !bg-[#050B10] !border !bottom-[-3px]"
        style={{ borderColor: meta.color }}
      />

      <div className="flex items-center justify-between gap-1 w-full min-w-0">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
          <span className="text-[10.5px] font-bold text-[#F7FAFA] truncate font-mono" title={data.name}>
            {data.name}
          </span>
        </div>
        <span
          className="text-[8px] font-mono font-bold px-1 py-0.2 rounded shrink-0 uppercase"
          style={{ color: extBadge.color, backgroundColor: extBadge.bg }}
        >
          {extBadge.label}
        </span>
      </div>

      <div className="flex items-center justify-between text-[9px] text-[#8EA9AE] font-mono leading-none">
        <span>{data.loc} L</span>
        <span className="text-[#3288F5]">{data.imports.length} imp</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  groupCard: GroupCardNode,
  dependencyNode: HierarchicalDependencyNode,
};

function ViewportZoom() {
  const { zoom } = useViewport();
  return <span>Zoom {Math.round(zoom * 100)}%</span>;
}

function FileGraphInternal({
  result,
  externalSearchQuery,
  fitViewTrigger,
  fitRepoTrigger,
}: {
  result: any;
  externalSearchQuery?: string;
  isFullScreen?: boolean;
  fitViewTrigger?: number;
  fitRepoTrigger?: number;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "grid" | "list">("graph");
  const [, setExpandedGroups] = useState<Record<string, boolean>>({});
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    if (fitViewTrigger && fitViewTrigger > 0) {
      fitView({ duration: 300, padding: 0.2 });
    }
  }, [fitViewTrigger, fitView]);

  useEffect(() => {
    if (fitRepoTrigger && fitRepoTrigger > 0) {
      setSelectedGroup(null);
      setSearchQuery("");
      setExpandedGroups({});
      fitView({ duration: 400, padding: 0.15 });
    }
  }, [fitRepoTrigger, fitView]);

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
        const name = f.path.split(/[\\/]/).pop() || f.path;
        const { category, level } = inferCategoryAndLevel(name);

        return {
          id: f.path,
          name,
          path: f.path,
          loc: f.lineCount || 45,
          complexity: Math.max(1, Math.round((f.lineCount || 50) / 35)),
          imports: f.internalImports || f.dependencies || [],
          importedBy: f.referencedBy || [],
          category,
          level,
        };
      });
  }, [result]);

  const groups = useMemo(() => {
    const map: Record<string, typeof fileNodes> = {};
    for (const f of fileNodes) {
      const segs = f.path.split(/[\\/]/).filter(Boolean);
      let gName = "/components";
      if (segs.length > 1) {
        gName = `/${segs[0] === "src" || segs[0] === "app" ? segs[1] || segs[0] : segs[0]}`;
      }
      if (!map[gName]) map[gName] = [];
      map[gName].push(f);
    }
    return map;
  }, [fileNodes]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const groupKeys = Object.keys(groups);
    const cols = 4;
    const spacingX = 260;
    const spacingY = 180;

    groupKeys.forEach((gName, idx) => {
      const gFiles = groups[gName];
      const meta = GROUP_META[gName] || { icon: Folder, color: "#16C7A3", label: gName.replace("/", "").toUpperCase() };
      const row = Math.floor(idx / cols);
      const col = idx % cols;

      nodes.push({
        id: `group-${gName}`,
        type: "groupCard",
        position: { x: col * spacingX + 50, y: row * spacingY + 50 },
        data: {
          id: `group-${gName}`,
          groupName: gName,
          fileCount: gFiles.length,
          files: gFiles,
          color: meta.color,
          icon: meta.icon,
          label: meta.label,
          onSelectGroup: (name: string) => setSelectedGroup(name),
          onExpandGroup: (name: string) => {
            setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
          },
        },
      });
    });

    for (let i = 0; i < groupKeys.length - 1; i++) {
      const g1 = groupKeys[i];
      const g2 = groupKeys[i + 1];
      edges.push({
        id: `edge-${g1}-${g2}`,
        source: `group-${g1}`,
        target: `group-${g2}`,
        type: "smoothstep",
        style: { stroke: "rgba(22, 199, 163, 0.25)", strokeWidth: 1.5 },
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [groups]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    return fileNodes.find((f: any) => f.id === selectedNodeId) || null;
  }, [selectedNodeId, fileNodes]);

  const selectedCategoryMeta = useMemo(() => {
    if (!selectedNodeData) return null;
    const cat = selectedNodeData.category as DependencyCategory;
    return CATEGORY_MAP[cat] || CATEGORY_MAP.Utility;
  }, [selectedNodeData]);

  return (
    <div className="h-full w-full relative bg-[#050B10] overflow-hidden flex flex-col font-sans select-none text-left">
      <div className="absolute top-4 left-6 z-20 flex items-center gap-2 bg-[#0E1B20] p-1 rounded-lg border border-[#16C7A3]/20 shadow-xl">
        <button
          onClick={() => setViewMode("graph")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
            viewMode === "graph" ? "bg-[#16C7A3] text-[#061015]" : "text-[#8EA9AE] hover:text-white"
          }`}
        >
          <GitBranch size={13} />
          <span>Graph</span>
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
            viewMode === "grid" ? "bg-[#16C7A3] text-[#061015]" : "text-[#8EA9AE] hover:text-white"
          }`}
        >
          <LayoutGrid size={13} />
          <span>Grid</span>
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
            viewMode === "list" ? "bg-[#16C7A3] text-[#061015]" : "text-[#8EA9AE] hover:text-white"
          }`}
        >
          <List size={13} />
          <span>List</span>
        </button>
      </div>

      {viewMode === "graph" && (
        <div className="flex-1 w-full h-full relative" onClick={() => setSelectedNodeId(null)}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
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
              className="!bg-[#0E1B20] !border-[#16C7A3]/20 rounded-xl overflow-hidden shadow-2xl !right-6 !bottom-14 !w-[180px] !h-[120px]"
              nodeColor={() => "#16C7A3"}
              maskColor="rgba(5, 11, 16, 0.85)"
            />
            <Background gap={24} size={1} color="rgba(22, 199, 163, 0.06)" />
          </ReactFlow>

          <div
            className="absolute left-6 bottom-14 z-20 flex items-center gap-1.5 bg-[#0E1B20] p-1.5 rounded-xl border border-[#16C7A3]/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => zoomIn()}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              +
            </button>
            <button
              onClick={() => zoomOut()}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              −
            </button>
            <button
              onClick={() => fitView({ padding: 0.2, duration: 400 })}
              className="px-2.5 h-7 rounded-lg bg-[#16C7A3]/15 hover:bg-[#16C7A3]/25 border border-[#16C7A3]/30 text-[#16C7A3] font-bold text-xs cursor-pointer"
            >
              Fit
            </button>
            <button
              onClick={() => fitView({ padding: 0.2, duration: 400 })}
              className="px-2.5 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={11} className="text-[#16C7A3]" />
              <span>Auto Layout</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === "grid" && (
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-[#050B10]">
          {Object.entries(groups).map(([gName, gFiles]) => {
            const meta = GROUP_META[gName] || { icon: Folder, color: "#16C7A3", label: gName.replace("/", "").toUpperCase() };
            const IconComp = meta.icon;
            return (
              <div
                key={gName}
                className="bg-[#0E1B20] border border-[#16C7A3]/20 hover:border-[#16C7A3]/50 rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#16C7A3]/15">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${meta.color}20`, border: `1px solid ${meta.color}50` }}
                    >
                      <IconComp size={18} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#F7FAFA] font-mono">{gName}</h3>
                      <span className="text-[10px] font-semibold text-[#8EA9AE]">{meta.label}</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#8EA9AE] bg-[#050B10] px-2 py-0.5 rounded border border-[#16C7A3]/15">
                    {gFiles.length} files
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 flex-1">
                  {gFiles.slice(0, 5).map((f: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedNodeId(f.id)}
                      className="flex items-center justify-between p-2 rounded bg-[#050B10] hover:bg-[#14262E] text-xs font-mono text-[#F7FAFA] cursor-pointer"
                    >
                      <span className="truncate">{f.name}</span>
                      <span className="text-[10px] text-[#8EA9AE]">{f.loc} L</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex-1 overflow-y-auto p-6 bg-[#050B10]">
          <div className="max-w-4xl mx-auto space-y-2">
            {fileNodes.map((file: any) => (
              <div
                key={file.id}
                onClick={() => setSelectedNodeId(file.id)}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0E1B20] border border-[#16C7A3]/15 hover:border-[#16C7A3]/40 cursor-pointer text-xs font-mono text-[#F7FAFA]"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#16C7A3]" />
                  <span className="font-bold truncate">{file.name}</span>
                  <span className="text-[#8EA9AE] text-[11px] truncate">{file.path}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[#8EA9AE]">
                  <span>{file.loc} lines</span>
                  <span>{file.imports.length} imports</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedNodeData && selectedCategoryMeta && (
          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-16 right-6 bottom-16 w-[360px] bg-[#0E1B20]/95 backdrop-blur-2xl rounded-2xl border border-[#16C7A3]/30 shadow-2xl p-5 z-30 flex flex-col overflow-y-auto text-left select-text"
          >
            <div className="flex items-start justify-between pb-4 border-b border-[#16C7A3]/20">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: selectedCategoryMeta.bg, border: `1px solid ${selectedCategoryMeta.border}` }}
                >
                  {React.createElement(selectedCategoryMeta.icon, {
                    size: 20,
                    style: { color: selectedCategoryMeta.color },
                  })}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#F7FAFA] truncate font-mono">
                    {selectedNodeData.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#16C7A3] uppercase tracking-wider mt-0.5">
                    {selectedCategoryMeta.label} Layer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8EA9AE] hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3.5 px-3 py-1.5 rounded-lg bg-[#050B10] border border-[#16C7A3]/15 font-mono text-[11px] text-[#8EA9AE] truncate">
              {selectedNodeData.path}
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <div className="p-3 rounded-xl bg-[#050B10] border border-[#16C7A3]/15">
                <div className="text-[10px] text-[#8EA9AE]">Lines of Code</div>
                <div className="text-lg font-bold text-[#F7FAFA] mt-0.5 font-mono">
                  {selectedNodeData.loc}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#050B10] border border-[#16C7A3]/15">
                <div className="text-[10px] text-[#8EA9AE]">Complexity Score</div>
                <div className="text-lg font-bold text-[#F7FAFA] mt-0.5 font-mono">
                  {selectedNodeData.complexity}
                </div>
              </div>
            </div>

            <div className="mt-4 flex-1">
              <div className="text-[11px] font-bold text-[#8EA9AE] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Outbound Imports ({selectedNodeData.imports.length})</span>
                <ArrowRight size={13} className="text-[#3288F5]" />
              </div>
              {selectedNodeData.imports.length > 0 ? (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {selectedNodeData.imports.map((imp: string) => (
                    <div
                      key={imp}
                      className="px-2.5 py-1.5 rounded-lg bg-[#050B10] border border-[#16C7A3]/10 text-xs font-mono text-[#F7FAFA] truncate"
                    >
                      {imp.split(/[\\/]/).pop() || imp}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8EA9AE] italic">No internal dependencies</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FileGraph({
  result,
  externalSearchQuery,
  isFullScreen,
  fitViewTrigger,
  fitRepoTrigger,
}: {
  result: any;
  externalSearchQuery?: string;
  isFullScreen?: boolean;
  fitViewTrigger?: number;
  fitRepoTrigger?: number;
}) {
  return (
    <ReactFlowProvider>
      <FileGraphInternal
        result={result}
        externalSearchQuery={externalSearchQuery}
        isFullScreen={isFullScreen}
        fitViewTrigger={fitViewTrigger}
        fitRepoTrigger={fitRepoTrigger}
      />
    </ReactFlowProvider>
  );
}

