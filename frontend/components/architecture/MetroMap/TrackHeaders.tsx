// frontend/components/architecture/MetroMap/TrackHeaders.tsx

import React, { useMemo } from 'react';
import { FeatureFlow, TrackHeadersProps } from './types';
import { LayerType, LAYER_CONFIG } from './layerDetector';

interface HeaderPosition {
  feature: FeatureFlow;
  x: number;
  y: number;
}

const START_X = 80;

export function TrackHeaders({ 
  filteredFeatures, 
  featureHeaderY = {},
  canvasWidth, 
  showLayerIndicators = true,
  onLayerClick,
  selectedLayers = []
}: TrackHeadersProps) {
  // Calculate header positions anchored directly to each track lane
  const headerPositions = useMemo<HeaderPosition[]>(() => {
    const positions: HeaderPosition[] = [];

    filteredFeatures.forEach((feature, index) => {
      const baseY = featureHeaderY[feature.id] !== undefined 
        ? featureHeaderY[feature.id] 
        : (55 + index * 260);
      
      positions.push({
        feature,
        x: START_X,
        y: baseY
      });
    });

    return positions;
  }, [filteredFeatures, featureHeaderY]);

  if (filteredFeatures.length === 0) return null;

  return (
    <div 
      className="absolute top-0 left-0 pointer-events-none z-10 overflow-visible"
      style={{ 
        width: canvasWidth,
        height: '100%',
      }}
    >
      {headerPositions.map(({ feature, x, y }) => {
        const stationCount = feature.files?.length || 0;
        const stationText = `${stationCount} ${stationCount === 1 ? 'station' : 'stations'}`;
        const lineNumber = String(stationCount).padStart(2, '0');

        return (
          <div
            key={feature.id}
            className="absolute flex flex-col items-start select-none transition-transform duration-150"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              pointerEvents: 'auto'
            }}
          >
            {/* Primary Track Title with Colored Track Marker */}
            <div className="flex items-center gap-2.5">
              <div 
                className="w-2.5 h-4 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: feature.color }}
              />
              <h3 className="text-[16px] font-semibold text-white tracking-wider uppercase leading-none">
                {feature.name}
              </h3>
            </div>

            {/* Secondary Metadata: 11-12px font-medium */}
            <div className="flex items-center gap-2 mt-1.5 ml-5 text-[11.5px] font-medium text-zinc-400 font-mono">
              <span>{stationText} · LINE {lineNumber}</span>

              {/* Optional Subtle Layer Indicators */}
              {showLayerIndicators && feature.layerGroups && (
                <div className="flex gap-1 ml-2 items-center border-l border-zinc-700/60 pl-2">
                  {Object.entries(feature.layerGroups).map(([layer, stations]) => {
                    const arr = Array.isArray(stations) ? stations : [];
                    if (arr.length === 0) return null;
                    const config = LAYER_CONFIG[layer as LayerType];
                    const isSelected = selectedLayers.length === 0 || selectedLayers.includes(layer as LayerType);
                    return (
                      <div
                        key={layer}
                        className="w-2 h-2 rounded-full cursor-pointer hover:scale-125 transition shrink-0"
                        style={{
                          backgroundColor: config?.color || '#a1a1aa',
                          opacity: isSelected ? 1 : 0.35,
                        }}
                        onClick={() => onLayerClick?.(layer as LayerType)}
                        title={`${config?.label}: ${arr.length} stations`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
