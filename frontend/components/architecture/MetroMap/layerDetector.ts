export type LayerType = 
  | 'api' 
  | 'middleware' 
  | 'business' 
  | 'data' 
  | 'infrastructure' 
  | 'utility';

export const LAYER_CONFIG: Record<LayerType, {
  label: string;
  emoji: string;
  color: string;
  order: number;
  badgeColor: string;
}> = {
  api: {
    label: 'API Layer',
    emoji: '🟢',
    color: '#22c55e',
    order: 0,
    badgeColor: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
  },
  middleware: {
    label: 'Middleware Layer',
    emoji: '🟣',
    color: '#a855f7',
    order: 1,
    badgeColor: 'bg-purple-500/20 border-purple-500/30 text-purple-400'
  },
  business: {
    label: 'Business Layer',
    emoji: '🟡',
    color: '#eab308',
    order: 2,
    badgeColor: 'bg-amber-500/20 border-amber-500/30 text-amber-400'
  },
  data: {
    label: 'Data Layer',
    emoji: '🔵',
    color: '#3b82f6',
    order: 3,
    badgeColor: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
  },
  infrastructure: {
    label: 'Infrastructure',
    emoji: '🔴',
    color: '#ef4444',
    order: 4,
    badgeColor: 'bg-red-500/20 border-red-500/30 text-red-400'
  },
  utility: {
    label: 'Utilities',
    emoji: '⚪',
    color: '#6b7280',
    order: 5,
    badgeColor: 'bg-gray-500/20 border-gray-500/30 text-gray-400'
  }
};

export function detectLayer(station: any, filePath?: string): LayerType {
  const type = station?.type;
  if (type === 'route') return 'api';
  if (type === 'middleware') return 'middleware';
  if (type === 'service') return 'business';
  if (type === 'controller') return 'business';
  if (type === 'repository') return 'data';
  if (type === 'database') return 'data';
  
  const fileName = filePath || station?.rawPath || station?.raw || station?.name || station?.label || '';
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('.route') || lowerName.includes('.controller') || 
      lowerName.includes('.handler') || lowerName.includes('/api/') || lowerName.startsWith('api/')) {
    return 'api';
  }
  
  if (lowerName.includes('.middleware') || lowerName.includes('.guard') || 
      lowerName.includes('.interceptor') || lowerName.includes('.filter')) {
    return 'middleware';
  }
  
  if (lowerName.includes('.service') || lowerName.includes('.use-case') || 
      lowerName.includes('.workflow') || lowerName.includes('.usecase') ||
      lowerName.includes('.domain') || lowerName.includes('.manager')) {
    return 'business';
  }
  
  if (lowerName.includes('.repository') || lowerName.includes('.model') || 
      lowerName.includes('.schema') || lowerName.includes('.entity') || 
      lowerName.includes('.dto') || lowerName.includes('.vo') || 
      lowerName.includes('.value-object') || lowerName.includes('prisma') || lowerName.includes('table')) {
    return 'data';
  }
  
  if (lowerName.includes('.config') || lowerName.includes('.env') || 
      lowerName.includes('database') || lowerName.includes('cache') || 
      lowerName.includes('queue') || lowerName.includes('.migration') ||
      lowerName.includes('redis') || lowerName.includes('postgres') ||
      lowerName.includes('mongodb') || lowerName.includes('rabbitmq') ||
      lowerName.includes('kafka') || lowerName.includes('elasticsearch')) {
    return 'infrastructure';
  }
  
  return 'utility';
}

export function getLayerOrder(layer: LayerType): number {
  return LAYER_CONFIG[layer]?.order ?? 99;
}

export function getLayerLabel(layer: LayerType): string {
  return LAYER_CONFIG[layer]?.label ?? layer;
}

export function getLayerColor(layer: LayerType): string {
  return LAYER_CONFIG[layer]?.color ?? '#6b7280';
}

export function getLayerEmoji(layer: LayerType): string {
  return LAYER_CONFIG[layer]?.emoji ?? '⚪';
}

export function getLayerBadgeColor(layer: LayerType): string {
  return LAYER_CONFIG[layer]?.badgeColor ?? 'bg-gray-500/20 border-gray-500/30 text-gray-400';
}


// ── File Importance & Utility Classifiers ──
export const IMPORTANT_FILE_PATTERNS = [
  '.service.',
  '.controller.',
  '.routes.',
  '.route.',
  '.repository.',
  '.repo.',
  '.middleware.',
  '.guard.',
  '.handler.',
  'index.',
  'main.',
  'app.',
  'server.'
];

export const UTILITY_PATTERNS = [
  '.util.',
  '.helper.',
  '.dto.',
  '.types.',
  '.type.',
  '.interface.',
  '.enum.',
  '.constant.',
  '.config.',
  '.mock.',
  '.test.',
  '.spec.',
  '.schema.'
];

export function isImportantFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMPORTANT_FILE_PATTERNS.some(p => lower.includes(p)) || 
         lower.startsWith('/api') || 
         lower.startsWith('api/') || 
         lower.includes('routes');
}

export function isUtilityFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return UTILITY_PATTERNS.some(p => lower.includes(p));
}
