import React from "react";
import { Handle, Position } from "@xyflow/react";
import { FileCode } from "lucide-react";

interface LayerFileNodeProps {
  data: {
    file: string;
    label: string;
    method?: string;
    path?: string;
    reqPerSecond?: number;
    loc?: number;
    dependencies?: number;
    rating?: string;
    isTopFile?: boolean;
    isSelected?: boolean;
    isGod?: boolean;
    isDead?: boolean;
    complexity?: number;
  };
}

export default function LayerFileNode({ data }: LayerFileNodeProps) {
  const {
    file,
    label,
    method,
    path,
    reqPerSecond,
    loc,
    dependencies,
    rating,
    isTopFile,
    isSelected,
    isGod,
    isDead
  } = data;

  const fileString = file || label || "";
  const filename = fileString.split(/[\\/]/).pop() || fileString;
  const ext = filename.split('.').pop()?.toLowerCase();
  const isTypeScript = ext === 'ts' || ext === 'tsx';
  const isJavaScript = ext === 'js' || ext === 'jsx';

  const getMethodColor = (method?: string) => {
    if (!method) return 'text-zinc-400';
    switch(method.toUpperCase()) {
      case 'GET': return 'text-emerald-400';
      case 'POST': return 'text-blue-400';
      case 'PUT': return 'text-amber-400';
      case 'DELETE': return 'text-rose-400';
      default: return 'text-zinc-400';
    }
  };

  const getStatusIcon = () => {
    if (isGod) return '🔥';
    if (isDead) return '💀';
    return '';
  };

  return (
    <div className={`
      px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer
      ${isSelected
        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
        : 'border-border/60 bg-zinc-950/80 hover:bg-zinc-800/80 hover:border-zinc-400'
      }
      ${isTopFile ? 'border-l-4 border-l-primary' : ''}
      min-w-[200px]
    `}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {/* File Name with Status Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isTypeScript ? 'text-blue-400' :
              isJavaScript ? 'text-yellow-400' :
                'text-zinc-500'
            }`} />
          <span className="text-[10.5px] font-mono font-bold truncate max-w-[120px]" title={fileString}>
            {filename}
          </span>
          {getStatusIcon() && (
            <span className="text-[10px]">{getStatusIcon()}</span>
          )}
        </div>
        {isTopFile && (
          <span className="text-[8px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">
            Top
          </span>
        )}
      </div>

      {/* Route Details */}
      {method && path && (
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[9px] font-bold ${getMethodColor(method)}`}>
            {method.toUpperCase()}
          </span>
          <span className="text-[9px] text-zinc-500 truncate">{path}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-zinc-500">
        {loc !== undefined && (
          <span className="flex items-center gap-0.5">
            📄 {loc} LOC
          </span>
        )}
        {dependencies !== undefined && (
          <span className="flex items-center gap-0.5">
            🔗 {dependencies} deps
          </span>
        )}
        {reqPerSecond !== undefined && (
          <span className="flex items-center gap-0.5">
            ⚡ {reqPerSecond} req/s
          </span>
        )}
        {rating && (
          <span className="flex items-center gap-0.5 text-amber-400">
            ⭐ {rating}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
