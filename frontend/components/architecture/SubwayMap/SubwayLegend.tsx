import React, { useMemo } from "react";
import { Activity, AlertTriangle, ChevronRight } from "lucide-react";
import { FeatureFlow, RepositorySubway } from "@shared/types";

interface SubwayLegendProps {
  subway?: RepositorySubway;
  features: FeatureFlow[];
  result: any;
  hoveredFeature: string | null;
  setHoveredFeature: (id: string | null) => void;
  selectedFeature?: string | null;
  setSelectedFeature?: (id: string | null) => void;
  selectedFeatures?: string[];
  setSelectedFeatures?: (ids: string[] | ((prev: string[]) => string[])) => void;
}

export default function SubwayLegend({
  subway,
  features,
  result,
  hoveredFeature,
  setHoveredFeature,
  selectedFeature,
  setSelectedFeature,
  selectedFeatures = [],
  setSelectedFeatures,
}: SubwayLegendProps) {
  // PageRank — top files by incoming reference count
  const topFiles = useMemo(() => {
    const files = result?.files || [];
    return (files || [])
      .filter((f: any) => {
        const p = f.path || "";
        return !p.startsWith("ROUTE:") && !p.startsWith("ENV:") && !p.startsWith("DB:") && !p.startsWith("ENTITY:");
      })
      .map((f: any) => ({
        name: (f.path || "").split("/").pop() || f.path,
        score: (f.referencedBy?.length || 0) * 10 + (f.lineCount || 0) / 10,
      }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);
  }, [result]);

  return (
    <div className="flex flex-col select-none h-full w-full">
      {/* Title */}
      <div className="p-4 border-b border-border/20 shrink-0 text-left">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={13} className="text-primary" />
          <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-widest leading-tight">
            CODEBASE FEATURES
          </h3>
        </div>
        <p className="text-[10px] text-zinc-550 mt-1 leading-normal">
          Click any node to inspect file details and dependencies.
        </p>
      </div>

      {/* Main Features List */}
      <div className="p-3 space-y-2 flex-1 overflow-y-auto min-h-0">
        {features.map((feature) => {
          const isHovered = hoveredFeature === feature.id;
          const isSelected = selectedFeatures.length > 0
            ? selectedFeatures.includes(feature.id)
            : selectedFeature === feature.id;
          const isActive = isSelected || isHovered;
          const healthBad = (feature.health || 0) < 40;
          const fileCount = feature.files?.length || 0;
          const confidence = Math.round(
            feature.confidence <= 1 ? feature.confidence * 100 : feature.confidence
          );

          return (
            <div
              key={feature.id}
              onMouseEnter={() => setHoveredFeature(feature.id)}
              onMouseLeave={() => setHoveredFeature(null)}
              onClick={() => {
                if (setSelectedFeatures) {
                  setSelectedFeatures((prev) =>
                    prev.includes(feature.id)
                      ? prev.filter((id) => id !== feature.id)
                      : [...prev, feature.id]
                  );
                } else if (setSelectedFeature) {
                  setSelectedFeature(isSelected ? null : feature.id);
                }
              }}
              className={`rounded-xl p-3 cursor-pointer transition-all duration-200 text-left border ${
                isActive
                  ? "bg-zinc-900/95 border-primary shadow-lg ring-1 ring-primary/30"
                  : "bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-600/60"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: feature.color }}
                />
                <span className="text-[11px] font-bold text-white truncate flex-1">
                  {feature.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                {healthBad && <AlertTriangle size={11} className="text-red-400 shrink-0" />}
                <span className={`font-bold ${healthBad ? "text-red-400" : "text-zinc-300"}`}>
                  {feature.health || 0}
                </span>
                <span className="text-zinc-500">Health</span>
                <span className="text-zinc-300 font-bold ml-auto">
                  {confidence}%
                </span>
                <span className="text-zinc-500">Conf</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500">
                <ChevronRight size={10} />
                <span>{fileCount} files</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* PageRank Importance */}
      {topFiles.length > 0 && (
        <div className="p-3 border-t border-border/20 shrink-0 text-left">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest">
              Pagerank Importance
            </span>
          </div>
          <div className="space-y-1.5">
            {topFiles.map((f: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-600 font-bold w-3">{i + 1}</span>
                <span className="text-[10px] text-zinc-400 truncate flex-1 font-mono">{f.name}</span>
                <div className="bg-zinc-800 text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {Math.round(f.score)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
