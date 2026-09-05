import { useMemo } from 'react';
import { Node, Edge, MarkerType } from '@xyflow/react';
import {
  FeatureCluster,
  Interchange,
  ExecutionTraceData,
  SubwayStationData,
  StationType,
  StationHealth
} from './types';
import { inferStationType, inferStationHealth } from './useMetroData';

interface UseMetroGraphProps {
  features: FeatureCluster[];
  filteredFeatures: FeatureCluster[];
  interchanges: Interchange[];
  selectedFeatures: string[];
  hoveredFeature: string | null;
  selectedStation: SubwayStationData | null;
  focusedNodeIds: string[];
  animatedRoute: string | null;
  animationStep: number;
  executionTraces: ExecutionTraceData[];
  healthGlowActive: boolean;
  positions: Record<string, { x: number; y: number }>;
}

export function useMetroGraph({
  features,
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
}: UseMetroGraphProps) {
  return useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const activeFeatures = filteredFeatures.length > 0 ? filteredFeatures : features;
    const hasFocus = focusedNodeIds.length > 0;

    // 1. Build Nodes with Phase 4 Focus Opacity (0.15 when dimmed)
    activeFeatures.forEach((feature) => {
      const isFeatureSelected = selectedFeatures.length === 0 || selectedFeatures.includes(feature.id);
      const isFeatureHovered = hoveredFeature === null || hoveredFeature === feature.id;

      (feature.files || []).forEach((file, fileIdx) => {
        const nodeId = `${feature.id}-${file}`;
        const pos = positions[nodeId] || { x: 100 + fileIdx * 230, y: 100 };

        const interchangeMatch = interchanges.find((i) => i.file === file);
        const isInterchange = Boolean(interchangeMatch && interchangeMatch.features.length > 1);
        const stationFeatures = interchangeMatch ? interchangeMatch.features : [feature.name];

        // Phase 4: Focus determination (dim to 0.15 opacity if not focused)
        const isNodeFocused = hasFocus ? focusedNodeIds.includes(nodeId) : (isFeatureSelected && isFeatureHovered);
        const isSelected = selectedStation?.id === nodeId;

        // Check if node is active in journey animation
        let isJourneyActive = false;
        if (animatedRoute) {
          const currentTrace = executionTraces.find((t) => t.route === animatedRoute);
          if (currentTrace && currentTrace.chain[animationStep]) {
            const step = currentTrace.chain[animationStep];
            if (file.includes(step.name) || (step.file && file.includes(step.file))) {
              isJourneyActive = true;
            }
          }
        }

        const displayName = file.split(/[\\/]/).pop() || file;
        const stationType = inferStationType(file);
        const health = inferStationHealth(file, feature.health);
        const complexity = stationType === 'database' ? 2 : (fileIdx * 7) % 25 + 6;

        const nodeData: SubwayStationData = {
          id: nodeId,
          name: file,
          label: displayName,
          displayName,
          rawPath: file,
          type: stationType,
          health,
          complexity,
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
          id: nodeId,
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

    // 2. Phase 3: Connect sequential stations on same line using smoothstep edges (strokeWidth: 3, line color)
    activeFeatures.forEach((feature) => {
      const files = feature.files || [];
      for (let i = 0; i < files.length - 1; i++) {
        const srcId = `${feature.id}-${files[i]}`;
        const dstId = `${feature.id}-${files[i + 1]}`;

        // Check if edge is in active animated trace
        let isEdgeInTrace = false;
        if (animatedRoute) {
          const trace = executionTraces.find((t) => t.route === animatedRoute);
          if (trace) {
            const hasSrc = trace.chain.some(
              (s) => files[i].includes(s.name) || (s.file && files[i].includes(s.file))
            );
            const hasDst = trace.chain.some(
              (s) => files[i + 1].includes(s.name) || (s.file && files[i + 1].includes(s.file))
            );
            isEdgeInTrace = hasSrc && hasDst;
          }
        }

        edges.push({
          id: `track-${srcId}-${dstId}`,
          source: srcId,
          target: dstId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'smoothstep',
          animated: isEdgeInTrace,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isEdgeInTrace ? '#3B82F6' : feature.color,
            width: 12,
            height: 12
          },
          style: {
            stroke: isEdgeInTrace ? '#3B82F6' : feature.color,
            strokeWidth: isEdgeInTrace ? 4.5 : 3, // Phase 3: strokeWidth 3
            opacity: isEdgeInTrace ? 1 : 0.85
          }
        });
      }
    });

    // 3. Phase 3: Generate cross-line dashed purple interchange edges (stroke: '#A855F7', strokeDasharray: '6 6')
    interchanges.forEach((interchange) => {
      const sharedNodeIds = activeFeatures
        .filter((f) => f.files?.includes(interchange.file))
        .map((f) => `${f.id}-${interchange.file}`)
        .filter((id) => nodes.some((n) => n.id === id));

      for (let i = 0; i < sharedNodeIds.length - 1; i++) {
        const srcId = sharedNodeIds[i];
        const dstId = sharedNodeIds[i + 1];

        edges.push({
          id: `interchange-${srcId}-${dstId}`,
          source: srcId,
          target: dstId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'smoothstep',
          style: {
            stroke: '#A855F7',
            strokeWidth: 2,
            strokeDasharray: '6 6',
            opacity: 0.8
          }
        });
      }
    });

    return { nodes, edges };
  }, [
    features,
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
  ]);
}
