// frontend/components/architecture/MetroMap/useMetroGraph.tsx

import { useMemo } from 'react';
import { Node as ReactFlowNode, Edge as ReactFlowEdge, MarkerType } from '@xyflow/react';
import { FeatureFlow, SubwayStationData, MetroGraphProps } from './types';
import { LayerType, getLayerOrder, LAYER_CONFIG } from './layerDetector';
import { inferStationType, inferStationHealth } from './useMetroData';

const HIGH_COMPLEXITY_THRESHOLD = 15;

export function useMetroGraph({
  filteredFeatures,
  features,
  featureLines = {},
  positions,
  selectedFeatures,
  selectedLayers = [],
  activeLayers = [],
  hoveredFeature,
  selectedStationId,
  selectedStation,
  focusedNodeIds = [],
  healthGlowActive = true,
  journeyActive = false,
  journeyNodeId,
  journeyFeatureId,
  animatedRoute,
  animationStep = 0,
  executionTraces = [],
  interchanges = [],
  layerGroups = {}
}: MetroGraphProps) {
  return useMemo(() => {
    const nodes: ReactFlowNode[] = [];
    const flowEdges: ReactFlowEdge[] = [];

    const activeFeatures = filteredFeatures.length > 0 ? filteredFeatures : features;
    if (activeFeatures.length === 0) return { nodes: [], edges: [] };

    const effectiveActiveLayers = selectedLayers.length > 0 
      ? selectedLayers 
      : (activeLayers.length > 0 ? activeLayers : ['api', 'middleware', 'business', 'data', 'infrastructure', 'utility' as LayerType]);

    const hasHighlight = hoveredFeature !== null || selectedFeatures.length > 0;
    const activeFeatureId = hoveredFeature || (selectedFeatures.length === 1 ? selectedFeatures[0] : null);
    const hasFocus = focusedNodeIds.length > 0;

    // ── 1. Build Station Nodes ──
    activeFeatures.forEach((feature) => {
      const isFeatureSelected = selectedFeatures.length === 0 || selectedFeatures.includes(feature.id);
      const isFeatureHovered = hoveredFeature === null || hoveredFeature === feature.id;
      const isActiveLine = selectedFeatures.length > 0 
        ? selectedFeatures.includes(feature.id) 
        : (activeFeatureId ? activeFeatureId === feature.id : true);

      const stations = featureLines[feature.id] || [];
      const groups = layerGroups[feature.id] || {};

      const sortedLayers = Object.keys(groups)
        .filter((key) => groups[key as LayerType] && groups[key as LayerType].length > 0)
        .sort((a, b) => getLayerOrder(a as LayerType) - getLayerOrder(b as LayerType)) as LayerType[];

      // Build from layer groups or flat stations
      const layersToRender = sortedLayers.length > 0 ? sortedLayers : (['api', 'middleware', 'business', 'data', 'infrastructure', 'utility'] as LayerType[]);

      layersToRender.forEach((layer) => {
        const layerStations = groups[layer] || stations.filter((s) => s.layer === layer);
        const isLayerActive = effectiveActiveLayers.includes(layer);

        layerStations.forEach((station, stationIdx) => {
          const pos = positions[feature.id]?.[station.id] || positions[station.id];
          if (!pos) return;

          const interchangeMatch = interchanges.find((i) => i.file === (station.raw || station.name || station.label));
          const isInterchange = Boolean(station.isInterchange || (interchangeMatch && interchangeMatch.features.length > 1));
          const stationFeatures = interchangeMatch ? interchangeMatch.features : [feature.name];

          const isNodeFocused = hasFocus ? focusedNodeIds.includes(station.id) : (isFeatureSelected && isFeatureHovered);
          const isSelected = selectedStation?.id === station.id || selectedStationId === station.id;

          let isJourneyActive = false;
          if (animatedRoute) {
            const currentTrace = executionTraces.find((t) => t.route === animatedRoute);
            if (currentTrace && currentTrace.chain[animationStep]) {
              const step = currentTrace.chain[animationStep];
              const nameToCheck = station.raw || station.name || station.label || '';
              if (nameToCheck.includes(step.name) || (step.file && nameToCheck.includes(step.file))) {
                isJourneyActive = true;
              }
            }
          }

          const nodeData: SubwayStationData = {
            id: station.id,
            name: station.name || station.label,
            label: station.label,
            displayName: station.displayName || station.label,
            rawPath: station.rawPath || station.raw || station.name || '',
            type: station.type,
            layer: layer,
            health: station.health || 'healthy',
            complexity: station.complexity || ((stationIdx * 7) % 25 + 6),
            features: stationFeatures,
            isInterchange,
            color: feature.color,
            focused: isNodeFocused,
            selected: isSelected,
            isJourneyActive,
            lineName: feature.name,
            routes: feature.routes
          };

          nodes.push({
            id: station.id,
            type: 'subwayStation',
            position: pos,
            data: nodeData as any,
            style: {
              background: 'transparent',
              border: 'none',
              padding: 0
            }
          });
        });
      });
    });

    // ── 2. Build Edges with Layer Support ──
    activeFeatures.forEach((feature) => {
      const groups = layerGroups[feature.id] || {};
      const isActiveLine = selectedFeatures.length > 0 
        ? selectedFeatures.includes(feature.id) 
        : (activeFeatureId ? activeFeatureId === feature.id : true);

      const sortedLayers = Object.keys(groups)
        .filter((key) => groups[key as LayerType] && groups[key as LayerType].length > 0)
        .sort((a, b) => getLayerOrder(a as LayerType) - getLayerOrder(b as LayerType)) as LayerType[];

      // ── A. Intra-layer edges (within same layer) ──
      sortedLayers.forEach((layer) => {
        const stations = groups[layer] || [];
        const isLayerActive = effectiveActiveLayers.includes(layer);

        for (let i = 0; i < stations.length - 1; i++) {
          const sNode = stations[i];
          const tNode = stations[i + 1];
          const isActiveEdge = isActiveLine && isLayerActive;
          const isEdgeDimmed = hasHighlight && !isActiveLine;

          // Check if edge is in active animated trace
          let isEdgeInTrace = false;
          if (animatedRoute) {
            const trace = executionTraces.find((t) => t.route === animatedRoute);
            if (trace) {
              const srcName = sNode.raw || sNode.name || sNode.label;
              const dstName = tNode.raw || tNode.name || tNode.label;
              const hasSrc = trace.chain.some((s) => srcName.includes(s.name) || (s.file && srcName.includes(s.file)));
              const hasDst = trace.chain.some((s) => dstName.includes(s.name) || (s.file && dstName.includes(s.file)));
              isEdgeInTrace = hasSrc && hasDst;
            }
          }

          flowEdges.push({
            id: `edge:${feature.id}:${layer}:${sNode.id}:${tNode.id}`,
            source: sNode.id,
            target: tNode.id,
            type: 'smoothstep',
            sourceHandle: 'right',
            targetHandle: 'left',
            animated: isEdgeInTrace || (isActiveEdge && journeyActive),
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isEdgeInTrace ? '#3B82F6' : (isEdgeDimmed ? `${feature.color}30` : feature.color),
              width: 12,
              height: 12
            },
            style: {
              stroke: isEdgeInTrace ? '#3B82F6' : (isEdgeDimmed ? `${feature.color}30` : feature.color),
              strokeWidth: isEdgeInTrace ? 4.5 : (isActiveEdge ? 3.5 : 2.5),
              opacity: isEdgeDimmed ? 0.25 : (isLayerActive ? 0.9 : 0.3),
              transition: 'stroke-width 0.3s, opacity 0.3s'
            }
          });
        }
      });

      // ── B. Inter-layer bridges (from end of one layer to start of next) ──
      for (let i = 0; i < sortedLayers.length - 1; i++) {
        const currentLayer = sortedLayers[i];
        const nextLayer = sortedLayers[i + 1];
        const currentStations = groups[currentLayer] || [];
        const nextStations = groups[nextLayer] || [];

        const isLayerActive = effectiveActiveLayers.includes(currentLayer) && effectiveActiveLayers.includes(nextLayer);

        if (currentStations.length > 0 && nextStations.length > 0) {
          const lastOfCurrent = currentStations[currentStations.length - 1];
          const firstOfNext = nextStations[0];

          flowEdges.push({
            id: `bridge:${feature.id}:${currentLayer}:${nextLayer}`,
            source: lastOfCurrent.id,
            target: firstOfNext.id,
            type: 'step',
            sourceHandle: 'bottom',
            targetHandle: 'top',
            animated: false,
            style: {
              stroke: feature.color,
              strokeWidth: 2,
              strokeDasharray: '5 4',
              opacity: isLayerActive ? 0.6 : 0.2
            }
          });
        }
      }
    });

    // ── 3. Cross-line Interchange Edges (shared files across features) ──
    interchanges.forEach((interchange) => {
      const matchingStations: { featureId: string; stationId: string }[] = [];
      activeFeatures.forEach((f) => {
        const fStations = featureLines[f.id] || [];
        const match = fStations.find((s) => (s.raw || s.name || s.label).includes(interchange.file));
        if (match && nodes.some((n) => n.id === match.id)) {
          matchingStations.push({ featureId: f.id, stationId: match.id });
        }
      });

      for (let i = 0; i < matchingStations.length - 1; i++) {
        const src = matchingStations[i];
        const dst = matchingStations[i + 1];

        flowEdges.push({
          id: `interchange:${src.stationId}:${dst.stationId}`,
          source: src.stationId,
          target: dst.stationId,
          type: 'straight',
          sourceHandle: 'bottom',
          targetHandle: 'top',
          animated: false,
          style: {
            stroke: '#A855F7',
            strokeWidth: 3,
            strokeDasharray: '5 5',
            opacity: 0.75
          }
        });
      }
    });

    // ── Validate and Clean Edges ──
    const validNodeIds = new Set(nodes.map((n) => n.id));
    const validEdges = flowEdges.filter((e) => validNodeIds.has(e.source) && validNodeIds.has(e.target));

    return { nodes, edges: validEdges };
  }, [
    filteredFeatures,
    features,
    featureLines,
    positions,
    selectedFeatures,
    selectedLayers,
    activeLayers,
    hoveredFeature,
    selectedStationId,
    selectedStation,
    focusedNodeIds,
    healthGlowActive,
    journeyActive,
    journeyNodeId,
    journeyFeatureId,
    animatedRoute,
    animationStep,
    executionTraces,
    interchanges,
    layerGroups
  ]);
}
