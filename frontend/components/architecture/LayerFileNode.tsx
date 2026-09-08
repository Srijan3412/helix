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

function formatRouteString(str: string): string {
  if (!str) return "";
  let p = str.trim();
  p = p.replace(/^[`"']|[`"']$/g, "");
  p = p.replace(/\$\{([^}]+)\}/g, ":$1");
  p = p.replace(/\/([a-zA-Z0-9_-]+)::?([a-zA-Z0-9_]+):/g, "/$1/:$2/");
  p = p.replace(/\/([a-zA-Z0-9_-]+)::?([a-zA-Z0-9_]+)\//g, "/$1/:$2/");
  p = p.replace(/\/([a-zA-Z0-9_-]+)::([a-zA-Z0-9_]+)$/g, "/$1/:$2");
  return p;
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
  const rawFilename = fileString.split(/[\\/]/).pop() || fileString;
  const filename = formatRouteString(rawFilename);
  const ext = filename.split(".").pop()?.toLowerCase();

  // ── File Type Detection ──
  const isTypeScript = ext === "ts" || ext === "tsx";
  const isJavaScript = ext === "js" || ext === "jsx";
  const isJson = ext === "json";
  const isMarkdown = ext === "md" || ext === "mdx";
  const isConfig = ext === "yml" || ext === "yaml" || ext === "toml" || ext === "json";
  const isDatabase = type === "database" || fileString.includes("DB:") || fileString.includes("ENTITY:");

  // ── Method Color ──
  const getMethodColor = (m?: string) => {
    if (!m) return "text-zinc-400";
    switch (m.toUpperCase()) {
      case "GET":
        return "text-[#16C7A1]";
      case "POST":
        return "text-[#4B83FF]";
      case "PUT":
        return "text-[#F5B800]";
      case "DELETE":
        return "text-[#FF4D5E]";
      case "PATCH":
        return "text-[#FB923C]";
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
      return <Database className="w-3.5 h-3.5 shrink-0 text-[#16C7A1]" />;
    }
    if (type === "route" || method) {
      return <Route className="w-3.5 h-3.5 shrink-0 text-[#2F80ED]" />;
    }
    if (isTypeScript) {
      return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#60A5FA]" />;
    }
    if (isJavaScript) {
      return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#F5B800]" />;
    }
    if (isJson) {
      return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#34D399]" />;
    }
    if (isMarkdown) {
      return <FileText className="w-3.5 h-3.5 shrink-0 text-[#9BE8E0]" />;
    }
    if (isConfig) {
      return <FileText className="w-3.5 h-3.5 shrink-0 text-[#A78BFA]" />;
    }
    return <FileText className="w-3.5 h-3.5 shrink-0 text-[#8EA9AE]" />;
  };

  // ── Rank Badge Colors ──
  const getRankColor = (r: number) => {
    switch (r) {
      case 1:
        return "bg-[#F5B800]/20 text-[#FFD84D] border border-[#F5B800]/40";
      case 2:
        return "bg-zinc-600/30 text-zinc-200 border border-zinc-500/40";
      case 3:
        return "bg-[#A78BFA]/20 text-[#C19AFF] border border-[#A78BFA]/40";
      default:
        return "bg-[#16C7A1]/12 text-[#9BE8E0] border border-[#16C7A1]/25";
    }
  };

  const displayPath = path ? formatRouteString(path) : "";

  return (
    <div
      className={`
        flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer
        transition-all duration-150 text-[11px] group select-none
        ${isSelected
          ? "bg-[#16C7A1]/15 border border-[#16C7A1]/40 ring-1 ring-[#16C7A1]/30"
          : "hover:bg-white/5 border border-transparent hover:border-white/10"
        }
      `}
      onClick={onClick}
    >
      {/* ── Rank Badge ── */}
      <span
        className={`
          text-[9px] font-bold w-6 text-center rounded-md px-1 py-0.5 shrink-0 font-mono
          ${getRankColor(rank)}
        `}
      >
        #{rank}
      </span>

      {/* ── File Icon ── */}
      {getFileIcon()}

      {/* ── File Name ── */}
      <span
        className="font-mono text-[11px] text-[#F7FAFA] truncate max-w-[150px]"
        title={fileString}
      >
        {filename}
      </span>

      {/* ── Status Icons ── */}
      {getStatusIcon() && (
        <span className="text-[11px] shrink-0" title={isGod ? "God Service" : "Dead Code"}>
          {getStatusIcon()}
        </span>
      )}

      {/* ── Route Details (if API route) ── */}
      {method && (
        <span className={`text-[9px] font-bold font-mono px-1 py-0.2 rounded shrink-0 ${getMethodColor(method)}`}>
          {method.toUpperCase()}
        </span>
      )}
      {displayPath && (
        <span className="text-[9px] font-mono text-[#8EA9AE] truncate max-w-[80px]" title={displayPath}>
          {displayPath}
        </span>
      )}

      {/* ── Metrics (single-line, compact) ── */}
      <div className="flex items-center gap-2 ml-auto shrink-0 font-mono text-[10px]">
        {/* LOC */}
        {loc !== undefined && loc > 0 && (
          <span className="flex items-center gap-0.5 text-[#8EA9AE]">
            <span>📄</span>
            <span className={loc > 300 ? "text-[#F5B800] font-bold" : "text-[#C3D5D8]"}>{loc}</span>
          </span>
        )}

        {/* Dependencies */}
        {dependencies !== undefined && dependencies > 0 && (
          <span className="flex items-center gap-0.5 text-[#8EA9AE]">
            <span>🔗</span>
            <span className={dependencies > 10 ? "text-[#FF4D5E] font-bold" : "text-[#C3D5D8]"}>
              {dependencies}
            </span>
          </span>
        )}

        {/* Request Rate */}
        {reqPerSecond !== undefined && reqPerSecond > 0 && (
          <span className="flex items-center gap-0.5 text-[#8EA9AE]">
            <span>⚡</span>
            <span className="text-[#9BE8E0]">{reqPerSecond}</span>
          </span>
        )}

        {/* Rating */}
        {rating && (
          <span className="flex items-center gap-0.5 text-[#FFD84D]">
            <Star className="w-2.5 h-2.5 fill-[#FFD84D] text-[#FFD84D]" />
            {rating}
          </span>
        )}
      </div>
    </div>
  );
}