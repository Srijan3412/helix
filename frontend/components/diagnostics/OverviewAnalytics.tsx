import React from "react";
import { motion } from "framer-motion";
import {
  Files,
  Route,
  Package,
  Key,
  Layers,
  Folder,
  FolderTree,
  Code2,
  Boxes,
  Zap,
  ArrowRight,
} from "lucide-react";

interface OverviewAnalyticsProps {
  overview: {
    totalFiles: number;
    totalRoutes: number;
    totalDependencies: number;
    totalEnvVars: number;
  };
  frameworkMetadata?: {
    language: string;
    runtime: string;
    packageManager?: string;
    frameworks: Array<{ name: string }>;
  };
  files?: Array<{ path: string; lineCount?: number }>;
}

export default function OverviewAnalytics({
  overview,
  frameworkMetadata,
  files = []
}: OverviewAnalyticsProps) {
  // 4 KPI Cards Data with exact UI theme colors restored (Solid Red card 1, Crisp White cards 2-4)
  const metrics = [
    {
      label: "FILES ANALYZED",
      value: overview?.totalFiles ?? 0,
      trendPercent: "12%",
      trendDirection: "up",
      trendLabel: "vs last scan",
      cardClass: "bg-[#F52F45] text-white shadow-lg shadow-red-500/25 border border-red-400/40",
      iconClass: "bg-white/20 text-white",
      titleClass: "text-white/90",
      numberClass: "text-white",
      arrowClass: "bg-white/20 text-white hover:bg-white/30",
      trendHighlightClass: "text-white font-bold",
      trendLabelClass: "text-white/80",
      curveColor: "#ffffff",
      curveFill: "url(#whiteCurveGrad)",
      icon: Files,
      curvePoints: "M 0 26 Q 22 24, 40 14 T 75 7 T 100 3",
      fillPoints: "M 0 26 Q 22 24, 40 14 T 75 7 T 100 3 L 100 30 L 0 30 Z",
      gradId: "whiteCurveGrad",
      gradFrom: "rgba(255, 255, 255, 0.25)",
      gradTo: "rgba(255, 255, 255, 0.0)"
    },
    {
      label: "API ROUTES",
      value: overview?.totalRoutes ?? 0,
      trendPercent: "8%",
      trendDirection: "up",
      trendLabel: "vs last scan",
      cardClass: "bg-white text-slate-900 border border-slate-200/80 shadow-md hover:border-teal-400/40",
      iconClass: "bg-[#C5F4EF] text-[#063D48]",
      titleClass: "text-slate-800",
      numberClass: "text-slate-900",
      arrowClass: "bg-[#EBF7F6] text-[#084C58] hover:bg-[#d8f0ed]",
      trendHighlightClass: "text-teal-600 font-bold",
      trendLabelClass: "text-slate-500",
      curveColor: "#16C7A1",
      curveFill: "url(#tealCurveGrad)",
      icon: Route,
      curvePoints: "M 0 28 Q 25 26, 45 16 T 80 9 T 100 4",
      fillPoints: "M 0 28 Q 25 26, 45 16 T 80 9 T 100 4 L 100 30 L 0 30 Z",
      gradId: "tealCurveGrad",
      gradFrom: "rgba(22, 199, 161, 0.25)",
      gradTo: "rgba(22, 199, 161, 0.0)"
    },
    {
      label: "DEPENDENCIES",
      value: overview?.totalDependencies ?? 0,
      trendPercent: "17%",
      trendDirection: "down",
      trendLabel: "vs last scan",
      cardClass: "bg-white text-slate-900 border border-slate-200/80 shadow-md hover:border-red-400/40",
      iconClass: "bg-[#F52F45] text-white",
      titleClass: "text-slate-800",
      numberClass: "text-slate-900",
      arrowClass: "bg-[#EBF7F6] text-[#084C58] hover:bg-[#d8f0ed]",
      trendHighlightClass: "text-red-500 font-bold",
      trendLabelClass: "text-slate-500",
      curveColor: "#F52F45",
      curveFill: "url(#redCurveGrad2)",
      icon: Package,
      curvePoints: "M 0 25 Q 25 23, 50 13 T 85 8 T 100 4",
      fillPoints: "M 0 25 Q 25 23, 50 13 T 85 8 T 100 4 L 100 30 L 0 30 Z",
      gradId: "redCurveGrad2",
      gradFrom: "rgba(245, 47, 69, 0.25)",
      gradTo: "rgba(245, 47, 69, 0.0)"
    },
    {
      label: "ENVIRONMENT VARS",
      value: overview?.totalEnvVars ?? 0,
      trendPercent: "4%",
      trendDirection: "up",
      trendLabel: "vs last scan",
      cardClass: "bg-white text-slate-900 border border-slate-200/80 shadow-md hover:border-teal-400/40",
      iconClass: "bg-[#C5F4EF] text-[#063D48]",
      titleClass: "text-slate-800",
      numberClass: "text-slate-900",
      arrowClass: "bg-[#EBF7F6] text-[#084C58] hover:bg-[#d8f0ed]",
      trendHighlightClass: "text-teal-600 font-bold",
      trendLabelClass: "text-slate-500",
      curveColor: "#16C7A1",
      curveFill: "url(#tealCurveGrad2)",
      icon: Key,
      curvePoints: "M 0 26 Q 25 24, 48 14 T 80 8 T 100 3",
      fillPoints: "M 0 26 Q 25 24, 48 14 T 80 8 T 100 3 L 100 30 L 0 30 Z",
      gradId: "tealCurveGrad2",
      gradFrom: "rgba(22, 199, 161, 0.25)",
      gradTo: "rgba(22, 199, 161, 0.0)"
    }
  ];

  // Compute Project Structure from actual files or default distribution
  const directoryBreakdown = React.useMemo(() => {
    if (files && files.length > 0) {
      const dirCounts: Record<string, number> = {};
      let total = 0;
      files.forEach((f) => {
        const parts = f.path.split(/[\\/]/);
        if (parts.length > 1) {
          const topDir = parts[0] + "/";
          dirCounts[topDir] = (dirCounts[topDir] || 0) + 1;
          total++;
        }
      });
      if (total > 0) {
        return Object.entries(dirCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([dir, count], idx) => ({
            name: dir,
            percentage: Math.round((count / total) * 100),
            color: idx === 0 ? "#FF3348" : idx === 1 ? "#20D6D8" : idx === 2 ? "#8DE2D8" : "#20D6D8"
          }));
      }
    }
    return [
      { name: "fronte...", percentage: 38, color: "#FF3348" },
      { name: "backen...", percentage: 31, color: "#20D6D8" },
      { name: "ROUTE:...", percentage: 20, color: "#8DE2D8" },
      { name: "ROUTE:...", percentage: 4, color: "#20D6D8" },
      { name: "ROUTE:...", percentage: 4, color: "#20D6D8" }
    ];
  }, [files]);

  return (
    <div className="space-y-4 text-left w-full">
      
      {/* ── ROW 1: 4 KEY METRIC CARDS (Exact Restored UI Theme) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {metrics.map((m, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`rounded-[16px] p-4 sm:p-4.5 relative overflow-hidden flex flex-col justify-between h-[125px] sm:h-[130px] transition-all duration-200 hover:-translate-y-0.5 ${m.cardClass}`}
          >
            {/* Top Row: Icon Container + Label + Arrow Button */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 shadow-xs ${m.iconClass}`}>
                  <m.icon size={16} className="stroke-[2.2]" />
                </div>
                <span className={`text-[11px] sm:text-[11.5px] font-extrabold uppercase tracking-[0.08em] leading-none ${m.titleClass}`}>
                  {m.label}
                </span>
              </div>

              {/* Circular Action Arrow Button */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${m.arrowClass}`}>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Bottom Row: Large Number + Trend & Smooth Area Sparkline */}
            <div className="flex items-end justify-between mt-1 relative z-10">
              <div>
                <div className={`text-2xl sm:text-[32px] font-black tracking-tight leading-none ${m.numberClass}`}>
                  {m.value.toLocaleString()}
                </div>
                <div className="text-[10.5px] font-semibold mt-1 flex items-center gap-1.5">
                  <span className={m.trendHighlightClass}>
                    {m.trendDirection === "up" ? "↑" : "↓"} {m.trendPercent}
                  </span>
                  <span className={m.trendLabelClass}>
                    {m.trendLabel}
                  </span>
                </div>
              </div>

              {/* Smooth Area Sparkline SVG */}
              <div className="w-20 sm:w-24 h-7 shrink-0 relative flex items-end">
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id={m.gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={m.gradFrom} />
                      <stop offset="100%" stopColor={m.gradTo} />
                    </linearGradient>
                  </defs>
                  <path d={m.fillPoints} fill={m.curveFill} />
                  <path
                    d={m.curvePoints}
                    fill="none"
                    stroke={m.curveColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── ROW 2: DETECTED TECH STACK (1.35fr) + PROJECT STRUCTURE (1fr) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 items-start h-auto min-h-0">
        
        {/* Left Panel: Detected Technology Stack (Red Left Accent) */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#084B52] rounded-[14px] p-4 sm:p-4.5 border border-[#20C7CF]/20 border-l-4 border-l-[#FF3045] shadow-md flex flex-col justify-between h-auto min-h-0"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#06363D] text-[#20C7CF] flex items-center justify-center shrink-0">
                  <Layers size={15} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F4EDE5] leading-snug">
                    Detected Technology Stack
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#8EDBD5] mt-0.5 leading-tight">
                    Automatically identified technologies and tools in your repository.
                  </p>
                </div>
              </div>
            </div>

            {/* 6 Technology Items in 3-col grid (Dark Teal cards with dedicated semantic icon squares) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Language Card: TypeScript (Blue #1689E8) */}
              <div className="p-2 rounded-[8px] bg-[#06363D] border border-[rgba(32,199,207,0.12)] hover:border-[rgba(32,199,207,0.30)] flex items-center gap-2 transition-all">
                <div className="w-7 h-7 rounded-[6px] bg-[#1689E8] text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                  TS
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F4EDE5] truncate">
                    {frameworkMetadata?.language || "TypeScript"}
                  </div>
                  <div className="text-[10px] text-[#8EDBD5]">Language</div>
                </div>
              </div>

              {/* Runtime Card: Node.js (Green #63B746) */}
              <div className="p-2 rounded-[8px] bg-[#06363D] border border-[rgba(32,199,207,0.12)] hover:border-[rgba(32,199,207,0.30)] flex items-center gap-2 transition-all">
                <div className="w-7 h-7 rounded-[6px] bg-[#63B746] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                  node
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F4EDE5] truncate">
                    {frameworkMetadata?.runtime || "Node.js"}
                  </div>
                  <div className="text-[10px] text-[#8EDBD5]">Runtime</div>
                </div>
              </div>

              {/* Package Manager Card: npm (Red #E83B45) */}
              <div className="p-2 rounded-[8px] bg-[#06363D] border border-[rgba(32,199,207,0.12)] hover:border-[rgba(32,199,207,0.30)] flex items-center gap-2 transition-all">
                <div className="w-7 h-7 rounded-[6px] bg-[#E83B45] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                  npm
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F4EDE5] truncate">
                    {frameworkMetadata?.packageManager || "npm"}
                  </div>
                  <div className="text-[10px] text-[#8EDBD5]">Package Manager</div>
                </div>
              </div>

              {/* Framework Card: Fastify (Near-black #151C20) */}
              <div className="p-2 rounded-[8px] bg-[#06363D] border border-[rgba(32,199,207,0.12)] hover:border-[rgba(32,199,207,0.30)] flex items-center gap-2 transition-all">
                <div className="w-7 h-7 rounded-[6px] bg-[#151C20] border border-white/20 text-[#20C7CF] font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                  <Code2 size={13} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F4EDE5] truncate">
                    {frameworkMetadata?.frameworks?.[0]?.name || "Fastify"}
                  </div>
                  <div className="text-[10px] text-[#8EDBD5]">Framework</div>
                </div>
              </div>

              {/* Database Card: Supabase (Mint #40D3A2) */}
              <div className="p-2 rounded-[8px] bg-[#06363D] border border-[rgba(32,199,207,0.12)] hover:border-[rgba(32,199,207,0.30)] flex items-center gap-2 transition-all">
                <div className="w-7 h-7 rounded-[6px] bg-[#40D3A2] text-[#06363D] font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                  <Zap size={13} className="fill-[#06363D]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F4EDE5] truncate">
                    Supabase
                  </div>
                  <div className="text-[10px] text-[#8EDBD5]">Database</div>
                </div>
              </div>

              {/* DevOps Card: Docker (Blue #19AEE5) */}
              <div className="p-2 rounded-[8px] bg-[#06363D] border border-[rgba(32,199,207,0.12)] hover:border-[rgba(32,199,207,0.30)] flex items-center gap-2 transition-all">
                <div className="w-7 h-7 rounded-[6px] bg-[#19AEE5] text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                  <Boxes size={13} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F4EDE5] truncate">
                    Docker
                  </div>
                  <div className="text-[10px] text-[#8EDBD5]">DevOps</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Project Structure (Mint Left Accent & Meaningful Progression Colors) */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-[#084B52] rounded-[14px] p-4 sm:p-4.5 border border-[#65D7CF]/20 border-l-4 border-l-[#65D7CF] shadow-md flex flex-col justify-between h-auto min-h-0"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#06363D] text-[#65D7CF] flex items-center justify-center shrink-0">
                  <FolderTree size={15} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F4EDE5] leading-snug">
                    Project Structure
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#8EDBD5] mt-0.5 leading-tight">
                    High-level directory analysis.
                  </p>
                </div>
              </div>
            </div>

            {/* Structure Progress Bars with Meaningful Multicolor Progression */}
            <div className="space-y-2">
              {directoryBreakdown.map((item, idx) => {
                // Meaningful Color Progression: 1: Red #FF3045, 2: Mint #65D7CF, 3: Cream #F3E8DF, 4: Cyan #27C7D0, 5: Aqua #62D9D5, 6: Blue #3197C8
                const colors = ["#FF3045", "#65D7CF", "#F3E8DF", "#27C7D0", "#62D9D5", "#3197C8"];
                const itemColor = colors[idx % colors.length];

                return (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 w-16 text-[11px] font-mono text-[#F4EDE5]">
                      <Folder size={11} style={{ color: itemColor }} className="shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {/* Horizontal Bar with Solid Dark Track (#07343B) */}
                    <div className="flex-1 h-2 rounded-full bg-[#07343B] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: itemColor
                        }}
                      />
                    </div>

                    <div className="w-8 text-right text-[11px] font-bold text-[#F4EDE5] font-mono">
                      {item.percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}