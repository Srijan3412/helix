"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Package, FileCode } from 'lucide-react';

interface PackageNodeProps {
  data: {
    name: string;
    version: string;
    type: 'dependency' | 'devDependency';
    usedByFiles: number;
  };
}

const packageTypeStyles = {
  dependency: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', icon: Package },
  devDependency: { bg: 'bg-slate-500/10', border: 'border-slate-500/50', text: 'text-slate-400', icon: Package }
};

function PackageGraphNode({ data }: PackageNodeProps) {
  const style = packageTypeStyles[data.type] || packageTypeStyles.dependency;
  const Icon = style.icon;

  return (
    <div className={`relative ${style.bg} border-2 ${style.border} rounded-xl shadow-lg p-3 min-w-[140px] text-left`}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-500" />

      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center`}>
          <Icon size={16} className={style.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-white truncate">{data.name}</div>
          <div className="text-[10px] text-slate-500">v{data.version}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
        <span className="text-[10px] text-slate-400">
          <span className={style.text}>{data.usedByFiles}</span> files
        </span>
        <span className={`ml-auto text-[10px] ${style.text}`}>
          {data.type === 'dependency' ? 'prod' : 'dev'}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-500" />
    </div>
  );
}

interface FileNodeProps {
  data: {
    name: string;
    importCount: number;
  };
}

function ImportingFileNode({ data }: FileNodeProps) {
  return (
    <div className="relative bg-slate-800 border border-slate-600 rounded-lg p-2 min-w-[120px] text-left">
      <Handle type="source" position={Position.Top} className="!w-2 !h-2 !bg-slate-500" />

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center">
          <FileCode size={12} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] text-slate-300 truncate">{data.name}</div>
          <div className="text-[10px] text-slate-500">{data.importCount} imports</div>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  packageNode: PackageGraphNode,
  fileNode: ImportingFileNode
};

function PackageGraphInternal({ result }: { result: any }) {
  const [showDevDeps, setShowDevDeps] = useState(true);

  // Map package metadata from scan results dynamically
  const packageNodes = useMemo(() => {
    const deps = result?.metadata?.frameworkMetadata?.dependencies || {};
    const devDeps = result?.metadata?.frameworkMetadata?.devDependencies || {};
    
    const prodList = Object.entries(deps).map(([name, ver]) => ({
      id: name,
      name,
      version: String(ver),
      type: 'dependency' as const,
      usedBy: [] as string[]
    }));

    const devList = Object.entries(devDeps).map(([name, ver]) => ({
      id: name,
      name,
      version: String(ver),
      type: 'devDependency' as const,
      usedBy: [] as string[]
    }));

    return [...prodList, ...devList];
  }, [result]);

  // Map file structures and their parsed imports dynamically
  const fileNodes = useMemo(() => {
    const files = result?.files || [];
    return files
      .filter((f: any) => !f.path.startsWith("ROUTE:") && !f.path.startsWith("ENV:") && !f.path.startsWith("DB:"))
      .map((f: any) => {
        // Track which dependencies this file actually imports
        const imports = f.externalImports || [];
        return {
          id: f.path,
          name: f.path.split(/[\\/]/).pop() || f.path,
          imports
        };
      });
  }, [result]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const filteredPackages = showDevDeps
      ? packageNodes
      : packageNodes.filter((p: { type: string }) => p.type === 'dependency');

    // Position packages in a grid
    const cols = 4;
    const startY = 400;

    filteredPackages.forEach((pkg, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 80 + col * 220;
      const y = startY + row * 120;

      // Count files using this package
      const usedByFiles = fileNodes.filter((f: { imports: string[] }) => f.imports.includes(pkg.id)).length;

      nodes.push({
        id: pkg.id,
        type: 'packageNode',
        position: { x, y },
        data: {
          name: pkg.name,
          version: pkg.version,
          type: pkg.type,
          usedByFiles
        }
      });
    });

    // Add top importing files
    const topImporterY = 80;
    const topImporters = fileNodes
      .filter((f: { imports: string[] }) => f.imports.length > 0)
      .sort((a: { imports: string[] }, b: { imports: string[] }) => b.imports.length - a.imports.length)
      .slice(0, 8);

    topImporters.forEach((file: { id: string; name: string; imports: string[] }, i: number) => {
      const x = 50 + i * 180;
      nodes.push({
        id: `file-${file.id}`,
        type: 'fileNode',
        position: { x, y: topImporterY },
        data: {
          name: file.name,
          importCount: file.imports.length
        }
      });

      // Connect to packages
      file.imports.forEach((importId: string) => {
        if (filteredPackages.some(p => p.id === importId)) {
          edges.push({
            id: `file-${file.id}-${importId}`,
            source: `file-${file.id}`,
            target: importId,
            type: 'smoothstep',
            style: { stroke: '#475569', strokeWidth: 1 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' }
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [showDevDeps, packageNodes, fileNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // useRef synchronization guards to block the rendering-loop crash (Error #185)
  const lastSyncedNodeIds = useRef<string>("");
  const lastSyncedEdgeIds = useRef<string>("");

  useEffect(() => {
    const newIds = initialNodes.map(n => n.id).join(',');
    if (newIds !== lastSyncedNodeIds.current) {
      lastSyncedNodeIds.current = newIds;
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    const newIds = initialEdges.map(e => e.id).join(',');
    if (newIds !== lastSyncedEdgeIds.current) {
      lastSyncedEdgeIds.current = newIds;
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  const depCount = packageNodes.filter(p => p.type === 'dependency').length;
  const devDepCount = packageNodes.filter(p => p.type === 'devDependency').length;

  return (
    <div className="h-full w-full relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Package className="text-blue-400" />
          Package Dependencies
        </h2>
        <p className="text-sm text-slate-400">
          {depCount} production + {devDepCount} dev dependencies
        </p>
      </div>

      {/* Toggle */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-3 border border-slate-800">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDevDeps}
            onChange={(e) => setShowDevDeps(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-300">Show devDependencies</span>
        </label>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Package Types</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/50" />
            <span className="text-xs text-blue-400">Production</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-500/20 border border-slate-500/50" />
            <span className="text-xs text-slate-400">Development</span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background gap={20} size={1} />
      </ReactFlow>
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
