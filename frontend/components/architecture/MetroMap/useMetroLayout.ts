// frontend/components/architecture/MetroMap/useMetroLayout.ts

import { useMemo } from 'react';
import { FeatureFlow } from './types';
import { LayerType } from './layerDetector';

const START_X = 80;
const START_Y = 60;
const STATION_SPACING_X = 125; // 102px node + 23px gap
const LINE_ROW_HEIGHT = 120;   // Row height between feature lines

export const DEFAULT_LAYER_ORDER: LayerType[] = [
  'api',
  'middleware',
  'business',
  'data',
  'infrastructure',
  'utility'
];

export function getFeaturePrefix(featureName: string, fIdx: number): string {
  const name = String(featureName || "").toLowerCase();
  if (name.includes('auth')) return 'A';
  if (name.includes('user')) return 'U';
  if (name.includes('admin') || name.includes('control')) return 'D';
  if (name.includes('log') || name.includes('analytic')) return 'L';
  if (name.includes('notif') || name.includes('email') || name.includes('alert')) return 'N';
  if (name.includes('core') || name.includes('system') || name.includes('infra') || name.includes('db')) return 'C';
  if (name.includes('pay') || name.includes('stripe')) return 'P';
  
  const clean = String(featureName || "").replace(/[^a-zA-Z]/g, '');
  return clean ? clean[0].toUpperCase() : `F${fIdx + 1}`;
}

export function getFeatureDescription(featureName: string): string {
  const name = String(featureName || "").toLowerCase();
  if (name.includes('auth')) return 'Auth, sessions & access control';
  if (name.includes('user')) return 'Users, profiles & teams';
  if (name.includes('admin') || name.includes('control')) return 'Admin, settings & configuration';
  if (name.includes('log') || name.includes('analytic')) return 'Analytics, events & monitoring';
  if (name.includes('notif') || name.includes('email') || name.includes('alert')) return 'Email, alerts & messaging';
  if (name.includes('core') || name.includes('system') || name.includes('infra') || name.includes('db')) return 'Database, cache & external services';
  if (name.includes('pay') || name.includes('stripe')) return 'Payments, billing & checkout';
  return 'Business logic & component pipeline';
}

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
    let maxContentX = START_X;
    let maxContentY = START_Y;

    // Identify feature roles
    const isCoreFeature = (f: FeatureFlow) => {
      const name = String(f?.name || "").toLowerCase();
      return name.includes('core') || name.includes('system') || name.includes('database') || name.includes('infra');
    };

    const isRightFeature = (f: FeatureFlow) => {
      const name = String(f?.name || "").toLowerCase();
      return name.includes('notif') || name.includes('email') || name.includes('payment');
    };

    const leftFeatures = featuresToLayout.filter((f) => !isCoreFeature(f) && !isRightFeature(f));
    const coreFeatures = featuresToLayout.filter(isCoreFeature);
    const rightFeatures = featuresToLayout.filter(isRightFeature);

    if (leftFeatures.length === 0 && featuresToLayout.length > 0) {
      leftFeatures.push(...featuresToLayout);
    }

    let leftRowIdx = 0;
    // 1. Layout Left Horizontal Feature Lines
    leftFeatures.forEach((feature) => {
      posMap[feature.id] = {};
      const stations = featureLines[feature.id] || [];
      const lineY = START_Y + leftRowIdx * LINE_ROW_HEIGHT;

      featureHeaderY[feature.id] = lineY - 32;
      featureStartY[feature.id] = lineY;

      stations.forEach((station, sIdx) => {
        const x = START_X + sIdx * STATION_SPACING_X;
        const y = lineY;
        posMap[feature.id][station.id] = { x, y };

        if (x + 140 > maxContentX) maxContentX = x + 140;
      });

      leftRowIdx++;
      if (lineY + 100 > maxContentY) maxContentY = lineY + 100;
    });

    // Central Core Hub position
    const hubX = Math.max(520, maxContentX + 40);
    const hubY = START_Y + Math.max(1, Math.floor(leftFeatures.length / 2)) * LINE_ROW_HEIGHT - 30;

    posMap['core-hub-center'] = {
      'core-hub-node': { x: hubX, y: hubY }
    };

    // 2. Layout Core System Vertical Line (at hubX + 130)
    const coreLineX = hubX + 130;
    let coreY = START_Y;

    coreFeatures.forEach((feature) => {
      posMap[feature.id] = {};
      const stations = featureLines[feature.id] || [];

      featureHeaderY[feature.id] = coreY - 32;
      featureStartY[feature.id] = coreY;

      stations.forEach((station, sIdx) => {
        const x = coreLineX;
        const y = coreY + sIdx * 75;
        posMap[feature.id][station.id] = { x, y };

        if (y + 100 > maxContentY) maxContentY = y + 100;
      });

      coreY += stations.length * 75 + 80;
    });

    // 3. Layout Right Features
    let rightRowIdx = 0;
    const rightStartX = coreLineX + 140;

    rightFeatures.forEach((feature) => {
      posMap[feature.id] = {};
      const stations = featureLines[feature.id] || [];
      const lineY = hubY + rightRowIdx * LINE_ROW_HEIGHT;

      featureHeaderY[feature.id] = lineY - 32;
      featureStartY[feature.id] = lineY;

      stations.forEach((station, sIdx) => {
        const x = rightStartX + sIdx * STATION_SPACING_X;
        const y = lineY;
        posMap[feature.id][station.id] = { x, y };

        if (x + 140 > maxContentX) maxContentX = x + 140;
      });

      rightRowIdx++;
      if (lineY + 100 > maxContentY) maxContentY = lineY + 100;
    });

    const canvasWidth = Math.max(maxContentX + 250, 1400);
    const canvasHeight = Math.max(maxContentY + 150, 750);

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
      featureStartY,
      hubX,
      hubY
    };
  }, [features, filteredFeatures, selectedFeatures, featureLines, layerGroups, maxStationsCount, stationsPerPage]);
}

