import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import LayerFileRow from "./LayerFileNode";
import { getLayerTheme, getLayerIcon } from "./layerTheme";
import {
  ChevronDown,
  CheckCircle,
} from "lucide-react";

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
    isSelected?: boolean;
    trackName?: string;
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
    isSelected = false,
    trackName,
    onShowMore,
    onToggle,
    files = [],
  } = data;

  const theme = getLayerTheme(label);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  // ── Health Color (Semantic: Green / Amber / Rose) ──
  const getHealthColor = (value: number) => {
    if (value > 70) return "text-[#34D399]";
    if (value > 40) return "text-[#F5B800]";
    return "text-[#FF4D5E]";
  };

  const getHealthBg = (value: number) => {
    if (value > 70) return "bg-[#34D399]";
    if (value > 40) return "bg-[#F5B800]";
    return "bg-[#FF4D5E]";
  };

  // ── Display files (top N) ──
  const displayFiles = files.slice(0, visibleCount || 5);

  return (
    <div
      className={`
        p-4.5 rounded-[18px] backdrop-blur-md transition-all duration-200 shadow-2xl min-w-[390px] max-w-[440px] text-left select-none relative group
        ${isSelected
          ? "ring-2 ring-[#9BE8E0] shadow-teal-950/80 scale-[1.02]"
          : "hover:scale-[1.01] hover:shadow-cyan-950/40"
        }
      `}
      style={{
        backgroundColor: "rgba(5, 30, 36, 0.94)",
        border: `1.5px solid ${theme.primary}B0`,
        borderLeft: `5px solid ${theme.primary}`,
        boxShadow: isSelected
          ? `0 0 24px ${theme.primary}40, 0 12px 30px rgba(0,0,0,0.6)`
          : `0 8px 24px rgba(0,0,0,0.5)`,
      }}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 !w-2 !h-2" />

      {/* ── HEADER: Icon Square + Name + Badge + Toggle ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Dark Icon Container with Bright Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner"
            style={{
              backgroundColor: theme.iconBg,
              color: theme.iconColor,
            }}
          >
            {getLayerIcon(label, "w-5 h-5")}
          </div>

          <div className="min-w-0">
            <h4 className="text-[15px] font-bold text-[#F7FAFA] tracking-wide truncate">
              {label}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#A8CBD0]">
              <span>📄 {count} files</span>
              <span className="text-zinc-600">•</span>
              <span>📊 Top {Math.min(visibleCount || count, count)} shown</span>
            </div>
          </div>
        </div>

        {/* Right side: Category Badge + Toggle Collapse Button */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase"
            style={{
              backgroundColor: `${theme.primary}20`,
              borderColor: `${theme.primary}40`,
              color: theme.bright,
            }}
          >
            {theme.badge}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            className={`
              p-1 rounded-lg transition-all duration-200 text-[#8EA9AE] hover:text-[#F7FAFA] hover:bg-[#084C58]/60 cursor-pointer
              ${isCollapsed ? "rotate-0" : "rotate-180"}
            `}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── HEALTH & CONFIDENCE (Semantic & Independent) ── */}
      {(health !== undefined || confidence !== undefined) && (
        <div className="mt-3.5 space-y-1.5 bg-[#031E24]/60 p-2.5 rounded-xl border border-white/5">
          {health !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8EA9AE] w-12 font-medium tracking-wider">HEALTH</span>
              <div className="flex-1 h-2 bg-[#062A32] rounded-full overflow-hidden p-[1px]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${getHealthBg(health)}`}
                  style={{ width: `${Math.min(100, Math.max(0, health))}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold w-9 text-right ${getHealthColor(health)}`}>
                {Math.round(health)}%
              </span>
            </div>
          )}
          {confidence !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8EA9AE] w-12 font-medium tracking-wider">CONF</span>
              <div className="flex-1 h-2 bg-[#062A32] rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full rounded-full bg-[#16C7A1] transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[#16C7A1] w-9 text-right">
                {Math.round(confidence)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── DIVIDER ── */}
      <div className="mt-3 border-t border-white/10" />

      {/* ── FILE LIST ── */}
      {!isCollapsed && displayFiles.length > 0 && (
        <div className="mt-3 space-y-1">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8EA9AE]">
              📌 Top {Math.min(displayFiles.length, 5)} {label}
            </span>
            {trackName && (
              <span className="text-[9px] font-medium text-[#9BE8E0]">
                ● {trackName}
              </span>
            )}
          </div>

          {/* File Rows */}
          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1 analysis-scrollbar">
            {displayFiles.map((file, index) => (
              <LayerFileRow
                key={file.id || index}
                rank={index + 1}
                name={file.name}
                method={file.method}
                path={file.path}
                loc={file.loc}
                dependencies={file.deps}
                reqPerSecond={file.reqPerSecond}
                rating={file.rating}
                isGod={file.isGod}
                isDead={file.isDead}
                type={file.isRoute ? "route" : file.isDatabase ? "database" : "file"}
                isSelected={file.isSelected}
                onClick={file.onSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── NO FILES STATE ── */}
      {!isCollapsed && displayFiles.length === 0 && (
        <div className="mt-3 text-center py-4 text-[#8EA9AE] text-xs">
          No files identified in this layer
        </div>
      )}

      {/* ── SHOW MORE BUTTON ── */}
      {!isCollapsed && hasMore && totalFiles && totalFiles > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowMore?.();
            }}
            className="
              w-full text-[11px] font-semibold flex items-center justify-center gap-2
              py-2 rounded-xl border transition-all duration-200 cursor-pointer
            "
            style={{
              backgroundColor: `${theme.primary}18`,
              borderColor: `${theme.primary}40`,
              color: theme.bright,
            }}
          >
            <span>📂</span>
            View {Math.min(totalFiles - (visibleCount || 5), 5)} More Files
            <span className="text-[10px] opacity-75">
              ({totalFiles - (visibleCount || 5)} remaining)
            </span>
          </button>
        </div>
      )}

      {/* ── ALL FILES VISIBLE MESSAGE ── */}
      {!isCollapsed && !hasMore && totalFiles && totalFiles > 0 && (
        <div className="mt-2.5 pt-2 border-t border-white/10">
          <span className="text-[10px] text-[#8EA9AE] flex items-center justify-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#16C7A1]" />
            All {totalFiles} files visible
          </span>
        </div>
      )}

      {/* ── BOTTOM LAYER IDENTITY PILL ── */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: theme.bright }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
          {label}
        </span>
        <span className="text-[10px] text-[#8EA9AE] font-mono">
          {theme.category}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0 !w-2 !h-2" />
    </div>
  );
}