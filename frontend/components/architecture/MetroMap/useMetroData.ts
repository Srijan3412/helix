import { useMemo } from 'react';
import { AnalysisResult } from '@shared/types';
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
 * Maps a file path or name to its architectural role:
 * 'route' | 'controller' | 'service' | 'middleware' | 'repository' | 'database'
 */
export function inferStationType(fileName: string): StationType {
  const lower = fileName.toLowerCase();
  if (lower.includes('route') || lower.startsWith('/api') || lower.startsWith('/')) return 'route';
  if (lower.includes('controller') || lower.includes('handler')) return 'controller';
  if (lower.includes('middleware') || lower.includes('guard') || lower.includes('auth')) return 'middleware';
  if (lower.includes('repository') || lower.includes('repo') || lower.includes('store') || lower.includes('dao')) return 'repository';
  if (['postgresql', 'redis', 'mongodb', 'mysql', 'prisma', 'stripe', 'database', 'db'].some((d) => lower.includes(d))) return 'database';
  if (lower.includes('service') || lower.includes('jwt') || lower.includes('helper') || lower.includes('util')) return 'service';
  return 'service';
}

/**
 * Calculates station health: 'healthy' | 'warning' | 'critical'
 */
export function inferStationHealth(fileName: string, staticHealth?: number): StationHealth {
  if (staticHealth !== undefined && staticHealth > 0) {
    if (staticHealth >= 75) return 'healthy';
    if (staticHealth >= 45) return 'warning';
    return 'critical';
  }
  const lower = fileName.toLowerCase();
  if (lower.includes('auth') || lower.includes('billing') || lower.includes('user')) return 'healthy';
  if (lower.includes('admin') || lower.includes('upload') || lower.includes('legacy')) return 'warning';
  return 'healthy';
}

export interface MetroDataResult {
  featureClusters: FeatureCluster[];
  interchanges: Interchange[];
  executionTraces: ExecutionTraceData[];
  featureImportance: FeatureImportanceItem[];
}

/**
 * Phase 1: Data Adaptation & Normalization Hook
 * Extracts and normalizes features, files, routes, interchanges, traces, and layer groups.
 */
export function useMetroData(result?: AnalysisResult | null): MetroDataResult {
  return useMemo(() => {
    if (result && result.features && result.features.length > 0) {
      // 1. Extract & normalize feature clusters with layer sub-groups
      const clusters: FeatureCluster[] = result.features.map((f: any) => {
        const files: string[] = f.files && f.files.length > 0 ? f.files : ['index.ts', 'service.ts'];
        const layerGroups: Record<LayerType, string[]> = {
          api: [],
          middleware: [],
          business: [],
          data: [],
          infrastructure: [],
          utility: []
        };

        files.forEach((file) => {
          const l = detectLayer({ type: inferStationType(file) }, file);
          layerGroups[l].push(file);
        });

        return {
          id: f.id || f.name.toLowerCase().replace(/\s+/g, '-'),
          name: f.name,
          color: f.color || '#3B82F6',
          files,
          routes: f.routes || [],
          databases: f.database && f.database.length > 0 ? f.database : ['PostgreSQL'],
          health: f.health !== undefined ? f.health : 85,
          confidence: f.confidence !== undefined ? f.confidence : 90,
          layerGroups
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
      if (result.subway?.transfers) {
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

      // 3. Extract and normalize execution traces
      const traces: ExecutionTraceData[] = (result.traces || []).map((t: any) => ({
        route: t.route,
        method: t.method || 'GET',
        chain: (t.steps || []).map((s: any) => ({
          name: s.name,
          type: inferStationType(s.name || s.filePath || ''),
          file: s.filePath,
          line: s.line
        }))
      }));

      // 4. Calculate feature importance based on architectural impact
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
