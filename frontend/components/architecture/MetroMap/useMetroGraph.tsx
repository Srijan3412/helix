import { useMemo } from 'react';
import { Node as ReactFlowNode, Edge as ReactFlowEdge, MarkerType } from '@xyflow/react';
import { FeatureFlow } from '@shared/types';

interface Station {
  id: string;
  label: string;
  type: string;
  key: string;
  raw: string;
}

interface UseMetroGraphProps {
  filteredFeatures: FeatureFlow[];
  features: FeatureFlow[];
  featureLines: Record<string, Station[]>;
  positions: Record<string, Record<string, { x: number; y: number }>>;
  selectedFeatures: string[];
  hoveredFeature: string | null;
  selectedStationId: string | null;
  healthGlowActive: boolean;
  journeyActive: boolean;
  journeyNodeId: string | null;
  journeyFeatureId: string | null;
  getStationTypeLabel: (station: Station) => string;
  getStationDisplayName: (station: Station) => string;
  getStationNumber: (feature: FeatureFlow, index: number) => string;
  getComplexityScore: (filePath: string) => number;
  onStationClick: (stationId: string, stationRaw: string, feature: FeatureFlow) => void;
  expandedStation: string | null;
  setExpandedStation: (id: string | null) => void;
  result: any;
}

interface MetroGraphResult {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

const HIGH_COMPLEXITY_THRESHOLD = 15;

export function useMetroGraph(props: UseMetroGraphProps): MetroGraphResult {
  return useMemo(() => {
    const {
      filteredFeatures,
      features,
      featureLines,
      positions,
      selectedFeatures,
      hoveredFeature,
      selectedStationId,
      healthGlowActive,
      journeyActive,
      journeyNodeId,
      journeyFeatureId,
      getStationTypeLabel,
      getStationDisplayName,
      getStationNumber,
      getComplexityScore,
      onStationClick,
      expandedStation,
      setExpandedStation,
    } = props;

    if (filteredFeatures.length === 0) return { nodes: [], edges: [] };

    const flowNodes: ReactFlowNode[] = [];
    const flowEdges: ReactFlowEdge[] = [];
    const visibleFeatureIds = new Set(filteredFeatures.map(f => f.id));

    const hasHighlight = hoveredFeature !== null || selectedFeatures.length > 0;
    const activeFeatureId = hoveredFeature || (selectedFeatures.length === 1 ? selectedFeatures[0] : null);

    // ── Build Station Nodes ──
    filteredFeatures.forEach((feature) => {
      const allStations = featureLines[feature.id] || [];
      const isActiveLine = selectedFeatures.length > 0 
        ? selectedFeatures.includes(feature.id) 
        : (activeFeatureId ? activeFeatureId === feature.id : true);

      allStations.forEach((station) => {
        const pos = positions[feature.id]?.[station.id];
        if (!pos || isNaN(pos.x) || isNaN(pos.y)) return;

        const isSelectedNode = selectedStationId === station.id;
        const isJourneyActiveNode = journeyActive && journeyNodeId === station.id;
        const complexity = station.type === "route" || station.type === "database" 
          ? 0 
          : getComplexityScore(station.raw);
        const hasHighComplexity = complexity > HIGH_COMPLEXITY_THRESHOLD;

        const isNodeActive = hasHighlight 
          ? (isActiveLine || selectedFeatures.includes(feature.id))
          : true;

        flowNodes.push({
          id: station.id,
          type: "station",
          data: {
            stationNumber: getStationNumber(feature, allStations.indexOf(station)),
            typeLabel: getStationTypeLabel(station),
            displayName: getStationDisplayName(station),
            color: feature.color,
            isActive: isNodeActive,
            hasHighComplexity,
            healthGlowActive,
            complexity,
            isSelected: isSelectedNode || isJourneyActiveNode,
            rawType: station.type,
            health: feature.health || 0,
            nextStationName: allStations[allStations.indexOf(station) + 1]
              ? getStationDisplayName(allStations[allStations.indexOf(station) + 1])
              : undefined,
            lineName: feature.name,
            onClick: () => {
              onStationClick(station.id, station.raw || station.label, feature);
            },
          },
          position: pos,
          style: {
            background: "transparent",
            border: "none",
            padding: 0,
            width: 140,
            height: 180,
          }
        });
      });
    });

    // ── Expanded Station Details ──
    if (expandedStation) {
      const expandedNode = flowNodes.find(n => n.id === expandedStation);
      if (expandedNode) {
        const parts = expandedStation.split(":");
        const stationRaw = parts.slice(3).join(":");
        const complexity = getComplexityScore(stationRaw) || 0;

        flowNodes.push({
          id: `expanded-${expandedStation}`,
          type: "default",
          style: {
            background: "transparent",
            border: "none",
            padding: 0,
            width: 280,
            zIndex: 999,
            pointerEvents: "auto",
          },
          data: {
            label: (
              <div className="p-4 bg-zinc-900/95 border border-border/60 rounded-xl shadow-2xl w-[280px] z-50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-white truncate max-w-[180px] block">
                      📄 {stationRaw.split(/[\\/]/).pop() || stationRaw}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                      <span>📊 LOC: {complexity || 'N/A'}</span>
                      <span>🔗 Deps: {stationRaw ? stationRaw.split(/[\\/]/).pop() : 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedStation(null);
                    }}
                    className="text-zinc-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 text-[9px] text-zinc-500 truncate">
                  🔗 Imports: {stationRaw ? stationRaw.split(/[\\/]/).pop() : 'N/A'}
                </div>
                <div className="mt-1.5 flex gap-2">
                  <button className="text-[8px] text-primary hover:text-primary/80">📂 View Impact</button>
                  <button className="text-[8px] text-primary hover:text-primary/80">🔍 View Trace</button>
                </div>
              </div>
            )
          },
          position: {
            x: expandedNode.position.x - 90,
            y: expandedNode.position.y + 110,
          }
        });
      }
    }

    // ── Build Horizontal Tube Lines ──
    filteredFeatures.forEach((feature) => {
      const allStations = featureLines[feature.id] || [];
      const isActiveLine = selectedFeatures.length > 0 
        ? selectedFeatures.includes(feature.id) 
        : (activeFeatureId ? activeFeatureId === feature.id : true);

      for (let i = 0; i < allStations.length - 1; i++) {
        const sNode = allStations[i];
        const tNode = allStations[i + 1];
        const isActiveEdge = isActiveLine || (journeyActive && journeyFeatureId === feature.id);

        flowEdges.push({
          id: `edge:${feature.id}:${sNode.id}:${tNode.id}`,
          source: sNode.id,
          target: tNode.id,
          type: 'smoothstep',
          sourceHandle: 'right',
          targetHandle: 'left',
          animated: isActiveEdge,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: feature.color,
            width: 12,
            height: 12,
          },
          ...(isActiveEdge && {
            label: '🚇',
            labelStyle: {
              fill: feature.color,
              fontSize: 12,
              fontWeight: 'bold',
            },
            labelBgStyle: { fill: 'transparent' },
            labelShowBg: false,
          }),
          style: {
            stroke: feature.color,
            strokeWidth: isActiveEdge ? 4 : 2,
            opacity: isActiveEdge ? 1 : 0.5,
          }
        });
      }
    });

    // ── Build Transfer Edges (strictly between currently visible features) ──
    const keyToInstances: Record<string, { featureId: string; stationId: string }[]> = {};
    filteredFeatures.forEach((feature) => {
      const stations = featureLines[feature.id] || [];
      stations.forEach((station) => {
        if (!keyToInstances[station.key]) {
          keyToInstances[station.key] = [];
        }
        keyToInstances[station.key].push({
          featureId: feature.id,
          stationId: station.id
        });
      });
    });

    Object.entries(keyToInstances).forEach(([_, instances]) => {
      if (instances.length > 1) {
        const visibleInstances = instances.filter(inst => 
          visibleFeatureIds.has(inst.featureId)
        );
        
        if (visibleInstances.length < 2) return;

        const sortedInst = [...visibleInstances].sort((a, b) => {
          const fIdxA = filteredFeatures.findIndex((f) => f.id === a.featureId);
          const fIdxB = filteredFeatures.findIndex((f) => f.id === b.featureId);
          return fIdxA - fIdxB;
        });

        for (let i = 0; i < sortedInst.length - 1; i++) {
          const src = sortedInst[i];
          const dest = sortedInst[i + 1];

          flowEdges.push({
            id: `transfer:${src.stationId}:${dest.stationId}`,
            source: src.stationId,
            target: dest.stationId,
            type: 'straight',
            sourceHandle: 'bottom',
            targetHandle: 'top',
            animated: false,
            style: {
              stroke: "#71717a",
              strokeWidth: 4,
              strokeDasharray: "4 4",
              opacity: 0.6,
            }
          });
        }
      }
    });

    // ── Strictly Validate and Clean Edges to Prevent Stray Crosshairs ──
    const validNodeIds = new Set(flowNodes.map(n => n.id));
    const filteredEdges = flowEdges.filter(e => 
      validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    return { nodes: flowNodes, edges: filteredEdges };
  }, [
    props.filteredFeatures,
    props.features,
    props.featureLines,
    props.positions,
    props.selectedFeatures,
    props.hoveredFeature,
    props.selectedStationId,
    props.healthGlowActive,
    props.journeyActive,
    props.journeyNodeId,
    props.journeyFeatureId,
    props.expandedStation,
    props.getStationTypeLabel,
    props.getStationDisplayName,
    props.getStationNumber,
    props.getComplexityScore,
    props.onStationClick,
    props.setExpandedStation,
    props.result
  ]);
}
