"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitCompare, 
  Loader2, 
  ArrowRight, 
  PlusCircle, 
  MinusCircle, 
  Settings, 
  ArrowUpRight, 
  FileCode, 
  Route, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Calendar
} from "lucide-react";
import { compareScans } from "../lib/api/client";
import { DiffReport } from "@shared/types";

interface ScanComparisonProps {
  baselineId: string;
  compareId: string;
  onClose?: () => void;
}

export default function ScanComparison({ baselineId, compareId, onClose }: ScanComparisonProps) {
  const [diffReport, setDiffReport] = useState<DiffReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion state
  const [expandedSection, setExpandedSection] = useState<"files" | "routes" | "layers" | null>("files");

  useEffect(() => {
    loadComparison();
  }, [baselineId, compareId]);

  const loadComparison = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await compareScans(baselineId, compareId);
      setDiffReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare scans");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/20 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <span className="text-xs text-zinc-500 font-semibold">Generating comparison report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 border border-rose-900/30 bg-rose-950/10 rounded-xl max-w-lg mx-auto">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3 animate-bounce" />
        <h4 className="text-sm font-semibold text-rose-400">Comparison Failed</h4>
        <p className="text-xs text-zinc-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!diffReport) return null;

  const { baseline, compare, changes } = diffReport;

  const renderSectionHeader = (title: string, icon: React.ReactNode, addedCount: number, removedCount: number, modifiedCount: number, sectionKey: "files" | "routes" | "layers") => {
    const isExpanded = expandedSection === sectionKey;
    const totalChanges = addedCount + removedCount + modifiedCount;

    return (
      <div 
        onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
        className="flex items-center justify-between p-4 border border-zinc-800 bg-zinc-900/30 rounded-xl cursor-pointer hover:border-zinc-700 transition"
      >
        <div className="flex items-center gap-3">
          <div className="text-zinc-500">{icon}</div>
          <span className="text-xs font-bold text-white tracking-wide uppercase">{title}</span>
          {totalChanges > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-extrabold uppercase">
              {totalChanges} Changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 text-[10px] font-bold">
            {addedCount > 0 && <span className="text-emerald-400">+{addedCount}</span>}
            {removedCount > 0 && <span className="text-rose-400">-{removedCount}</span>}
            {modifiedCount > 0 && <span className="text-amber-400">~{modifiedCount}</span>}
          </div>
          {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
        </div>
      </div>
    );
  };

  const renderList = (items: string[], type: "added" | "removed" | "modified") => {
    if (items.length === 0) return null;
    const colors = {
      added: "text-emerald-400 border-emerald-950/40 bg-emerald-950/10",
      removed: "text-rose-400 border-rose-950/40 bg-rose-950/10",
      modified: "text-amber-400 border-amber-950/40 bg-amber-950/10"
    };
    const labels = {
      added: "Added",
      removed: "Removed",
      modified: "Unchanged/Modified"
    };

    return (
      <div className="space-y-1.5 mt-3">
        <h5 className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">{labels[type]}</h5>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-2 rounded-lg border text-xs font-mono truncate flex items-center gap-2 ${colors[type]}`}
            >
              {type === "added" && <PlusCircle size={11} className="shrink-0" />}
              {type === "removed" && <MinusCircle size={11} className="shrink-0" />}
              {type === "modified" && <Settings size={11} className="shrink-0 animate-spin-slow" />}
              <span className="truncate">{item.split(/[\\/]/).pop() || item}</span>
              <span className="text-[9px] text-zinc-500 truncate ml-auto font-sans">{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Side-by-side Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline Card */}
        <div className="bg-zinc-950/50 border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[8px]">
                Baseline Scan
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide truncate">{baseline.repoName}</h3>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
              <Calendar size={11} />
              {new Date(baseline.scannedAt).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/10">
            <div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Files</span>
              <span className="text-sm font-black text-white">{baseline.totalFiles}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Routes</span>
              <span className="text-sm font-black text-white">{baseline.totalRoutes}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Health</span>
              <span className={`text-sm font-black ${
                baseline.healthScore >= 70 ? 'text-emerald-400' :
                baseline.healthScore >= 40 ? 'text-amber-400' :
                'text-rose-400'
              }`}>{baseline.healthScore}%</span>
            </div>
          </div>
        </div>

        {/* Comparison Card */}
        <div className="bg-zinc-950/50 border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold uppercase tracking-wider text-[8px] flex items-center gap-1">
                <ArrowRight size={10} />
                Compared Scan
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide truncate">{compare.repoName}</h3>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
              <Calendar size={11} />
              {new Date(compare.scannedAt).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/10">
            <div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Files</span>
              <span className="text-sm font-black text-white">{compare.totalFiles}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Routes</span>
              <span className="text-sm font-black text-white">{compare.totalRoutes}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Health</span>
              <span className={`text-sm font-black ${
                compare.healthScore >= 70 ? 'text-emerald-400' :
                compare.healthScore >= 40 ? 'text-amber-400' :
                'text-rose-400'
              }`}>{compare.healthScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delta Metrics Overview */}
      <div className="bg-zinc-900/40 border border-border/40 rounded-2xl p-4">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Delta Trend Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Files Change</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-lg font-black ${
                changes.totalFiles.diff > 0 ? "text-emerald-400" :
                changes.totalFiles.diff < 0 ? "text-rose-400" :
                "text-zinc-400"
              }`}>
                {changes.totalFiles.diff > 0 ? "+" : ""}{changes.totalFiles.diff}
              </span>
              <span className="text-[9px] text-zinc-500 font-semibold">Files</span>
            </div>
          </div>

          <div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Health Delta</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-lg font-black ${
                changes.healthScore.diff > 0 ? "text-emerald-400 animate-pulse" :
                changes.healthScore.diff < 0 ? "text-rose-400" :
                "text-zinc-400"
              }`}>
                {changes.healthScore.diff > 0 ? "+" : ""}{changes.healthScore.diff}%
              </span>
              <span className="text-[9px] text-zinc-500 font-semibold">Health Score</span>
            </div>
          </div>

          <div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Files Added</div>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {changes.files.added.length}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Files Removed</div>
            <div className="text-lg font-black text-rose-400 mt-1">
              {changes.files.removed.length}
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Detail Sections */}
      <div className="space-y-2">
        {/* Files Section */}
        <div className="space-y-1">
          {renderSectionHeader(
            "Files Delta", 
            <FileCode size={14} />, 
            changes.files.added.length, 
            changes.files.removed.length, 
            changes.files.modified.length, 
            "files"
          )}
          {expandedSection === "files" && (
            <div className="p-3 border-x border-b border-border/20 rounded-b-xl bg-zinc-950/20 space-y-4">
              {changes.files.added.length === 0 && changes.files.removed.length === 0 && changes.files.modified.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 font-semibold">No file structure changes detected</div>
              ) : (
                <>
                  {renderList(changes.files.added, "added")}
                  {renderList(changes.files.removed, "removed")}
                  {renderList(changes.files.modified, "modified")}
                </>
              )}
            </div>
          )}
        </div>

        {/* Routes Section */}
        <div className="space-y-1">
          {renderSectionHeader(
            "Routes Delta", 
            <Route size={14} />, 
            changes.routes.added.length, 
            changes.routes.removed.length, 
            changes.routes.modified.length, 
            "routes"
          )}
          {expandedSection === "routes" && (
            <div className="p-3 border-x border-b border-border/20 rounded-b-xl bg-zinc-950/20 space-y-4">
              {changes.routes.added.length === 0 && changes.routes.removed.length === 0 && changes.routes.modified.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 font-semibold">No router interface changes detected</div>
              ) : (
                <>
                  {renderList(changes.routes.added, "added")}
                  {renderList(changes.routes.removed, "removed")}
                  {renderList(changes.routes.modified, "modified")}
                </>
              )}
            </div>
          )}
        </div>

        {/* Layers Section */}
        <div className="space-y-1">
          {renderSectionHeader(
            "Layers Delta", 
            <Layers size={14} />, 
            changes.layers.added.length, 
            changes.layers.removed.length, 
            changes.layers.modified.length, 
            "layers"
          )}
          {expandedSection === "layers" && (
            <div className="p-3 border-x border-b border-border/20 rounded-b-xl bg-zinc-950/20 space-y-4">
              {changes.layers.added.length === 0 && changes.layers.removed.length === 0 && changes.layers.modified.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 font-semibold">No architecture layer structural changes detected</div>
              ) : (
                <>
                  {renderList(changes.layers.added, "added")}
                  {renderList(changes.layers.removed, "removed")}
                  {renderList(changes.layers.modified, "modified")}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AlertTriangle fallback helper
function AlertTriangle({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
