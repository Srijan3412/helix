// frontend/components/architecture/MetroMap/MetroMap.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  NodeMouseHandler,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  RotateCcw,
  Download,
  Layers,
  Database,
  Server,
  Cloud,
  Cpu,
  HeartPulse,
  Eye,
  Focus,
  Compass,
  GitBranch
} from 'lucide-react';

import { SubwayStationNode } from './SubwayStationNode';
import { TrackHeaderNode } from './TrackHeaderNode';
import { StationInspector } from './StationInspector';
import { FeatureLegend } from './FeatureLegend';
import { MetroSearchPanel } from './MetroSearchPanel';
import { useMetroData, inferStationType } from './useMetroData';
import { useMetroLayout } from './useMetroLayout';
import { useMetroGraph } from './useMetroGraph';
import { SubwayStationData, FeatureFlow, MetroMapProps, FlowGroupData } from './types';
import { ALL_LAYERS } from './layerDetector';

// Custom Node: Flow Group Card (Overview Mode)
function FlowGroupNode({ data }: { data: any }) {
  const isSelected = data.isSelected;
  const color = data.color || '#F43F8C';
  const flowGroup: FlowGroupData = data.flowGroup;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onSelectGroup?.(flowGroup);
      }}
      className={`p-3.5 rounded-2xl bg-[#0E1B20] border transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl select-none ${
        isSelected
          ? 'border-[#16C7A3] ring-2 ring-[#16C7A3]/40 scale-105'
          : 'border-[#64BEC7]/20 hover:border-[#64BEC7]/50'
      }`}
      style={{
        borderLeft: `5px solid ${color}`,
        width: 210
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{flowGroup?.icon || '🔐'}</span>
          <h4 className="text-xs font-bold text-[#F4F7F7] font-mono truncate">
            {flowGroup?.name}
          </h4>
        </div>
      </div>
      <div className="text-[10px] font-mono text-[#9FB0B4] flex items-center justify-between mb-2">
        <span>{flowGroup?.stationsCount || 4} stations</span>
        <span>{flowGroup?.endpointsCount || 8} endpoints</span>
      </div>
      <div className="w-full bg-[#061318] h-1.5 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${flowGroup?.health || 96}%`,
            backgroundColor: (flowGroup?.health || 96) >= 90 ? '#16C7A3' : '#F5A623'
          }}
        />
      </div>
      <div className="text-[9px] font-mono text-[#16C7A3] flex items-center justify-between">
        <span>{flowGroup?.health || 96}% Health</span>
        <span className="text-[#718287] hover:text-white font-bold">Inspect &rarr;</span>
      </div>
    </div>
  );
}

// Custom Node: Core Hub Node
function CoreHubNode({ data }: { data: any }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onSelectHub?.();
      }}
      className="w-36 h-36 rounded-full bg-[#0E1B20] border-2 border-[#16C7A3] shadow-[0_0_40px_rgba(22,199,163,0.3)] flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:scale-105 transition-all select-none"
    >
      <div className="w-11 h-11 rounded-2xl bg-[#16C7A3]/20 flex items-center justify-center mb-1 text-[#16C7A3] border border-[#16C7A3]/40">
        <Layers size={24} />
      </div>
      <span className="text-xs font-extrabold text-[#F4F7F7] font-mono tracking-wider">CORE HUB</span>
      <span className="text-[9px] text-[#9FB0B4] font-mono">Infrastructure & Integrations</span>
    </div>
  );
}

// Custom Node: Shared Infrastructure Node
function InfraNode({ data }: { data: any }) {
  const Icon = data.icon || Database;
  return (
    <div className="px-4 py-3 rounded-xl bg-[#0E1B20] border border-[#64BEC7]/25 flex items-center gap-3 shadow-md min-w-[170px] select-none hover:border-[#16C7A3] transition">
      <div className="w-8 h-8 rounded-lg bg-[#16C7A3]/15 flex items-center justify-center text-[#16C7A3]">
        <Icon size={18} />
      </div>
      <div>
        <span className="text-xs font-bold text-[#F4F7F7] font-mono block leading-tight">{data.label}</span>
        <span className="text-[10px] text-[#9FB0B4] font-mono">{data.stationsCount || 4} stations</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  subwayStation: SubwayStationNode,
  trackHeader: TrackHeaderNode,
  flowGroup: FlowGroupNode,
  coreHub: CoreHubNode,
  infraNode: InfraNode
};

function MetroMapInternal({
  result,
  onSwitchTab,
  onSetImpactFile,
  onSelectTraceRouteId
}: MetroMapProps) {
  const { fitView, setCenter } = useReactFlow();

  // Phase 1: Data Hook
  const { featureClusters, interchanges, executionTraces } = useMetroData(result);

  // ── Mode & Selection State ──
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<FeatureFlow | null>(null);
  const [selectedFlowGroup, setSelectedFlowGroup] = useState<FlowGroupData | null>(null);
  const [selectedStation, setSelectedStation] = useState<SubwayStationData | null>(null);
  const [focusedNodeIds, setFocusedNodeIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Feature Lines & Flow Groups ──
  const sortedFeatureClusters = useMemo(() => {
    return [...featureClusters].sort((a, b) => (b.health || 0) - (a.health || 0));
  }, [featureClusters]);

  const activeFeatureClusters = useMemo(() => {
    if (selectedFeatures.length === 0) return sortedFeatureClusters;
    return sortedFeatureClusters.filter((f) => selectedFeatures.includes(f.id));
  }, [sortedFeatureClusters, selectedFeatures]);

  // Handle Feature Selection
  const handleToggleFeature = useCallback((featId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featId) ? prev.filter((id) => id !== featId) : [...prev, featId]
    );
  }, []);

  const handleSelectAllFeatures = useCallback(() => {
    setSelectedFeatures([]);
  }, []);

  // Center canvas on feature
  const handleCenterFeature = useCallback((featId: string) => {
    const feat = sortedFeatureClusters.find((f) => f.id === featId || f.name === featId);
    if (feat) {
      setSelectedFeature(feat);
      setSelectedFlowGroup(null);
      setSelectedStation(null);
    }
  }, [sortedFeatureClusters]);

  // Overview ReactFlow Graph Layout Construction
  const overviewGraph = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    let currentY = 50;

    activeFeatureClusters.forEach((feat) => {
      const featColor = feat.color || '#F43F8C';
      const flowGroups = feat.flowGroups || [];

      // Feature Line Header
      nodes.push({
        id: `feat-header-${feat.id}`,
        type: 'trackHeader',
        position: { x: 50, y: currentY },
        data: {
          label: feat.name,
          color: featColor,
          stationCount: feat.totalStations || feat.files?.length || 12,
          featureId: feat.id,
          onSelectFeature: () => {
            setSelectedFeature(feat);
            setSelectedFlowGroup(null);
            setSelectedStation(null);
          }
        }
      });

      // Render Flow Groups horizontally along feature line
      flowGroups.forEach((fg, fgIdx) => {
        const nodeId = `fg-${feat.id}-${fg.id}`;
        const isSelected = selectedFlowGroup?.id === fg.id;

        nodes.push({
          id: nodeId,
          type: 'flowGroup',
          position: { x: 260 + fgIdx * 240, y: currentY - 15 },
          data: {
            flowGroup: fg,
            color: featColor,
            isSelected,
            onSelectGroup: (group: FlowGroupData) => {
              setSelectedFlowGroup(group);
              setSelectedFeature(feat);
              setSelectedStation(null);
            }
          }
        });

        // Edge connecting feature line to flow group
        if (fgIdx === 0) {
          edges.push({
            id: `edge-${feat.id}-header-fg0`,
            source: `feat-header-${feat.id}`,
            target: nodeId,
            style: { stroke: featColor, strokeWidth: 3 },
            type: 'smoothstep'
          });
        } else {
          edges.push({
            id: `edge-${feat.id}-fg${fgIdx - 1}-fg${fgIdx}`,
            source: `fg-${feat.id}-${flowGroups[fgIdx - 1].id}`,
            target: nodeId,
            style: { stroke: featColor, strokeWidth: 3 },
            type: 'smoothstep'
          });
        }
      });

      currentY += 160;
    });

    // Central Core Hub Node
    const coreHubX = 1200;
    const coreHubY = Math.max(250, currentY / 2);

    nodes.push({
      id: 'core-hub-central',
      type: 'coreHub',
      position: { x: coreHubX, y: coreHubY - 70 },
      data: {
        onSelectHub: () => {
          const coreFeat = sortedFeatureClusters.find((f) => f.name.toLowerCase().includes('core'));
          if (coreFeat) {
            setSelectedFeature(coreFeat);
            setSelectedFlowGroup(null);
            setSelectedStation(null);
          }
        }
      }
    });

    // Connect Feature Lines to Core Hub
    activeFeatureClusters.forEach((feat) => {
      const featColor = feat.color || '#F43F8C';
      const flowGroups = feat.flowGroups || [];
      if (flowGroups.length > 0) {
        const lastFgId = `fg-${feat.id}-${flowGroups[flowGroups.length - 1].id}`;
        edges.push({
          id: `edge-${feat.id}-hub`,
          source: lastFgId,
          target: 'core-hub-central',
          style: { stroke: featColor, strokeWidth: 2, strokeDasharray: '4,4' },
          type: 'smoothstep'
        });
      }
    });

    // Shared Infrastructure Nodes (Right of Core Hub)
    const infraNodesData = [
      { id: 'infra-postgres', label: 'PostgreSQL', icon: Database, stationsCount: 4, y: coreHubY - 180 },
      { id: 'infra-redis', label: 'Redis Cache', icon: Server, stationsCount: 3, y: coreHubY - 90 },
      { id: 'infra-external', label: 'External APIs', icon: Cloud, stationsCount: 4, y: coreHubY },
      { id: 'infra-[#16C7A3]', label: 'Background Jobs', icon: Cpu, stationsCount: 4, y: coreHubY + 90 },
      { id: 'infra-[#F5A623]', label: 'System Health', icon: HeartPulse, stationsCount: 3, y: coreHubY + 180 }
    ];

    infraNodesData.forEach((infra) => {
      nodes.push({
        id: infra.id,
        type: 'infraNode',
        position: { x: coreHubX + 240, y: infra.y },
        data: {
          label: infra.label,
          icon: infra.icon,
          stationsCount: infra.stationsCount
        }
      });

      edges.push({
        id: `edge-hub-${infra.id}`,
        source: 'core-hub-central',
        target: infra.id,
        style: { stroke: 'rgba(100,190,205,0.4)', strokeWidth: 2 },
        type: 'smoothstep'
      });
    });

    return { nodes, edges, canvasWidth: coreHubX + 500, canvasHeight: currentY + 100 };
  }, [activeFeatureClusters, selectedFlowGroup, sortedFeatureClusters]);

  // Detailed ReactFlow Graph Layout Construction
  const detailedFeatureLines = useMemo(() => {
    const lines: Record<string, SubwayStationData[]> = {};
    activeFeatureClusters.forEach((feature) => {
      const rawStations: SubwayStationData[] = [];
      (feature.files || []).forEach((fPath) => {
        const filename = fPath.split(/[\\/]/).pop() || fPath;
        rawStations.push({
          id: `${feature.id}-${fPath}`,
          name: fPath,
          label: filename,
          displayName: filename,
          rawPath: fPath,
          type: inferStationType(filename),
          key: `file:${fPath}`,
          raw: fPath,
          layer: 'business',
          health: 'healthy',
          complexity: 25,
          color: feature.color,
          featureId: feature.id,
          lineName: feature.name,
          features: [feature.name],
          isInterchange: false
        });
      });
      lines[feature.id] = rawStations;
    });
    return { stations: lines, layerGroups: {} };
  }, [activeFeatureClusters]);

  const { positions } = useMetroLayout(
    activeFeatureClusters,
    activeFeatureClusters,
    selectedFeatures,
    detailedFeatureLines.stations,
    detailedFeatureLines.layerGroups,
    20,
    9999
  );

  const detailedGraph = useMetroGraph({
    features: activeFeatureClusters,
    filteredFeatures: activeFeatureClusters,
    featureLines: detailedFeatureLines.stations,
    layerGroups: detailedFeatureLines.layerGroups,
    interchanges,
    selectedFeatures,
    hoveredFeature: null,
    selectedStation,
    selectedStationType: null,
    focusedNodeIds,
    animatedRoute: null,
    animationStep: 0,
    executionTraces,
    healthGlowActive: true,
    positions,
    activeLayers: ALL_LAYERS
  });

  // Active ReactFlow Graph
  const activeGraphNodes = viewMode === 'overview' ? overviewGraph.nodes : detailedGraph.nodes;
  const activeGraphEdges = viewMode === 'overview' ? overviewGraph.edges : detailedGraph.edges;

  const [nodes, setNodes, onNodesChange] = useNodesState(activeGraphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeGraphEdges);

  useEffect(() => {
    setNodes(activeGraphNodes);
  }, [activeGraphNodes, setNodes]);

  useEffect(() => {
    setEdges(activeGraphEdges);
  }, [activeGraphEdges, setEdges]);

  // Handle Station Click
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'subwayStation') {
        const stData = node.data as unknown as SubwayStationData;
        setSelectedStation(stData);
        setSelectedFlowGroup(null);
        setSelectedFeature(null);
        setFocusedNodeIds([node.id]);
      }
    },
    []
  );

  const handlePaneClick = useCallback(() => {
    setSelectedStation(null);
    setSelectedFlowGroup(null);
    setSelectedFeature(null);
    setFocusedNodeIds([]);
  }, []);

  // Search Engine
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setFocusedNodeIds([]);
        return;
      }
      const q = query.toLowerCase();
      const matches = nodes.filter((n) => {
        const data = n.data as any;
        return (
          data.label?.toLowerCase().includes(q) ||
          data.displayName?.toLowerCase().includes(q) ||
          data.name?.toLowerCase().includes(q)
        );
      });

      if (matches.length > 0) {
        setFocusedNodeIds(matches.map((m) => m.id));
        setCenter(matches[0].position.x + 85, matches[0].position.y + 45, {
          zoom: 1.2,
          duration: 500
        });
      }
    },
    [nodes, setCenter]
  );

  // SVG Export
  const exportToSvg = useCallback(() => {
    const svgElement = document.querySelector('.react-flow__viewport');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metro-map-${new Date().toISOString().slice(0, 10)}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-[#061318] text-[#F4F7F7] select-none overflow-hidden font-sans">
      {/* ── 1. HEADER BAR ── */}
      <header className="h-[72px] px-6 border-b border-[#64BEC7]/15 bg-[#071113] flex items-center justify-between shrink-0 z-30">
        <div>
          <h1 className="text-[26px] font-extrabold font-mono tracking-tight text-[#F4F7F7] leading-none">
            Metro Map
          </h1>
          <p className="text-[13px] text-[#9FB0B4] mt-1 font-sans">
            Visualize API flows across your codebase
          </p>
        </div>

        {/* Right Search & Controls */}
        <div className="flex items-center gap-3">
          {/* Search Input (320–370px) */}
          <div className="w-[340px]">
            <MetroSearchPanel
              nodes={nodes}
              searchQuery={searchQuery}
              onSearch={handleSearch}
              onSelectNode={(id) => setFocusedNodeIds([id])}
              onClear={() => setSearchQuery('')}
            />
          </div>

          <div className="h-5 w-[1px] bg-[#64BEC7]/20 mx-1" />

          {/* Action Buttons */}
          <button
            onClick={() => fitView({ padding: 0.2, duration: 400 })}
            className="px-3.5 py-2 bg-[#0E1B20] hover:bg-[#14262E] border border-[#64BEC7]/20 rounded-xl text-xs font-mono font-bold text-[#F4F7F7] transition shadow-sm flex items-center gap-1.5"
          >
            <RotateCcw size={14} className="text-[#16C7A3]" />
            <span>Fit View</span>
          </button>

          <button
            onClick={() => {
              if (nodes.length > 0) {
                setCenter(nodes[0].position.x, nodes[0].position.y, { zoom: 1.1, duration: 400 });
              }
            }}
            className="px-3.5 py-2 bg-[#0E1B20] hover:bg-[#14262E] border border-[#64BEC7]/20 rounded-xl text-xs font-mono font-bold text-[#F4F7F7] transition shadow-sm flex items-center gap-1.5"
          >
            <Focus size={14} className="text-[#2F80ED]" />
            <span>Center</span>
          </button>

          {/* Overview / Detailed Toggle */}
          <div className="bg-[#0E1B20] p-1 border border-[#64BEC7]/20 rounded-xl flex items-center font-mono text-xs">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded-lg transition font-bold ${
                viewMode === 'overview'
                  ? 'bg-[#16C7A3] text-[#061318]'
                  : 'text-[#9FB0B4] hover:text-[#F4F7F7]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 rounded-lg transition font-bold ${
                viewMode === 'detailed'
                  ? 'bg-[#16C7A3] text-[#061318]'
                  : 'text-[#9FB0B4] hover:text-[#F4F7F7]'
              }`}
            >
              Detailed
            </button>
          </div>

          <button
            onClick={exportToSvg}
            className="px-3.5 py-2 bg-[#0E1B20] hover:bg-[#14262E] border border-[#64BEC7]/20 rounded-xl text-xs font-mono font-bold text-[#F4F7F7] transition shadow-sm flex items-center gap-1.5"
          >
            <Download size={14} className="text-[#A855F7]" />
            <span>Export SVG</span>
          </button>
        </div>
      </header>

      {/* ── 2. MAIN 3-COLUMN WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Feature Lines Navigation (260-280px) */}
        <aside className="w-[270px] shrink-0 border-r border-[#64BEC7]/15 bg-[#0B171B] flex flex-col h-full overflow-hidden z-20">
          <FeatureLegend
            features={featureClusters}
            selectedFeatures={selectedFeatures}
            onToggleFeature={handleToggleFeature}
            onSelectAll={handleSelectAllFeatures}
            hoveredFeature={null}
            onHoverFeature={() => {}}
            onCenterFeature={handleCenterFeature}
            onSelectStationType={() => {}}
            selectedStationType={null}
          />
        </aside>

        {/* Center Column: Interactive Canvas Map */}
        <main className="flex-1 h-full relative bg-[#061318] overflow-hidden">
          {/* Subtle Grid Container */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(70,160,175,0.18) 1px, transparent 1px)`,
                backgroundSize: '22px 22px'
              }}
            />
          </div>

          {/* Incoming Requests Tag */}
          <div className="absolute top-4 left-6 z-10 bg-[#0E1B20]/80 backdrop-blur-md border border-[#64BEC7]/20 px-3 py-1.5 rounded-xl flex items-center gap-2 font-mono text-xs font-bold text-[#16C7A3]">
            <span>Incoming Requests &rarr;</span>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            fitView={false}
            minZoom={0.4}
            maxZoom={1.8}
            defaultViewport={{ x: 60, y: 40, zoom: 0.8 }}
            panOnDrag={true}
            panOnScroll={true}
            zoomOnScroll={true}
            style={{ width: '100%', height: '100%' }}
          >
            <Controls className="!bg-[#0E1B20] !border-[#64BEC7]/20 !shadow-xl !fill-[#F4F7F7] [&>button]:!bg-[#0E1B20] [&>button]:!border-[#64BEC7]/15 [&>button]:!text-[#9FB0B4]" />
            <MiniMap
              nodeStrokeWidth={2}
              zoomable
              pannable
              className="!bg-[#071113] !border !border-[#64BEC7]/20 !rounded-xl overflow-hidden"
              nodeColor={(n) => (n.data as any)?.color || '#16C7A3'}
              maskColor="rgba(6, 19, 24, 0.8)"
            />
            <Background gap={22} size={1} color="rgba(70,160,175,0.07)" />
          </ReactFlow>
        </main>

        {/* Right Column: Detailed Inspector (340px) */}
        <aside className="w-[340px] shrink-0 border-l border-[#64BEC7]/15 bg-[#0B171B] flex flex-col h-full overflow-hidden z-20">
          <StationInspector
            station={selectedStation}
            flowGroup={selectedFlowGroup}
            feature={selectedFeature}
            featureClusters={featureClusters}
            interchanges={interchanges}
            executionTraces={executionTraces}
            onClose={() => {
              setSelectedStation(null);
              setSelectedFlowGroup(null);
              setSelectedFeature(null);
            }}
            onSwitchTab={onSwitchTab}
            onSetImpactFile={onSetImpactFile}
            onSelectTraceRouteId={onSelectTraceRouteId}
            onCenterFeature={handleCenterFeature}
            onSelectStation={(st) => setSelectedStation(st)}
            isEmbedded={true}
          />
        </aside>
      </div>

      {/* ── 3. BOTTOM SUMMARY PANEL (130-150px) ── */}
      <footer className="h-[140px] border-t border-[#64BEC7]/15 bg-[#071113] px-6 py-3.5 grid grid-cols-12 gap-6 shrink-0 z-30">
        {/* Map Overview Thumbnail (Cols 1-3) */}
        <div className="col-span-3 bg-[#0B171B] border border-[#64BEC7]/15 rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#9FB0B4] uppercase">
            <span>Map Overview</span>
            <span className="text-[#16C7A3]">Active</span>
          </div>
          {/* Mini SVG Diagram */}
          <div className="h-14 flex items-center justify-center relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 200 60">
              <path d="M 10 15 H 190" stroke="#F43F8C" strokeWidth="3" fill="none" />
              <path d="M 10 30 H 190" stroke="#2F80ED" strokeWidth="3" fill="none" />
              <path d="M 10 45 H 190" stroke="#A855F7" strokeWidth="3" fill="none" />
              <circle cx="60" cy="15" r="4" fill="#F4F7F7" />
              <circle cx="120" cy="30" r="4" fill="#F4F7F7" />
              <circle cx="160" cy="45" r="4" fill="#F4F7F7" />
            </svg>
          </div>
        </div>

        {/* Repository Statistics (Cols 4-8) */}
        <div className="col-span-5 bg-[#0B171B] border border-[#64BEC7]/15 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-mono font-bold text-[#9FB0B4] uppercase block">
            Repository Statistics
          </span>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#0E1B20] p-2 rounded-xl border border-[#64BEC7]/10">
              <span className="text-lg font-bold font-mono text-[#F4F7F7] block">6</span>
              <span className="text-[10px] text-[#718287] font-mono">Feature Lines</span>
            </div>
            <div className="bg-[#0E1B20] p-2 rounded-xl border border-[#64BEC7]/10">
              <span className="text-lg font-bold font-mono text-[#F4F7F7] block">22</span>
              <span className="text-[10px] text-[#718287] font-mono">Flow Groups</span>
            </div>
            <div className="bg-[#0E1B20] p-2 rounded-xl border border-[#64BEC7]/10">
              <span className="text-lg font-bold font-mono text-[#F4F7F7] block">80</span>
              <span className="text-[10px] text-[#718287] font-mono">Stations</span>
            </div>
            <div className="bg-[#0E1B20] p-2 rounded-xl border border-[#64BEC7]/10">
              <span className="text-lg font-bold font-mono text-[#F4F7F7] block">48</span>
              <span className="text-[10px] text-[#718287] font-mono">Dependencies</span>
            </div>
          </div>
        </div>

        {/* Quick Actions (Cols 9-12) */}
        <div className="col-span-4 bg-[#0B171B] border border-[#64BEC7]/15 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-mono font-bold text-[#9FB0B4] uppercase block">
            Quick Actions
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                if (nodes.length > 2) {
                  setFocusedNodeIds([nodes[0].id, nodes[2].id]);
                }
              }}
              className="p-2 rounded-xl bg-[#0E1B20] hover:bg-[#14262E] border border-[#64BEC7]/20 font-mono text-[11px] text-[#F4F7F7] font-bold text-center transition flex flex-col items-center justify-center gap-1"
            >
              <Compass size={14} className="text-[#16C7A3]" />
              <span>Shortest Path</span>
            </button>

            <button
              onClick={() => {
                if (executionTraces.length > 0 && onSelectTraceRouteId && onSwitchTab) {
                  onSelectTraceRouteId(executionTraces[0].route);
                  onSwitchTab('trace');
                }
              }}
              className="p-2 rounded-xl bg-[#0E1B20] hover:bg-[#14262E] border border-[#64BEC7]/20 font-mono text-[11px] text-[#F4F7F7] font-bold text-center transition flex flex-col items-center justify-center gap-1"
            >
              <GitBranch size={14} className="text-[#2F80ED]" />
              <span>Trace Flow</span>
            </button>

            <button
              onClick={() => setViewMode((prev) => (prev === 'overview' ? 'detailed' : 'overview'))}
              className="p-2 rounded-xl bg-[#0E1B20] hover:bg-[#14262E] border border-[#64BEC7]/20 font-mono text-[11px] text-[#F4F7F7] font-bold text-center transition flex flex-col items-center justify-center gap-1"
            >
              <Eye size={14} className="text-[#A855F7]" />
              <span>{viewMode === 'overview' ? 'Show All' : 'Overview'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function MetroMap(props: MetroMapProps) {
  return (
    <ReactFlowProvider>
      <MetroMapInternal {...props} />
    </ReactFlowProvider>
  );
}
