import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "../ui/badge";
import {
  Shield,
  Network,
  Terminal,
  Layers,
  Database,
  Settings,
  CheckCircle,
  Wrench,
  ChevronDown,
  ChevronRight,
  FileText,
  FileCode,
  Route,
  Zap,
  Star,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// LAYER ICONS
// ─────────────────────────────────────────────────────────────
const LAYER_ICONS: Record<string, React.ReactNode> = {
  Routes: <Network className="w-4.5 h-4.5" />,
  Controllers: <Terminal className="w-4.5 h-4.5" />,
  Services: <Layers className="w-4.5 h-4.5" />,
  Repositories: <Shield className="w-4.5 h-4.5" />,
  Models: <Layers className="w-4.5 h-4.5" />,
  Middleware: <Shield className="w-4.5 h-4.5" />,
  Config: <Settings className="w-4.5 h-4.5" />,
  Tests: <CheckCircle className="w-4.5 h-4.5" />,
  Utils: <Wrench className="w-4.5 h-4.5" />,
  Database: <Database className="w-4.5 h-4.5" />,
};

// ─────────────────────────────────────────────────────────────
// LAYER THEMES
// ─────────────────────────────────────────────────────────────
const LAYER_THEMES: Record<
  string,
  { bg: string; border: string; text: string; accent: string }
> = {
  Routes: {
    bg: "bg-blue-950/40",
    border: "border-blue-500/50",
    text: "text-blue-300",
    accent: "blue",
  },
  Controllers: {
    bg: "bg-purple-950/40",
    border: "border-purple-500/50",
    text: "text-purple-300",
    accent: "purple",
  },
  Services: {
    bg: "bg-amber-950/40",
    border: "border-amber-500/50",
    text: "text-amber-300",
    accent: "amber",
  },
  Repositories: {
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/50",
    text: "text-emerald-300",
    accent: "emerald",
  },
  Models: {
    bg: "bg-teal-950/40",
    border: "border-teal-500/50",
    text: "text-teal-300",
    accent: "teal",
  },
  Middleware: {
    bg: "bg-indigo-950/40",
    border: "border-indigo-500/50",
    text: "text-indigo-300",
    accent: "indigo",
  },
  Config: {
    bg: "bg-slate-950/40",
    border: "border-slate-500/50",
    text: "text-slate-300",
    accent: "slate",
  },
  Tests: {
    bg: "bg-lime-950/40",
    border: "border-lime-500/50",
    text: "text-lime-300",
    accent: "lime",
  },
  Utils: {
    bg: "bg-cyan-950/40",
    border: "border-cyan-500/50",
    text: "text-cyan-300",
    accent: "cyan",
  },
  Database: {
    bg: "bg-rose-950/40",
    border: "border-rose-500/50",
    text: "text-rose-300",
    accent: "rose",
  },
};

// ─────────────────────────────────────────────────────────────
// FILE ROW COMPONENT (Internal)
// ─────────────────────────────────────────────────────────────
interface FileRowProps {
  rank: number;
  name: string;
  method?: string;
  path?: string;
  loc?: number;
  deps?: number;
  reqPerSecond?: number;
  rating?: string;
  isGod?: boolean;
  isDead?: boolean;
  isRoute?: boolean;
  isDatabase?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}

function FileRow({
  rank,
  name,
  method,
  path,
  loc,
  deps,
  reqPerSecond,
  rating,
  isGod,
  isDead,
  isRoute,
  isDatabase,
  onClick,
  isSelected,
}: FileRowProps) {
  // ── Method Color ──
  const getMethodColor = (method?: string) => {
    if (!method) return "text-zinc-400";
    switch (method.toUpperCase()) {
      case "GET":
        return "text-emerald-400";
      case "POST":
        return "text-blue-400";
      case "PUT":
        return "text-amber-400";
      case "DELETE":
        return "text-rose-400";
      case "PATCH":
        return "text-purple-400";
      default:
        return "text-zinc-400";
    }
  };

  // ── Rank Badge Colors ──
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case 2:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
      case 3:
        return "bg-amber-700/20 text-amber-600 border-amber-700/30";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  // ── File Icon ──
  const getFileIcon = () => {
    if (isDatabase) {
      return <Database className="w-3 h-3 shrink-0 text-rose-400" />;
    }
    if (isRoute || method) {
      return <Route className="w-3 h-3 shrink-0 text-blue-400" />;
    }
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "ts" || ext === "tsx") {
      return <FileCode className="w-3 h-3 shrink-0 text-blue-400" />;
    }
    if (ext === "js" || ext === "jsx") {
      return <FileCode className="w-3 h-3 shrink-0 text-yellow-400" />;
    }
    return <FileText className="w-3 h-3 shrink-0 text-zinc-500" />;
  };

  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
        transition-all duration-150 text-[10px]
        ${isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/50"
        }
      `}
      onClick={onClick}
    >
      {/* Rank Badge */}
      <span
        className={`
          text-[8px] font-bold w-5 text-center rounded px-1 py-0.5
          ${getRankColor(rank)}
        `}
      >
        #{rank}
      </span>

      {/* File Icon */}
      {getFileIcon()}

      {/* File Name */}
      <span className="font-mono text-[10px] text-zinc-200 truncate max-w-[100px]" title={name}>
        {name}
      </span>

      {/* Status Icons */}
      {isGod && <span className="text-[10px]" title="God Service">🔥</span>}
      {isDead && <span className="text-[10px]" title="Dead Code">💀</span>}

      {/* Route Details */}
      {method && path && (
        <>
          <span className={`text-[8px] font-bold ${getMethodColor(method)}`}>
            {method.toUpperCase()}
          </span>
          <span className="text-[8px] text-zinc-500 truncate max-w-[60px]">{path}</span>
        </>
      )}

      {/* Metrics */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        {loc !== undefined && loc > 0 && (
          <span className="flex items-center gap-0.5 text-[8px] text-zinc-500">
            <span>📄</span>
            <span className={loc > 300 ? "text-amber-400" : "text-zinc-400"}>{loc}</span>
          </span>
        )}
        {deps !== undefined && deps > 0 && (
          <span className="flex items-center gap-0.5 text-[8px] text-zinc-500">
            <span>🔗</span>
            <span className={deps > 10 ? "text-amber-400" : "text-zinc-400"}>{deps}</span>
          </span>
        )}
        {reqPerSecond !== undefined && reqPerSecond > 0 && (
          <span className="flex items-center gap-0.5 text-[8px] text-zinc-500">
            <span>⚡</span>
            <span className="text-zinc-400">{reqPerSecond}</span>
          </span>
        )}
        {rating && (
          <span className="flex items-center gap-0.5 text-[8px] text-amber-400">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            {rating}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
interface LayerNodeProps {
  data: {
    label: string;
    count: number;
    isExpanded?: boolean;
    health?: number;
    confidence?: number;
    hasMore?: boolean;
    visibleCount?: number;
    totalFiles?: number;
    onShowMore?: () => void;
    onToggle?: () => void;
    files?: Array<{
      id: string;
      name: string;
      method?: string;
      path?: string;
      loc?: number;
      deps?: number;
      reqPerSecond?: number;
      rating?: string;
      isGod?: boolean;
      isDead?: boolean;
      isRoute?: boolean;
      isDatabase?: boolean;
      isSelected?: boolean;
      onSelect?: () => void;
    }>;
    key?: string;
  };
}

export default function LayerNode({ data }: LayerNodeProps) {
  const {
    label,
    count,
    isExpanded = true,
    health,
    confidence,
    hasMore,
    visibleCount,
    totalFiles,
    onShowMore,
    onToggle,
    files = [],
  } = data;

  const theme = LAYER_THEMES[label] || LAYER_THEMES.Services;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  // ── Health Color ──
  const getHealthColor = (value: number) => {
    if (value > 70) return "text-emerald-400";
    if (value > 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getHealthBg = (value: number) => {
    if (value > 70) return "bg-emerald-400";
    if (value > 40) return "bg-amber-400";
    return "bg-rose-400";
  };

  // ── Display files (top N) ──
  const displayFiles = files.slice(0, visibleCount || 5);

  return (
    <div
      className={`
        p-4 rounded-2xl border bg-zinc-900/90 backdrop-blur-md
        transition-all duration-300 shadow-xl min-w-[320px] max-w-[400px]
        ${theme.border}
        hover:shadow-2xl hover:border-opacity-80
      `}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />

      {/* ── HEADER: Icon + Name | Count + Toggle ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.bg} ${theme.text}`}>
            {LAYER_ICONS[label] || <Layers className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">{label}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-zinc-400">📄 {count} files</span>
              <span className="text-[10px] text-zinc-600">•</span>
              <span className="text-[10px] text-zinc-400">
                📊 Top {Math.min(visibleCount || count, count)} shown
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Button (replaces "Expanded/View" badge) */}
        <button
          onClick={toggleCollapse}
          className={`
            p-1.5 rounded-lg transition-all duration-200
            hover:bg-zinc-800/60 text-zinc-400 hover:text-white
            ${isCollapsed ? "rotate-0" : "rotate-180"}
          `}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* ── HEALTH & CONFIDENCE (Combined Row) ── */}
      {(health !== undefined || confidence !== undefined) && (
        <div className="mt-3 space-y-1">
          {health !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-zinc-400 w-11 font-medium">HEALTH</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out ${getHealthBg(health)}`}
                  style={{ width: `${Math.min(100, Math.max(0, health))}%` }}
                />
              </div>
              <span className={`text-[9px] font-bold w-10 text-right ${getHealthColor(health)}`}>
                {Math.round(health)}%
              </span>
            </div>
          )}
          {confidence !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-zinc-400 w-11 font-medium">CONF</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-primary w-10 text-right">
                {Math.round(confidence)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── DIVIDER ── */}
      <div className="mt-3 border-t border-border/30" />

      {/* ── FILE LIST ── */}
      {!isCollapsed && displayFiles.length > 0 && (
        <div className="mt-3 space-y-1">
          {/* "Top 5 {Layer}" Header */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">
              📌 Top {Math.min(displayFiles.length, 5)} {label}
            </span>
          </div>

          {/* File Rows */}
          <div className="space-y-0.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
            {displayFiles.map((file, index) => (
              <FileRow
                key={file.id || index}
                rank={index + 1}
                name={file.name}
                method={file.method}
                path={file.path}
                loc={file.loc}
                deps={file.deps}
                reqPerSecond={file.reqPerSecond}
                rating={file.rating}
                isGod={file.isGod}
                isDead={file.isDead}
                isRoute={file.isRoute}
                isDatabase={file.isDatabase}
                isSelected={file.isSelected}
                onClick={file.onSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── SHOW MORE BUTTON ── */}
      {!isCollapsed && hasMore && totalFiles && totalFiles > 0 && (
        <div className="mt-3 pt-2 border-t border-border/30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowMore?.();
            }}
            className="
              w-full text-[9px] text-primary hover:text-primary/80
              font-medium flex items-center justify-center gap-1.5
              py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10
              transition-all duration-200
            "
          >
            <span>📂</span>
            View {Math.min(totalFiles - (visibleCount || 5), 5)} More Files
            <span className="text-[7px] text-zinc-500">
              ({totalFiles - (visibleCount || 5)} remaining)
            </span>
          </button>
        </div>
      )}

      {/* ── "All files loaded" message ── */}
      {!isCollapsed && !hasMore && totalFiles && totalFiles > 0 && (
        <div className="mt-3 pt-2 border-t border-border/30">
          <span className="text-[8px] text-zinc-500 flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            All {totalFiles} files visible
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}