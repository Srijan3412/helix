import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  PanOnScrollMode,
  NodeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence } from 'framer-motion';
import { RotateCcw, Download, Layers, RotateCw } from 'lucide-react';

import { SubwayStationNode } from './SubwayStationNode';
import { StationInspector } from './StationInspector';
import { FeatureImportancePanel } from './FeatureImportancePanel';
import { FeatureLegend } from './FeatureLegend';
import { MetroSearchPanel } from './MetroSearchPanel';
import { LayerHeader } from './LayerHeader';
import { TrackHeaders } from './TrackHeaders';
import { useMetroData } from './useMetroData';
import { useMetroLayout } from './useMetroLayout';
import { useMetroGraph } from './useMetroGraph';
import { useJourneyAnimation } from './useJourneyAnimation';
import { SubwayStationData, MetroMapProps, FeatureFlow } from './types';
import {
  LayerType,
  LAYER_CONFIG,
  getLayerOrder,
  getLayerColor,
  detectLayer
} from './layerDetector';

const nodeTypes = {
  subwayStation: SubwayStationNode
};

const ALL_LAYERS: LayerType[] = [
  'api',
  'middleware',
  'business',
  'data',
  'infrastructure',
  'utility'
];

function MetroMapInternal({
  result,
  onSwitchTab,
  onSetImpactFile,
  onSelectTraceRouteId
}: MetroMapProps) {
  const { fitView, setCenter } = useReactFlow();

  // Phase 1: Data Hook
  const { featureClusters, interchanges, executionTraces, featureImportance } =
    useMetroData(result);

  // ── State for Selection & Focus ──
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<SubwayStationData | null>(null);
  const [focusedNodeIds, setFocusedNodeIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ── 4b: Layer Filter State ──
  const [activeLayers, setActiveLayers] = useState<LayerType[]>(ALL_LAYERS);

  // ── 4c: Layer-Aware Feature Lines & Layer Groups ──
  const featureLines = useMemo(() => {
    const lines: Record<string, SubwayStationData[]> = {};
    const layerGroups: Record<string, Record<LayerType, SubwayStationData[]>> = {};

    featureClusters.forEach((feature: FeatureFlow) => {
      const allStations: SubwayStationData[] = [];
      const groups: Record<LayerType, SubwayStationData[]> = {
        api: [],
        middleware: [],
        business: [],
        data: [],
        infrastructure: [],
        utility: []
      };

      // ── Process Routes (API Layer) ──
      (feature.routes || []).forEach((r: string) => {
        const spaceIdx = r.indexOf(' ');
        const method = spaceIdx > 0 ? r.substring(0, spaceIdx) : 'GET';
        const path = spaceIdx > 0 ? r.substring(spaceIdx + 1) : r;
        const station: SubwayStationData = {
          id: `station:${feature.id}:route:${method}:${path}`,
          name: r,
          label: r,
          displayName: r,
          rawPath: path,
          type: 'route',
          key: `route:${method}:${path}`,
          raw: r,
          layer: 'api',
          health: 'healthy',
          complexity: 10,
          features: [feature.name],
          isInterchange: false,
          color: feature.color,
          featureId: feature.id,
          lineName: feature.name
        };
        allStations.push(station);
        groups.api.push(station);
      });

      // ── Process Files (Detected Layer) ──
      (feature.files || []).forEach((fPath: string, fIdx: number) => {
        const filename = fPath.split(/[\\/]/).pop() || fPath;
        const layer = detectLayer({ type: 'file' }, fPath);
        const station: SubwayStationData = {
          id: `${feature.id}-${fPath}`,
          name: fPath,
          label: filename,
          displayName: filename,
          rawPath: fPath,
          type: 'service',
          key: `file:${fPath}`,
          raw: fPath,
          layer,
          health: 'healthy',
          complexity: (fIdx * 7) % 25 + 6,
          features: [feature.name],
          isInterchange: interchanges.some((i) => i.file === fPath && i.features.length > 1),
          color: feature.color,
          featureId: feature.id,
          lineName: feature.name
        };
        allStations.push(station);
        groups[layer].push(station);
      });

      // ── Process Database Tables (Data Layer) ──
      (feature.database || feature.databases || []).forEach((ent: string) => {
        const station: SubwayStationData = {
          id: `station:${feature.id}:db:${ent}`,
          name: ent,
          label: ent,
          displayName: ent,
          rawPath: ent,
          type: 'database',
          key: `db:${ent}`,
          raw: ent,
          layer: 'data',
          health: 'healthy',
          complexity: 4,
          features: [feature.name],
          isInterchange: false,
          color: feature.color,
          featureId: feature.id,
          lineName: feature.name
        };
        allStations.push(station);
        groups.data.push(station);
      });

      lines[feature.id] = allStations;
      layerGroups[feature.id] = groups;
    });

    return { stations: lines, layerGroups };
  }, [featureClusters, interchanges]);

  // ── 4d: Filtered Features by Active Layers & Selection ──
  const filteredFeatures = useMemo(() => {
    let result = featureClusters;

    if (selectedFeatures.length > 0) {
      result = result.filter((f: FeatureFlow) => selectedFeatures.includes(f.id));
    }

    if (activeLayers.length > 0 && activeLayers.length < ALL_LAYERS.length) {
      result = result
        .map((feature: FeatureFlow) => {
          const filteredFiles = (feature.files || []).filter((fPath: string) => {
            const layer = detectLayer({ type: 'file' }, fPath);
            return activeLayers.includes(layer);
          });

          const filteredRoutes = activeLayers.includes('api') ? feature.routes || [] : [];
          const filteredDatabase = activeLayers.includes('data')
            ? feature.database || feature.databases || []
            : [];

          return {
            ...feature,
            files: filteredFiles,
            routes: filteredRoutes,
            database: filteredDatabase
          };
        })
        .filter(
          (f: FeatureFlow) =>
            f.files.length > 0 ||
            f.routes.length > 0 ||
            (f.database && f.database.length > 0)
        );
    }

    return result.length > 0 ? result : featureClusters;
  }, [featureClusters, selectedFeatures, activeLayers]);

  // ── 4f: Layout Computation ──
  const maxStationsCount = useMemo(() => {
    let maxCount = 1;
    Object.values(featureLines.stations).forEach((st) => {
      if (st.length > maxCount) maxCount = st.length;
    });
    return maxCount;
  }, [featureLines.stations]);

  const {
    positions,
    canvasWidth,
    canvasHeight,
    keyToInstances,
    layerGroups: computedLayerGroups,
    layerOrder
  } = useMetroLayout(
    featureClusters,
    filteredFeatures,
    selectedFeatures,
    featureLines.stations,
    featureLines.layerGroups,
    maxStationsCount,
    9999
  );

  // Phase 5: Journey Simulation Engine
  const {
    animatedRoute,
    animationStep,
    isPlaying: journeyActive,
    isPaused: journeyPaused,
    startJourney,
    pauseJourney,
    resumeJourney,
    stopJourney
  } = useJourneyAnimation(executionTraces);

  // Graph Generation
  const { nodes: graphNodes, edges: graphEdges } = useMetroGraph({
    features: featureClusters,
    filteredFeatures,
    featureLines: featureLines.stations,
    layerGroups: featureLines.layerGroups,
    interchanges,
    selectedFeatures,
    hoveredFeature,
    selectedStation,
    focusedNodeIds,
    animatedRoute,
    animationStep,
    executionTraces,
    healthGlowActive: true,
    positions,
    activeLayers
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  useMemo(() => {
    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [graphNodes, graphEdges, setNodes, setEdges]);

  // Station Node Click
  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    const stationData = node.data as unknown as SubwayStationData;
    setSelectedStation(stationData);
    setFocusedNodeIds([node.id]);
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
        const data = n.data as unknown as SubwayStationData;
        return (
          data.label?.toLowerCase().includes(q) ||
          data.displayName?.toLowerCase().includes(q) ||
          data.name?.toLowerCase().includes(q) ||
          data.type?.toLowerCase().includes(q) ||
          data.layer?.toLowerCase().includes(q) ||
          data.lineName?.toLowerCase().includes(q) ||
          data.features?.some((f) => f.toLowerCase().includes(q))
        );
      });

      const matchedIds = matches.map((n) => n.id);
      setFocusedNodeIds(matchedIds);

      if (matches.length > 0) {
        setCenter(matches[0].position.x + 85, matches[0].position.y + 45, {
          zoom: 1.4,
          duration: 500
        });
      }
    },
    [nodes, setCenter]
  );

  const handleSelectSearchResult = useCallback(
    (nodeId: string) => {
      setFocusedNodeIds([nodeId]);
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedStation(node.data as unknown as SubwayStationData);
      }
    },
    [nodes]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setFocusedNodeIds([]);
  }, []);

  // Feature Selection Toggle
  const toggleFeature = useCallback((featId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featId) ? prev.filter((id) => id !== featId) : [...prev, featId]
    );
  }, []);

  const selectAllFeatures = useCallback(() => {
    setSelectedFeatures([]);
  }, []);

  // Layer Filter Toggle
  const toggleLayer = useCallback((layer: LayerType) => {
    setActiveLayers((prev) =>
      prev.includes(layer)
        ? prev.length > 1
          ? prev.filter((l) => l !== layer)
          : prev
        : [...prev, layer]
    );
  }, []);

  const resetLayers = useCallback(() => {
    setActiveLayers(ALL_LAYERS);
  }, []);

  // Export SVG
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
    <div className="h-full w-full text-left relative flex flex-col bg-zinc-950 select-none overflow-hidden">
      {/* ── FILTER & TOOLBAR ── */}
      <div className="flex flex-col shrink-0 bg-zinc-900/80 border-b border-zinc-800/80 z-10">
        {/* Row 1: Feature Track Filter & Canvas Actions */}
        <div className="flex items-center justify-between gap-2 px-4 py-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={selectAllFeatures}
              className={`px-2.5 py-1 rounded-lg text-[9.5px] font-bold transition whitespace-nowrap border ${
                selectedFeatures.length === 0
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-zinc-800/60 text-zinc-400 border-transparent hover:border-zinc-600'
              }`}
            >
              All Tracks
            </button>

            {featureClusters.map((f) => {
              const isSelected = selectedFeatures.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFeature(f.id)}
                  className="px-2.5 py-1 rounded-lg text-[9.5px] font-bold transition whitespace-nowrap border flex items-center gap-1.5"
                  style={{
                    backgroundColor: isSelected ? f.color : '#27272a',
                    color: isSelected ? 'white' : '#a1a1aa',
                    borderColor: isSelected ? f.color : 'transparent'
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSelected ? 'white' : f.color }}
                  />
                  {f.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fitView({ padding: 0.15, duration: 400 })}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 rounded-lg text-[9.5px] font-semibold text-zinc-300 transition"
            >
              <RotateCcw size={11} />
              <span>Fit View</span>
            </button>

            <button
              onClick={exportToSvg}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 rounded-lg text-[9.5px] font-semibold text-zinc-300 transition"
            >
              <Download size={11} />
              <span>Export SVG</span>
            </button>
          </div>
        </div>

        {/* ── 4e: LAYER FILTER CONTROLS ── */}
        <div className="flex items-center gap-1 px-4 py-1 border-t border-zinc-800/60 bg-zinc-950/40 overflow-x-auto scrollbar-none">
          <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers size={10} /> Layers:
          </span>

          {Object.entries(LAYER_CONFIG).map(([key, config]) => {
            const isActive = activeLayers.includes(key as LayerType);
            return (
              <button
                key={key}
                onClick={() => toggleLayer(key as LayerType)}
                className={`px-2 py-0.5 rounded text-[8px] font-bold transition border flex items-center gap-1 ${
                  isActive
                    ? 'bg-zinc-800/90 text-white border-zinc-600 shadow-sm'
                    : 'text-zinc-500 border-transparent hover:border-zinc-700 opacity-60 hover:opacity-100'
                }`}
                style={{
                  borderColor: isActive ? config.color : 'transparent'
                }}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </button>
            );
          })}

          <button
            onClick={resetLayers}
            className="px-2 py-0.5 rounded text-[8px] font-bold text-zinc-400 hover:text-white transition ml-auto flex items-center gap-1"
          >
            <RotateCw size={9} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar Feature Legend */}
        <aside className="w-52 shrink-0 hidden md:flex flex-col border-r border-zinc-800/80 bg-zinc-900/40 z-10">
          <FeatureLegend
            features={featureClusters}
            selectedFeatures={selectedFeatures}
            onToggleFeature={toggleFeature}
            onSelectAll={selectAllFeatures}
            hoveredFeature={hoveredFeature}
            onHoverFeature={setHoveredFeature}
          />
        </aside>

        {/* ReactFlow Interactive Canvas Container */}
        <div className="flex-1 h-full relative bg-zinc-950">
          {/* Search Panel */}
          <MetroSearchPanel
            nodes={nodes}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onSelectNode={handleSelectSearchResult}
            onClear={handleClearSearch}
          />

          {/* Feature Importance Panel (Bottom Right) */}
          <FeatureImportancePanel items={featureImportance} />

          {/* Station Inspector Drawer (Right Side) */}
          <AnimatePresence>
            {selectedStation && (
              <StationInspector
                station={selectedStation}
                featureClusters={featureClusters}
                interchanges={interchanges}
                executionTraces={executionTraces}
                onClose={() => setSelectedStation(null)}
                onStartJourney={startJourney}
                onPauseJourney={pauseJourney}
                onResumeJourney={resumeJourney}
                onStopJourney={stopJourney}
                journeyActive={journeyActive}
                journeyPaused={journeyPaused}
                activeJourneyRoute={animatedRoute}
                animationStep={animationStep}
                onSwitchTab={onSwitchTab}
                onSetImpactFile={onSetImpactFile}
                onSelectTraceRouteId={onSelectTraceRouteId}
              />
            )}
          </AnimatePresence>

          {/* ReactFlow Graph Canvas */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            minZoom={0.25}
            maxZoom={1.75}
            defaultViewport={{ x: 50, y: 50, zoom: 0.85 }}
            panOnDrag={[0, 1, 2]}
            panOnScroll={true}
            panOnScrollMode={PanOnScrollMode.Free}
            style={{ width: '100%', height: '100%' }}
          >
            {/* ── 4g: LAYER HEADERS ON CANVAS ── */}
            

            <Controls className="!bg-zinc-900/90 !border-zinc-800 !shadow-xl !fill-zinc-300" />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="!bg-zinc-900/90 !border-zinc-800 !rounded-xl overflow-hidden"
              nodeColor={(n) => (n.data as any)?.color || '#3B82F6'}
              maskColor="rgba(0, 0, 0, 0.75)"
            />
            <Background gap={20} size={1} color="#27272a" />
          </ReactFlow>
        </div>
      </div>
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
