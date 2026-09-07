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
  // Metric Cards Data
  const metrics = [
    {
      label: "FILES ANALYZED",
      value: overview.totalFiles || 213,
      trendPercent: "12%",
      trendDirection: "up",
      trendLabel: "vs last scan",
      cardStyle: "bg-gradient-to-br from-[#F52B35] to-[#D91F29] text-white shadow-xl shadow-red-500/20",
      iconContainerStyle: "bg-white/20 text-white",
      titleStyle: "text-white",
      arrowStyle: "bg-white/15 text-white hover:bg-white/25",
      numberStyle: "text-white",
      trendHighlightStyle: "text-white",
      trendLabelStyle: "text-white/80",
      icon: Files,
      bars: [30, 50, 75, 60, 90, 100],
      barGradient: "from-white/10 to-white/40"
    },
    {
      label: "API ROUTES",
      value: overview.totalRoutes || 88,
      trendPercent: "8%",
      trendDirection: "up",
      trendLabel: "vs last scan",
      cardStyle: "bg-[#F8F8F6] text-[#082D3A] border border-white/80 shadow-md",
      iconContainerStyle: "bg-[#A8ECE7] text-[#0A3440]",
      titleStyle: "text-[#0A3440]",
      arrowStyle: "bg-[#EDF3F4] text-[#123D49] hover:bg-[#dfe9eb]",
      numberStyle: "text-[#082D3A]",
      trendHighlightStyle: "text-[#16BFA6]",
      trendLabelStyle: "text-[#315D66]",
      icon: Route,
      bars: [25, 45, 60, 75, 85, 95],
      barGradient: "from-[#79DCD5]/15 to-[#79DCD5]/90"
    },
    {
      label: "DEPENDENCIES",
      value: overview.totalDependencies || 620,
      trendPercent: "17%",
      trendDirection: "down",
      trendLabel: "vs last scan",
      cardStyle: "bg-[#E4F8F7] text-[#082D3A] border border-[#C5F4EF]/60 shadow-md",
      iconContainerStyle: "bg-[#087B83] text-white",
      titleStyle: "text-[#0A3440]",
      arrowStyle: "bg-[#EDF3F4] text-[#123D49] hover:bg-[#dfe9eb]",
      numberStyle: "text-[#082D3A]",
      trendHighlightStyle: "text-[#E9232E]",
      trendLabelStyle: "text-[#315D66]",
      icon: Package,
      bars: [35, 55, 70, 80, 90, 100],
      barGradient: "from-[#79DCD5]/15 to-[#79DCD5]/90"
    },
    {
      label: "ENVIRONMENT VARS",
      value: overview.totalEnvVars || 27,
      trendPercent: "4%",
      trendDirection: "up",
      trendLabel: "vs last scan",
      cardStyle: "bg-[#F8F8F6] text-[#082D3A] border border-white/80 shadow-md",
      iconContainerStyle: "bg-[#A8ECE7] text-[#0A3440]",
      titleStyle: "text-[#0A3440]",
      arrowStyle: "bg-[#EDF3F4] text-[#123D49] hover:bg-[#dfe9eb]",
      numberStyle: "text-[#082D3A]",
      trendHighlightStyle: "text-[#16BFA6]",
      trendLabelStyle: "text-[#315D66]",
      icon: Key,
      bars: [20, 35, 50, 70, 85, 100],
      barGradient: "from-[#79DCD5]/15 to-[#79DCD5]/90"
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
    <div className="space-y-6 text-left w-full">
      
      {/* ── 1. 4 KEY METRIC CARDS (EXACT REFERENCE DESIGN) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-[20px] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[175px] sm:min-h-[180px] transition-all duration-200 hover:-translate-y-1 ${m.cardStyle}`}
          >
            {/* Top Row: Icon Container + Title + Arrow Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm ${m.iconContainerStyle}`}
                >
                  <m.icon size={22} className="stroke-[2.2]" />
                </div>
                <span
                  className={`text-[13px] sm:text-[14px] font-extrabold uppercase tracking-[0.12em] leading-tight ${m.titleStyle}`}
                >
                  {m.label}
                </span>
              </div>

              {/* Circular Action Arrow Button */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${m.arrowStyle}`}
              >
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Bottom Row: Large Number + Trend & Vertical Bar Chart */}
            <div className="flex items-end justify-between mt-4 relative z-10">
              <div>
                <div
                  className={`text-5xl sm:text-[54px] font-black tracking-tight leading-none ${m.numberStyle}`}
                >
                  {m.value.toLocaleString()}
                </div>
                <div className="text-sm font-semibold mt-2 flex items-center gap-1.5">
                  <span className={`font-bold flex items-center gap-0.5 ${m.trendHighlightStyle}`}>
                    {m.trendDirection === "up" ? "↑" : "↓"} {m.trendPercent}
                  </span>
                  <span className={m.trendLabelStyle}>
                    {m.trendLabel}
                  </span>
                </div>
              </div>

              {/* Mini Vertical Bar Chart with bottom fade */}
              <div className="flex items-end gap-1.5 h-14 pb-0.5 shrink-0">
                {m.bars.map((barHeight, bIdx) => (
                  <div
                    key={bIdx}
                    className={`w-2 sm:w-2.5 rounded-t-md bg-gradient-to-t ${m.barGradient}`}
                    style={{ height: `${barHeight}%` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── 2. TWO-COLUMN ROW: DETECTED TECH STACK + PROJECT STRUCTURE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Panel: Detected Technology Stack */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-7 bg-[rgba(8,70,80,0.75)] backdrop-blur-md rounded-[20px] p-6 border border-[rgba(155,232,224,0.18)] shadow-md flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#084C58] text-[#9BE8E0] flex items-center justify-center">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#F7FAFA]">
                    Detected Technology Stack
                  </h3>
                  <p className="text-xs text-[#C3D5D8]">
                    Automatically identified technologies and tools in your repository.
                  </p>
                </div>
              </div>

              <button className="text-xs font-semibold text-[#9BE8E0] hover:text-white flex items-center gap-1 transition">
                View Details <ArrowRight size={13} />
              </button>
            </div>

            {/* Tech Stack Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Language Card */}
              <div className="p-3.5 rounded-[14px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  TS
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {frameworkMetadata?.language || "TypeScript"}
                  </div>
                  <div className="text-[11px] text-[#8EA9AE]">Language</div>
                </div>
              </div>

              {/* Runtime Card */}
              <div className="p-3.5 rounded-[14px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#68a063] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  node
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {frameworkMetadata?.runtime || "Node.js"}
                  </div>
                  <div className="text-[11px] text-[#8EA9AE]">Runtime</div>
                </div>
              </div>

              {/* Package Manager Card */}
              <div className="p-3.5 rounded-[14px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#cb3837] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  npm
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {frameworkMetadata?.packageManager || "npm"}
                  </div>
                  <div className="text-[11px] text-[#8EA9AE]">Package Manager</div>
                </div>
              </div>

              {/* Framework Card */}
              <div className="p-3.5 rounded-[14px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-neutral-900 border border-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  <Code2 size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {frameworkMetadata?.frameworks?.[0]?.name || "Fastify"}
                  </div>
                  <div className="text-[11px] text-[#8EA9AE]">Framework</div>
                </div>
              </div>

              {/* Database Card */}
              <div className="p-3.5 rounded-[14px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#3ecf8e] text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  <Zap size={16} className="fill-slate-950" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    Supabase
                  </div>
                  <div className="text-[11px] text-[#8EA9AE]">Database</div>
                </div>
              </div>

              {/* DevOps Card */}
              <div className="p-3.5 rounded-[14px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#0db7ed] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  <Boxes size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    Docker
                  </div>
                  <div className="text-[11px] text-[#8EA9AE]">DevOps</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Project Structure */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-5 bg-[rgba(8,70,80,0.75)] backdrop-blur-md rounded-[20px] p-6 border border-[rgba(155,232,224,0.18)] shadow-md flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#084C58] text-[#9BE8E0] flex items-center justify-center">
                  <FolderTree size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#F7FAFA]">
                    Project Structure
                  </h3>
                  <p className="text-xs text-[#C3D5D8]">
                    High-level directory analysis.
                  </p>
                </div>
              </div>

              <button className="text-xs font-semibold text-[#9BE8E0] hover:text-white flex items-center gap-1 transition">
                View Tree <ArrowRight size={13} />
              </button>
            </div>

            {/* Structure Progress Bars */}
            <div className="space-y-3">
              {directoryBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-20 text-xs font-mono text-[#C3D5D8]">
                    <Folder size={12} className="text-[#9BE8E0] shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="flex-1 h-3 rounded-full bg-[rgba(6,47,56,0.85)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>

                  <div className="w-10 text-right text-xs font-bold text-[#F7FAFA]">
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