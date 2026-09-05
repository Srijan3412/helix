// frontend/components/architecture/MetroMap/TrackHeaderNode.tsx

import React, { memo } from 'react';

export interface TrackHeaderNodeData {
  id: string;
  name: string;
  color: string;
  stationCount: number;
  lineNumber: string;
  health?: number;
}

export interface TrackHeaderNodeProps {
  data: TrackHeaderNodeData;
  selected?: boolean;
}

const TrackHeaderNodeComponent = ({ data }: TrackHeaderNodeProps) => {
  const { name, color, stationCount, lineNumber } = data;
  const stationText = stationCount === 1 ? '1 station' : `${stationCount} stations`;

  return (
    <div className="select-none pointer-events-none text-left py-1 min-w-[240px]">
      {/* Title Row: Indicator dot + Track Name */}
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full shrink-0 inline-block shadow-md"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}90`
          }}
        />
        <h3 className="text-[15px] font-bold text-white tracking-wider uppercase font-mono leading-none m-0 p-0 drop-shadow-sm">
          {name}
        </h3>
      </div>

      {/* Metadata Row */}
      <div className="mt-1.5 pl-5 flex items-center gap-2">
        <span className="text-[11px] font-mono text-zinc-400 tracking-wide font-medium">
          {stationText} · LINE {lineNumber}
        </span>
      </div>
    </div>
  );
};

export const TrackHeaderNode = memo(TrackHeaderNodeComponent);
export default TrackHeaderNode;
