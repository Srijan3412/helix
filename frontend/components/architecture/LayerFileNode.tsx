import React from "react";
import { FileCode, FileText, Database, Route, Star } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// COMPONENT PROPS
// ─────────────────────────────────────────────────────────────
interface LayerFileRowProps {
  rank: number;
  name: string;
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
  onClick?: () => void;
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT - Single-line row (not ReactFlow node)
// ─────────────────────────────────────────────────────────────
export default function LayerFileRow({
  rank,
  name,
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
  type,
  onClick,
}: LayerFileRowProps) {
  // ── File Name Extraction ──
  const fileString = name || "";
  const filename = fileString.split(/[\\/]/).pop() || fileString;
  const ext = filename.split(".").pop()?.toLowerCase();

  // ── File Type Detection ──
  const isTypeScript = ext === "ts" || ext === "tsx";
  const isJavaScript = ext === "js" || ext === "jsx";
  const isJson = ext === "json";
  const isMarkdown = ext === "md" || ext === "mdx";
  const isConfig = ext === "yml" || ext === "yaml" || ext === "toml" || ext === "json";
  const isDatabase = type === "database" || fileString.includes("DB:") || fileString.includes("ENTITY:");

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

  // ── Status Icons ──
  const getStatusIcon = () => {
    if (isGod) return "🔥";
    if (isDead) return "💀";
    return "";
  };

  // ── File Icon ──
  const getFileIcon = () => {
    if (isDatabase) {
      return <Database className="w-3 h-3 shrink-0 text-rose-400" />;
    }
    if (type === "route" || method) {
      return <Route className="w-3 h-3 shrink-0 text-blue-400" />;
    }
    if (isTypeScript) {
      return <FileCode className="w-3 h-3 shrink-0 text-blue-400" />;
    }
    if (isJavaScript) {
      return <FileCode className="w-3 h-3 shrink-0 text-yellow-400" />;
    }
    if (isJson) {
      return <FileCode className="w-3 h-3 shrink-0 text-emerald-400" />;
    }
    if (isMarkdown) {
      return <FileText className="w-3 h-3 shrink-0 text-zinc-400" />;
    }
    if (isConfig) {
      return <FileText className="w-3 h-3 shrink-0 text-amber-400" />;
    }
    return <FileText className="w-3 h-3 shrink-0 text-zinc-500" />;
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

  // ── Is this a route file? ──
  const isRoute = type === "route" || !!method;

  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
        transition-all duration-150 text-[10px] group
        ${isSelected
          ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20"
          : "hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/50"
        }
      `}
      onClick={onClick}
    >
      {/* ── Rank Badge ── */}
      <span
        className={`
          text-[8px] font-bold w-5 text-center rounded px-1 py-0.5 shrink-0
          ${getRankColor(rank)}
        `}
      >
        #{rank}
      </span>

      {/* ── File Icon ── */}
      {getFileIcon()}

      {/* ── File Name ── */}
      <span
        className="font-mono text-[10px] text-zinc-200 truncate max-w-[100px]"
        title={fileString}
      >
        {filename}
      </span>

      {/* ── Status Icons ── */}
      {getStatusIcon() && (
        <span className="text-[10px] shrink-0" title={isGod ? "God Service" : "Dead Code"}>
          {getStatusIcon()}
        </span>
      )}

      {/* ── Route Details (if API route) ── */}
      {method && path && (
        <>
          <span className={`text-[8px] font-bold ${getMethodColor(method)} shrink-0`}>
            {method.toUpperCase()}
          </span>
          <span className="text-[8px] text-zinc-500 truncate max-w-[60px]">{path}</span>
        </>
      )}

      {/* ── Metrics (single-line, compact) ── */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        {/* LOC */}
        {loc !== undefined && loc > 0 && (
          <span className="flex items-center gap-0.5 text-[8px] text-zinc-500">
            <span>📄</span>
            <span className={loc > 300 ? "text-amber-400" : "text-zinc-400"}>{loc}</span>
          </span>
        )}

        {/* Dependencies */}
        {dependencies !== undefined && dependencies > 0 && (
          <span className="flex items-center gap-0.5 text-[8px] text-zinc-500">
            <span>🔗</span>
            <span className={dependencies > 10 ? "text-amber-400" : "text-zinc-400"}>
              {dependencies}
            </span>
          </span>
        )}

        {/* Request Rate */}
        {reqPerSecond !== undefined && reqPerSecond > 0 && (
          <span className="flex items-center gap-0.5 text-[8px] text-zinc-500">
            <span>⚡</span>
            <span className="text-zinc-400">{reqPerSecond}</span>
          </span>
        )}

        {/* Rating */}
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