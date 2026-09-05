// frontend/components/architecture/MetroMap/useMetroLayout.ts

import { useMemo } from 'react';
import { LayerType, getLayerOrder } from './layerDetector';
import { SubwayStationData, FeatureFlow, LayoutResult } from './types';

// ── Precise Transit Layout Spacing Constants ──
const START_X = 80;
const START_Y = 55; // Generous top padding to prevent clipping with top bar
const HEADER_TO_STATIONS_GAP = 70; // Dedicated vertical gap between track title and first station row
const LAYER_SPACING = 155; // 105px station card + 50px vertical gap between layers
const STATION_SPACING = 220; // 150px station card + 70px horizontal track gap
const TRACK_GAP = 95; // Clear separation between previous track's lowest station and next track's title
const BOTTOM_PADDING = 140; // Ensures last track is never cut off by bottom scrollbar/controls
const RIGHT_PADDING = 240;

// ── Default Layer Order ──
const DEFAULT_LAYER_ORDER: LayerType[] = [
  'api',
  'middleware',
  'business',
  'data',
  'infrastructure',
  'utility'
];

export function useMetroLayout(
  features: FeatureFlow[],
  filteredFeatures: FeatureFlow[],
  selectedFeatures: string[],
  featureLines: Record<string, SubwayStationData[]>,
  layerGroups: Record<string, Record<LayerType, SubwayStationData[]>>,
  maxStationsCount: number,
  stationsPerPage: number = 9999
): LayoutResult {
  return useMemo(() => {
    const posMap: any = {};
    const featuresToLayout = filteredFeatures.length > 0 ? filteredFeatures : features;

    // ── Calculate layer order for each feature ──
    const featureLayerOrder: Record<string, LayerType[]> = {};
    featuresToLayout.forEach((feature) => {
      const groups = layerGroups[feature.id] || {};
      const sortedLayers = Object.keys(groups)
        .filter((key) => groups[key as LayerType] && groups[key as LayerType].length > 0)
        .sort((a, b) => getLayerOrder(a as LayerType) - getLayerOrder(b as LayerType)) as LayerType[];

      featureLayerOrder[feature.id] = sortedLayers.length > 0 ? sortedLayers : DEFAULT_LAYER_ORDER;
    });

    // ── Dynamic Lane-Based Vertical Layout (Zero Overlaps) ──
    let currentY = START_Y;
    const featureHeaderY: Record<string, number> = {};
    let maxStationColumns = 1;

    featuresToLayout.forEach((feature) => {
      posMap[feature.id] = {};
      const groups = layerGroups[feature.id] || {};
      const sortedLayers = featureLayerOrder[feature.id] || [];
      const activeLayersCount = Math.max(1, sortedLayers.length);

      // Track header positioned cleanly in its own vertical space
      featureHeaderY[feature.id] = currentY;

      // Station nodes starting Y for layer 0 (strictly below header)
      const stationStartY = currentY + HEADER_TO_STATIONS_GAP;

      sortedLayers.forEach((layer, layerIdx) => {
        const stations = groups[layer] || [];
        if (stations.length > maxStationColumns) {
          maxStationColumns = stations.length;
        }

        stations.forEach((station, stepIdx) => {
          const pt = {
            x: START_X + stepIdx * STATION_SPACING,
            y: stationStartY + layerIdx * LAYER_SPACING
          };
          posMap[feature.id][station.id] = pt;
          posMap[station.id] = pt; // Flat lookup support

          // Store layer index on station
          station.layerIndex = layerIdx;
        });
      });

      // Advance currentY for the next feature lane
      currentY = stationStartY + (activeLayersCount - 1) * LAYER_SPACING + 110 + TRACK_GAP;
    });

    // ── Build keyToInstances for shared stations (for transfer edges) ──
    const keyToInstances: Record<string, { featureId: string; stationId: string }[]> = {};
    featuresToLayout.forEach((feature) => {
      const stations = featureLines[feature.id] || [];
      stations.forEach((station) => {
        const k = station.key || station.rawPath || station.name || station.id;
        if (!keyToInstances[k]) {
          keyToInstances[k] = [];
        }
        keyToInstances[k].push({
          featureId: feature.id,
          stationId: station.id
        });
      });
    });

    // ── Relaxation solver for shared stations ──
    for (let iter = 0; iter < 3; iter++) {
      Object.entries(keyToInstances).forEach(([_, instances]) => {
        if (instances.length > 1) {
          let maxX = 0;
          instances.forEach((inst) => {
            const pos = posMap[inst.featureId]?.[inst.stationId] || posMap[inst.stationId];
            if (pos && pos.x > maxX) maxX = pos.x;
          });

          instances.forEach((inst) => {
            const pos = posMap[inst.featureId]?.[inst.stationId] || posMap[inst.stationId];
            if (pos) {
              const shift = maxX - pos.x;
              if (shift > 0) {
                const lineStations = featureLines[inst.featureId] || [];
                const stationIdx = lineStations.findIndex((s) => s.id === inst.stationId);
                if (stationIdx >= 0) {
                  const currentLayer = lineStations[stationIdx]?.layer;
                  for (let i = stationIdx; i < lineStations.length; i++) {
                    const sId = lineStations[i].id;
                    if (lineStations[i]?.layer === currentLayer) {
                      if (posMap[inst.featureId]?.[sId]) {
                        posMap[inst.featureId][sId].x += shift;
                      }
                      if (posMap[sId]) {
                        posMap[sId].x += shift;
                      }
                    }
                  }
                }
              }
            }
          });
        }
      });
    }

    // ── Calculate canvas dimensions ──
    const effectiveStations = Math.max(maxStationColumns, maxStationsCount || 6);
    const canvasWidth = Math.max(1400, START_X + effectiveStations * STATION_SPACING + RIGHT_PADDING);
    const canvasHeight = Math.max(750, currentY + BOTTOM_PADDING);

    // ── Build layer groups for return ──
    const resultLayerGroups: Record<string, Record<LayerType, SubwayStationData[]>> = {};
    featuresToLayout.forEach((feature) => {
      resultLayerGroups[feature.id] = (layerGroups[feature.id] || {}) as Record<LayerType, SubwayStationData[]>;
    });

    return {
      positions: posMap,
      featureLines,
      maxStationsCount,
      canvasWidth,
      canvasHeight,
      keyToInstances,
      layerGroups: resultLayerGroups,
      layerOrder: DEFAULT_LAYER_ORDER,
      featureHeaderY
    };
  }, [
    features,
    filteredFeatures,
    selectedFeatures,
    featureLines,
    layerGroups,
    maxStationsCount,
    stationsPerPage
  ]);
}
