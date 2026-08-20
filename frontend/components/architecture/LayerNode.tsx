import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "../ui/badge";
import { Shield, Network, Terminal, Layers, Database, Settings, CheckCircle, Wrench } from "lucide-react";

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

const LAYER_THEMES: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  Routes: { bg: "bg-blue-950/40", border: "border-blue-500/50", text: "text-blue-300", accent: "blue" },
  Controllers: { bg: "bg-purple-950/40", border: "border-purple-500/50", text: "text-purple-300", accent: "purple" },
  Services: { bg: "bg-amber-950/40", border: "border-amber-500/50", text: "text-amber-300", accent: "amber" },
  Repositories: { bg: "bg-emerald-950/40", border: "border-emerald-500/50", text: "text-emerald-300", accent: "emerald" },
  Models: { bg: "bg-teal-950/40", border: "border-teal-500/50", text: "text-teal-300", accent: "teal" },
  Middleware: { bg: "bg-indigo-950/40", border: "border-indigo-500/50", text: "text-indigo-300", accent: "indigo" },
  Config: { bg: "bg-slate-950/40", border: "border-slate-500/50", text: "text-slate-300", accent: "slate" },
  Tests: { bg: "bg-lime-950/40", border: "border-lime-500/50", text: "text-lime-300", accent: "lime" },
  Utils: { bg: "bg-cyan-950/40", border: "border-cyan-500/50", text: "text-cyan-300", accent: "cyan" },
  Database: { bg: "bg-rose-950/40", border: "border-rose-500/50", text: "text-rose-300", accent: "rose" },
};

export default function LayerNode({ data }: { data: any }) {
  const { label, count, isExpanded, health, confidence, hasMore, visibleCount, totalFiles, onShowMore } = data;
  const theme = LAYER_THEMES[label] || LAYER_THEMES.Services;

  return (
    <div className={`p-4 rounded-2xl border bg-zinc-900/90 backdrop-blur-md transition-all duration-300 shadow-xl min-w-[260px] ${theme.border}`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />

      {/* Header: Layer Name + File Count */}
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
              <span className="text-[10px] text-zinc-400">📊 Top {visibleCount || count} shown</span>
            </div>
          </div>
        </div>
        <Badge className={`text-[9px] uppercase tracking-wider font-bold shrink-0 ${isExpanded ? "bg-primary text-background" : "bg-zinc-800 text-zinc-400"
          }`}>
          {isExpanded ? "Expanded" : "View"}
        </Badge>
      </div>

      {/* Health & Confidence Section */}
      {(health !== undefined || confidence !== undefined) && (
        <div className="mt-3 space-y-1.5">
          {health !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">HEALTH</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${health > 70 ? 'bg-emerald-400' :
                      health > 40 ? 'bg-amber-400' :
                        'bg-rose-400'
                    }`}
                  style={{ width: `${Math.min(100, Math.max(0, health))}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold w-12 text-right ${health > 70 ? 'text-emerald-400' :
                  health > 40 ? 'text-amber-400' :
                    'text-rose-400'
                }`}>
                {Math.round(health)}%
              </span>
            </div>
          )}
          {confidence !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">CONF</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-primary w-12 text-right">
                {Math.round(confidence)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="mt-3 border-t border-border/30" />

      {/* Show More Button */}
      {hasMore && totalFiles > 0 && (
        <div className="mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowMore?.();
            }}
            className="w-full text-[10px] text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition"
          >
            📂 View {Math.min(totalFiles - (visibleCount || 5), 5)} More Files
            <span className="text-[8px] text-zinc-500">
              ({totalFiles - (visibleCount || 5)} remaining)
            </span>
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
