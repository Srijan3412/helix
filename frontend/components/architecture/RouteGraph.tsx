"use client";

import React, { useState, useMemo } from "react";
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
  ReactFlowProvider
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { Route as RouteIcon, Shield, Database, Server, AlertTriangle, FileCode, Search, X } from "lucide-react";
import { RouteNode } from "@shared/types";

// Method style mapping
const methodStyles: Record<string, { bg: string; border: string; text: string }> = {
  GET: { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", border: "border-emerald-500/40", text: "text-emerald-400" },
  POST: { bg: "bg-blue-500/20 text-blue-400 border-blue-500/40", border: "border-blue-500/40", text: "text-blue-400" },
  PUT: { bg: "bg-amber-500/20 text-amber-400 border-amber-500/40", border: "border-amber-400/40", text: "text-amber-400" },
  DELETE: { bg: "bg-red-500/20 text-red-400 border-red-500/40", border: "border-red-500/40", text: "text-red-400" },
  PATCH: { bg: "bg-purple-500/20 text-purple-400 border-purple-500/40", border: "border-purple-500/40", text: "text-purple-400" }
};

const getBasename = (path: string) => {
  if (!path) return "UnknownController";
  return path.split(/[\\/]/).pop() || path;
};

// Custom Route Node
function RouteGraphNode({ data }: { data: any }) {
  const style = methodStyles[data.method.toUpperCase()] || methodStyles.GET;

  return (
    <div className="relative bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-lg p-3 min-w-[200px] text-left">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-600" />

      <div className="flex items-center gap-1.5 mb-2">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${style.bg}`}>
          {data.method}
        </span>
        <span className="font-mono text-[10px] text-zinc-100 truncate flex-1" title={data.path}>
          {data.path}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
        <Server size={11} className="text-zinc-550 shrink-0" />
        <span className="truncate font-mono">{getBasename(data.file)}</span>
      </div>

      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/80">
        {data.hasAuth ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <Shield size={11} className="shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Protected</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-500">
            <AlertTriangle size={11} className="shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wider">No Auth</span>
          </span>
        )}

        {data.accessesDB && (
          <span className="flex items-center gap-1 text-blue-400">
            <Database size={11} className="shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wider">DB</span>
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-600" />
    </div>
  );
}

// Custom Controller Node
function ControllerNode({ data }: { data: any }) {
  return (
    <div className="relative bg-zinc-950 border border-purple-500/40 rounded-xl shadow-lg p-3 min-w-[170px] text-left">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-600" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-600" />

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
          <FileCode size={15} className="text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10.5px] text-zinc-100 truncate font-bold" title={data.name}>
            {data.name}
          </div>
          <div className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider mt-0.5">
            {data.routeCount} {data.routeCount === 1 ? "endpoint" : "endpoints"}
          </div>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  routeNode: RouteGraphNode,
  controllerNode: ControllerNode
};

// Dagre Layout function
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 80 });

  nodes.forEach((node) => {
    // Standard node dimensions
    const width = node.type === "routeNode" ? 200 : 170;
    const height = node.type === "routeNode" ? 95 : 60;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.type === "routeNode" ? 200 : 170;
    const height = node.type === "routeNode" ? 95 : 60;
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

function RouteGraphInternal({ result }: { result: any }) {
  const [filter, setFilter] = useState<"all" | "protected" | "unprotected">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const routes = useMemo(() => {
    return result?.routes || [];
  }, [result]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    // Group routes by controller
    const controllerMap = new Map<string, RouteNode[]>();
    routes.forEach((r: RouteNode) => {
      const controllerPath = r.file || "UnknownController.ts";
      if (!controllerMap.has(controllerPath)) {
        controllerMap.set(controllerPath, []);
      }
      controllerMap.get(controllerPath)!.push(r);
    });

    // Create Controller Nodes
    controllerMap.forEach((controllerRoutes, controllerPath) => {
      const controllerName = getBasename(controllerPath);
      nodesList.push({
        id: `controller:${controllerPath}`,
        type: "controllerNode",
        position: { x: 0, y: 0 },
        data: {
          name: controllerName,
          routeCount: controllerRoutes.length
        }
      });
    });

    // Create Route Nodes and Connect to Controllers
    routes.forEach((r: RouteNode, index: number) => {
      const routeId = `route:${r.method}:${r.path}`;
      const controllerPath = r.file || "UnknownController.ts";

      // Detect hasAuth
      const hasAuth = r.middleware?.some(m =>
        /auth|protect|jwt|passport|login|session|require/i.test(m)
      ) || r.chain?.some(c =>
        /auth|protect|jwt|passport/i.test(c)
      ) || false;

      // Detect accessesDB
      const accessesDB = (result.metadata?.databaseInfo?.flows ?? []).some(
        (f: any) => f.route === r.path && f.method.toUpperCase() === r.method.toUpperCase()
      );

      nodesList.push({
        id: routeId,
        type: "routeNode",
        position: { x: 0, y: 0 },
        data: {
          method: r.method,
          path: r.path,
          file: controllerPath,
          hasAuth,
          accessesDB
        }
      });

      // Connect route to controller
      edgesList.push({
        id: `edge:${routeId}-to-controller:${controllerPath}`,
        source: routeId,
        target: `controller:${controllerPath}`,
        type: "smoothstep",
        style: { stroke: "#a855f7", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" }
      });
    });

    // Filter nodes and edges based on user filters
    const filteredRoutes = routes.filter((r: RouteNode) => {
      // Auth filter
      const hasAuth = r.middleware?.some(m =>
        /auth|protect|jwt|passport|login|session|require/i.test(m)
      ) || r.chain?.some(c =>
        /auth|protect|jwt|passport/i.test(c)
      ) || false;

      if (filter === "protected" && !hasAuth) return false;
      if (filter === "unprotected" && hasAuth) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchPath = r.path.toLowerCase().includes(query);
        const matchController = getBasename(r.file || "").toLowerCase().includes(query);
        const matchMethod = r.method.toLowerCase().includes(query);
        if (!matchPath && !matchController && !matchMethod) return false;
      }

      return true;
    });

    const activeRouteIds = new Set(filteredRoutes.map((r: RouteNode) => `route:${r.method}:${r.path}`));
    const activeControllerPaths = new Set(filteredRoutes.map((r: RouteNode) => r.file || "UnknownController.ts"));

    const displayNodes = nodesList.filter((node) => {
      if (node.type === "routeNode") {
        return activeRouteIds.has(node.id);
      }
      if (node.type === "controllerNode") {
        const cPath = node.id.replace("controller:", "");
        return activeControllerPaths.has(cPath);
      }
      return true;
    });

    // Recalculate route count for active controller nodes
    displayNodes.forEach(node => {
      if (node.type === "controllerNode") {
        const cPath = node.id.replace("controller:", "");
        const activeCount = filteredRoutes.filter((r: RouteNode) => (r.file || "UnknownController.ts") === cPath).length;
        node.data.routeCount = activeCount;
      }
    });

    const displayEdges = edgesList.filter((edge) => {
      return activeRouteIds.has(edge.source) && activeControllerPaths.has(edge.target.replace("controller:", ""));
    });

    // Layout layout elements with dagre
    if (displayNodes.length > 0) {
      return getLayoutedElements(displayNodes, displayEdges);
    }

    return { nodes: [], edges: [] };
  }, [routes, filter, searchQuery, result]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state if initial elements change (safely guarded)
  React.useEffect(() => {
    const currentIds = nodes.map(n => n.id).join(',');
    const initialIds = initialNodes.map(n => n.id).join(',');
    if (nodes.length !== initialNodes.length || currentIds !== initialIds) {
      setNodes(initialNodes);
    }
  }, [initialNodes, nodes, setNodes]);

  React.useEffect(() => {
    const currentEdgeIds = edges.map(e => e.id).join(',');
    const initialEdgeIds = initialEdges.map(e => e.id).join(',');
    if (edges.length !== initialEdges.length || currentEdgeIds !== initialEdgeIds) {
      setEdges(initialEdges);
    }
  }, [initialEdges, edges, setEdges]);

  return (
    <div className="h-full w-full relative bg-zinc-950">
      {/* Search and Filters Header */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-zinc-900/90 border border-border/60 rounded-xl p-3 shadow-lg backdrop-blur-md">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
          <RouteIcon className="text-emerald-400 w-4 h-4" />
          Route Endpoint Graph
        </h2>
        <p className="text-[10px] text-zinc-450 font-semibold uppercase tracking-wider">
          {routes.length} API endpoints mapped
        </p>
      </div>

      {/* Center Top Controls: Route Search & Filter */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-border/60 rounded-xl px-2.5 py-1.5 shadow-lg backdrop-blur-md">
          <Search className="w-3.5 h-3.5 text-zinc-500 mr-1 shrink-0" />
          <input
            type="text"
            placeholder="Search path, method, controller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[10px] text-zinc-200 placeholder-zinc-550 focus:outline-none w-48 sm:w-56 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-zinc-500 hover:text-white ml-1 shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Selection */}
        <div className="bg-zinc-900/90 border border-border/60 rounded-xl p-1.5 shadow-lg backdrop-blur-md flex gap-1">
          {(["all", "protected", "unprotected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-[9.5px] font-extrabold uppercase tracking-wider transition-all ${
                filter === f
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-zinc-450 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Legend Left-Bottom */}
      <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/90 border border-border/60 rounded-xl shadow-lg p-3.5 backdrop-blur-md">
        <div className="text-[8.5px] font-bold text-zinc-450 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">Methods</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {Object.entries(methodStyles).map(([method, style]) => (
            <div key={method} className="flex items-center gap-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${style.bg}`}>
                {method}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      {nodes.length > 0 ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <MiniMap
            style={{
              backgroundColor: "rgba(9, 9, 11, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "0.75rem",
            }}
            nodeColor={(node) => {
              if (node.type === "controllerNode") return "#a855f7";
              const method = ((node.data as any).method || "").toUpperCase();
              if (method === "GET") return "#10b981";
              if (method === "POST") return "#3b82f6";
              if (method === "DELETE") return "#ef4444";
              return "#71717a";
            }}
            maskColor="rgba(0, 0, 0, 0.6)"
          />
          <Background color="#222" gap={20} />
        </ReactFlow>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-550">
          <RouteIcon className="w-12 h-12 text-zinc-700 mb-2 animate-pulse" />
          <h4 className="text-xs font-bold text-zinc-300">No matching endpoints found</h4>
          <p className="text-[10px] text-zinc-550 max-w-xs mt-1">Adjust your filter options or search queries.</p>
        </div>
      )}
    </div>
  );
}

export default function RouteGraph({ result }: { result: any }) {
  return (
    <ReactFlowProvider>
      <RouteGraphInternal result={result} />
    </ReactFlowProvider>
  );
}
