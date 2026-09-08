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
import { Route as RouteIcon, Shield, Database, AlertTriangle, FileCode } from 'lucide-react';

const METHOD_CONFIG: Record<string, { bg: string; text: string; border: string; edgeColor: string }> = {
  GET: { bg: 'bg-[#16C7A1]', text: 'text-[#06100C]', border: 'border-[#22304A]', edgeColor: '#16C7A1' },
  POST: { bg: 'bg-[#2F80ED]', text: 'text-white', border: 'border-[#2F80ED]/40', edgeColor: '#2F80ED' },
  DELETE: { bg: 'bg-[#FF3B4E]', text: 'text-white', border: 'border-[#FF3B4E]/40', edgeColor: '#FF3B4E' },
  PUT: { bg: 'bg-[#F5B800]', text: 'text-zinc-950', border: 'border-[#F5B800]/40', edgeColor: '#F5B800' },
  PATCH: { bg: 'bg-[#FF8A00]', text: 'text-white', border: 'border-[#FF8A00]/40', edgeColor: '#FF8A00' },
};

interface RouteNodeProps {
  data: {
    method: string;
    path: string;
    controller: string;
    hasAuth: boolean;
    accessesDB: boolean;
    middleware: string[];
  };
  selected?: boolean;
}

function RouteGraphNode({ data, selected }: RouteNodeProps) {
  const method = data.method?.toUpperCase() || 'GET';
  const config = METHOD_CONFIG[method] || METHOD_CONFIG.GET;

  const borderColor = selected
    ? 'border-[#60A5FA]'
    : data.hasAuth
      ? 'border-[#1F6FEB]'
      : method === 'DELETE'
        ? 'border-[#FF3B4E]/50'
        : method === 'POST'
          ? 'border-[#2F80ED]/50'
          : 'border-[#22304A]';

  return (
    <div
      className={`relative w-[175px] min-h-[76px] rounded-[11px] p-2.5 text-left transition-all duration-200 border ${borderColor} ${
        selected ? 'bg-[#101F30] ring-1 ring-[#60A5FA]' : 'bg-[#0D1728] hover:bg-[#101D2D] hover:-translate-y-0.5'
      }`}
      style={{
        boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[7px] !h-[7px] !bg-[#8792A0] !border-none opacity-70 hover:opacity-100 transition-opacity"
      />

      {/* Row 1: Method badge + Path */}
      <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
        <span className={`h-[22px] px-2 rounded-[4px] text-[10.5px] font-bold shrink-0 flex items-center justify-center ${config.bg} ${config.text}`}>
          {method}
        </span>
        <span
          className="text-[12px] font-semibold text-[#F7FAFA] truncate flex-1 min-w-0 font-mono"
          title={data.path}
        >
          {data.path}
        </span>
      </div>

      {/* Row 2: File / Source */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#A5B0BA] mb-2 min-w-0">
        <FileCode size={13} className="text-[#8792A0] shrink-0" />
        <span className="truncate font-sans">{data.controller}</span>
      </div>

      {/* Row 3: Auth Status */}
      <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px] font-semibold">
        {data.hasAuth ? (
          <span className="flex items-center gap-1 text-[#16C7A1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A1]" />
            <span className="tracking-wider">PROTECTED</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[#F5B800]">
            <AlertTriangle size={11} className="text-[#F5B800]" />
            <span className="tracking-wider">NO AUTH</span>
          </span>
        )}

        {data.accessesDB && (
          <span className="flex items-center gap-1 text-[#00B8D9] ml-auto">
            <Database size={11} />
            <span>DB</span>
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[7px] !h-[7px] !bg-[#8792A0] !border-none opacity-70 hover:opacity-100 transition-opacity"
      />
    </div>
  );
}

interface ControllerNodeProps {
  data: {
    name: string;
    routeCount: number;
  };
  selected?: boolean;
}

function ControllerNode({ data, selected }: ControllerNodeProps) {
  return (
    <div
      className={`relative w-[155px] h-[46px] rounded-[11px] px-3 py-1.5 text-left transition-all duration-200 border border-[#9B5CFF] bg-[#1A1329] flex items-center gap-2.5 ${
        selected ? 'ring-1 ring-[#9B5CFF] brightness-125' : 'hover:brightness-110'
      }`}
      style={{
        boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[7px] !h-[7px] !bg-[#8792A0] !border-none opacity-70 hover:opacity-100 transition-opacity"
      />

      <div className="w-7 h-7 rounded-lg bg-[#9B5CFF]/15 flex items-center justify-center border border-[#9B5CFF]/30 shrink-0">
        <FileCode size={15} className="text-[#9B5CFF]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-[#F7FAFA] truncate font-sans" title={data.name}>
          {data.name}
        </div>
        <div className="text-[10px] text-[#A5B0BA] truncate">
          {data.routeCount} {data.routeCount === 1 ? 'route' : 'routes'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[7px] !h-[7px] !bg-[#8792A0] !border-none opacity-70 hover:opacity-100 transition-opacity"
      />
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
    const seenNodeIds = new Set<string>();

    // Group filtered routes by controller
    const controllerMap = new Map<string, any[]>();
    filteredRoutes.forEach((r: any) => {
      if (!controllerMap.has(r.controller)) {
        controllerMap.set(r.controller, []);
      }
      controllerMap.get(r.controller)!.push(r);
    });

    // Calculate maximum routes in any controller for bottom alignment
    let maxRoutes = 1;
    controllerMap.forEach((routes: any[]) => {
      if (routes.length > maxRoutes) maxRoutes = routes.length;
    });

    const controllers = Array.from(controllerMap.keys());
    const colWidth = 215; // 175px width + 40px gap
    const rowHeight = 92; // 76px height + 16px gap
    const startX = 60;
    const startY = 60;
    const bottomY = startY + maxRoutes * rowHeight + 24;

    controllers.forEach((controller: string, colIdx: number) => {
      const cRoutes = controllerMap.get(controller) || [];
      const colX = startX + colIdx * colWidth;

      // Add Route Nodes in this column
      cRoutes.forEach((route: any, rowIdx: number) => {
        const routeId = route.id;
        if (!seenNodeIds.has(routeId)) {
          seenNodeIds.add(routeId);
          const nodeY = startY + rowIdx * rowHeight;

          nodes.push({
            id: routeId,
            type: 'routeNode',
            position: { x: colX, y: nodeY },
            data: {
              method: route.method,
              path: route.path,
              controller: route.controller,
              hasAuth: route.hasAuth,
              accessesDB: route.accessesDB,
              middleware: route.middleware
            }
          });

          // If not the last route in column, connect to the next route below
          if (rowIdx < cRoutes.length - 1) {
            const nextRouteId = cRoutes[rowIdx + 1].id;
            const methodConfig = METHOD_CONFIG[route.method?.toUpperCase()] || METHOD_CONFIG.GET;
            edges.push({
              id: `edge-${routeId}-${nextRouteId}`,
              source: routeId,
              target: nextRouteId,
              type: 'smoothstep',
              style: { stroke: methodConfig.edgeColor, strokeWidth: 1.5, opacity: 0.7 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 6,
                height: 6,
                color: methodConfig.edgeColor
              }
            });
          }
        }
      });

      // Add Controller Node (bottom file node directly under column)
      const controllerId = `controller-${controller}`;
      if (!seenNodeIds.has(controllerId)) {
        seenNodeIds.add(controllerId);
        nodes.push({
          id: controllerId,
          type: 'controllerNode',
          position: { x: colX + 10, y: bottomY },
          data: {
            name: controller,
            routeCount: cRoutes.length
          }
        });

        // Connect the last route in this column to the controller node
        if (cRoutes.length > 0) {
          const lastRoute = cRoutes[cRoutes.length - 1];
          edges.push({
            id: `edge-${lastRoute.id}-${controllerId}`,
            source: lastRoute.id,
            target: controllerId,
            type: 'smoothstep',
            style: { stroke: '#9B5CFF', strokeWidth: 1.5, opacity: 0.7 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 6,
              height: 6,
              color: '#9B5CFF'
            }
          });
        }
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [filter, routeNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // useRef synchronization guards to block rendering-loop crashes (Error #301)
  const lastSyncedNodeIds = useRef<string>("");
  const lastSyncedEdgeIds = useRef<string>("");

  useEffect(() => {
    const newIds = initialNodes.map((n) => `${n.id}:${n.position.x}:${n.position.y}`).join("|");
    if (newIds !== lastSyncedNodeIds.current) {
      lastSyncedNodeIds.current = newIds;
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    const newIds = initialEdges.map((e) => e.id).join("|");
    if (newIds !== lastSyncedEdgeIds.current) {
      lastSyncedEdgeIds.current = newIds;
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  return (
    <div className="h-full w-full relative bg-[#07090C] overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 bg-[#0D1728]/90 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-lg">
        <h2 className="text-sm font-bold text-[#F7FAFA] flex items-center gap-2">
          <RouteIcon className="text-[#16C7A1] w-4 h-4" />
          Route Endpoint Graph
        </h2>
        <p className="text-[11px] text-[#A5B0BA] mt-0.5">{routeNodes.length} API endpoints mapped</p>
      </div>

      {/* Filter */}
      <div className="absolute top-4 right-4 z-10 bg-[#0D1728]/90 backdrop-blur-md rounded-xl p-1.5 border border-white/10 shadow-lg flex items-center gap-1">
        {(['all', 'protected', 'unprotected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-[#16C7A1] text-[#07090C] font-bold'
                : 'text-[#A5B0BA] hover:text-white hover:bg-white/5'
            }`}
          >
            {f === 'all' ? 'All' : f === 'protected' ? 'Protected' : 'No Auth'}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#0D1728]/90 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 shadow-lg flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#6F7B86] uppercase tracking-wider mr-1">Methods</span>
          {Object.entries(METHOD_CONFIG).map(([method, style]) => (
            <span key={method} className={`h-[18px] px-1.5 rounded text-[9.5px] font-bold flex items-center justify-center ${style.bg} ${style.text}`}>
              {method}
            </span>
          ))}
        </div>
        <div className="w-px h-3.5 bg-white/10" />
        <div className="flex items-center gap-2 text-[10px] font-semibold">
          <span className="flex items-center gap-1 text-[#16C7A1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A1]" />
            <span>PROTECTED</span>
          </span>
          <span className="flex items-center gap-1 text-[#F5B800]">
            <AlertTriangle size={10} />
            <span>NO AUTH</span>
          </span>
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
        <Controls className="!bg-[#0D1728] !border-white/10 !fill-[#F7FAFA] !rounded-lg overflow-hidden [&>button]:!bg-[#0D1728] [&>button]:!border-white/10 [&>button]:!text-zinc-400 hover:[&>button]:!text-white" />
        <MiniMap
          nodeStrokeWidth={2}
          zoomable
          pannable
          className="!bg-[#07090C] !border !border-white/10 !rounded-xl overflow-hidden"
          nodeColor={(n) => n.type === 'controllerNode' ? '#9B5CFF' : '#1F6FEB'}
          maskColor="rgba(7, 9, 12, 0.75)"
        />
        <Background color="rgba(255, 255, 255, 0.035)" gap={16} size={1} />
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
