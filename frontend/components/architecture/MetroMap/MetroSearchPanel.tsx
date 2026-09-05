import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, ChevronRight, RotateCcw } from 'lucide-react';
import { Node, useReactFlow } from '@xyflow/react';
import { stationIconMap, stationColorMap } from './SubwayStationNode';
import { SubwayStationData, StationType } from './types';

interface MetroSearchPanelProps {
  nodes: Node[];
  searchQuery: string;
  onSearch: (query: string) => void;
  onSelectNode: (nodeId: string) => void;
  onClear: () => void;
}

/**
 * Phase 4: Search, Camera & Focus Engine
 * - Floating search input at top-left of canvas
 * - Live station name, role type, and feature matching
 * - Camera centering: reactFlow.setCenter(x, y, { zoom: 1.4, duration: 500 })
 * - Focus state triggering 0.15 opacity on non-matching stations
 */
export function MetroSearchPanel({
  nodes,
  searchQuery,
  onSearch,
  onSelectNode,
  onClear
}: MetroSearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { setCenter } = useReactFlow();

  const matchingNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    return nodes.filter((n) => {
      const data = n.data as unknown as SubwayStationData;
      const label = (data?.label || '').toLowerCase();
      const displayName = (data?.displayName || '').toLowerCase();
      const rawPath = (data?.rawPath || '').toLowerCase();
      const type = (data?.type || '').toLowerCase();
      const lineName = (data?.lineName || '').toLowerCase();
      const features = (data?.features || []).map((f) => f.toLowerCase());

      return (
        label.includes(q) ||
        displayName.includes(q) ||
        rawPath.includes(q) ||
        type.includes(q) ||
        lineName.includes(q) ||
        features.some((f) => f.includes(q))
      );
    });
  }, [nodes, searchQuery]);

  const handleSelect = (node: Node) => {
    onSelectNode(node.id);
    // Camera centering with smooth animation
    setCenter(node.position.x + 85, node.position.y + 45, { zoom: 1.4, duration: 500 });
    setIsOpen(false);
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col w-72 sm:w-80 select-none">
      {/* Search Input Floating Container */}
      <div className="relative flex items-center bg-zinc-900/95 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-md px-3 py-2 text-zinc-100 focus-within:border-primary/80 transition-all">
        <Search size={15} className="text-zinc-400 shrink-0 mr-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search stations, routes, features..."
          className="bg-transparent border-none outline-none text-xs text-zinc-100 placeholder-zinc-500 w-full font-medium"
        />
        {searchQuery ? (
          <button
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className="p-1 text-zinc-400 hover:text-zinc-200 transition"
            title="Clear Search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Live Autocomplete Results Dropdown */}
      {isOpen && searchQuery && (
        <div className="mt-1.5 bg-zinc-900/98 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/40">
            <span>Matching Stations ({matchingNodes.length})</span>
            {matchingNodes.length > 0 && (
              <span className="text-primary font-mono text-[8.5px]">Click to Zoom</span>
            )}
          </div>

          {matchingNodes.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">
              No matching stations or features found
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {matchingNodes.slice(0, 15).map((node) => {
                const data = node.data as unknown as SubwayStationData;
                const Icon = stationIconMap[data.type as StationType] || MapPin;
                const color = stationColorMap[data.type as StationType] || '#6B7280';

                return (
                  <button
                    key={node.id}
                    onClick={() => handleSelect(node)}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-800/80 flex items-center gap-2.5 transition-colors group"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      <Icon size={13} className="text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-200 truncate group-hover:text-primary transition-colors">
                        {data.displayName || data.label}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-zinc-400 mt-0.5">
                        <span className="uppercase font-mono font-medium">{data.type}</span>
                        <span>*</span>
                        <span className="truncate">{data.lineName || data.features?.[0]}</span>
                      </div>
                    </div>

                    <ChevronRight size={13} className="text-zinc-600 group-hover:text-zinc-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
