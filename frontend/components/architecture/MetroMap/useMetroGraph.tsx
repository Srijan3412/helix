// frontend/components/architecture/MetroMap/useMetroGraph.tsx

import { useMemo } from 'react';
import { Node as ReactFlowNode, Edge as ReactFlowEdge, MarkerType } from '@xyflow/react';
import { FeatureFlow, SubwayStationData, MetroGraphProps } from './types';
import { LayerType, getLayerOrder } from './layerDetector';

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
    if (!activeFeatures || activeFeatures.length === 0) {
      return { nodes: [], edges: [] };
    }

    const effectiveActiveLayers = activeLayers.length > 0 ? activeLayers : selectedLayers;
    const activeFeatureId = selectedFeatures[0];
    const hasHighlight = Boolean(activeFeatureId || hoveredFeature);
    const hasFocus = focusedNodeIds.length > 0;

    // ── 1. Build Track Header Nodes & Station Nodes ──
    activeFeatures.forEach((feature, fIdx) => {
      const allFeatureStations = featureLines[feature.id] || [];
      const groups = layerGroups[feature.id] || {};
      const isFeatureSelected = selectedFeatures.length === 0 || selectedFeatures.includes(feature.id);
      const isFeatureHovered = !hoveredFeature || hoveredFeature === feature.id;

      // Find lowest Y position among stations in this feature to calculate header Y
      let minStationY = Infinity;
      allFeatureStations.forEach((station) => {
        const pos = positions[feature.id]?.[station.id] || positions[station.id];
        if (pos && pos.y < minStationY) {
          minStationY = pos.y;
        }
      });

      const headerY = minStationY !== Infinity ? minStationY - 64 : (50 + fIdx * 250);

      // Add Native ReactFlow Track Header Node
      nodes.push({
        id: `track-header-${feature.id}`,
        type: 'trackHeader',
        position: { x: 80, y: headerY },
        data: {
          id: feature.id,
          name: feature.name,
          color: feature.color,
          stationCount: allFeatureStations.length,
          lineNumber: String(fIdx + 1).padStart(2, '0'),
          health: feature.health
        },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: 5,
        style: {
          background: 'transparent',
          border: 'none',
          padding: 0
        }
      });

      // Add Stations
      const sortedLayers = Object.keys(groups)
        .filter((key) => groups[key as LayerType] && groups[key as LayerType].length > 0)
        .sort((a, b) => getLayerOrder(a as LayerType) - getLayerOrder(b as LayerType)) as LayerType[];

      sortedLayers.forEach((layer) => {
        const layerStations = groups[layer] || [];
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
            healthScore: station.healthScore,
            httpMethod: station.httpMethod,
            isAuthRequired: station.isAuthRequired,
            lineCount: station.lineCount,
            complexity: station.complexity || station.lineCount || 0,
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

      // Intra-layer edges
      sortedLayers.forEach((layer) => {
        const stations = groups[layer] || [];
        const isLayerActive = effectiveActiveLayers.includes(layer);

        for (let i = 0; i < stations.length - 1; i++) {
          const sNode = stations[i];
          const tNode = stations[i + 1];
          const isActiveEdge = isActiveLine && isLayerActive;
          const isEdgeDimmed = hasHighlight && !isActiveLine;

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

      // Inter-layer bridges
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

    // Cross-line Interchange Edges
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
