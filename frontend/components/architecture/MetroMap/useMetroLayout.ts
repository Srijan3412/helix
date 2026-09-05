// frontend/components/architecture/MetroMap/useMetroLayout.ts

import { useMemo } from 'react';
import { LayerType, getLayerOrder } from './layerDetector';
import { SubwayStationData, FeatureFlow, LayoutResult } from './types';

// ── Constants ──
const FEATURE_SPACING = 260;
const LAYER_SPACING = 120;
const STATION_SPACING = 220;
const START_X = 80;
const START_Y = 80;
const PADDING = 200;

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
    const linesCount = filteredFeatures.length || features.length || 1;
    const featuresToLayout = filteredFeatures.length > 0 ? filteredFeatures : features;

    // ── Calculate max layers for canvas height ──
    let maxLayers = 1;
    featuresToLayout.forEach((feature) => {
      const groups = layerGroups[feature.id] || {};
      const activeLayers = Object.values(groups).filter((arr) => arr && arr.length > 0).length;
      if (activeLayers > maxLayers) maxLayers = activeLayers;
    });

    // ── Calculate layer order for each feature ──
    const featureLayerOrder: Record<string, LayerType[]> = {};
    featuresToLayout.forEach((feature) => {
      const groups = layerGroups[feature.id] || {};
      const sortedLayers = Object.keys(groups)
        .filter((key) => groups[key as LayerType] && groups[key as LayerType].length > 0)
        .sort((a, b) => getLayerOrder(a as LayerType) - getLayerOrder(b as LayerType)) as LayerType[];

      featureLayerOrder[feature.id] = sortedLayers.length > 0 ? sortedLayers : DEFAULT_LAYER_ORDER;
    });

    // ── Build position map with layer grouping ──
    featuresToLayout.forEach((feature, fIdx) => {
      posMap[feature.id] = {};
      const groups = layerGroups[feature.id] || {};
      const sortedLayers = featureLayerOrder[feature.id] || [];

      const baseY = START_Y + fIdx * FEATURE_SPACING;

      sortedLayers.forEach((layer, layerIdx) => {
        const stations = groups[layer] || [];

        stations.forEach((station, stepIdx) => {
          const pt = {
            x: START_X + stepIdx * STATION_SPACING,
            y: baseY + layerIdx * LAYER_SPACING
          };
          posMap[feature.id][station.id] = pt;
          posMap[station.id] = pt; // flat lookup support

          // Store layer index on station for later use
          station.layerIndex = layerIdx;
        });
      });
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
          // Find max X position among shared stations
          let maxX = 0;
          instances.forEach((inst) => {
            const pos = posMap[inst.featureId]?.[inst.stationId] || posMap[inst.stationId];
            if (pos && pos.x > maxX) maxX = pos.x;
          });

          // Align all shared stations to maxX
          instances.forEach((inst) => {
            const pos = posMap[inst.featureId]?.[inst.stationId] || posMap[inst.stationId];
            if (pos) {
              const shift = maxX - pos.x;
              if (shift > 0) {
                const lineStations = featureLines[inst.featureId] || [];
                const stationIdx = lineStations.findIndex((s) => s.id === inst.stationId);
                if (stationIdx >= 0) {
                  // Shift all subsequent stations in the same layer
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
    const visibleCount = Math.min(stationsPerPage, maxStationsCount || 10);
    const canvasWidth = Math.max(1300, START_X + visibleCount * STATION_SPACING + PADDING);
    const canvasHeight = Math.max(750, START_Y + linesCount * FEATURE_SPACING + maxLayers * LAYER_SPACING + 100);

    // ── Build layer groups for return ──
    const resultLayerGroups: Record<string, Record<LayerType, SubwayStationData[]>> = {};
    featuresToLayout.forEach((feature) => {
      resultLayerGroups[feature.id] = (layerGroups[feature.id] || {}) as Record<LayerType, SubwayStationData[]>;
    });

    // ── Return layout result ──
    return {
      positions: posMap,
      featureLines,
      maxStationsCount,
      canvasWidth,
      canvasHeight,
      keyToInstances,
      layerGroups: resultLayerGroups,
      layerOrder: DEFAULT_LAYER_ORDER
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
