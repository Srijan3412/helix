import React from "react";
import { Handle, Position } from "@xyflow/react";
import { FileCode, FileText, Database, Route } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// COMPONENT PROPS
// ─────────────────────────────────────────────────────────────
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
    layer?: string;
    type?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
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
    isDead,
    layer,
    type,
  } = data;

  // ── File Name Extraction ──
  const fileString = file || label || "";
  const filename = fileString.split(/[\\/]/).pop() || fileString;
  const ext = filename.split('.').pop()?.toLowerCase();

  // ── File Type Detection ──
  const isTypeScript = ext === 'ts' || ext === 'tsx';
  const isJavaScript = ext === 'js' || ext === 'jsx';
  const isPython = ext === 'py';
  const isJson = ext === 'json';
  const isMarkdown = ext === 'md' || ext === 'mdx';
  const isConfig = ext === 'yml' || ext === 'yaml' || ext === 'toml';
  const isDatabase = type === 'database' || fileString.includes('DB:') || fileString.includes('ENTITY:');

  // ── Method Color ──
  const getMethodColor = (method?: string) => {
    if (!method) return 'text-zinc-400';
    switch (method.toUpperCase()) {
      case 'GET': return 'text-emerald-400';
      case 'POST': return 'text-blue-400';
      case 'PUT': return 'text-amber-400';
      case 'DELETE': return 'text-rose-400';
      case 'PATCH': return 'text-purple-400';
      default: return 'text-zinc-400';
    }
  };

  // ── Status Icons ──
  const getStatusIcon = () => {
    if (isGod) return '🔥';
    if (isDead) return '💀';
    return '';
  };

  // ── File Icon ──
  const getFileIcon = () => {
    if (isDatabase) {
      return <Database className="w-3.5 h-3.5 shrink-0 text-rose-400" />;
    }
    if (type === 'route' || method) {
      return <Route className="w-3.5 h-3.5 shrink-0 text-blue-400" />;
    }
    if (isTypeScript) {
      return <FileCode className="w-3.5 h-3.5 shrink-0 text-blue-400" />;
    }
    if (isJavaScript) {
      return <FileCode className="w-3.5 h-3.5 shrink-0 text-yellow-400" />;
    }
    if (isJson) {
      return <FileCode className="w-3.5 h-3.5 shrink-0 text-emerald-400" />;
    }
    if (isMarkdown) {
      return <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-400" />;
    }
    if (isConfig) {
      return <FileText className="w-3.5 h-3.5 shrink-0 text-amber-400" />;
    }
    return <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-500" />;
  };

  // ── Get File Type Label ──
  const getFileTypeLabel = () => {
    if (isDatabase) return 'DB';
    if (type === 'route' || method) return 'API';
    if (isTypeScript) return 'TS';
    if (isJavaScript) return 'JS';
    if (isJson) return 'JSON';
    if (isMarkdown) return 'MD';
    if (isConfig) return 'CONFIG';
    return 'FILE';
  };

  // ── Top File Badge Color ──
  const getTopBadgeColor = () => {
    if (isTopFile === true) return 'bg-primary/20 text-primary';
    if (typeof isTopFile === 'number') {
      switch (isTopFile) {
        case 1: return 'bg-amber-500/20 text-amber-400';
        case 2: return 'bg-zinc-500/20 text-zinc-400';
        case 3: return 'bg-amber-700/20 text-amber-600';
        default: return 'bg-primary/10 text-primary';
      }
    }
    return 'bg-primary/10 text-primary';
  };

  return (
    <div
      className={`
        px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary'
          : 'border-border/60 bg-zinc-950/80 hover:bg-zinc-800/80 hover:border-zinc-400'
        }
        ${isTopFile ? 'border-l-2 border-l-primary' : ''}
        min-w-[200px] max-w-[220px]
        group
      `}
    >
      {/* ── Handle (Top) ── */}
      <Handle type="target" position={Position.Top} className="opacity-0" />

      {/* ── File Name with Status Icon ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* File Icon */}
          {getFileIcon()}

          {/* File Name */}
          <span
            className="text-[10.5px] font-mono font-medium truncate max-w-[120px] text-zinc-200"
            title={fileString}
          >
            {filename}
          </span>

          {/* Status Icon (God/Dead) */}
          {getStatusIcon() && (
            <span className="text-[10px] shrink-0" title={isGod ? 'God Service' : 'Dead Code'}>
              {getStatusIcon()}
            </span>
          )}
        </div>

        {/* Top File Badge */}
        {isTopFile && (
          <span className={`
            text-[8px] font-bold uppercase tracking-wider 
            px-1.5 py-0.5 rounded shrink-0
            ${getTopBadgeColor()}
          `}>
            #{typeof isTopFile === 'number' ? isTopFile : 'TOP'}
          </span>
        )}
      </div>

      {/* ── Route Details (if API route) ── */}
      {method && path && (
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[9px] font-bold ${getMethodColor(method)}`}>
            {method.toUpperCase()}
          </span>
          <span className="text-[9px] text-zinc-500 truncate flex-1">
            {path}
          </span>
        </div>
      )}

      {/* ── Metrics Row ── */}
      <div className="flex items-center flex-wrap gap-2 mt-1.5">
        {/* LOC */}
        {loc !== undefined && loc > 0 && (
          <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
            <span className="text-[8px]">📄</span>
            <span className={loc > 300 ? 'text-amber-400' : 'text-zinc-400'}>
              {loc} LOC
            </span>
          </span>
        )}

        {/* Dependencies */}
        {dependencies !== undefined && dependencies > 0 && (
          <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
            <span className="text-[8px]">🔗</span>
            <span className={dependencies > 10 ? 'text-amber-400' : 'text-zinc-400'}>
              {dependencies} deps
            </span>
          </span>
        )}

        {/* Request Rate */}
        {reqPerSecond !== undefined && reqPerSecond > 0 && (
          <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
            <span className="text-[8px]">⚡</span>
            <span className="text-zinc-400">{reqPerSecond} req/s</span>
          </span>
        )}

        {/* Rating */}
        {rating && (
          <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
            <span className="text-[8px]">⭐</span>
            {rating}
          </span>
        )}

        {/* File Type Badge */}
        <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-wider ml-auto shrink-0">
          {getFileTypeLabel()}
        </span>
      </div>

      {/* ── Handle (Bottom) ── */}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}