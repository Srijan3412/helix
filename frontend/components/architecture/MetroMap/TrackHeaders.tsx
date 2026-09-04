import React, { useMemo } from 'react';
import { FeatureFlow } from '@shared/types';

interface TrackHeadersProps {
  filteredFeatures: FeatureFlow[];
  canvasWidth: number;
  scrollLeft: number;
  viewportWidth: number;
}

interface HeaderPosition {
  feature: FeatureFlow;
  x: number;
  y: number;
  isSticky: boolean;
}

const FEATURE_SPACING = 260;
const HEADER_OFFSET = 55; // Offset above station row

export function TrackHeaders({ 
  filteredFeatures, 
  canvasWidth, 
  scrollLeft, 
  viewportWidth
}: TrackHeadersProps) {
  // Calculate header positions and stickiness
  const headerPositions = useMemo<HeaderPosition[]>(() => {
    const positions: HeaderPosition[] = [];
    const padding = 80; // Left padding offset

    filteredFeatures.forEach((feature, index) => {
      const baseY = 80 + index * FEATURE_SPACING - HEADER_OFFSET;
      const baseX = padding;
      const isSticky = scrollLeft > baseX;
      const visibleX = isSticky ? scrollLeft + 20 : baseX;
      
      positions.push({
        feature,
        x: visibleX,
        y: baseY,
        isSticky
      });
    });

    return positions;
  }, [filteredFeatures, scrollLeft]);

  if (filteredFeatures.length === 0) return null;

  return (
    <div 
      className="absolute top-0 left-0 pointer-events-none z-20 overflow-visible"
      style={{ 
        width: canvasWidth,
        height: '100%',
      }}
    >
      {headerPositions.map(({ feature, x, y, isSticky }) => {
        const stationCount = feature.files?.length || 0;
        const lineNumber = String(stationCount).padStart(2, '0');

        return (
          <div
            key={feature.id}
            className={`absolute flex items-center gap-3 px-4 py-2 rounded-xl border-2 shadow-lg select-none transition-all duration-200 ${
              isSticky 
                ? 'bg-zinc-950/95 backdrop-blur-md border-zinc-700/80 shadow-2xl' 
                : 'bg-zinc-950/90'
            }`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              borderColor: feature.color,
              minWidth: '280px',
              maxWidth: isSticky ? `min(${viewportWidth - 40}px, 450px)` : '400px',
              pointerEvents: 'auto',
              transform: isSticky ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            {/* Color bar */}
            <div 
              className="w-3 h-8 rounded-full shrink-0"
              style={{ backgroundColor: feature.color }}
            />

            {/* Feature name */}
            <span className="text-xs font-bold text-white tracking-wider uppercase truncate">
              {feature.name}
            </span>

            {/* Station count badge */}
            <span 
              className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ 
                backgroundColor: `${feature.color}30`,
                color: feature.color,
              }}
            >
              {stationCount} stations
            </span>

            {/* Line number */}
            <span className="text-[9px] text-zinc-500 ml-auto font-mono shrink-0">
              LINE {lineNumber}
            </span>

            {/* Show indicator when sticky */}
            {isSticky && (
              <span className="text-[8px] text-zinc-500 ml-1 shrink-0">
                📌
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
