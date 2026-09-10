// frontend/components/architecture/MetroMap/useMetroGraph.tsx

import { useMemo } from 'react';
import { Node as ReactFlowNode, Edge as ReactFlowEdge, MarkerType } from '@xyflow/react';
import { FeatureFlow, SubwayStationData, MetroGraphProps } from './types';
import { LayerType } from './layerDetector';
import { getFeaturePrefix } from './useMetroLayout';

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
  selectedStationType,
  focusedNodeIds = [],
  journeyActive = false,
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

    const activeFeatureId = selectedFeatures[0];
    const hasHighlight = Boolean(activeFeatureId || hoveredFeature);
    const hasFocus = focusedNodeIds.length > 0;

    // ── 1. Central Core Hub Node ──
    const hubPos = positions['core-hub-center']?.['core-hub-node'] || { x: 550, y: 250 };
    const connectedLinesCount = activeFeatures.length;

    nodes.push({
      id: 'core-hub-node',
      type: 'subwayStation',
      position: hubPos,
      data: {
        id: 'core-hub-node',
        name: 'Core Hub',
        label: 'Core Hub',
        displayName: 'Core Hub',
        rawPath: 'shared-infrastructure',
        type: 'database',
        layer: 'infrastructure',
        color: '#38BDF8',
        isHub: true,
        hubTitle: 'Core Hub',
        connectedCount: connectedLinesCount,
        features: activeFeatures.map((f) => f.name),
        isInterchange: true,
        complexity: 0,
        health: 'healthy'
      } as any,
      style: { background: 'transparent', border: 'none', padding: 0 },
      zIndex: 15
    });

    // ── 2. Track Header Nodes & Feature Stations ──
    activeFeatures.forEach((feature, fIdx) => {
      const allFeatureStations = featureLines[feature.id] || [];
      const isFeatureSelected = selectedFeatures.length === 0 || selectedFeatures.includes(feature.id);
      const isFeatureHovered = !hoveredFeature || hoveredFeature === feature.id;
      const featurePrefix = getFeaturePrefix(feature.name, fIdx);

      // Find Header Y Position
      const firstStationId = allFeatureStations[0]?.id;
      const firstPos = firstStationId ? (positions[feature.id]?.[firstStationId] || positions[firstStationId]) : null;
      const headerX = firstPos ? Math.max(20, firstPos.x - 10) : 80;
      const headerY = firstPos ? firstPos.y - 38 : (50 + fIdx * 120);

      // Native Track Header Node
      nodes.push({
        id: `track-header-${feature.id}`,
        type: 'trackHeader',
        position: { x: headerX, y: headerY },
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
        zIndex: 10,
        style: { background: 'transparent', border: 'none', padding: 0 }
      });

      // Stations along this feature line
      allFeatureStations.forEach((station, stationIdx) => {
        const pos = positions[feature.id]?.[station.id] || positions[station.id];
        if (!pos) return;

        const interchangeMatch = interchanges.find((i) => i.file === (station.raw || station.name || station.label));
        const isInterchange = Boolean(station.isInterchange || (interchangeMatch && interchangeMatch.features.length > 1));
        const stationFeatures = interchangeMatch ? interchangeMatch.features : [feature.name];

        const isTypeMatching = selectedStationType
          ? selectedStationType === 'interchange'
            ? isInterchange
            : station.type === selectedStationType
          : true;

        const isNodeFocused = hasFocus
          ? focusedNodeIds.includes(station.id)
          : (isFeatureSelected && isFeatureHovered && isTypeMatching);
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

        const stationNumberStr = `${featurePrefix}${stationIdx + 1}`;

        const nodeData: SubwayStationData = {
          id: station.id,
          name: station.name || station.label,
          label: station.label,
          displayName: station.displayName || station.label,
          rawPath: station.rawPath || station.raw || station.name || '',
          type: station.type,
          layer: station.layer || 'api',
          stationNumber: stationNumberStr,
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
          style: { background: 'transparent', border: 'none', padding: 0 }
        });
      });
    });

    // ── 3. Build Solid Feature Journey Edges & Core Connections ──
    activeFeatures.forEach((feature) => {
      const stations = featureLines[feature.id] || [];
      const isActiveLine = selectedFeatures.length > 0
        ? selectedFeatures.includes(feature.id)
        : (activeFeatureId ? activeFeatureId === feature.id : true);

      // Connect stations along the line horizontally
      for (let i = 0; i < stations.length - 1; i++) {
        const sNode = stations[i];
        const tNode = stations[i + 1];
        const isEdgeDimmed = hasHighlight && !isActiveLine;

        flowEdges.push({
          id: `edge:${feature.id}:${sNode.id}:${tNode.id}`,
          source: sNode.id,
          target: tNode.id,
          type: 'smoothstep',
          sourceHandle: 'right',
          targetHandle: 'left',
          animated: isActiveLine && journeyActive,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isEdgeDimmed ? `${feature.color}30` : feature.color,
            width: 6,
            height: 6
          },
          style: {
            stroke: isEdgeDimmed ? `${feature.color}30` : feature.color,
            strokeWidth: isActiveLine ? 3.5 : 2,
            opacity: isEdgeDimmed ? 0.25 : 0.9,
            transition: 'stroke-width 0.3s, opacity 0.3s'
          }
        });
      }

      // Connect last station of feature to Core Hub
      if (stations.length > 0) {
        const lastStation = stations[stations.length - 1];
        flowEdges.push({
          id: `hub-edge:${feature.id}:${lastStation.id}`,
          source: lastStation.id,
          target: 'core-hub-node',
          type: 'smoothstep',
          sourceHandle: 'right',
          targetHandle: 'left',
          animated: false,
          style: {
            stroke: feature.color,
            strokeWidth: 2,
            strokeDasharray: '5 4',
            opacity: isActiveLine ? 0.65 : 0.2
          }
        });
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
            strokeWidth: 2.5,
            strokeDasharray: '4 4',
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
    hoveredFeature,
    selectedStationId,
    selectedStation,
    focusedNodeIds,
    journeyActive,
    animatedRoute,
    animationStep,
    executionTraces,
    interchanges,
    layerGroups
  ]);
}

