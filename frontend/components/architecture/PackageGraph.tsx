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
import { Package, FileCode, Search, X } from "lucide-react";

// Package type style configurations
const packageStyles = {
  dependency: { bg: "bg-blue-500/10 text-blue-400 border-blue-500/40", text: "text-blue-400" },
  devDependency: { bg: "bg-zinc-800/40 text-zinc-400 border-zinc-700/60", text: "text-zinc-400" }
};

// Custom Package Node Component
function PackageGraphNode({ data }: { data: any }) {
  const isDev = data.type === "devDependency";
  const style = isDev ? packageStyles.devDependency : packageStyles.dependency;

  return (
    <div className={`relative bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-lg p-3.5 min-w-[170px] text-left`}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-650" />

      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-950 border border-zinc-800/80 shrink-0`}>
          <Package size={15} className={style.text || (isDev ? "text-zinc-450" : "text-blue-400")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10.5px] text-zinc-100 truncate font-bold" title={data.name}>
            {data.name}
          </div>
          <div className="text-[9px] text-zinc-450 mt-0.5 font-bold">
            v{data.version || "latest"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/80">
        <span className="text-[9px] text-zinc-450 font-semibold uppercase tracking-wider">
          <span className={isDev ? "text-zinc-400" : "text-blue-400 font-bold"}>{data.usedByFiles}</span> {data.usedByFiles === 1 ? "file" : "files"}
        </span>
        <span className={`text-[8.5px] font-extrabold uppercase tracking-widest px-1 py-0.5 rounded ${
          isDev ? "bg-zinc-850/60 text-zinc-450 border border-zinc-800" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
        }`}>
          {isDev ? "dev" : "prod"}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-650" />
    </div>
  );
}

// Custom Importing File Node Component
function ImportingFileNode({ data }: { data: any }) {
  return (
    <div className="relative bg-zinc-950 border border-zinc-700/80 rounded-xl shadow-lg p-3 min-w-[150px] text-left">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-650" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-650" />

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700/40 shrink-0">
          <FileCode size={13} className="text-zinc-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] text-zinc-200 truncate font-bold" title={data.name}>
            {data.name}
          </div>
          <div className="text-[8.5px] text-zinc-450 font-bold uppercase tracking-wider mt-0.5">
            {data.importCount} {data.importCount === 1 ? "import" : "imports"}
          </div>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  packageNode: PackageGraphNode,
  fileNode: ImportingFileNode
};

// Dagre Layout function for PackageGraph
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 90 });

  nodes.forEach((node) => {
    const width = node.type === "packageNode" ? 170 : 150;
    const height = node.type === "packageNode" ? 85 : 55;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.type === "packageNode" ? 170 : 150;
    const height = node.type === "packageNode" ? 85 : 55;
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

function PackageGraphInternal({ result }: { result: any }) {
  const [showDevDeps, setShowDevDeps] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Extracted packages metadata
  const { dependencies, devDependencies } = useMemo(() => {
    const deps = result?.metadata?.frameworkMetadata?.dependencies || {};
    const devDeps = result?.metadata?.frameworkMetadata?.devDependencies || {};
    return { dependencies: deps, devDependencies: devDeps };
  }, [result]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    // 1. Gather all external imports used by files
    const allExternalImports = new Set<string>();
    const fileNodesData = result?.files || [];
    
    fileNodesData.forEach((f: any) => {
      f.externalImports?.forEach((imp: string) => {
        allExternalImports.add(imp);
      });
    });

    // 2. Identify and construct package list
    const packages: { name: string; version: string; type: "dependency" | "devDependency" }[] = [];
    allExternalImports.forEach((pkgName) => {
      // Find package type and version
      let type: "dependency" | "devDependency" = "dependency";
      let version = "latest";

      if (dependencies[pkgName]) {
        version = dependencies[pkgName];
        type = "dependency";
      } else if (devDependencies[pkgName]) {
        version = devDependencies[pkgName];
        type = "devDependency";
      } else {
        // Look up package names in package.json metadata case-insensitively or just fallback to dependency
        const foundDep = Object.keys(dependencies).find(k => k.toLowerCase() === pkgName.toLowerCase());
        const foundDevDep = Object.keys(devDependencies).find(k => k.toLowerCase() === pkgName.toLowerCase());
        
        if (foundDep) {
          version = dependencies[foundDep];
          type = "dependency";
        } else if (foundDevDep) {
          version = devDependencies[foundDevDep];
          type = "devDependency";
        }
      }

      // Filter devDependencies if toggle is off
      if (type === "devDependency" && !showDevDeps) {
        return;
      }

      packages.push({ name: pkgName, version, type });
    });

    // Filter packages by search query if applicable
    const filteredPackages = packages.filter(pkg => {
      if (!searchQuery.trim()) return true;
      return pkg.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const activePkgNames = new Set(filteredPackages.map(p => p.name));

    // 3. Create Package Nodes
    filteredPackages.forEach((pkg) => {
      // Count files using this package
      const usedByFiles = fileNodesData.filter((f: any) => 
        (f.externalImports || []).some((imp: string) => imp.toLowerCase() === pkg.name.toLowerCase())
      ).length;

      nodesList.push({
        id: `pkg:${pkg.name}`,
        type: "packageNode",
        position: { x: 0, y: 0 },
        data: {
          name: pkg.name,
          version: pkg.version,
          type: pkg.type,
          usedByFiles
        }
      });
    });

    // 4. Create File Nodes (Only top 10 files using filtered packages to prevent clutter)
    const filesWithImports = fileNodesData
      .map((f: any) => {
        const activeImports = (f.externalImports || []).filter((imp: string) => 
          activePkgNames.has(imp) || Object.keys(dependencies).some(k => k.toLowerCase() === imp.toLowerCase() && activePkgNames.has(k))
        );
        return {
          ...f,
          activeImports
        };
      })
      .filter((f: any) => f.activeImports.length > 0)
      .sort((a: any, b: any) => b.activeImports.length - a.activeImports.length);

    // Limit to top 10 files to keep graph readable
    const displayFiles = filesWithImports.slice(0, 10);

    displayFiles.forEach((file: any) => {
      const filename = file.path.split(/[\\/]/).pop() || file.path;
      nodesList.push({
        id: `file:${file.path}`,
        type: "fileNode",
        position: { x: 0, y: 0 },
        data: {
          name: filename,
          importCount: file.activeImports.length
        }
      });

      // 5. Connect files to packages
      file.activeImports.forEach((importName: string) => {
        // Resolve exact casing of package id
        let exactPkgName = importName;
        const matched = filteredPackages.find(p => p.name.toLowerCase() === importName.toLowerCase());
        if (matched) exactPkgName = matched.name;

        edgesList.push({
          id: `edge:${file.path}-to-pkg:${exactPkgName}`,
          source: `file:${file.path}`,
          target: `pkg:${exactPkgName}`,
          type: "smoothstep",
          style: { stroke: "#4b5563", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#4b5563" }
        });
      });
    });

    // Layout layout elements with dagre
    if (nodesList.length > 0) {
      return getLayoutedElements(nodesList, edgesList);
    }

    return { nodes: [], edges: [] };
  }, [dependencies, devDependencies, showDevDeps, searchQuery, result]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state if initial elements change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Compute counts
  const prodDepCount = Object.keys(dependencies).length;
  const devDepCount = Object.keys(devDependencies).length;

  return (
    <div className="h-full w-full relative bg-zinc-950">
      {/* Header Info */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-zinc-900/90 border border-border/60 rounded-xl p-3 shadow-lg backdrop-blur-md">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
          <Package className="text-blue-400 w-4 h-4" />
          Package Dependencies
        </h2>
        <p className="text-[10px] text-zinc-450 font-semibold uppercase tracking-wider">
          {prodDepCount} production + {devDepCount} dev dependencies
        </p>
      </div>

      {/* Controls: Search and Toggle */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-border/60 rounded-xl px-2.5 py-1.5 shadow-lg backdrop-blur-md">
          <Search className="w-3.5 h-3.5 text-zinc-500 mr-1 shrink-0" />
          <input
            type="text"
            placeholder="Search package name..."
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

        {/* Toggle devDependencies */}
        <div className="bg-zinc-900/90 border border-border/60 rounded-xl px-3 py-2 shadow-lg backdrop-blur-md flex items-center gap-2">
          <input
            type="checkbox"
            id="showDevDeps"
            checked={showDevDeps}
            onChange={(e) => setShowDevDeps(e.target.checked)}
            className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-700/80 text-blue-500 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="showDevDeps" className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider cursor-pointer">
            Show devDependencies
          </label>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/90 border border-border/60 rounded-xl shadow-lg p-3.5 backdrop-blur-md">
        <div className="text-[8.5px] font-bold text-zinc-450 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">Package Types</div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/30" />
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Production</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700" />
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Development</span>
          </div>
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
              if (node.type === "fileNode") return "#71717a";
              return (node.data as any).type === "devDependency" ? "#3f3f46" : "#3b82f6";
            }}
            maskColor="rgba(0, 0, 0, 0.6)"
          />
          <Background color="#222" gap={20} />
        </ReactFlow>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-550">
          <Package className="w-12 h-12 text-zinc-700 mb-2 animate-pulse" />
          <h4 className="text-xs font-bold text-zinc-300">No packages mapped</h4>
          <p className="text-[10px] text-zinc-550 max-w-xs mt-1">Make sure you have analyzed a Node.js project with external imports.</p>
        </div>
      )}
    </div>
  );
}

export default function PackageGraph({ result }: { result: any }) {
  return (
    <ReactFlowProvider>
      <PackageGraphInternal result={result} />
    </ReactFlowProvider>
  );
}
