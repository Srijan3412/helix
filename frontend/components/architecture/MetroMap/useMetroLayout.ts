import { useMemo } from 'react';
import { FeatureFlow } from '@shared/types';

interface Station {
  id: string;
  label: string;
  type: string;
  key: string;
  raw: string;
}

interface LayoutResult {
  positions: Record<string, Record<string, { x: number; y: number }>>;
  canvasWidth: number;
  canvasHeight: number;
  keyToInstances: Record<string, { featureId: string; stationId: string }[]>;
}

const STATION_SPACING = 220;
const FEATURE_SPACING = 260;
const START_X = 80;
const START_Y = 80;
const PADDING = 200;

export function useMetroLayout(
  features: FeatureFlow[],
  filteredFeatures: FeatureFlow[],
  selectedFeatures: string[],
  featureLines: Record<string, Station[]>,
  maxStationsCount: number,
  stationsPerPage: number = 9999
): LayoutResult {
  return useMemo(() => {
    const posMap: Record<string, Record<string, { x: number; y: number }>> = {};
    const linesCount = filteredFeatures.length || features.length || 1;

    const featuresToLayout = filteredFeatures.length > 0 ? filteredFeatures : features;

    // 1. Compute Base Positions per visible feature line
    featuresToLayout.forEach((feature, fIdx) => {
      posMap[feature.id] = {};
      const stations = featureLines[feature.id] || [];
      const baseY = START_Y + fIdx * FEATURE_SPACING;

      stations.forEach((station, stepIdx) => {
        posMap[feature.id][station.id] = {
          x: START_X + stepIdx * STATION_SPACING,
          y: baseY
        };
      });
    });

    // 2. Build shared station index for relaxation solver
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

    // 3. Relaxation solver to align shared stations without breaking layout
    for (let iter = 0; iter < 3; iter++) {
      Object.entries(keyToInstances).forEach(([_, instances]) => {
        if (instances.length > 1) {
          let maxX = 0;
          instances.forEach((inst) => {
            const pos = posMap[inst.featureId]?.[inst.stationId];
            if (pos && pos.x > maxX) {
              maxX = pos.x;
            }
          });

          instances.forEach((inst) => {
            const pos = posMap[inst.featureId]?.[inst.stationId];
            if (pos) {
              const shift = maxX - pos.x;
              if (shift > 0) {
                const lineStations = featureLines[inst.featureId] || [];
                const stationIdx = lineStations.findIndex((s) => s.id === inst.stationId);
                if (stationIdx >= 0) {
                  for (let i = stationIdx; i < lineStations.length; i++) {
                    const sId = lineStations[i].id;
                    if (posMap[inst.featureId]?.[sId]) {
                      posMap[inst.featureId][sId].x += shift;
                    }
                  }
                }
              }
            }
          });
        }
      });
    }

    const visibleCount = Math.min(stationsPerPage, maxStationsCount || 1);
    const canvasWidth = 80 + visibleCount * STATION_SPACING + PADDING;
    const canvasHeight = 80 + linesCount * FEATURE_SPACING + 100;

    return {
      positions: posMap,
      canvasWidth,
      canvasHeight,
      keyToInstances
    };
  }, [features, filteredFeatures, selectedFeatures, featureLines, maxStationsCount, stationsPerPage]);
}
