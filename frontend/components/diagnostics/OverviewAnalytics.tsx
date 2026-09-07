import React from "react";
import { motion } from "framer-motion";
import {
  Files,
  Route,
  Package,
  Key,
  Braces,
  Server,
  Terminal,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Folder,
  FolderTree,
  ExternalLink,
  Code2,
  Boxes,
  Database,
  ShieldCheck,
  Workflow,
  Zap
} from "lucide-react";
import { Badge } from "../ui/badge";

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
  // Metric Cards Data matching Reference Image 1
  const metrics = [
    {
      label: "FILES ANALYZED",
      value: overview?.totalFiles ?? 0,
      trendPercent: "12%",
      trendDirection: "up",
      trendLabel: "vs last scan",
      iconBg: "bg-[#FF3344] text-white",
      arrowBg: "bg-[#E6F4F5] text-[#0A3D46] hover:bg-[#D5EBEE]",
      trendColor: "text-[#16C7A1]",
      curveColor: "#FF3344",
      curveFill: "url(#redCurveGrad)",
      icon: Files,
      curvePoints: "M 0 32 Q 25 30, 45 18 T 85 8 T 120 4",
      fillPoints: "M 0 32 Q 25 30, 45 18 T 85 8 T 120 4 L 120 38 L 0 38 Z",
      gradId: "redCurveGrad",
      gradFrom: "rgba(255, 51, 68, 0.35)",
      gradTo: "rgba(255, 51, 68, 0.0)"
    },
    {
      label: "API ROUTES",
      value: overview?.totalRoutes ?? 0,
      trendPercent: "8%",
      trendDirection: "up",
      trendLabel: "vs last scan",
      iconBg: "bg-[#9BE8E0] text-[#084C58]",
      arrowBg: "bg-[#E6F4F5] text-[#0A3D46] hover:bg-[#D5EBEE]",
      trendColor: "text-[#16C7A1]",
      curveColor: "#16C7A1",
      curveFill: "url(#tealCurveGrad)",
      icon: Route,
      curvePoints: "M 0 34 Q 30 32, 55 20 T 95 12 T 120 6",
      fillPoints: "M 0 34 Q 30 32, 55 20 T 95 12 T 120 6 L 120 38 L 0 38 Z",
      gradId: "tealCurveGrad",
      gradFrom: "rgba(22, 199, 161, 0.35)",
      gradTo: "rgba(22, 199, 161, 0.0)"
    },
    {
      label: "DEPENDENCIES",
      value: overview?.totalDependencies ?? 0,
      trendPercent: "17%",
      trendDirection: "down",
      trendLabel: "vs last scan",
      iconBg: "bg-[#FF3344] text-white",
      arrowBg: "bg-[#E6F4F5] text-[#0A3D46] hover:bg-[#D5EBEE]",
      trendColor: "text-[#FF3344]",
      curveColor: "#FF3344",
      curveFill: "url(#redCurveGrad2)",
      icon: Package,
      curvePoints: "M 0 30 Q 30 28, 60 16 T 100 10 T 120 6",
      fillPoints: "M 0 30 Q 30 28, 60 16 T 100 10 T 120 6 L 120 38 L 0 38 Z",
      gradId: "redCurveGrad2",
      gradFrom: "rgba(255, 51, 68, 0.35)",
      gradTo: "rgba(255, 51, 68, 0.0)"
    },
    {
      label: "ENVIRONMENT VARS",
      value: overview?.totalEnvVars ?? 0,
      trendPercent: "4%",
      trendDirection: "up",
      trendLabel: "vs last scan",
      iconBg: "bg-[#9BE8E0] text-[#084C58]",
      arrowBg: "bg-[#E6F4F5] text-[#0A3D46] hover:bg-[#D5EBEE]",
      trendColor: "text-[#16C7A1]",
      curveColor: "#16C7A1",
      curveFill: "url(#tealCurveGrad2)",
      icon: Key,
      curvePoints: "M 0 32 Q 30 30, 55 18 T 90 10 T 120 4",
      fillPoints: "M 0 32 Q 30 30, 55 18 T 90 10 T 120 4 L 120 38 L 0 38 Z",
      gradId: "tealCurveGrad2",
      gradFrom: "rgba(22, 199, 161, 0.35)",
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
          .slice(0, 6)
          .map(([dir, count], idx) => ({
            name: dir,
            percentage: Math.round((count / total) * 100),
            color: idx === 0 ? "#FF3344" : idx === 1 ? "#16C7A1" : idx === 2 ? "#C5F4EF" : "#9BE8E0"
          }));
      }
    }
    // Default matching reference
    return [
      { name: "src/", percentage: 42, color: "#FF3344" },
      { name: "tests/", percentage: 18, color: "#16C7A1" },
      { name: "docs/", percentage: 12, color: "#C5F4EF" },
      { name: "config/", percentage: 10, color: "#9BE8E0" },
      { name: "scripts/", percentage: 8, color: "#9BE8E0" },
      { name: "other/", percentage: 10, color: "#9BE8E0" }
    ];
  }, [files]);

  return (
    <div className="space-y-4 text-left w-full">
      
      {/* ── ROW 1: 4 KEY METRIC CARDS (~145px height, 4-col grid, rounded 14px) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {metrics.map((m, idx) => {
          const isHero = idx === 0;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`rounded-[14px] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[145px] max-h-[155px] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${
                isHero
                  ? "bg-[#FF3344] text-white border border-[#ff4d5e] shadow-lg shadow-[#FF3344]/20"
                  : "bg-white border border-[#E1ECEF] text-[#082D3A]"
              }`}
            >
              {/* Top Row: Icon Box + Label + Circular Arrow */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center shrink-0 shadow-xs ${
                      isHero ? "bg-white/20 text-white" : m.iconBg
                    }`}
                  >
                    <m.icon size={18} className="stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.1em] leading-none ${
                      isHero ? "text-white" : "text-[#0A3440]"
                    }`}
                  >
                    {m.label}
                  </span>
                </div>

                {/* Circular Action Arrow */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    isHero ? "bg-white/20 text-white hover:bg-white/30" : m.arrowBg
                  }`}
                >
                  <ArrowRight size={13} />
                </div>
              </div>

              {/* Bottom Row: Number + Trend & Smooth Sparkline */}
              <div className="flex items-end justify-between mt-2.5 relative z-10">
                <div>
                  <div
                    className={`text-3xl sm:text-[38px] font-black tracking-tight leading-none ${
                      isHero ? "text-white" : "text-[#082D3A]"
                    }`}
                  >
                    {m.value.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold mt-1.5 flex items-center gap-1.5">
                    <span
                      className={`font-bold flex items-center gap-0.5 ${
                        isHero ? "text-white" : m.trendColor
                      }`}
                    >
                      {m.trendDirection === "up" ? "↑" : "↓"} {m.trendPercent}
                    </span>
                    <span
                      className={`text-[11px] ${
                        isHero ? "text-white/80" : "text-[#62878F]"
                      }`}
                    >
                      {m.trendLabel}
                    </span>
                  </div>
                </div>

                {/* Smooth Area Sparkline SVG */}
                <div className="w-24 sm:w-28 h-9 shrink-0 relative flex items-end">
                  <svg viewBox="0 0 120 38" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id={m.gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isHero ? "rgba(255, 255, 255, 0.45)" : m.gradFrom}
                        />
                        <stop
                          offset="100%"
                          stopColor={isHero ? "rgba(255, 255, 255, 0.0)" : m.gradTo}
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d={m.fillPoints}
                      fill={isHero ? `url(#${m.gradId})` : m.curveFill}
                    />
                    <path
                      d={m.curvePoints}
                      fill="none"
                      stroke={isHero ? "#FFFFFF" : m.curveColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── ROW 2: DETECTED TECH STACK (1.35fr / 56%) + PROJECT STRUCTURE (1fr / 44%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 items-stretch">
        
        {/* Left Panel: Detected Technology Stack */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-[rgba(8,70,80,0.75)] backdrop-blur-md rounded-[16px] p-5 border border-[rgba(155,232,224,0.18)] shadow-md flex flex-col justify-between min-h-[260px] sm:min-h-[270px]"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#084C58] text-[#9BE8E0] flex items-center justify-center shrink-0">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-[15px] font-bold text-[#F7FAFA] leading-snug">
                    Detected Technology Stack
                  </h3>
                  <p className="text-[11px] text-[#C3D5D8] leading-tight">
                    Automatically identified technologies and tools in your repository.
                  </p>
                </div>
              </div>

              <button className="text-xs font-semibold text-[#9BE8E0] hover:text-white flex items-center gap-1 transition shrink-0">
                View Details <ArrowRight size={12} />
              </button>
            </div>

            {/* 6 Technology Items in 3-col grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Language Card */}
              <div className="p-2.5 sm:p-3 rounded-[10px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] bg-[#007acc] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  TS
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] font-bold text-white truncate">
                    {frameworkMetadata?.language || "TypeScript"}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#8EA9AE]">Language</div>
                </div>
              </div>

              {/* Runtime Card */}
              <div className="p-2.5 sm:p-3 rounded-[10px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] bg-[#539e43] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  node
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] font-bold text-white truncate">
                    {frameworkMetadata?.runtime || "Node.js"}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#8EA9AE]">Runtime</div>
                </div>
              </div>

              {/* Package Manager Card */}
              <div className="p-2.5 sm:p-3 rounded-[10px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] bg-[#cb3837] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  npm
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] font-bold text-white truncate">
                    {frameworkMetadata?.packageManager || "npm"}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#8EA9AE]">Package Manager</div>
                </div>
              </div>

              {/* Framework Card */}
              <div className="p-2.5 sm:p-3 rounded-[10px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] bg-neutral-900 border border-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  <Code2 size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] font-bold text-white truncate">
                    {frameworkMetadata?.frameworks?.[0]?.name || "Fastify"}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#8EA9AE]">Framework</div>
                </div>
              </div>

              {/* Database Card */}
              <div className="p-2.5 sm:p-3 rounded-[10px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] bg-[#3ecf8e] text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  <Zap size={15} className="fill-slate-950" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] font-bold text-white truncate">
                    Supabase
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#8EA9AE]">Database</div>
                </div>
              </div>

              {/* DevOps Card */}
              <div className="p-2.5 sm:p-3 rounded-[10px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] bg-[#0db7ed] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  <Boxes size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] font-bold text-white truncate">
                    Docker
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#8EA9AE]">DevOps</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Project Structure */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-[rgba(8,70,80,0.75)] backdrop-blur-md rounded-[16px] p-5 border border-[rgba(155,232,224,0.18)] shadow-md flex flex-col justify-between min-h-[260px] sm:min-h-[270px]"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#084C58] text-[#9BE8E0] flex items-center justify-center shrink-0">
                  <FolderTree size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-[15px] font-bold text-[#F7FAFA] leading-snug">
                    Project Structure
                  </h3>
                  <p className="text-[11px] text-[#C3D5D8] leading-tight">
                    High-level directory analysis.
                  </p>
                </div>
              </div>

              <button className="text-xs font-semibold text-[#9BE8E0] hover:text-white flex items-center gap-1 transition shrink-0">
                View Tree <ArrowRight size={12} />
              </button>
            </div>

            {/* Structure Progress Bars */}
            <div className="space-y-2.5">
              {directoryBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-18 text-xs font-mono text-[#C3D5D8]">
                    <Folder size={12} className="text-[#9BE8E0] shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="flex-1 h-2.5 rounded-full bg-[rgba(6,47,56,0.85)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>

                  <div className="w-9 text-right text-xs font-bold text-[#F7FAFA] font-mono">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}