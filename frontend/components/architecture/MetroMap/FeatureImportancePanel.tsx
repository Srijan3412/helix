import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { FeatureImportanceItem } from './types';

interface FeatureImportancePanelProps {
  items: FeatureImportanceItem[];
}

export function FeatureImportancePanel({ items }: FeatureImportancePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-zinc-900/90 border border-zinc-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-4 w-72 text-left transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
            <BarChart3 size={13} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-100 leading-tight">Feature Importance</h4>
            <span className="text-[9px] text-zinc-400">Architectural Impact Score</span>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
        >
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="space-y-2.5 mt-3 pt-2.5 border-t border-zinc-800/80">
          {items.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex justify-between text-[10.5px]">
                <span className="font-semibold text-zinc-200 truncate flex-1 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-mono font-bold text-zinc-300 ml-2">
                  {item.impact}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.impact}%`,
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
