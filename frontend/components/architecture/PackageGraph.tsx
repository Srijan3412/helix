"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Package, FileCode, CheckSquare, Square } from "lucide-react";

// --- Compact File Node Component (120px × 54px) ---
interface CompactFileNodeData {
  id: string;
  name: string;
  importCount: number;
  isSelected?: boolean;
  isDimmed?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

function CompactFileNode({ data }: { data: CompactFileNodeData }) {
  const isSelected = data.isSelected;
  const isDimmed = data.isDimmed;

  return (
    <div
      onClick={() => data.onSelect?.(data.id)}
      onMouseEnter={() => data.onHover?.(data.id)}
      onMouseLeave={() => data.onHover?.(null)}
      className="group relative w-[120px] min-h-[52px] rounded-[10px] px-2.5 py-2 text-left transition-all duration-150 select-none cursor-pointer"
      style={{
        opacity: isDimmed ? 0.25 : 1,
        backgroundColor: "#101827",
        border: isSelected ? "1.5px solid #3288F5" : "1px solid #25344A",
        boxShadow: isSelected ? "0 0 14px rgba(50, 136, 245, 0.4)" : "0 2px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#07090C] !border !border-[#3288F5] !-top-[3px] opacity-40 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#07090C] !border !border-[#3288F5] !-bottom-[3px] opacity-40 group-hover:opacity-100"
      />

      <div className="flex items-center gap-1.5">
        <FileCode size={13} className="text-[#91A0AA] shrink-0" />
        <span
          className="text-[11.5px] font-bold font-mono text-[#F4F7F7] truncate max-w-[85px] leading-tight"
          title={data.name}
        >
          {data.name}
        </span>
      </div>

      <div className="text-[9.5px] text-[#91A0AA] mt-1 pl-[19px] font-medium leading-none">
        {data.importCount} imports
      </div>
    </div>
  );
}

// --- Compact Package Node Component (120px × 56px) ---
interface CompactPackageNodeData {
  id: string;
  name: string;
  version?: string;
  packageType: "dependency" | "devDependency";
  usedByFiles: number;
  isSelected?: boolean;
  isDimmed?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

function CompactPackageNode({ data }: { data: CompactPackageNodeData }) {
  const isDev = data.packageType === "devDependency";
  const isSelected = data.isSelected;
  const isDimmed = data.isDimmed;

  return (
    <div
      onClick={() => data.onSelect?.(data.id)}
      onMouseEnter={() => data.onHover?.(data.id)}
      onMouseLeave={() => data.onHover?.(null)}
      className="group relative w-[122px] min-h-[56px] rounded-[10px] px-2.5 py-2 text-left transition-all duration-150 select-none cursor-pointer"
      style={{
        opacity: isDimmed ? 0.25 : 1,
        backgroundColor: "#101827",
        border: isSelected
          ? "1.5px solid #3288F5"
          : isDev
          ? "1px dashed #3A4D6B"
          : "1px solid rgba(22, 199, 163, 0.45)",
        boxShadow: isSelected ? "0 0 14px rgba(50, 136, 245, 0.4)" : "0 2px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#07090C] !border !border-[#16C7A3] !-top-[3px] opacity-40 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#07090C] !border !border-[#16C7A3] !-bottom-[3px] opacity-40 group-hover:opacity-100"
      />

      <div className="flex items-center gap-1.5">
        <Package
          size={13}
          className={`shrink-0 ${isDev ? "text-[#64748B]" : "text-[#16C7A3]"}`}
        />
        <span
          className="text-[11.5px] font-bold font-mono text-[#F4F7F7] truncate max-w-[85px] leading-tight"
          title={data.name}
        >
          {data.name}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1 pl-[19px] text-[9px] text-[#91A0AA] font-mono leading-none">
        <span>{data.usedByFiles} files</span>
        <span className={`uppercase font-semibold ${isDev ? "text-[#64748B]" : "text-[#16C7A3]"}`}>
          {isDev ? "dev" : "prod"}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = {
  fileNode: CompactFileNode,
  packageNode: CompactPackageNode,
};

interface RawPackageItem {
  id: string;
  name: string;
  version: string;
  type: "dependency" | "devDependency";
  usedBy: string[];
}

interface RawFileItem {
  id: string;
  name: string;
  imports: string[];
}

function PackageGraphInternal({
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
  const [showDevDeps, setShowDevDeps] = useState(true);
  const [showProdDeps, setShowProdDeps] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const reactFlow = useReactFlow();

  // Handle Fit View trigger
  useEffect(() => {
    if (fitViewTrigger && fitViewTrigger > 0) {
      reactFlow.fitView({ duration: 300, padding: 0.2 });
    }
  }, [fitViewTrigger, reactFlow]);

  // Handle Fit Repository trigger
  useEffect(() => {
    if (fitRepoTrigger && fitRepoTrigger > 0) {
      setShowDevDeps(true);
      setShowProdDeps(true);
      setSelectedNodeId(null);
      reactFlow.fitView({ duration: 400, padding: 0.15 });
    }
  }, [fitRepoTrigger, reactFlow]);

  // Map package metadata from scan results dynamically
  const packageNodes: RawPackageItem[] = useMemo(() => {
    const deps = result?.metadata?.frameworkMetadata?.dependencies || {};
    const devDeps = result?.metadata?.frameworkMetadata?.devDependencies || {};

    const prodList: RawPackageItem[] = Object.entries(deps).map(([name, ver]) => ({
      id: name,
      name,
      version: String(ver),
      type: "dependency" as const,
      usedBy: [] as string[],
    }));

    const devList: RawPackageItem[] = Object.entries(devDeps).map(([name, ver]) => ({
      id: name,
      name,
      version: String(ver),
      type: "devDependency" as const,
      usedBy: [] as string[],
    }));

    return [...prodList, ...devList];
  }, [result]);

  // Map file structures and their parsed imports dynamically
  const fileNodes: RawFileItem[] = useMemo(() => {
    const files = result?.files || [];
    return files
      .filter(
        (f: any) =>
          !f.path.startsWith("ROUTE:") &&
          !f.path.startsWith("ENV:") &&
          !f.path.startsWith("DB:") &&
          !f.path.startsWith("ENTITY:")
      )
      .map((f: any) => {
        const imports: string[] = f.externalImports || [];
        return {
          id: f.path,
          name: f.path.split(/[\\/]/).pop() || f.path,
          imports,
        };
      });
  }, [result]);

  // Filter packages based on checkboxes
  const filteredPackages: RawPackageItem[] = useMemo(() => {
    return packageNodes.filter((p: RawPackageItem) => {
      if (p.type === "dependency" && !showProdDeps) return false;
      if (p.type === "devDependency" && !showDevDeps) return false;
      return true;
    });
  }, [packageNodes, showProdDeps, showDevDeps]);

  // Generate sparse deterministic horizontal layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const seenNodeIds = new Set<string>();

    // Top Row: Files (placed horizontally at y = 200)
    const topImporters = fileNodes
      .filter((f: RawFileItem) => f.imports.length > 0)
      .sort((a: RawFileItem, b: RawFileItem) => b.imports.length - a.imports.length)
      .slice(0, 10);

    const colSpacing = 165; // 120px node + 45px gap
    const fileRowY = 200;

    topImporters.forEach((file: RawFileItem, i: number) => {
      const x = 60 + i * colSpacing;
      nodes.push({
        id: `file-${file.id}`,
        type: "fileNode",
        position: { x, y: fileRowY },
        data: {
          id: `file-${file.id}`,
          name: file.name,
          importCount: file.imports.length,
          onSelect: (id: string) => setSelectedNodeId((prev) => (prev === id ? null : id)),
          onHover: (id: string | null) => setHoveredNodeId(id),
        },
      });

      // Connections to packages
      file.imports.forEach((importId: string) => {
        if (filteredPackages.some((p: RawPackageItem) => p.id === importId)) {
          edges.push({
            id: `edge-${file.id}-${importId}`,
            source: `file-${file.id}`,
            target: importId,
            type: "smoothstep",
            style: { stroke: "#3288F5", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 7, height: 7, color: "#3288F5" },
          });
        }
      });
    });

    // Lower Row: Packages (placed horizontally at y = 440)
    const packageRowY = 440;
    filteredPackages.forEach((pkg: RawPackageItem, i: number) => {
      const packageId = pkg.id;

      if (!seenNodeIds.has(packageId)) {
        seenNodeIds.add(packageId);

        const x = 60 + i * colSpacing;
        const usedByFiles = fileNodes.filter((f: RawFileItem) => f.imports.includes(pkg.id)).length;

        nodes.push({
          id: packageId,
          type: "packageNode",
          position: { x, y: packageRowY },
          data: {
            id: packageId,
            name: pkg.name,
            version: pkg.version,
            packageType: pkg.type,
            usedByFiles,
            onSelect: (id: string) => setSelectedNodeId((prev) => (prev === id ? null : id)),
            onHover: (id: string | null) => setHoveredNodeId(id),
          },
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [filteredPackages, fileNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronization guards
  const lastSyncedNodeIds = useRef<string>("");
  const lastSyncedEdgeIds = useRef<string>("");

  React.useEffect(() => {
    const newIds = initialNodes.map((n) => n.id).join(",");
    if (newIds !== lastSyncedNodeIds.current) {
      lastSyncedNodeIds.current = newIds;
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    const newIds = initialEdges.map((e) => e.id).join(",");
    if (newIds !== lastSyncedEdgeIds.current) {
      lastSyncedEdgeIds.current = newIds;
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  // Interactive edge & node visibility based on hover / selection
  const activeFocusId = selectedNodeId || hoveredNodeId;

  const displayEdges = useMemo(() => {
    return edges.map((edge) => {
      const isConnected =
        activeFocusId && (edge.source === activeFocusId || edge.target === activeFocusId);

      if (isConnected) {
        return {
          ...edge,
          style: {
            stroke: "#3288F5",
            strokeWidth: 2,
            opacity: 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 7,
            height: 7,
            color: "#3288F5",
          },
        };
      }

      return {
        ...edge,
        style: {
          stroke: "rgba(255, 255, 255, 0.08)",
          strokeWidth: 1,
          opacity: 0, // Hidden/quiet by default matching Screenshot 3
        },
        markerEnd: undefined,
      };
    });
  }, [edges, activeFocusId]);

  const displayNodes = useMemo(() => {
    if (!activeFocusId) {
      return nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: false,
          isDimmed: false,
        },
      }));
    }

    const connectedNodeIds = new Set<string>([activeFocusId]);
    edges.forEach((edge) => {
      if (edge.source === activeFocusId) connectedNodeIds.add(edge.target);
      if (edge.target === activeFocusId) connectedNodeIds.add(edge.source);
    });

    return nodes.map((node) => {
      const isSelected = node.id === activeFocusId;
      const isConnected = connectedNodeIds.has(node.id);

      return {
        ...node,
        data: {
          ...node.data,
          isSelected,
          isDimmed: !isConnected,
        },
      };
    });
  }, [nodes, activeFocusId, edges]);

  const prodCount = packageNodes.filter((p) => p.type === "dependency").length;
  const devCount = packageNodes.filter((p) => p.type === "devDependency").length;

  return (
    <div
      className="h-full w-full relative bg-[#07090C] overflow-hidden select-none font-sans"
      onClick={() => setSelectedNodeId(null)}
    >
      {/* ── Top-Left: Compact Header Card (340px) ────────────────────────── */}
      <div className="absolute top-4 left-4 z-20 bg-[#0D1728]/95 backdrop-blur-md rounded-2xl p-4 border border-white/[0.08] shadow-xl w-[340px] text-left pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3288F5]/15 border border-[#3288F5]/35 flex items-center justify-center shrink-0">
            <Package size={20} className="text-[#3288F5]" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-[#F4F7F7] leading-tight">
              Package Dependencies
            </h2>
            <p className="text-[14px] text-[#91A0AA] mt-0.5 font-normal">
              {prodCount} production + {devCount} dev dependencies
            </p>
          </div>
        </div>
      </div>

      {/* ── Top-Right: Compact Show devDependencies Control ─────────────── */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <label className="h-[42px] px-4 rounded-xl bg-[#0D1728]/95 backdrop-blur-md border border-white/[0.08] shadow-xl flex items-center gap-2.5 cursor-pointer hover:bg-[#121f36] transition-colors">
          <input
            type="checkbox"
            checked={showDevDeps}
            onChange={(e) => setShowDevDeps(e.target.checked)}
            className="w-4 h-4 rounded bg-[#101827] border-white/20 text-[#3288F5] focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-[14px] font-medium text-[#F4F7F7]">Show devDependencies</span>
        </label>
      </div>

      {/* ── Bottom-Left: Package Types Panel ─────────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-20 bg-[#0D1728]/95 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.08] shadow-xl w-[180px] text-left pointer-events-auto">
        <div className="text-[12px] font-bold tracking-[0.08em] text-[#91A0AA] uppercase mb-2.5">
          PACKAGE TYPES
        </div>
        <div className="space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProdDeps((v) => !v);
            }}
            className="w-full flex items-center gap-2.5 text-[13px] font-medium transition-colors cursor-pointer text-left"
          >
            {showProdDeps ? (
              <CheckSquare size={16} className="text-[#16C7A3]" />
            ) : (
              <Square size={16} className="text-[#64748B]" />
            )}
            <span className={showProdDeps ? "text-[#F4F7F7]" : "text-[#91A0AA]"}>Production</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDevDeps((v) => !v);
            }}
            className="w-full flex items-center gap-2.5 text-[13px] font-medium transition-colors cursor-pointer text-left"
          >
            {showDevDeps ? (
              <CheckSquare size={16} className="text-[#3288F5]" />
            ) : (
              <Square size={16} className="text-[#64748B]" />
            )}
            <span className={showDevDeps ? "text-[#F4F7F7]" : "text-[#91A0AA]"}>Development</span>
          </button>
        </div>
      </div>

      {/* ── Main Canvas ─────────────────────────────────────────────────── */}
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="!bg-[#0D1728] !border-white/[0.08] !fill-[#F4F7F7] !text-[#F4F7F7] rounded-xl shadow-xl !left-4 !bottom-36" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-[#0D1728] !border-white/[0.08] rounded-xl overflow-hidden shadow-2xl !right-4 !bottom-4"
          nodeColor={(n) => {
            return n.type === "packageNode" ? "#16C7A3" : "#3288F5";
          }}
          maskColor="rgba(7, 9, 12, 0.85)"
        />
        <Background gap={22} size={1} color="rgba(255, 255, 255, 0.035)" />
      </ReactFlow>
    </div>
  );
}

export default function PackageGraph({
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
      <PackageGraphInternal
        result={result}
        externalSearchQuery={externalSearchQuery}
        isFullScreen={isFullScreen}
        fitViewTrigger={fitViewTrigger}
        fitRepoTrigger={fitRepoTrigger}
      />
    </ReactFlowProvider>
  );
}


