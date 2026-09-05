import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { FeatureImportanceItem } from './types';

interface FeatureImportancePanelProps {
  items: FeatureImportanceItem[];
}

export function FeatureImportancePanel({ items }: FeatureImportancePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div className="absolute bottom-3 right-3 z-20 bg-zinc-950/90 border border-zinc-800/90 backdrop-blur-md rounded-xl shadow-2xl p-2.5 w-56 text-left transition-all duration-200 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <BarChart3 size={11} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-bold text-zinc-100 leading-none truncate">Feature Importance</h4>
            <span className="text-[8px] text-zinc-400 font-mono">Impact Score</span>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-md transition shrink-0 ml-1"
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="space-y-1.5 mt-2 pt-2 border-t border-zinc-800/80 max-h-36 overflow-y-auto scrollbar-none pr-0.5">
          {items.map((item) => (
            <div key={item.id} className="space-y-0.5">
              <div className="flex justify-between items-center text-[9.5px]">
                <span className="font-medium text-zinc-300 truncate flex-1 flex items-center gap-1.5 pr-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-mono text-[9px] font-bold text-zinc-300 shrink-0">
                  {item.impact}%
                </span>
              </div>

              {/* Mini Progress Bar */}
              <div className="w-full bg-zinc-800/80 h-1 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(item.impact, 2)}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
