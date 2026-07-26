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
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FileCode, AlertTriangle, X, GitBranch } from 'lucide-react';

interface FileNodeProps {
  data: {
    label: string;
    path: string;
    loc: number;
    complexity: number;
    riskLevel: 'low' | 'medium' | 'high';
    importCount: number;
    focused?: boolean;
  };
}

const riskColors = {
  low: { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  medium: { border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  high: { border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-400' }
};

function FileGraphNode({ data }: FileNodeProps) {
  const risk = riskColors[data.riskLevel] || riskColors.low;
  const isFocused = data.focused !== false;
  const opacity = isFocused ? 1 : 0.12;

  return (
    <div
      className={`relative bg-slate-900 border-2 ${risk.border} rounded-xl shadow-lg p-3 min-w-[150px] text-left`}
      style={{ opacity }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-500" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-500" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-500" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-500" />

      <div className="flex items-start gap-2">
        <div className={`w-8 h-8 rounded-lg ${risk.bg} flex items-center justify-center flex-shrink-0`}>
          <FileCode size={16} className={risk.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-white truncate">{data.label}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{data.loc} LOC</div>
        </div>
        {data.riskLevel === 'high' && (
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
        <div className="text-[10px] text-slate-500">
          <span className="text-slate-300">{data.complexity}</span> complexity
        </div>
        <div className="text-[10px] text-slate-500 ml-auto">
          <span className="text-blue-400">{data.importCount}</span> imports
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  fileNode: FileGraphNode
};

// Circular layout algorithm
function calculateCircularLayout(nodes: any[], centerX: number, centerY: number) {
  const totalNodes = nodes.length;
  const radius = Math.min(400, 150 + totalNodes * 12);

  return nodes.map((node, i) => {
    const angle = (i / totalNodes) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { ...node, x, y };
  });
}

// BFS for subgraph filtering
function getFocusedNodes(
  allNodes: any[],
  searchTerm: string,
  depth: number = 2
): Set<string> {
  const matched = new Set<string>();
  const lowerSearch = searchTerm.toLowerCase();

  // Find initial matches
  allNodes.forEach(node => {
    if (node.name.toLowerCase().includes(lowerSearch)) {
      matched.add(node.id);
    }
  });

  if (matched.size === 0) return matched;

  // BFS expansion
  const visited = new Set(matched);
  const queue = Array.from(matched).map(id => ({ id, dist: 0 }));

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    if (dist >= depth) continue;

    const node = allNodes.find(n => n.id === id);
    if (!node) continue;

    // Follow imports
    node.imports.forEach((importId: string) => {
      if (!visited.has(importId)) {
        visited.add(importId);
        matched.add(importId);
        queue.push({ id: importId, dist: dist + 1 });
      }
    });

    // Follow reverse imports (referenced by)
    node.importedBy.forEach((refId: string) => {
      if (!visited.has(refId)) {
        visited.add(refId);
        matched.add(refId);
        queue.push({ id: refId, dist: dist + 1 });
      }
    });
  }

  return matched;
}

function FileGraphInternal({ result }: { result: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedNodes, setFocusedNodes] = useState<Set<string>>(new Set());
  const { setCenter } = useReactFlow();

  // Map backend files dynamically
  const fileNodes = useMemo(() => {
    const files = result?.files || [];
    return files
      .filter((f: any) => !f.path.startsWith("ROUTE:") && !f.path.startsWith("ENV:") && !f.path.startsWith("DB:") && !f.path.startsWith("ENTITY:"))
      .map((f: any) => ({
        id: f.path,
        name: f.path.split(/[\\/]/).pop() || f.path,
        path: f.path,
        type: 'file' as const,
        loc: f.loc || 100,
        imports: f.internalImports || [],
        importedBy: f.referencedBy || [],
        complexity: f.complexity || 0,
        riskLevel: (f.complexity > 20 ? 'high' : f.complexity > 10 ? 'medium' : 'low') as 'low' | 'medium' | 'high'
      }));
  }, [result]);

  // Generate nodes and edges with circular layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const centerX = 500;
    const centerY = 400;

    const positionedNodes = calculateCircularLayout(fileNodes, centerX, centerY);

    const nodes: Node[] = positionedNodes.map(node => ({
      id: node.id,
      type: 'fileNode',
      position: { x: node.x, y: node.y },
      data: {
        label: node.name,
        path: node.path,
        loc: node.loc,
        complexity: node.complexity,
        riskLevel: node.riskLevel,
        importCount: node.imports.length
      }
    }));

    const edges: Edge[] = [];
    fileNodes.forEach((node: any) => {
      node.imports.forEach((targetId: string) => {
        edges.push({
          id: `${node.id}-${targetId}`,
          source: node.id,
          target: targetId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#475569', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' }
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [fileNodes]);

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

  // Update focused nodes based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFocusedNodes(new Set());
      return;
    }

    const focused = getFocusedNodes(fileNodes, searchQuery, 2);
    setFocusedNodes(focused);

    // Center on first matched node
    if (focused.size > 0) {
      const firstId = Array.from(focused)[0];
      const node = nodes.find((n: Node) => n.id === firstId);
      if (node) {
        setCenter(node.position.x + 75, node.position.y + 50, { zoom: 1.3, duration: 400 });
      }
    }
  }, [searchQuery, nodes, setCenter, fileNodes]);

  // Update nodes with focused state
  const displayNodes = useMemo(() => {
    if (focusedNodes.size === 0) return nodes;

    return nodes.map((node: Node) => ({
      ...node,
      data: {
        ...node.data,
        focused: focusedNodes.has(node.id)
      }
    }));
  }, [nodes, focusedNodes]);

  return (
    <div className="h-full w-full relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <GitBranch className="text-purple-400" />
          File Dependency Graph
        </h2>
        <p className="text-sm text-slate-400">{fileNodes.length} files analyzed</p>
      </div>

      {/* Search */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-3 border border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search files (BFS 2 hops)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 w-56"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-slate-400 mt-2">
            {focusedNodes.size} nodes in focused subgraph
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Risk Level</div>
        <div className="space-y-1.5">
          {(['low', 'medium', 'high'] as const).map(level => (
            <div key={level} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${riskColors[level].bg} ${riskColors[level].border}`} />
              <span className={`text-xs ${riskColors[level].text} capitalize`}>{level}</span>
            </div>
          ))}
        </div>
      </div>

      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background gap={20} size={1} />
      </ReactFlow>
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
