import React, { useState, useMemo, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { Search, X, Train, ChevronRight } from 'lucide-react';
import { SubwayStationData } from './types';
import { stationIconMap, stationColorMap } from './SubwayStationNode';
import { LAYER_CONFIG } from './layerDetector';

interface MetroSearchPanelProps {
  nodes: Node[];
  searchQuery: string;
  onSearch: (query: string) => void;
  onSelectNode: (nodeId: string) => void;
  onClear: () => void;
  className?: string;
}

export function MetroSearchPanel({
  nodes,
  searchQuery,
  onSearch,
  onSelectNode,
  onClear,
  className = ''
}: MetroSearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();

    return nodes
      .map((n) => ({
        node: n,
        data: n.data as unknown as SubwayStationData
      }))
      .filter(({ data }) => {
        return (
          data.label?.toLowerCase().includes(q) ||
          data.displayName?.toLowerCase().includes(q) ||
          data.name?.toLowerCase().includes(q) ||
          data.type?.toLowerCase().includes(q) ||
          data.layer?.toLowerCase().includes(q) ||
          data.lineName?.toLowerCase().includes(q) ||
          data.features?.some((f) => f.toLowerCase().includes(q))
        );
      })
      .slice(0, 10);
  }, [nodes, searchQuery]);

  const handleSelect = useCallback(
    (nodeId: string) => {
      onSelectNode(nodeId);
      setIsOpen(false);
    },
    [onSelectNode]
  );

  return (
    <div className={`relative ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center bg-zinc-950/70 border border-zinc-700/70 rounded-lg shadow-sm focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 transition">
        <Search size={12} className="ml-2.5 text-zinc-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search stations, files, layers..."
          className="w-full bg-transparent px-2.5 py-1 text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className="mr-2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Auto-suggest Results Dropdown */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-zinc-900/98 backdrop-blur-xl border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden divide-y divide-zinc-800/80 max-h-64 overflow-y-auto">
          {searchResults.map(({ node, data }) => {
            const Icon = stationIconMap[data.type] || Train;
            const color = stationColorMap[data.type] || '#6B7280';
            const layerConfig = LAYER_CONFIG[data.layer] || LAYER_CONFIG.utility;

            return (
              <button
                key={node.id}
                onClick={() => handleSelect(node.id)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-zinc-800/80 transition group"
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  <Icon size={11} className="text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold text-zinc-100 group-hover:text-primary transition truncate">
                    {data.displayName || data.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] text-zinc-400 font-mono">
                    <span className="uppercase">{data.type}</span>
                    <span>•</span>
                    <span style={{ color: data.color }}>{data.lineName || data.features?.[0]}</span>
                    <span>•</span>
                    <span className="text-zinc-400">
                      {layerConfig.emoji} {layerConfig.label}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  size={12}
                  className="text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition shrink-0"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
