export interface LayerItemData {
  id: string;
  num: string;
  name: string;
  shortDesc: string;
  tag: string;
  color: string;
  glowColor: string;
  bgColor: string;
  borderColor: string;
  badgeText?: string;
  files: string[];
}

export interface Architecture3DProps {
  layers: Record<string, string[]>;
  selectedLayerId: string;
  onSelectLayer: (layerId: string) => void;
  searchQuery?: string;
}
