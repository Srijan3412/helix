import React, {  useState, useMemo, useCallback , useRef, useEffect } from 'react';
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
import { RotateCcw, Download, Layers, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

import { SubwayStationNode } from './SubwayStationNode';
import { StationInspector } from './StationInspector';
import { FeatureImportancePanel } from './FeatureImportancePanel';
import { FeatureLegend } from './FeatureLegend';
import { MetroSearchPanel } from './MetroSearchPanel';
import { LayerHeader } from './LayerHeader';
import { TrackHeaders } from './TrackHeaders';
import { useMetroData, inferStationType } from './useMetroData';
import { useMetroLayout } from './useMetroLayout';
import { useMetroGraph } from './useMetroGraph';
import { useJourneyAnimation } from './useJourneyAnimation';
import { SubwayStationData, FeatureFlow, MetroMapProps, StationType } from './types';
import { LayerType, LAYER_CONFIG, getLayerColor, getLayerEmoji, detectLayer, isImportantFile, isUtilityFile } from './layerDetector';

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

  // ── Smart Filtering & Collapse Configuration ──
  const MAX_STATIONS_TO_SHOW = 15;
  const AUTO_COLLAPSE_THRESHOLD = 20;
  const TOP_FEATURES_COUNT = 5;

  // ── State for Selection & Focus ──
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<SubwayStationData | null>(null);
  const [focusedNodeIds, setFocusedNodeIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Smart View Controls ──
  const [showUtilities, setShowUtilities] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [collapseLarge, setCollapseLarge] = useState(true);

  // ── 4b: Layer Filter State ──
  const [activeLayers, setActiveLayers] = useState<LayerType[]>(ALL_LAYERS);

  // ── Horizontal Scrolling State & Ref ──
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [viewportWidthState, setViewportWidthState] = useState(1200);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Scroll Event Handler ──
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    setScrollProgress(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
    setIsAtStart(scrollLeft <= 5);
    setIsAtEnd(scrollLeft >= maxScroll - 5);
    setScrollLeftState(scrollLeft);
    setViewportWidthState(clientWidth);
  }, []);

  // ── Scroll Button Handler ──
  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = Math.min(480, scrollContainerRef.current.clientWidth * 0.75);
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  // ── Mouse Wheel → Horizontal Scroll Conversion ──
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) return;
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // ── Toggle Expand for specific feature ──
  const toggleFeatureExpand = useCallback((featId: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(featId)) {
        next.delete(featId);
      } else {
        next.add(featId);
      }
      return next;
    });
  }, []);

  const toggleCollapseAll = useCallback(() => {
    setCollapseLarge((prev) => {
      const nextVal = !prev;
      if (!nextVal) {
        setExpandedFeatures(new Set(featureClusters.map((f) => f.id)));
      } else {
        setExpandedFeatures(new Set());
      }
      return nextVal;
    });
  }, [featureClusters]);

  // ── Feature Importance Sorting ──
  const sortedFeatureClusters = useMemo(() => {
    return [...featureClusters].sort((a, b) => {
      if ((b.health || 0) !== (a.health || 0)) {
        return (b.health || 0) - (a.health || 0);
      }
      return (a.files?.length || 0) - (b.files?.length || 0);
    });
  }, [featureClusters]);

  const activeFeatureClusters = useMemo(() => {
    if (showAllFeatures || selectedFeatures.length > 0) return sortedFeatureClusters;
    return sortedFeatureClusters.slice(0, TOP_FEATURES_COUNT);
  }, [sortedFeatureClusters, showAllFeatures, selectedFeatures]);

  // ── 4c: Smart Filtered & Collapsed Feature Lines ──
  const featureLines = useMemo(() => {
    const lines: Record<string, SubwayStationData[]> = {};
    const layerGroups: Record<string, Record<LayerType, SubwayStationData[]>> = {};

    activeFeatureClusters.forEach((feature: FeatureFlow, fIdx: number) => {
      const rawStations: SubwayStationData[] = [];
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
        rawStations.push(station);
      });

      // ── Process Files (Filter utilities if showUtilities is false) ──
      (feature.files || []).forEach((fPath: string, fileIdx: number) => {
        const filename = fPath.split(/[\\/]/).pop() || fPath;
        const isUtil = isUtilityFile(filename) && !isImportantFile(filename);
        
        // Hide low-priority utility files by default unless showUtilities is enabled or activeLayers specifically isolates utility
        if (!showUtilities && isUtil && activeLayers.length === ALL_LAYERS.length) {
          return;
        }

        const layer = detectLayer({ type: 'file' }, fPath);
        const station: SubwayStationData = {
          id: `${feature.id}-${fPath}`,
          name: fPath,
          label: filename,
          displayName: filename,
          rawPath: fPath,
          type: inferStationType(filename),
          key: `file:${fPath}`,
          raw: fPath,
          layer,
          health: 'healthy',
          complexity: (fileIdx * 7) % 25 + 6,
          features: [feature.name],
          isInterchange: interchanges.some((i) => i.file === fPath && i.features.length > 1),
          color: feature.color,
          featureId: feature.id,
          lineName: feature.name
        };
        rawStations.push(station);
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
        rawStations.push(station);
      });

      // ── Auto-Collapse Handling for Large Features ──
      const isExpanded = expandedFeatures.has(feature.id);
      const shouldCollapse = collapseLarge && !isExpanded && rawStations.length > AUTO_COLLAPSE_THRESHOLD;

      let finalStations: SubwayStationData[] = [];
      if (shouldCollapse) {
        // Pick most important stations first (routes -> controllers -> services -> repos -> databases)
        const sortedStations = [...rawStations].sort((a, b) => {
          const priorityOrder: Record<StationType, number> = {
            route: 1,
            controller: 2,
            service: 3,
            repository: 4,
            database: 5,
            middleware: 6
          };
          return (priorityOrder[a.type] || 9) - (priorityOrder[b.type] || 9);
        });

        const visibleSubset = sortedStations.slice(0, MAX_STATIONS_TO_SHOW);
        const hiddenCount = rawStations.length - MAX_STATIONS_TO_SHOW;

        const expandNode: SubwayStationData = {
          id: `station:${feature.id}:expand-more`,
          name: `+${hiddenCount} More`,
          label: `+${hiddenCount} More`,
          displayName: `+${hiddenCount} More Stations`,
          rawPath: 'expandable',
          type: 'service',
          key: `expand:${feature.id}`,
          raw: 'expandable',
          layer: 'utility',
          health: 'healthy',
          complexity: hiddenCount,
          features: [feature.name],
          isInterchange: false,
          color: feature.color,
          featureId: feature.id,
          lineName: feature.name,
          isAggregated: true,
          hiddenCount,
          isExpandable: true
        };

        finalStations = [...visibleSubset, expandNode];
      } else {
        finalStations = rawStations;
      }

      // Group into layers
      finalStations.forEach((station) => {
        groups[station.layer]?.push(station);
      });

      lines[feature.id] = finalStations;
      layerGroups[feature.id] = groups;
    });

    return { stations: lines, layerGroups };
  }, [
    activeFeatureClusters,
    interchanges,
    showUtilities,
    activeLayers,
    expandedFeatures,
    collapseLarge
  ]);

  // ── 4d: Filtered Features by Active Layers & Selection ──
  const filteredFeatures = useMemo(() => {
    let result = activeFeatureClusters;

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

    return result.length > 0 ? result : activeFeatureClusters;
  }, [activeFeatureClusters, selectedFeatures, activeLayers]);

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
    activeFeatureClusters,
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

  // useRef synchronization guards to prevent infinite re-render loops (React Error #301)
  const lastSyncedNodeIds = useRef<string>("");
  const lastSyncedEdgeIds = useRef<string>("");

  useEffect(() => {
    const newIds = graphNodes
      .map(
        (n) =>
          `${n.id}:${n.position.x}:${n.position.y}:${(n.data as any)?.focused}:${(n.data as any)?.selected}:${(n.data as any)?.isJourneyActive}`
      )
      .join("|");
    if (newIds !== lastSyncedNodeIds.current) {
      lastSyncedNodeIds.current = newIds;
      setNodes(graphNodes);
    }
  }, [graphNodes, setNodes]);

  useEffect(() => {
    const newIds = graphEdges
      .map((e) => `${e.id}:${e.style?.opacity}:${e.style?.strokeWidth}:${e.animated}`)
      .join("|");
    if (newIds !== lastSyncedEdgeIds.current) {
      lastSyncedEdgeIds.current = newIds;
      setEdges(graphEdges);
    }
  }, [graphEdges, setEdges]);

  // Station Node Click
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const stationData = node.data as unknown as SubwayStationData;
      if (stationData.isAggregated && stationData.featureId) {
        toggleFeatureExpand(stationData.featureId);
        return;
      }
      setSelectedStation(stationData);
      setFocusedNodeIds([node.id]);
    },
    [toggleFeatureExpand]
  );

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
      {/* ── FILTER & TOOLBAR (Single Clean Unified Row) ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-1.5 shrink-0 bg-zinc-900/90 border-b border-zinc-800/80 z-10 overflow-x-auto scrollbar-none">
        {/* Layer Filter Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
            <Layers size={11} className="text-primary" /> Layers:
          </span>

          {Object.entries(LAYER_CONFIG).map(([key, config]) => {
            const isActive = activeLayers.includes(key as LayerType);
            return (
              <button
                key={key}
                onClick={() => toggleLayer(key as LayerType)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition whitespace-nowrap border flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-zinc-800/90 text-white border-zinc-600 shadow-sm'
                    : 'bg-zinc-950/40 text-zinc-500 border-transparent hover:border-zinc-700 opacity-60 hover:opacity-100'
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
            className="px-2 py-1 rounded-lg text-[8.5px] font-bold text-zinc-400 hover:text-white transition flex items-center gap-1 hover:bg-zinc-800/60"
            title="Reset layer filters"
          >
            <RotateCw size={10} />
            <span>Reset</span>
          </button>
        </div>

        {/* Smart View Controls & Canvas Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Feature Range Toggle */}
          <button
            onClick={() => setShowAllFeatures((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition border ${
              showAllFeatures
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:border-zinc-500'
            }`}
            title="Toggle showing Top 5 vs All Tracks"
          >
            {showAllFeatures ? 'Showing All Tracks' : 'Showing Top 5'}
          </button>

          {/* Utilities Toggle */}
          <button
            onClick={() => setShowUtilities((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition border ${
              showUtilities
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:border-zinc-500'
            }`}
            title="Show or hide low-priority utility/helper files"
          >
            {showUtilities ? 'Show Utils' : 'Hide Utils'}
          </button>

          {/* Auto-Collapse Large Features Toggle */}
          <button
            onClick={toggleCollapseAll}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition border ${
              collapseLarge
                ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                : 'bg-primary/20 text-primary border-primary/40'
            }`}
            title="Collapse large features into summary preview"
          >
            {collapseLarge ? 'Collapse Large' : 'Expand All'}
          </button>

          <div className="h-4 w-[1px] bg-zinc-700/60 mx-0.5" />

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

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar Feature Legend */}
        <aside className="w-52 shrink-0 hidden md:flex flex-col border-r border-zinc-800/80 bg-zinc-900/40 z-10 overflow-y-auto">
          <FeatureLegend
            features={featureClusters}
            selectedFeatures={selectedFeatures}
            onToggleFeature={toggleFeature}
            onSelectAll={selectAllFeatures}
            hoveredFeature={hoveredFeature}
            onHoverFeature={setHoveredFeature}
          />
        </aside>

        {/* ReactFlow Interactive Canvas Container (Contained Horizontal Scroll) */}
        <div className="flex-1 h-full relative bg-zinc-950 overflow-hidden">
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

          {/* ── SCROLLABLE CONTAINER ── */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-x-auto overflow-y-hidden select-none scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Inner Canvas with Computed Width & Height */}
            <div 
              className="relative h-full"
              style={{ 
                width: Math.max(canvasWidth, 1400),
                minHeight: Math.max(canvasHeight, 700) 
              }}
            >
              {/* Sticky Track Headers */}
              <TrackHeaders
                filteredFeatures={filteredFeatures}
                canvasWidth={Math.max(canvasWidth, 1400)}
                scrollLeft={scrollLeftState}
                viewportWidth={viewportWidthState}
                selectedLayers={activeLayers}
                onLayerClick={toggleLayer}
              />

              {/* ReactFlow Graph Canvas */}
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onNodeClick={handleNodeClick}
                fitView={false}
                minZoom={0.3}
                maxZoom={1.8}
                defaultViewport={{ x: 50, y: 50, zoom: 0.85 }}
                panOnDrag={false}
                panOnScroll={false}
                zoomOnScroll={false}
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

          {/* ── LEFT FLOATING SCROLL BUTTON ── */}
          {!isAtStart && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-zinc-900/95 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full border border-zinc-700/80 shadow-2xl transition-all duration-200 hover:scale-110 flex items-center justify-center backdrop-blur-md"
              title="Scroll Left"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* ── RIGHT FLOATING SCROLL BUTTON ── */}
          {!isAtEnd && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-zinc-900/95 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full border border-zinc-700/80 shadow-2xl transition-all duration-200 hover:scale-110 flex items-center justify-center backdrop-blur-md"
              title="Scroll Right"
            >
              <ChevronRight size={16} />
            </button>
          )}

          {/* ── SCROLL PROGRESS BAR (Bottom Floating Bar) ── */}
          <div className="absolute bottom-3 left-6 right-6 z-20 pointer-events-auto">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-900/90 rounded-xl border border-zinc-800/80 backdrop-blur-md shadow-lg max-w-md mx-auto">
              <button 
                onClick={() => scroll('left')}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                title="Scroll left"
              >
                <ChevronLeft size={13} />
              </button>
              
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-150 shadow-sm"
                  style={{ width: `${Math.max(4, Math.min(100, scrollProgress))}%` }}
                />
              </div>
              
              <button 
                onClick={() => scroll('right')}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                title="Scroll right"
              >
                <ChevronRight size={13} />
              </button>
              
              <span className="text-[8.5px] text-zinc-400 font-mono min-w-[32px] text-right font-semibold">
                {Math.round(scrollProgress)}%
              </span>
            </div>
          </div>
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
