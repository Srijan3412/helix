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
  GitBranch,
  Search,
  X,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';

import { SubwayStationNode } from './SubwayStationNode';
import { TrackHeaderNode } from './TrackHeaderNode';
import { StationInspector } from './StationInspector';
import { FeatureLegend } from './FeatureLegend';
import { useMetroData, inferStationType } from './useMetroData';
import { useMetroLayout } from './useMetroLayout';
import { useMetroGraph } from './useMetroGraph';
import { SubwayStationData, FeatureFlow, MetroMapProps, FlowGroupData } from './types';
import { ALL_LAYERS } from './layerDetector';

// Custom Node: Flow Group Card (Overview Mode, compact 145px x 88px)
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
      className={`p-2.5 rounded-xl bg-[#0E1B20] border transition-all duration-150 cursor-pointer shadow-md select-none ${
        isSelected
          ? 'border-[#16C7A3] ring-2 ring-[#16C7A3]/40 shadow-lg scale-105'
          : 'border-[rgba(80,180,200,0.18)] hover:border-[#16C7A3]/50 hover:bg-[#122229]'
      }`}
      style={{
        borderLeft: `4px solid ${color}`,
        width: 148,
        minHeight: 84
      }}
    >
      <div className="flex items-center gap-1.5 mb-1 min-w-0">
        <span className="text-xs shrink-0">{flowGroup?.icon || '🔐'}</span>
        <h4 className="text-[11px] font-bold text-[#F4F7F7] font-mono truncate">
          {flowGroup?.name}
        </h4>
      </div>

      <div className="text-[9.5px] font-mono text-[#9FB0B4] flex items-center justify-between mb-1.5">
        <span>{flowGroup?.stationsCount ?? flowGroup?.stations?.length ?? 1} stations</span>
        <span>{flowGroup?.endpointsCount ?? flowGroup?.endpoints?.length ?? 0} eps</span>
      </div>

      <div className="w-full bg-[#061318] h-1.5 rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full"
          style={{
            width: `${flowGroup?.health ?? 95}%`,
            backgroundColor: (flowGroup?.health ?? 95) >= 90 ? '#16C7A3' : '#F5A623'
          }}
        />
      </div>

      <div className="text-[9px] font-mono text-[#16C7A3] flex items-center justify-between">
        <span>{flowGroup?.health ?? 95}% Health</span>
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
      className="w-28 h-28 rounded-full bg-[#0E1B20] border-2 border-[#16C7A3] shadow-[0_0_30px_rgba(22,199,163,0.25)] flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:scale-105 transition-all select-none"
    >
      <div className="w-8 h-8 rounded-xl bg-[#16C7A3]/20 flex items-center justify-center mb-1 text-[#16C7A3] border border-[#16C7A3]/40">
        <Layers size={18} />
      </div>
      <span className="text-[10.5px] font-extrabold text-[#F4F7F7] font-mono tracking-wider">CORE HUB</span>
      <span className="text-[8.5px] text-[#9FB0B4] font-mono leading-tight">Infrastructure</span>
    </div>
  );
}

// Custom Node: Shared Infrastructure Node
function InfraNode({ data }: { data: any }) {
  const Icon = data.icon || Database;
  return (
    <div className="px-3 py-2 rounded-xl bg-[#0E1B20] border border-[rgba(80,180,200,0.18)] flex items-center gap-2.5 shadow-sm min-w-[145px] select-none hover:border-[#16C7A3] transition">
      <div className="w-6 h-6 rounded-lg bg-[#16C7A3]/15 flex items-center justify-center text-[#16C7A3] shrink-0">
        <Icon size={14} />
      </div>
      <div>
        <span className="text-[11px] font-bold text-[#F4F7F7] font-mono block leading-tight">{data.label}</span>
        <span className="text-[9px] text-[#9FB0B4] font-mono">{data.stationsCount || 4} stations</span>
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
  const { fitView, setCenter, zoomIn, zoomOut } = useReactFlow();

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
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

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
      setIsInspectorOpen(true);
    }
  }, [sortedFeatureClusters]);

  // Overview ReactFlow Graph Layout Construction (Lanes with 170px vertical spacing)
  const overviewGraph = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    let currentY = 50;

    activeFeatureClusters.forEach((feat) => {
      const featColor = feat.color || '#F43F8C';
      const flowGroups = feat.flowGroups || [];

      // Feature Line Header (Sitting to the left of the lane)
      nodes.push({
        id: `feat-header-${feat.id}`,
        type: 'trackHeader',
        position: { x: 40, y: currentY },
        data: {
          name: feat.name,
          color: featColor,
          stationCount: feat.totalStations || feat.files?.length || 12,
          lineNumber: feat.id.slice(0, 3).toUpperCase(),
          health: feat.health || 95,
        }
      });

      // Render Flow Groups horizontally along feature line
      flowGroups.forEach((fg, fgIdx) => {
        const nodeId = `fg-${feat.id}-${fg.id}`;
        const isSelected = selectedFlowGroup?.id === fg.id;

        nodes.push({
          id: nodeId,
          type: 'flowGroup',
          position: { x: 230 + fgIdx * 165, y: currentY - 10 },
          data: {
            flowGroup: fg,
            color: featColor,
            isSelected,
            onSelectGroup: (group: FlowGroupData) => {
              setSelectedFlowGroup(group);
              setSelectedFeature(feat);
              setSelectedStation(null);
              setIsInspectorOpen(true);
            }
          }
        });

        // Edge connecting feature line to flow group
        if (fgIdx === 0) {
          edges.push({
            id: `edge-${feat.id}-header-fg0`,
            source: `feat-header-${feat.id}`,
            target: nodeId,
            style: { stroke: featColor, strokeWidth: 2.5 },
            type: 'smoothstep'
          });
        } else {
          edges.push({
            id: `edge-${feat.id}-fg${fgIdx - 1}-fg${fgIdx}`,
            source: `fg-${feat.id}-${flowGroups[fgIdx - 1].id}`,
            target: nodeId,
            style: { stroke: featColor, strokeWidth: 2.5 },
            type: 'smoothstep'
          });
        }
      });

      currentY += 165;
    });

    // Calculate the rightmost X coordinate among all flow groups so Core Hub & Infra nodes NEVER overlap
    let maxFlowGroupEndX = 230;
    activeFeatureClusters.forEach((feat) => {
      const flowGroups = feat.flowGroups || [];
      if (flowGroups.length > 0) {
        const endX = 230 + (flowGroups.length - 1) * 165 + 155;
        if (endX > maxFlowGroupEndX) {
          maxFlowGroupEndX = endX;
        }
      }
    });

    // Central Core Hub Node positioned cleanly after all flow groups
    const coreHubX = Math.max(940, maxFlowGroupEndX + 110);
    const coreHubY = Math.max(220, currentY / 2);

    nodes.push({
      id: 'core-hub-central',
      type: 'coreHub',
      position: { x: coreHubX, y: coreHubY - 55 },
      data: {
        onSelectHub: () => {
          const coreFeat = sortedFeatureClusters.find((f) => f.name.toLowerCase().includes('core'));
          if (coreFeat) {
            setSelectedFeature(coreFeat);
            setSelectedFlowGroup(null);
            setSelectedStation(null);
            setIsInspectorOpen(true);
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
          style: { stroke: featColor, strokeWidth: 1.5, strokeDasharray: '4,4' },
          type: 'smoothstep'
        });
      }
    });

    // Shared Infrastructure Nodes (Right of Core Hub)
    const infraNodesData = [
      { id: 'infra-postgres', label: 'PostgreSQL', icon: Database, stationsCount: 4, y: coreHubY - 140 },
      { id: 'infra-redis', label: 'Redis Cache', icon: Server, stationsCount: 3, y: coreHubY - 70 },
      { id: 'infra-external', label: 'External APIs', icon: Cloud, stationsCount: 4, y: coreHubY },
      { id: 'infra-jobs', label: 'Background Jobs', icon: Cpu, stationsCount: 4, y: coreHubY + 70 },
      { id: 'infra-health', label: 'System Health', icon: HeartPulse, stationsCount: 3, y: coreHubY + 140 }
    ];

    infraNodesData.forEach((infra) => {
      nodes.push({
        id: infra.id,
        type: 'infraNode',
        position: { x: coreHubX + 180, y: infra.y },
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
        style: { stroke: 'rgba(80,180,200,0.3)', strokeWidth: 1.5 },
        type: 'smoothstep'
      });
    });

    return {
      nodes,
      edges,
      canvasWidth: coreHubX + 380,
      canvasHeight: Math.max(currentY + 80, coreHubY + 220)
    };
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
        setIsInspectorOpen(true);
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
          data.name?.toLowerCase().includes(q) ||
          data.flowGroup?.name?.toLowerCase().includes(q)
        );
      });

      if (matches.length > 0) {
        setFocusedNodeIds(matches.map((m) => m.id));
        setCenter(matches[0].position.x + 75, matches[0].position.y + 40, {
          zoom: 1.1,
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
    <div className="h-full w-full flex flex-col bg-[#061318] text-[#F4F7F7] select-none overflow-hidden font-sans text-left">
      {/* ── 1. SINGLE COMPACT PAGE HEADER ROW (60-64px) ── */}
      <header className="h-[60px] px-4 border-b border-[rgba(80,180,200,0.14)] bg-[#071219] flex items-center justify-between shrink-0 z-30 gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#F4F7F7] leading-none">
            Metro Map
          </h1>
          <p className="text-[12px] text-[#9FB0B4] mt-1 font-normal leading-none">
            Visualize API flows across your codebase
          </p>
        </div>

        {/* Right Search & Controls Grouped on Single Row */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Unified Search Input */}
          <div className="relative w-[270px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#718287] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search stations, files, or services..."
              className="w-full bg-[#0A171C] border border-[rgba(80,180,200,0.16)] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#F4F7F7] placeholder-[#718287] focus:outline-none focus:border-[#16C7A3] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#718287] hover:text-[#F4F7F7]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="h-4 w-[1px] bg-[rgba(80,180,200,0.2)] mx-0.5" />

          {/* Fit View Button */}
          <button
            onClick={() => fitView({ padding: 0.25, duration: 400 })}
            className="px-3 py-1.5 bg-[#0A171C] hover:bg-[#0E1B20] border border-[rgba(80,180,200,0.18)] rounded-lg text-xs font-semibold text-[#A4B5B8] hover:text-[#F4F7F7] transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={12} className="text-[#16C7A3]" />
            <span>Fit View</span>
          </button>

          {/* Center Button */}
          <button
            onClick={() => {
              if (nodes.length > 0) {
                setCenter(nodes[0].position.x + 80, nodes[0].position.y + 40, { zoom: 1.0, duration: 400 });
              }
            }}
            className="px-3 py-1.5 bg-[#0A171C] hover:bg-[#0E1B20] border border-[rgba(80,180,200,0.18)] rounded-lg text-xs font-semibold text-[#A4B5B8] hover:text-[#F4F7F7] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Focus size={12} className="text-[#2F80ED]" />
            <span>Center</span>
          </button>

          {/* Overview / Detailed Toggle */}
          <div className="bg-[#0A171C] p-0.5 border border-[rgba(80,180,200,0.18)] rounded-lg flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'overview'
                  ? 'bg-[#16C7A3] text-[#061318] font-bold'
                  : 'text-[#A4B5B8] hover:text-[#F4F7F7]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-[#16C7A3] text-[#061318] font-bold'
                  : 'text-[#A4B5B8] hover:text-[#F4F7F7]'
              }`}
            >
              Detailed
            </button>
          </div>

          {/* Export SVG */}
          <button
            onClick={exportToSvg}
            className="px-3 py-1.5 bg-[#0A171C] hover:bg-[#0E1B20] border border-[rgba(80,180,200,0.18)] rounded-lg text-xs font-semibold text-[#A4B5B8] hover:text-[#F4F7F7] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={12} className="text-[#8B5CF6]" />
            <span>Export SVG</span>
          </button>
        </div>
      </header>

      {/* ── 2. MAIN 3-COLUMN WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Left Column: Feature Lines Sidebar (260px) */}
        <aside className="w-[260px] shrink-0 h-full flex flex-col overflow-hidden z-20">
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

        {/* Center Column: Interactive Canvas Map (Dominant 55-65%+, expands when inspector closed) */}
        <main className="flex-1 h-full relative bg-[#061318] overflow-hidden">
          {/* Subtle Grid Container */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(80,180,200,0.15) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />
          </div>

          {/* Incoming Requests Tag */}
          <div className="absolute top-3 left-4 z-10 bg-[#0A171C]/90 backdrop-blur-md border border-[rgba(80,180,200,0.2)] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#16C7A3] shadow-sm">
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
            minZoom={0.3}
            maxZoom={2.0}
            defaultViewport={{ x: 40, y: 30, zoom: 0.85 }}
            panOnDrag={true}
            panOnScroll={true}
            zoomOnScroll={true}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Floating Controls in Bottom-Right */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-[#0A171C]/90 backdrop-blur-md border border-[rgba(80,180,200,0.2)] p-1 rounded-xl shadow-lg">
              <button
                onClick={() => zoomOut({ duration: 300 })}
                className="w-7 h-7 rounded-lg bg-[#0E1B20] hover:bg-[#152B36] text-[#A4B5B8] hover:text-[#F4F7F7] flex items-center justify-center transition cursor-pointer"
                title="Zoom Out"
              >
                <Minus size={13} />
              </button>
              <button
                onClick={() => zoomIn({ duration: 300 })}
                className="w-7 h-7 rounded-lg bg-[#0E1B20] hover:bg-[#152B36] text-[#A4B5B8] hover:text-[#F4F7F7] flex items-center justify-center transition cursor-pointer"
                title="Zoom In"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => fitView({ padding: 0.2, duration: 400 })}
                className="px-2.5 h-7 rounded-lg bg-[#0E1B20] hover:bg-[#152B36] text-[11px] font-mono text-[#A4B5B8] hover:text-[#F4F7F7] flex items-center justify-center transition cursor-pointer"
                title="Fit View"
              >
                Fit
              </button>
            </div>

            <MiniMap
              nodeStrokeWidth={2}
              zoomable
              pannable
              style={{ width: 180, height: 110 }}
              className="!bg-[#071219] !border !border-[rgba(80,180,200,0.2)] !rounded-xl overflow-hidden !bottom-4 !left-4 !w-[180px] !h-[110px] shadow-xl"
              nodeColor={(n) => (n.data as any)?.color || '#16C7A3'}
              maskColor="rgba(6, 19, 24, 0.75)"
            />
            <Background gap={24} size={1} color="rgba(80,180,200,0.06)" />
          </ReactFlow>
        </main>

        {/* Right Column: Detailed Inspector (320px, collapsible) */}
        {isInspectorOpen && (
          <aside className="w-[320px] shrink-0 border-l border-[rgba(80,180,200,0.14)] bg-[#08171C] flex flex-col h-full overflow-hidden z-20">
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
                setIsInspectorOpen(false);
              }}
              onSwitchTab={onSwitchTab}
              onSetImpactFile={onSetImpactFile}
              onSelectTraceRouteId={onSelectTraceRouteId}
              onCenterFeature={handleCenterFeature}
              onSelectStation={(st) => setSelectedStation(st)}
              isEmbedded={true}
            />
          </aside>
        )}
      </div>

      {/* ── 3. BOTTOM SUMMARY PANEL (125-140px Height) ── */}
      <footer className="h-[130px] border-t border-[rgba(80,180,200,0.14)] bg-[#071219] px-4 py-2.5 grid grid-cols-12 gap-3.5 shrink-0 z-30">
        {/* Map Overview Thumbnail (Cols 1-3 ~25%) */}
        <div className="col-span-3 bg-[#0A171C] border border-[rgba(80,180,200,0.14)] rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10.5px] font-mono font-bold text-[#9FB0B4] uppercase">
            <span>Map Overview</span>
            <span className="text-[#16C7A3] text-[9.5px]">Active</span>
          </div>
          {/* Mini SVG Diagram */}
          <div className="h-12 flex items-center justify-center relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 200 50">
              <path d="M 10 12 H 190" stroke="#F43F8C" strokeWidth="2.5" fill="none" />
              <path d="M 10 25 H 190" stroke="#2F80ED" strokeWidth="2.5" fill="none" />
              <path d="M 10 38 H 190" stroke="#8B5CF6" strokeWidth="2.5" fill="none" />
              <circle cx="50" cy="12" r="3.5" fill="#F4F7F7" />
              <circle cx="110" cy="25" r="3.5" fill="#F4F7F7" />
              <circle cx="150" cy="38" r="3.5" fill="#F4F7F7" />
            </svg>
          </div>
        </div>

        {/* Repository Statistics (Cols 4-8 ~40%) */}
        <div className="col-span-5 bg-[#0A171C] border border-[rgba(80,180,200,0.14)] rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[10.5px] font-mono font-bold text-[#9FB0B4] uppercase block">
            Repository Statistics
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-[#071219] p-1.5 rounded-lg border border-[rgba(80,180,200,0.1)]">
              <span className="text-sm font-bold font-mono text-[#F4F7F7] block">
                {featureClusters.length}
              </span>
              <span className="text-[9.5px] text-[#718287] font-mono">Feature Lines</span>
            </div>
            <div className="bg-[#071219] p-1.5 rounded-lg border border-[rgba(80,180,200,0.1)]">
              <span className="text-sm font-bold font-mono text-[#F4F7F7] block">
                {featureClusters.reduce((sum, f) => sum + (f.flowGroups?.length || 0), 0)}
              </span>
              <span className="text-[9.5px] text-[#718287] font-mono">Flow Groups</span>
            </div>
            <div className="bg-[#071219] p-1.5 rounded-lg border border-[rgba(80,180,200,0.1)]">
              <span className="text-sm font-bold font-mono text-[#F4F7F7] block">
                {result?.files?.length || featureClusters.reduce((sum, f) => sum + (f.totalStations || f.files?.length || 0), 0)}
              </span>
              <span className="text-[9.5px] text-[#718287] font-mono">Stations</span>
            </div>
            <div className="bg-[#071219] p-1.5 rounded-lg border border-[rgba(80,180,200,0.1)]">
              <span className="text-sm font-bold font-mono text-[#F4F7F7] block">
                {result?.dependencies?.length || 
                 (result?.metadata?.dependencies ? Object.keys(result.metadata.dependencies).length : 0) ||
                 (result?.files ? result.files.reduce((acc: number, f: any) => acc + (f.imports?.length || 0), 0) : 0) ||
                 interchanges.length * 3}
              </span>
              <span className="text-[9.5px] text-[#718287] font-mono">Dependencies</span>
            </div>
          </div>
        </div>

        {/* Quick Actions (Cols 9-12 ~35%) */}
        <div className="col-span-4 bg-[#0A171C] border border-[rgba(80,180,200,0.14)] rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[10.5px] font-mono font-bold text-[#9FB0B4] uppercase block">
            Quick Actions
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => {
                if (nodes.length > 2) {
                  setFocusedNodeIds([nodes[0].id, nodes[2].id]);
                }
              }}
              className="p-1.5 rounded-lg bg-[#071219] hover:bg-[#0E1B20] border border-[rgba(80,180,200,0.18)] font-mono text-[10px] text-[#F4F7F7] font-bold text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <Compass size={13} className="text-[#16C7A3]" />
              <span>Shortest Path</span>
            </button>

            <button
              onClick={() => {
                if (executionTraces.length > 0 && onSelectTraceRouteId && onSwitchTab) {
                  onSelectTraceRouteId(executionTraces[0].route);
                  onSwitchTab('trace');
                }
              }}
              className="p-1.5 rounded-lg bg-[#071219] hover:bg-[#0E1B20] border border-[rgba(80,180,200,0.18)] font-mono text-[10px] text-[#F4F7F7] font-bold text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <GitBranch size={13} className="text-[#2F80ED]" />
              <span>Trace Flow</span>
            </button>

            <button
              onClick={() => setViewMode((prev) => (prev === 'overview' ? 'detailed' : 'overview'))}
              className="p-1.5 rounded-lg bg-[#071219] hover:bg-[#0E1B20] border border-[rgba(80,180,200,0.18)] font-mono text-[10px] text-[#F4F7F7] font-bold text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <Eye size={13} className="text-[#8B5CF6]" />
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
