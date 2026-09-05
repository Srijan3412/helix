// frontend/components/architecture/MetroMap/useMetroLayout.ts

import { useMemo } from 'react';
import { FeatureFlow } from './types';
import { LayerType, getLayerOrder } from './layerDetector';

const START_X = 80;
const START_Y = 50;
const STATION_SPACING = 240;
const LAYER_ROW_HEIGHT = 140;
const STATION_CARD_HEIGHT = 105;
const HEADER_HEIGHT = 36;
const HEADER_GAP = 28;
const HEADER_RESERVED = HEADER_HEIGHT + HEADER_GAP; // 64px
const INTER_TRACK_GAP = 85; // Clean separation between last station of Track A and header of Track B
const PADDING_RIGHT = 300;
const PADDING_BOTTOM = 200;

export const DEFAULT_LAYER_ORDER: LayerType[] = [
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
  featureLines: Record<string, any[]>,
  layerGroups: Record<string, Record<LayerType, any[]>>,
  maxStationsCount: number,
  stationsPerPage: number = 9999
) {
  return useMemo(() => {
    const posMap: Record<string, Record<string, { x: number; y: number }>> = {};
    const featureHeaderY: Record<string, number> = {};
    const featureStartY: Record<string, number> = {};

    const featuresToLayout = filteredFeatures.length > 0 ? filteredFeatures : features;
    let currentTrackY = START_Y;
    let maxContentX = START_X;

    featuresToLayout.forEach((feature, fIdx) => {
      posMap[feature.id] = {};

      const groups = layerGroups[feature.id] || ({} as Record<LayerType, any[]>);
      const sortedLayers = (Object.keys(groups) as LayerType[])
        .filter((k) => groups[k] && groups[k].length > 0)
        .sort((a, b) => getLayerOrder(a) - getLayerOrder(b));

      // Anchor Header at currentTrackY
      featureHeaderY[feature.id] = currentTrackY;
      featureStartY[feature.id] = currentTrackY;

      // First station starts after header reserved space
      const firstStationY = currentTrackY + HEADER_RESERVED;
      const layerCount = Math.max(1, sortedLayers.length);

      sortedLayers.forEach((layer, layerIdx) => {
        const stations: any[] = groups[layer] || [];
        const layerY = firstStationY + layerIdx * LAYER_ROW_HEIGHT;

        stations.forEach((station: any, colIdx: number) => {
          const x = START_X + colIdx * STATION_SPACING;
          posMap[feature.id][station.id] = { x, y: layerY };

          if (x + 220 > maxContentX) {
            maxContentX = x + 220;
          }
        });
      });

      // Calculate track height based on number of active layers
      const trackHeight = (layerCount - 1) * LAYER_ROW_HEIGHT + STATION_CARD_HEIGHT;
      const trackBottomY = firstStationY + trackHeight;

      // Next track starts with inter-track gap
      currentTrackY = trackBottomY + INTER_TRACK_GAP;
    });

    const canvasWidth = Math.max(maxContentX + PADDING_RIGHT, 1400);
    const canvasHeight = Math.max(currentTrackY + PADDING_BOTTOM, 800);

    return {
      positions: posMap,
      featureLines,
      maxStationsCount,
      canvasWidth,
      canvasHeight,
      keyToInstances: {},
      layerGroups,
      layerOrder: DEFAULT_LAYER_ORDER,
      featureHeaderY,
      featureStartY
    };
  }, [features, filteredFeatures, selectedFeatures, featureLines, layerGroups, maxStationsCount, stationsPerPage]);
}
