import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  PanOnScrollMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence } from 'framer-motion';
import { RotateCcw, Download } from 'lucide-react';

import { SubwayStationData, MetroMapProps } from './types';
import { useMetroData } from './useMetroData';
import { useJourneyAnimation } from './useJourneyAnimation';
import { SubwayStationNode } from './SubwayStationNode';
import { MetroSearchPanel } from './MetroSearchPanel';
import { StationInspector } from './StationInspector';
import { FeatureImportancePanel } from './FeatureImportancePanel';
import { FeatureLegend } from './FeatureLegend';
import { useMetroLayout } from './useMetroLayout';
import { useMetroGraph } from './useMetroGraph';

const nodeTypes = {
  subwayStation: SubwayStationNode
};

function MetroMapInternal({
  result,
  onSwitchTab,
  onSetImpactFile,
  onSelectTraceRouteId
}: MetroMapProps) {
  const [selectedStation, setSelectedStation] = useState<SubwayStationData | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedNodeIds, setFocusedNodeIds] = useState<string[]>([]);
  const [healthGlowActive, setHealthGlowActive] = useState(true);

  const { setCenter, fitView } = useReactFlow();

  // Phase 1: Data Adaptation Pipeline
  const { featureClusters, interchanges, executionTraces, featureImportance } = useMetroData(result);

  // Phase 5: Transit Journey & Trace Animation Engine
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

  // Filtered Feature Lines
  const filteredFeatures = useMemo(() => {
    if (selectedFeatures.length === 0) return featureClusters;
    return featureClusters.filter((f) => selectedFeatures.includes(f.id));
  }, [featureClusters, selectedFeatures]);

  // Phase 3: Track Layout (160px vertical spacing)
  const { positions, canvasWidth, canvasHeight } = useMetroLayout(featureClusters, filteredFeatures);

  // Phase 3 & 5: Graph, Edges and Animated Trace Route
  const { nodes: initialNodes, edges: initialEdges } = useMetroGraph({
    features: featureClusters,
    filteredFeatures,
    interchanges,
    selectedFeatures,
    hoveredFeature,
    selectedStation,
    focusedNodeIds,
    animatedRoute,
    animationStep,
    executionTraces,
    healthGlowActive,
    positions
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when graph updates
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Node Click Handler
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const data = node.data as unknown as SubwayStationData;
    setSelectedStation(data);
  }, []);

  // Phase 4: Search, Camera & Focus Handlers
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setFocusedNodeIds([]);
        return;
      }

      const q = query.toLowerCase().trim();
      const matches = nodes.filter((n) => {
        const data = n.data as unknown as SubwayStationData;
        return (
          data.label?.toLowerCase().includes(q) ||
          data.displayName?.toLowerCase().includes(q) ||
          data.name?.toLowerCase().includes(q) ||
          data.type?.toLowerCase().includes(q) ||
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

  const handleSelectSearchResult = useCallback((nodeId: string) => {
    setFocusedNodeIds([nodeId]);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedStation(node.data as unknown as SubwayStationData);
    }
  }, [nodes]);

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
      {/* Top Filter & Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 shrink-0 z-10">
        {/* Feature Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={selectAllFeatures}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap border ${
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
                className="px-3 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap border flex items-center gap-1.5"
                style={{
                  backgroundColor: isSelected ? f.color : '#27272a',
                  color: isSelected ? 'white' : '#a1a1aa',
                  borderColor: isSelected ? f.color : 'transparent'
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? 'white' : f.color }}
                />
                {f.name}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fitView({ padding: 0.15, duration: 400 })}
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 rounded-lg text-[10px] font-semibold text-zinc-300 transition"
          >
            <RotateCcw size={11} />
            <span>Fit View</span>
          </button>

          <button
            onClick={exportToSvg}
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 rounded-lg text-[10px] font-semibold text-zinc-300 transition"
          >
            <Download size={11} />
            <span>Export SVG</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas Area */}
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

        {/* ReactFlow Interactive Canvas */}
        <div className="flex-1 h-full relative bg-zinc-950">
          {/* Phase 4: Search Panel with Zoom & Focus Opacity */}
          <MetroSearchPanel
            nodes={nodes}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onSelectNode={handleSelectSearchResult}
            onClear={handleClearSearch}
          />

          {/* Phase 6: Feature Importance Panel (Bottom Right) */}
          <FeatureImportancePanel items={featureImportance} />

          {/* Phase 5 & 6: Station Inspector Drawer (Right Side) */}
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

          {/* ReactFlow */}
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
