import { LucideIcon } from 'lucide-react';
import { AnalysisResult } from '@shared/types';

export type StationType = 'route' | 'controller' | 'service' | 'middleware' | 'repository' | 'database';
export type StationHealth = 'healthy' | 'warning' | 'critical';

export interface SubwayStationData {
  id: string;
  label: string;
  name: string;
  displayName: string;
  rawPath: string;
  type: StationType;
  health: StationHealth;
  complexity: number;
  features: string[];
  isInterchange: boolean;
  color: string;
  focused?: boolean;
  selected?: boolean;
  isJourneyActive?: boolean;
  lineName?: string;
  routes?: string[];
  metrics?: {
    lineCount?: number;
    dependentsCount?: number;
  };
}

export interface FeatureCluster {
  id: string;
  name: string;
  color: string;
  files: string[];
  routes: string[];
  databases: string[];
  health?: number;
  confidence?: number;
}

export interface Interchange {
  file: string;
  features: string[];
}

export interface ExecutionStep {
  name: string;
  type: StationType;
  file?: string;
  line?: number;
}

export interface ExecutionTraceData {
  route: string;
  method: string;
  chain: ExecutionStep[];
}

export interface FeatureImportanceItem {
  id: string;
  name: string;
  impact: number;
  color: string;
  filesCount: number;
}

export interface MetroMapProps {
  result?: AnalysisResult | null;
  onSwitchTab?: (tab: string) => void;
  onSetImpactFile?: (file: string) => void;
  onSelectTraceRouteId?: (routeId: string) => void;
}
