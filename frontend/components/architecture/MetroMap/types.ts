// frontend/components/architecture/MetroMap/types.ts

import { LayerType } from './layerDetector';
import { AnalysisResult } from '@shared/types';

export type StationType = 'route' | 'controller' | 'service' | 'middleware' | 'repository' | 'database';
export type StationHealth = 'healthy' | 'warning' | 'critical';

// ── Subway Station Data ──
export interface SubwayStationData {
  id: string;
  label: string;
  name: string;
  displayName: string;
  rawPath: string;
  type: StationType;
  key?: string;
  raw?: string;
  layer: LayerType;          // ✅ Layer classification
  layerIndex?: number;       // ✅ Position within layer
  featureId?: string;        // ✅ Parent feature ID
  health: StationHealth;     // ✅ Station health status
  complexity: number;        // ✅ Code complexity
  features: string[];        // ✅ Connected feature line names
  isInterchange: boolean;    // ✅ Interchange junction status
  color: string;             // ✅ Track color
  focused?: boolean;         // ✅ Search focus state
  selected?: boolean;        // ✅ Selection state
  isSelected?: boolean;      // ✅ Selection alias
  isActive?: boolean;        // ✅ Active state
  isJourneyActive?: boolean;
  isAggregated?: boolean;
  hiddenCount?: number;
  isExpandable?: boolean; // ✅ Journey simulation active
  lineName?: string;         // ✅ Line name
  routes?: string[];         // ✅ Route endpoints
  metrics?: {
    lineCount?: number;
    dependentsCount?: number;
  };
}

// ── Feature Flow (Extended) ──
export interface FeatureFlow {
  id: string;
  name: string;
  color: string;
  health: number;
  confidence: number;
  routes: string[];
  files: string[];
  database?: string[];
  databases?: string[];
  auth?: boolean;
  metrics?: {
    routes?: number;
    services?: number;
    repositories?: number;
    tables?: number;
  };
  layerGroups?: Record<LayerType, SubwayStationData[] | string[]>;  // ✅ Stations or files grouped by layer
  layerHealth?: Record<LayerType, number>;                          // ✅ Health per layer
  layerCounts?: Record<LayerType, number>;                          // ✅ Count per layer
}

// ── Feature Cluster Alias ──
export type FeatureCluster = FeatureFlow;

// ── Interchange ──
export interface Interchange {
  file: string;
  features: string[];
}

// ── Execution Step & Trace ──
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

// ── Feature Importance Item ──
export interface FeatureImportanceItem {
  id: string;
  name: string;
  impact: number;
  color: string;
  filesCount: number;
}

// ── Layout Result ──
export interface LayoutResult {
  positions: Record<string, Record<string, { x: number; y: number }>> & Record<string, { x: number; y: number }>;
  featureLines: Record<string, SubwayStationData[]>;
  maxStationsCount: number;
  canvasWidth: number;
  canvasHeight: number;
  keyToInstances: Record<string, { featureId: string; stationId: string }[]>;
  layerGroups: Record<string, Record<LayerType, SubwayStationData[]>>;
  layerOrder: LayerType[];
}

// ── Layer Statistics ──
export interface LayerStats {
  layer: LayerType;
  count: number;
  color: string;
  emoji: string;
  label: string;
  health: number;
  percentage: number;
}

// ── Filter State ──
export interface MetroFilterState {
  selectedFeatures: string[];
  selectedLayers: LayerType[];
  searchQuery: string;
  showOnlyHighlighted: boolean;
  healthThreshold: number;
}

// ── Metro Map Props ──
export interface MetroMapProps {
  result?: AnalysisResult | any;
  onSwitchTab?: (tab: any) => void;
  onSetImpactFile?: (file: string) => void;
  onSelectTraceRouteId?: (routeId: string) => void;
  initialFilters?: Partial<MetroFilterState>;
  onFilterChange?: (filters: MetroFilterState) => void;
}

// ── Node Generation Props ──
export interface MetroGraphProps {
  filteredFeatures: FeatureFlow[];
  features: FeatureFlow[];
  featureLines?: Record<string, SubwayStationData[]>;
  positions: any;
  selectedFeatures: string[];
  selectedLayers?: LayerType[];
  activeLayers?: LayerType[];
  hoveredFeature: string | null;
  selectedStationId?: string | null;
  selectedStation?: SubwayStationData | null;
  focusedNodeIds?: string[];
  healthGlowActive?: boolean;
  journeyActive?: boolean;
  journeyNodeId?: string | null;
  journeyFeatureId?: string | null;
  animatedRoute?: string | null;
  animationStep?: number;
  executionTraces?: ExecutionTraceData[];
  interchanges?: Interchange[];
  layerGroups?: Record<string, Record<LayerType, SubwayStationData[]>>;
  getStationTypeLabel?: (station: SubwayStationData) => string;
  getStationDisplayName?: (station: SubwayStationData) => string;
  getStationNumber?: (feature: FeatureFlow, index: number) => string;
  getComplexityScore?: (filePath: string) => number;
  onStationClick?: (stationId: string, stationRaw: string, feature: FeatureFlow) => void;
  expandedStation?: string | null;
  setExpandedStation?: (id: string | null) => void;
  result?: any;
}

// ── Layout Hook Props ──
export interface MetroLayoutProps {
  features: FeatureFlow[];
  filteredFeatures: FeatureFlow[];
  selectedFeatures?: string[];
  featureLines?: Record<string, SubwayStationData[]>;
  maxStationsCount?: number;
  stationsPerPage?: number;
  layerOrder?: LayerType[];
  activeLayers?: LayerType[];
}

// ── Track Headers Props ──
export interface TrackHeadersProps {
  filteredFeatures: FeatureFlow[];
  canvasWidth: number;
  scrollLeft: number;
  viewportWidth: number;
  containerRef?: React.RefObject<HTMLDivElement>;
  showLayerIndicators?: boolean;
  onLayerClick?: (layer: LayerType) => void;
  selectedLayers?: LayerType[];
}

// ── Graph Node Data ──
export interface MetroNodeData {
  stationNumber?: string;
  typeLabel?: string;
  displayName: string;
  color: string;
  isActive?: boolean;
  hasHighComplexity?: boolean;
  healthGlowActive?: boolean;
  complexity: number;
  isSelected?: boolean;
  onClick?: () => void;
  rawType?: string;
  health?: number;
  nextStationName?: string;
  lineName?: string;
  layer?: LayerType;
  layerLabel?: string;
  layerEmoji?: string;
}
