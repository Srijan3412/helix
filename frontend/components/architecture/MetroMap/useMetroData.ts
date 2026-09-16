// frontend/components/architecture/MetroMap/useMetroData.ts

import { useMemo } from 'react';
import { AnalysisResult, RouteNode } from '@shared/types';
import {
  FeatureCluster,
  Interchange,
  ExecutionTraceData,
  FeatureImportanceItem,
  StationType,
  StationHealth
} from './types';
import {
  mockFeatureClusters,
  mockInterchanges,
  mockExecutionTraces,
  mockFeatureImportance
} from './mockData';
import { detectLayer, LayerType } from './layerDetector';

/**
 * Maps a file path or name to its architectural role
 */
export function inferStationType(fileName: string): StationType {
  const lower = String(fileName || '').toLowerCase();
  if (lower.includes('route') || lower.startsWith('/api') || lower.startsWith('/') || lower.startsWith('get ') || lower.startsWith('post ') || lower.startsWith('put ') || lower.startsWith('delete ')) return 'route';
  if (lower.includes('controller') || lower.includes('handler')) return 'controller';
  if (lower.includes('middleware') || lower.includes('guard') || lower.includes('auth')) return 'middleware';
  if (lower.includes('repository') || lower.includes('repo') || lower.includes('store') || lower.includes('dao')) return 'repository';
  if (['postgresql', 'redis', 'mongodb', 'mysql', 'prisma', 'stripe', 'database', 'db', 'table'].some((d) => lower.includes(d))) return 'database';
  if (lower.includes('service') || lower.includes('jwt') || lower.includes('helper') || lower.includes('util')) return 'service';
  return 'service';
}

/**
 * Calculates station health and health percentage from real static analysis findings
 */
export function calculateFileHealth(
  filePath: string,
  result?: AnalysisResult | null
): { health: StationHealth; healthScore: number } {
  if (!result || !result.staticAnalysis) {
    return { health: 'healthy', healthScore: 92 };
  }

  const filename = filePath.split(/[\\/]/).pop() || filePath;
  const staticReport = result.staticAnalysis;
  const repoHealth = staticReport.healthScore || 90;

  const deadCode = staticReport.deadCode || [];
  const cycles = staticReport.cycles || [];
  const godServices = staticReport.godServices || [];
  const largeFiles = staticReport.largeFiles || [];
  const complexityList = staticReport.complexity || [];

  const isDead = deadCode.some((d) => d.file.includes(filename));
  const inCycle = cycles.some((c) => c.cycle.some((cf) => cf.includes(filename)));
  const isGodService = godServices.some((g) => g.file.includes(filename));

  if (isDead || inCycle || isGodService) {
    return { health: 'critical', healthScore: Math.min(38, repoHealth - 50) };
  }

  const isLarge = largeFiles.some((l) => l.file.includes(filename));
  const isRiskyComplexity = complexityList.some((c) => c.file.includes(filename) && c.rating === 'risky');

  if (isLarge || isRiskyComplexity) {
    return { health: 'warning', healthScore: Math.max(55, Math.min(72, repoHealth - 25)) };
  }

  return { health: 'healthy', healthScore: Math.max(85, Math.min(98, repoHealth)) };
}

import { FlowGroupData } from './types';

export function generateFlowGroupsForFeature(
  featureId: string,
  featureName: string,
  files: string[],
  routes: string[]
): FlowGroupData[] {
  // If we have actual routes, partition them into logical flow groups based on path sub-segments
  if (routes && routes.length > 0) {
    const routeGroups: Record<string, string[]> = {};
    routes.forEach((r) => {
      const segs = r.replace(/^\/api\//, '').replace(/^\//, '').split('/');
      const groupKey = segs.length > 1 ? segs[1] : (segs[0] || 'main');
      if (!routeGroups[groupKey]) routeGroups[groupKey] = [];
      routeGroups[groupKey].push(r);
    });

    const groups = Object.entries(routeGroups).map(([key, groupRoutes], idx) => {
      const name = key.charAt(0).toUpperCase() + key.slice(1).replace(/[-_]/g, ' ') + ' Flow';
      const endpoints = groupRoutes.map((r) => {
        const parts = r.split(' ');
        const method = parts.length > 1 ? parts[0] : 'GET';
        const path = parts.length > 1 ? parts[1] : parts[0];
        return { method, path };
      });

      return {
        id: `${featureId}-${key}-${idx}`,
        featureId,
        name,
        stationsCount: Math.max(2, Math.ceil(files.length / Object.keys(routeGroups).length)),
        endpointsCount: endpoints.length,
        stations: [],
        endpoints,
        health: Math.max(75, 96 - idx * 3),
        dependencies: ['Internal Service'],
      };
    });

    if (groups.length > 0) return groups;
  }

  // If we have files, partition files into sub-flow groups
  if (files && files.length > 0) {
    const fileSubgroups: Record<string, string[]> = {
      handlers: [],
      services: [],
      data: [],
    };

    files.forEach((f) => {
      const lower = f.toLowerCase();
      if (lower.includes('route') || lower.includes('controller') || lower.includes('api')) {
        fileSubgroups.handlers.push(f);
      } else if (lower.includes('repo') || lower.includes('model') || lower.includes('db') || lower.includes('schema')) {
        fileSubgroups.data.push(f);
      } else {
        fileSubgroups.services.push(f);
      }
    });

    const populatedGroups: FlowGroupData[] = [];
    if (fileSubgroups.handlers.length > 0) {
      populatedGroups.push({
        id: `${featureId}-api`,
        featureId,
        name: `${featureName} API Entry`,
        stationsCount: fileSubgroups.handlers.length,
        endpointsCount: routes.length || fileSubgroups.handlers.length,
        stations: [],
        endpoints: routes.map((r) => ({ method: 'GET', path: r })),
        health: 95,
        dependencies: ['HTTP Router'],
      });
    }
    if (fileSubgroups.services.length > 0) {
      populatedGroups.push({
        id: `${featureId}-services`,
        featureId,
        name: `${featureName} Core Logic`,
        stationsCount: fileSubgroups.services.length,
        endpointsCount: 0,
        stations: [],
        endpoints: [],
        health: 92,
        dependencies: ['Domain Engine'],
      });
    }
    if (fileSubgroups.data.length > 0) {
      populatedGroups.push({
        id: `${featureId}-data`,
        featureId,
        name: `${featureName} Persistence`,
        stationsCount: fileSubgroups.data.length,
        endpointsCount: 0,
        stations: [],
        endpoints: [],
        health: 90,
        dependencies: ['Database'],
      });
    }

    if (populatedGroups.length > 0) return populatedGroups;
  }

  return [
    {
      id: `${featureId}-default`,
      featureId,
      name: `${featureName} Flow`,
      stationsCount: files.length > 0 ? files.length : 3,
      endpointsCount: routes.length > 0 ? routes.length : 1,
      stations: [],
      endpoints: routes.map(r => ({ method: 'GET', path: r })),
      health: 90,
      dependencies: ['Core Module']
    }
  ];
}

export interface MetroDataResult {
  featureClusters: FeatureCluster[];
  interchanges: Interchange[];
  executionTraces: ExecutionTraceData[];
  featureImportance: FeatureImportanceItem[];
}

/**
 * Phase 1: Data Adaptation & Normalization Hook
 * Extracts real codebase features, files, routes, interchanges, traces, and layer groups.
 */
export function useMetroData(result?: AnalysisResult | null): MetroDataResult {
  return useMemo(() => {
    const rawFeatures = result?.features && result.features.length > 0 
      ? result.features 
      : (() => {
          if (!result?.files || result.files.length === 0) return [];
          const groups: Record<string, string[]> = {};
          result.files.forEach((f: any) => {
            const p = f.path || f;
            if (p.startsWith('ROUTE:') || p.startsWith('ENV:') || p.startsWith('DB:')) return;
            const segs = p.split(/[\\/]/).filter(Boolean);
            const domain = segs.length > 1 ? (segs[0] === 'src' || segs[0] === 'app' ? segs[1] || 'Core' : segs[0]) : 'Core';
            const cap = domain.charAt(0).toUpperCase() + domain.slice(1);
            if (!groups[cap]) groups[cap] = [];
            groups[cap].push(p);
          });
          const palette = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
          return Object.entries(groups).slice(0, 6).map(([name, files], i) => ({
            id: name.toLowerCase(),
            name,
            color: palette[i % palette.length],
            files,
            routes: (result?.routes || [])
              .filter((r: any) => (r.file && files.some((f: string) => f.includes(r.file))) || r.path.toLowerCase().includes(name.toLowerCase()))
              .map((r: any) => `${r.method} ${r.path}`),
            database: [result?.metadata?.databaseInfo?.type || 'PostgreSQL'],
            health: 92,
            confidence: 90
          }));
        })();

    if (rawFeatures && rawFeatures.length > 0) {
      // 1. Extract & normalize feature clusters with layer sub-groups
      const clusters: FeatureCluster[] = rawFeatures.map((f: any) => {
        const files: string[] = f.files && f.files.length > 0 ? f.files : ['index.ts', 'service.ts'];
        const layerGroups: Record<LayerType, string[]> = {
          api: [],
          middleware: [],
          business: [],
          data: [],
          infrastructure: [],
          utility: []
        };

        let featureHealthSum = 0;
        files.forEach((file) => {
          const l = detectLayer({ type: inferStationType(file) }, file);
          layerGroups[l].push(file);
          const { healthScore } = calculateFileHealth(file, result);
          featureHealthSum += healthScore;
        });

        const calculatedFeatureHealth = files.length > 0 ? Math.round(featureHealthSum / files.length) : 90;
        const featureId = f.id || String(f?.name || 'feature').toLowerCase().replace(/\s+/g, '-');

        const flowGroups = generateFlowGroupsForFeature(
          featureId,
          f?.name || 'Feature',
          files,
          f.routes || []
        );

        return {
          id: featureId,
          name: f.name,
          color: f.color || '#3B82F6',
          files,
          routes: f.routes || [],
          databases: f.database && f.database.length > 0 ? f.database : [result?.metadata?.databaseInfo?.type || 'PostgreSQL'],
          health: f.health !== undefined && f.health > 0 ? f.health : calculatedFeatureHealth,
          confidence: f.confidence !== undefined ? f.confidence : 92,
          layerGroups,
          flowGroups
        };
      });

      // 2. Detect shared files across features to produce an interchanges index
      const fileFeatureMap: Record<string, string[]> = {};
      clusters.forEach((cluster) => {
        (cluster.files || []).forEach((file) => {
          const key = file.split(/[\\/]/).pop() || file;
          if (!fileFeatureMap[key]) {
            fileFeatureMap[key] = [];
          }
          if (!fileFeatureMap[key].includes(cluster.name)) {
            fileFeatureMap[key].push(cluster.name);
          }
        });
      });

      const calculatedInterchanges: Interchange[] = Object.entries(fileFeatureMap)
        .filter(([_, featureNames]) => featureNames.length > 1)
        .map(([file, featureNames]) => ({
          file,
          features: featureNames
        }));

      // Merge subway transfers if provided
      if (result?.subway?.transfers) {
        result.subway.transfers.forEach((transferFile: string) => {
          const rawName = transferFile.split(/[\\/]/).pop() || transferFile;
          if (!calculatedInterchanges.some((i) => i.file === rawName)) {
            calculatedInterchanges.push({
              file: rawName,
              features: clusters
                .filter((c) => c.files.some((f) => f.includes(rawName)))
                .map((c) => c.name)
            });
          }
        });
      }

      // 3. Extract and normalize execution traces from real routes & traces
      let traces: ExecutionTraceData[] = (result?.traces || []).map((t: any) => ({
        route: t.route,
        method: t.method || 'GET',
        chain: (t.steps || []).map((s: any) => ({
          name: s.name,
          type: inferStationType(s.name || s.filePath || ''),
          file: s.filePath,
          line: s.line
        }))
      }));

      // If no explicit traces, build dynamic chains from result.routes
      if (traces.length === 0 && result?.routes && result.routes.length > 0) {
        traces = result.routes.map((r: RouteNode) => {
          const steps: any[] = [];
          if (r.handler) {
            steps.push({ name: r.handler, type: 'controller', file: r.file });
          }
          (r.middleware || []).forEach((m) => {
            steps.push({ name: m, type: 'middleware' });
          });
          (r.chain || []).forEach((c) => {
            steps.push({ name: c, type: inferStationType(c) });
          });
          return {
            route: `${r.method} ${r.path}`,
            method: r.method,
            chain: steps.length > 0 ? steps : [{ name: r.path, type: 'route', file: r.file }]
          };
        });
      }

      // 4. Calculate feature importance based on real file counts
      const totalFiles = clusters.reduce((sum, c) => sum + c.files.length, 0) || 1;
      const importance: FeatureImportanceItem[] = clusters.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        filesCount: c.files.length,
        impact: Math.round((c.files.length / totalFiles) * 100)
      }));

      return {
        featureClusters: clusters,
        interchanges: calculatedInterchanges.length > 0 ? calculatedInterchanges : mockInterchanges,
        executionTraces: traces.length > 0 ? traces : mockExecutionTraces,
        featureImportance: importance.length > 0 ? importance : mockFeatureImportance
      };
    }

    // Seamless fallback to rich mock data with populated layerGroups
    const enrichedMockClusters = mockFeatureClusters.map((cluster) => {
      const layerGroups: Record<LayerType, string[]> = {
        api: [],
        middleware: [],
        business: [],
        data: [],
        infrastructure: [],
        utility: []
      };
      cluster.files.forEach((file) => {
        const l = detectLayer({ type: inferStationType(file) }, file);
        layerGroups[l].push(file);
      });
      return {
        ...cluster,
        layerGroups
      };
    });

    return {
      featureClusters: enrichedMockClusters,
      interchanges: mockInterchanges,
      executionTraces: mockExecutionTraces,
      featureImportance: mockFeatureImportance
    };
  }, [result]);
}
