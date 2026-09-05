// frontend/components/architecture/MetroMap/useMetroLayout.ts

import { useMemo } from 'react';
import { LayerType, getLayerOrder } from './layerDetector';
import { SubwayStationData, FeatureFlow, LayoutResult } from './types';

// ── Strict Transit Lane Spacing Constants (Zero Collisions Guaranteed) ──
const START_X = 80;
const START_Y = 60; // Top padding so first header never touches top bar
const HEADER_HEIGHT = 44;
const HEADER_GAP = 32; // Vertical gap between header and first station
const HEADER_RESERVED = HEADER_HEIGHT + HEADER_GAP; // 76px
const STATION_HEIGHT = 105; // Station card height
const LAYER_SPACING = 150; // Distance between layer rows (105px card + 45px vertical gap)
const STATION_SPACING = 220; // Distance between horizontal stations (150px card + 70px gap)
const TRACK_GAP = 90; // Dedicated clearance between previous track's lowest station and next track's header
const BOTTOM_PADDING = 160;
const RIGHT_PADDING = 260;

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
    const posMap: Record<string, Record<string, { x: number; y: number }>> = {};
    const featureStartY: Record<string, number> = {};
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

    // ── Compute Lane Geometry per Track ──
    let currentY = START_Y;
    let maxStationColumns = 1;

    featuresToLayout.forEach((feature) => {
      posMap[feature.id] = {};
      const groups = layerGroups[feature.id] || {};
      const sortedLayers = featureLayerOrder[feature.id] || [];
      const activeLayersCount = Math.max(1, sortedLayers.length);

      // Track header position (anchored directly above its track)
      featureStartY[feature.id] = currentY;

      // Station nodes starting Y for layer 0 (strictly below header with 32px gap)
      const firstStationY = currentY + HEADER_RESERVED;

      sortedLayers.forEach((layer, layerIdx) => {
        const stations = groups[layer] || [];
        if (stations.length > maxStationColumns) {
          maxStationColumns = stations.length;
        }

        const layerY = firstStationY + layerIdx * LAYER_SPACING;

        stations.forEach((station, stepIdx) => {
          const pt = {
            x: START_X + stepIdx * STATION_SPACING,
            y: layerY
          };
          posMap[feature.id][station.id] = pt;
          station.layerIndex = layerIdx;
        });
      });

      // Advance currentY for the next feature lane
      const trackHeight = (activeLayersCount - 1) * LAYER_SPACING + STATION_HEIGHT;
      currentY = firstStationY + trackHeight + TRACK_GAP;
    });

    // Build keyToInstances for transfer edges
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
      positions: posMap as any,
      featureLines,
      maxStationsCount,
      canvasWidth,
      canvasHeight,
      keyToInstances,
      layerGroups: resultLayerGroups,
      layerOrder: DEFAULT_LAYER_ORDER,
      featureHeaderY: featureStartY
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
