"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
import { Route as RouteIcon, Shield, Database, Server, AlertTriangle, FileCode } from 'lucide-react';

interface RouteNodeProps {
  data: {
    method: string;
    path: string;
    controller: string;
    hasAuth: boolean;
    accessesDB: boolean;
    middleware: string[];
  };
}

const methodStyles = {
  GET: { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-400' },
  POST: { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-400' },
  PUT: { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-400' },
  DELETE: { bg: 'bg-red-500', border: 'border-red-400', text: 'text-red-400' },
  PATCH: { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-400' }
};

type HttpMethod = keyof typeof methodStyles;

function RouteGraphNode({ data }: RouteNodeProps) {
  const style = methodStyles[data.method as HttpMethod] || methodStyles.GET;

  return (
    <div className="relative bg-slate-900 border-2 border-slate-700/80 rounded-xl shadow-lg p-3 min-w-[200px] text-left">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-500" />

      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${style.bg} text-white`}>
          {data.method}
        </span>
        <span className="font-mono text-xs text-white truncate max-w-[130px]" title={data.path}>
          {data.path}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Server size={12} className="shrink-0" />
        <span className="truncate">{data.controller}</span>
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
        {data.hasAuth ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <Shield size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Protected</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-400">
            <AlertTriangle size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">No Auth</span>
          </span>
        )}

        {data.accessesDB && (
          <span className="flex items-center gap-1 text-blue-400 ml-auto">
            <Database size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">DB</span>
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-500" />
    </div>
  );
}

interface ControllerNodeProps {
  data: {
    name: string;
    routeCount: number;
  };
}

function ControllerNode({ data }: ControllerNodeProps) {
  return (
    <div className="relative bg-slate-800 border-2 border-purple-500/50 rounded-xl shadow-lg p-3 min-w-[170px] text-left">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-500" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-500" />

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center border border-purple-500/20 shrink-0">
          <FileCode size={14} className="text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs text-white truncate font-bold" title={data.name}>
            {data.name}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {data.routeCount} {data.routeCount === 1 ? 'route' : 'routes'}
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

function RouteGraphInternal({ result }: { result: any }) {
  const [filter, setFilter] = useState<'all' | 'protected' | 'unprotected'>('all');

  // Dynamically map backend analysis results to the graph structure format
  const routeNodes = useMemo(() => {
    return (result?.routes || []).map((r: any, idx: number) => {
      const controllerBasename = r.file ? r.file.split(/[\\/]/).pop() || r.file : 'UnknownController.ts';
      const hasAuth = r.middleware?.some((m: string) =>
        /auth|protect|jwt|passport|login|session|require/i.test(m)
      ) || r.chain?.some((c: any) =>
        /auth|protect|jwt|passport/i.test(c.name || c)
      ) || false;

      const accessesDB = (result?.metadata?.databaseInfo?.flows ?? []).some(
        (f: any) => f.route === r.path && f.method.toUpperCase() === r.method.toUpperCase()
      );

      return {
        id: `route:${r.method}:${r.path}-${idx}`,
        method: r.method as any,
        path: r.path,
        controller: controllerBasename,
        middleware: r.middleware || [],
        hasAuth,
        accessesDB
      };
    });
  }, [result]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const filteredRoutes = routeNodes.filter((route: any) => {
      if (filter === 'protected') return route.hasAuth;
      if (filter === 'unprotected') return !route.hasAuth;
      return true;
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const seenNodeIds = new Set<string>(); // ✅ Add this
    const controllerY = 550;

    // Group routes by controller
    const controllerCount = new Map<string, number>();
    routeNodes.forEach((r: any) => {
      controllerCount.set(r.controller, (controllerCount.get(r.controller) || 0) + 1);
    });

    // Add controller nodes
    const controllers = Array.from(controllerCount.keys());
    controllers.forEach((controller, i) => {
      const controllerId = controller;

      // ✅ Add duplicate check
      if (!seenNodeIds.has(controllerId)) {
        seenNodeIds.add(controllerId);
        const x = 100 + i * 250;
        nodes.push({
          id: controllerId,
          type: 'controllerNode',
          position: { x, y: controllerY },
          data: {
            name: controller,
            routeCount: controllerCount.get(controller) || 0
          }
        });
      }
    });

    // Add route nodes
    filteredRoutes.forEach((route: any, i: number) => {
      const routeId = route.id;

      // ✅ Add duplicate check
      if (!seenNodeIds.has(routeId)) {
        seenNodeIds.add(routeId);
        const controllerIdx = controllers.indexOf(route.controller);
        const x = 100 + controllerIdx * 250;
        const y = 50 + (i % 4) * 110;

        nodes.push({
          id: routeId,
          type: 'routeNode',
          position: { x, y },
          data: {
            method: route.method,
            path: route.path,
            controller: route.controller,
            hasAuth: route.hasAuth,
            accessesDB: route.accessesDB,
            middleware: route.middleware
          }
        });

        // Connect to controller
        edges.push({
          id: `${routeId}-${route.controller}`,
          source: routeId,
          target: route.controller,
          type: 'smoothstep',
          style: { stroke: '#7c3aed', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#7c3aed' }
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [filter, routeNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Simple sync - only triggers when memoized data changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="h-full w-full relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <RouteIcon className="text-emerald-400" />
          Route Endpoint Graph
        </h2>
        <p className="text-sm text-slate-400">{routeNodes.length} API endpoints mapped</p>
      </div>

      {/* Filter */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-3 border border-slate-800">
        <div className="text-xs font-semibold text-slate-400 mb-2">Filter Routes</div>
        <div className="flex gap-2">
          {(['all', 'protected', 'unprotected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Methods</div>
        <div className="space-y-1.5">
          {Object.entries(methodStyles).map(([method, style]) => (
            <div key={method} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.bg} text-white`}>
                {method}
              </span>
            </div>
          ))}
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

export default function RouteGraph({ result }: { result: any }) {
  return (
    <ReactFlowProvider>
      <RouteGraphInternal result={result} />
    </ReactFlowProvider>
  );
}
