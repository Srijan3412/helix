import { useMemo } from 'react';
import { FeatureCluster } from './types';

interface LayoutResult {
  positions: Record<string, { x: number; y: number }>;
  canvasWidth: number;
  canvasHeight: number;
}

// Phase 3: Track Layout Constants
const STATION_SPACING_X = 230;
const FEATURE_SPACING_Y = 160; // Consistent 160px vertical spacing between tracks
const START_X = 100;
const START_Y = 110;
const PADDING = 200;

/**
 * Phase 3: Track Layout Generator
 * Computes horizontal tracks for each feature line with consistent 160px vertical spacing.
 */
export function useMetroLayout(
  features: FeatureCluster[],
  filteredFeatures: FeatureCluster[]
): LayoutResult {
  return useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const featuresToRender = filteredFeatures.length > 0 ? filteredFeatures : features;

    let maxStationsInLine = 1;

    featuresToRender.forEach((feature, featureIdx) => {
      const y = START_Y + featureIdx * FEATURE_SPACING_Y;
      const files = feature.files || [];

      if (files.length > maxStationsInLine) {
        maxStationsInLine = files.length;
      }

      files.forEach((file, fileIdx) => {
        const x = START_X + fileIdx * STATION_SPACING_X;
        const stationId = `${feature.id}-${file}`;
        positions[stationId] = { x, y };
      });
    });

    const canvasWidth = Math.max(1200, START_X + maxStationsInLine * STATION_SPACING_X + PADDING);
    const canvasHeight = Math.max(700, START_Y + featuresToRender.length * FEATURE_SPACING_Y + PADDING);

    return {
      positions,
      canvasWidth,
      canvasHeight
    };
  }, [features, filteredFeatures]);
}
