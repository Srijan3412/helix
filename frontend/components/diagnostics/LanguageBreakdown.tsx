"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Database,
  ChevronUp,
  ChevronRight,
  Plus,
  Target,
  ArrowRight,
} from "lucide-react";

interface EntryPointItem {
  filePath?: string;
  path?: string;
  name?: string;
  confidence: number;
  role?: string;
  description?: string;
  chips?: Array<{ label: string; type: "critical" | "important" | "low" | "entry" | "tag" }>;
}

interface LanguageBreakdownProps {
  languages?: Record<string, number>;
  totalLines?: number;
  entryPoints?: EntryPointItem[];
}

// Visual color palette matching the comprehensive multicolor specification
const languageConfig: Record<
  string,
  { color: string; bg: string; text: string; label: string }
> = {
  TypeScript: {
    color: "#1689E8", // Blue
    bg: "bg-[#1689E8]/20",
    text: "text-[#1689E8]",
    label: "TS",
  },
  JSON: {
    color: "#FF3045", // Red
    bg: "bg-[#FF3045]/20",
    text: "text-[#FF3045]",
    label: "JSON",
  },
  Markdown: {
    color: "#F4EDE5", // Cream
    bg: "bg-[#F4EDE5]/20",
    text: "text-[#F4EDE5]",
    label: "MD",
  },
  YAML: {
    color: "#65D7CF", // Mint
    bg: "bg-[#65D7CF]/20",
    text: "text-[#65D7CF]",
    label: "YML",
  },
  JavaScript: {
    color: "#20C7CF", // Cyan
    bg: "bg-[#20C7CF]/20",
    text: "text-[#20C7CF]",
    label: "JS",
  },
  CSS: {
    color: "#A855F7", // Purple
    bg: "bg-[#A855F7]/20",
    text: "text-[#A855F7]",
    label: "CSS",
  },
  HTML: {
    color: "#EC4899",
    bg: "bg-[#EC4899]/20",
    text: "text-[#EC4899]",
    label: "HTML",
  },
  Python: {
    color: "#10B981",
    bg: "bg-[#10B981]/20",
    text: "text-[#10B981]",
    label: "PY",
  },
  Go: {
    color: "#06B6D4",
    bg: "bg-[#06B6D4]/20",
    text: "text-[#06B6D4]",
    label: "GO",
  },
  Rust: {
    color: "#F97316",
    bg: "bg-[#F97316]/20",
    text: "text-[#F97316]",
    label: "RS",
  },
  SQL: {
    color: "#FBBF24",
    bg: "bg-[#FBBF24]/20",
    text: "text-[#FBBF24]",
    label: "SQL",
  },
};

const fallbackColors = [
  "#1689E8", // Blue
  "#FF3045", // Red
  "#F4EDE5", // Cream
  "#65D7CF", // Mint
  "#20C7CF", // Cyan
  "#A855F7", // Purple
];

// Helper to get extension badge label & color (Point 5: 56x56 TS / JS badge)
function getFileBadge(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  if (ext === "ts" || ext === "tsx") {
    return {
      label: "TS",
      bg: "bg-[#1687FF]",
      text: "text-white",
      border: "border-[#1687FF]",
    };
  }
  if (ext === "js" || ext === "jsx" || ext === "mjs" || ext === "cjs") {
    return {
      label: "JS",
      bg: "bg-[#F5B82E]",
      text: "text-[#1F2937]",
      border: "border-[#F5B82E]",
    };
  }
  if (ext === "py") {
    return {
      label: "PY",
      bg: "bg-[#10B981]",
      text: "text-white",
      border: "border-[#10B981]",
    };
  }
  if (ext === "go") {
    return {
      label: "GO",
      bg: "bg-[#06B6D4]",
      text: "text-white",
      border: "border-[#06B6D4]",
    };
  }
  if (ext === "json") {
    return {
      label: "JSON",
      bg: "bg-[#FF3045]",
      text: "text-white",
      border: "border-[#FF3045]",
    };
  }
  return {
    label: "FILE",
    bg: "bg-[#1687FF]",
    text: "text-white",
    border: "border-[#1687FF]",
  };
}

// Helper to determine inferred file role/description
function getFileDescription(filePath: string, customDesc?: string): string {
  if (customDesc) return customDesc;
  const lower = filePath.toLowerCase();
  if (
    lower.includes("app.ts") ||
    lower.includes("main.ts") ||
    (lower.includes("index.ts") && !lower.includes("core/"))
  ) {
    return "Application entry point";
  }
  if (lower.includes("config")) {
    return "Configuration loader";
  }
  if (lower.includes("logger")) {
    return "Logging and monitoring";
  }
  if (lower.includes("supabase") || lower.includes("db") || lower.includes("database")) {
    return "Supabase client initialization";
  }
  if (lower.includes("eslint")) {
    return "Configuration loader";
  }
  if (lower.includes("auth")) {
    return "Authentication & middleware";
  }
  return "Core repository module";
}

// Helper for metadata chips (Point 6)
function getChipsForEntry(filePath: string, index: number) {
  const lower = filePath.toLowerCase();
  if (lower.includes("app.ts") || index === 0) {
    return [
      { label: "critical", type: "critical" },
      { label: "entry", type: "entry" },
    ];
  }
  if (lower.includes("config") && !lower.includes("eslint")) {
    return [
      { label: "important", type: "important" },
      { label: "config", type: "tag" },
    ];
  }
  if (lower.includes("logger")) {
    return [
      { label: "important", type: "important" },
      { label: "logger", type: "tag" },
    ];
  }
  if (lower.includes("supabase")) {
    return [
      { label: "important", type: "important" },
      { label: "supabase", type: "tag" },
    ];
  }
  if (lower.includes("eslint")) {
    return [
      { label: "low", type: "low" },
      { label: "config", type: "tag" },
    ];
  }
  return [
    { label: "module", type: "tag" },
  ];
}

export default function LanguageBreakdown({
  languages = {},
  totalLines: customTotalLines,
  entryPoints = [],
}: LanguageBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const calculatedTotalLines = Object.values(languages).reduce((a, b) => a + b, 0);
  const totalLines = customTotalLines || calculatedTotalLines || 63598;
  const sortedLanguages = Object.entries(languages).sort((a, b) => b[1] - a[1]);

  // Fallback languages matching screenshot
  const displayLanguages: Array<[string, number]> =
    sortedLanguages.length > 0
      ? sortedLanguages
      : [
          ["TypeScript", 186],
          ["JSON", 11],
          ["Markdown", 4],
          ["YAML", 2],
          ["JavaScript", 1],
          ["CSS", 1],
        ];

  // SVG Donut Chart Calculation
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  interface DonutSegment {
    lang: string;
    lines: number;
    rawPercent: number;
    strokeDasharray: string;
    strokeDashoffset: number;
    color: string;
  }

  const donutSegments: DonutSegment[] = useMemo(() => {
    const percentages = displayLanguages.map(([_, lines]) =>
      Math.max((lines / totalLines) * 100, 2)
    );

    return displayLanguages.map(([lang, lines], idx) => {
      const rawPercent = (lines / totalLines) * 100;
      const percent = percentages[idx];
      const priorSum = percentages.slice(0, idx).reduce((sum, p) => sum + p, 0);
      const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((priorSum / 100) * circumference);

      const config =
        languageConfig[lang] || {
          color: fallbackColors[idx % fallbackColors.length],
          bg: "bg-teal-500/20",
          text: "text-teal-400",
          label: lang.slice(0, 2).toUpperCase(),
        };

      return {
        lang,
        lines,
        rawPercent,
        strokeDasharray,
        strokeDashoffset,
        color: config.color,
      };
    });
  }, [displayLanguages, totalLines, circumference]);

  // Default fallback entry points matching 1st screenshot
  const defaultEntryPoints: EntryPointItem[] = [
    { filePath: "backend/src/app.ts", confidence: 80, description: "Application entry point" },
    { filePath: "backend/src/core/config/index.ts", confidence: 55, description: "Configuration loader" },
    { filePath: "backend/src/core/logger/index.ts", confidence: 55, description: "Logging and monitoring" },
    { filePath: "backend/src/core/supabase/index.ts", confidence: 55, description: "Supabase client initialization" },
    { filePath: "backend/eslint.config.js", confidence: 30, description: "Configuration loader" },
  ];

  const activeEntryPoints = entryPoints.length > 0 ? entryPoints : defaultEntryPoints;
  const visibleEntrypoints = isExpanded ? activeEntryPoints : activeEntryPoints.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[0.88fr_1.12fr] gap-4 sm:gap-5 items-start text-left w-full h-auto min-h-0">
      
      {/* ─── LEFT: LANGUAGE BREAKDOWN (Multicolor Donut) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[#084B52] rounded-[20px] p-5 sm:p-6 border border-[#62D9D0]/25 border-l-4 border-l-[#62D9D0] shadow-sm flex flex-col h-auto min-h-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-[#06363D] text-[#62D9D0] flex items-center justify-center shrink-0 shadow-xs">
              <Code2 size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-[0.08em] uppercase text-[#F4EDE5]">
                Language Breakdown
              </h3>
              <p className="text-[11px] text-[#8EDBD5] mt-0.5">
                Distribution of code across your repository.
              </p>
            </div>
          </div>
        </div>

        {/* Content: Donut + Language list */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-2">
          {/* Donut Chart with Darkest Teal Center (#052F35) */}
          <div className="sm:col-span-5 flex justify-center items-center relative py-1">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg
                viewBox="0 0 130 130"
                className="w-full h-full -rotate-90 transform"
              >
                {/* Background Ring */}
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="transparent"
                  stroke="#052F35"
                  strokeWidth="18"
                />
                {/* Segments */}
                {donutSegments.map((segment) => (
                  <circle
                    key={segment.lang}
                    cx="65"
                    cy="65"
                    r={radius}
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth="18"
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                    className="transition-all duration-500 ease-out"
                  />
                ))}
              </svg>

              {/* Inner Donut Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-lg sm:text-xl font-black text-[#F4EDE5] font-mono tracking-tight leading-tight">
                  {totalLines.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#8EDBD5] font-medium mt-0.5 leading-none">
                  Total Lines
                </span>
                <span className="text-[10px] text-[#8EDBD5] font-medium leading-none">
                  of Code
                </span>
              </div>
            </div>
          </div>

          {/* Language Rows List with individual color dots */}
          <div className="sm:col-span-7 space-y-1.5">
            {displayLanguages.map(([lang, lines], index) => {
              const rawPercentage = (lines / totalLines) * 100;
              const formattedPercentage =
                rawPercentage < 0.1 && rawPercentage > 0
                  ? "0.0%"
                  : `${rawPercentage.toFixed(1)}%`;
              const config =
                languageConfig[lang] || {
                  color: fallbackColors[index % fallbackColors.length],
                  bg: "bg-teal-500/20",
                  text: "text-teal-400",
                  label: lang.slice(0, 2).toUpperCase(),
                };

              return (
                <div key={lang} className="group">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="font-semibold text-[#F4EDE5]">{lang}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[#8EDBD5] font-mono text-[10.5px]">
                        {lines.toLocaleString()} lines
                      </span>
                      <span
                        className="font-bold font-mono text-right w-9 text-[11px]"
                        style={{ color: config.color }}
                      >
                        {formattedPercentage}
                      </span>
                    </div>
                  </div>

                  {/* Micro Progress Bar on Solid Track */}
                  <div className="h-1 w-full bg-[#052F35] rounded-full overflow-hidden mt-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(rawPercentage, 1.5)}%` }}
                      transition={{ duration: 0.6, delay: index * 0.04 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Metric Card */}
        <div className="mt-2 p-2.5 px-3 rounded-[10px] bg-[#06363D] border border-[rgba(98,217,208,0.12)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-[#084B52] text-[#62D9D0] flex items-center justify-center shrink-0">
              <Database size={14} />
            </div>
            <div>
              <div className="text-[11.5px] font-semibold text-[#F4EDE5]">
                Total Lines of Code
              </div>
              <div className="text-[10px] text-[#8EDBD5]">
                Across {displayLanguages.length} languages
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-[#F4EDE5] font-mono leading-tight">
              {totalLines.toLocaleString()}
            </div>
            <div className="text-[9.5px] text-[#62D9D0] font-semibold flex items-center justify-end gap-0.5">
              <span>↑ 0%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── RIGHT: CORE ENTRYPOINTS (Points 1–12 Redesign to match 1st Image) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04 }}
        className="bg-[#074A52] rounded-[20px] p-5 sm:p-6 border border-[#126873] shadow-sm flex flex-col h-auto min-h-0 space-y-4 text-left"
      >
        {/* Point 2 & 3: Header with 64x64px Red Target Tile + View All Button */}
        <div className="flex items-center justify-between gap-3 pb-1">
          {/* Left: 64x64px Red Icon Tile + Title + Subtitle */}
          <div className="flex items-center gap-3.5">
            {/* Point 2: Red Target/Bullseye Tile (64x64px, bg #FF304F, radius 14px, shadow) */}
            <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-[14px] bg-[#FF304F] shadow-md shadow-[#FF304F]/25 text-white flex items-center justify-center shrink-0">
              <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.4]" />
            </div>

            <div>
              {/* Point 2: Title (24-28px font-bold #F4F7F7) */}
              <h2 className="text-xl sm:text-[24px] lg:text-[26px] font-extrabold text-[#F4F7F7] tracking-tight leading-tight">
                Core Entrypoints
              </h2>
              {/* Point 2: Subtitle (15-16px #91B7BA) */}
              <p className="text-xs sm:text-[14px] text-[#91B7BA] mt-0.5 leading-snug">
                Most important files in your codebase.
              </p>
            </div>
          </div>

          {/* Point 3: View All Button (Top-Right, h: ~44px, bg #063942, border #126873, hover turquoise) */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-[40px] sm:h-[44px] px-3.5 sm:px-4.5 rounded-[12px] bg-[#063942] hover:bg-[#19D3D8] border border-[#126873] hover:border-[#19D3D8] text-[#19D3D8] hover:text-[#063E45] text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 group"
          >
            <span>View All</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform stroke-[2.4]" />
          </button>
        </div>

        {/* Points 4–10: Large Horizontal Cards List */}
        <div className="space-y-2.5">
          {visibleEntrypoints.map((entry, index) => {
            const entryPath = entry.filePath || entry.path || entry.name || "Unknown";
            const badge = getFileBadge(entryPath);
            const description = getFileDescription(entryPath, entry.description || entry.role);
            const score = Math.round(
              entry.confidence <= 1 ? entry.confidence * 100 : entry.confidence
            );
            const isFirst = index === 0;
            const chips = getChipsForEntry(entryPath, index);

            // Point 7: Progress Bar Fill (#FF304F for 80% / #1, #19D3D8 for others)
            const isRedBar = score >= 80 || isFirst;
            const barFillColor = isRedBar ? "#FF304F" : "#19D3D8";

            return (
              <motion.div
                key={entryPath + index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`p-3.5 sm:px-4 sm:py-3.5 rounded-[16px] bg-[#063942] hover:bg-[#09515A] border transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                  isFirst
                    ? "border-[rgba(255,48,79,0.35)] shadow-xs"
                    : "border-[#126873]/50 hover:border-[#19D3D8]/40"
                }`}
              >
                {/* Left: 54x54px Tech Badge + Path + Description + Metadata Chips */}
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  {/* Point 5: 54x54px Technology Badge */}
                  <div
                    className={`w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-[12px] ${badge.bg} ${badge.text} flex items-center justify-center text-sm sm:text-base font-black shrink-0 shadow-xs font-mono`}
                  >
                    {badge.label}
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1">
                    {/* Path */}
                    <div className="text-xs sm:text-[13.5px] font-bold font-mono text-[#F4F7F7] truncate leading-tight group-hover:text-white">
                      {entryPath}
                    </div>
                    {/* Description */}
                    <div className="text-[11px] sm:text-[12px] text-[#91B7BA] truncate mt-0.5 leading-tight">
                      {description}
                    </div>

                    {/* Point 6: Metadata Chips ([critical], [entry], [important], [config], etc.) */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {chips.map((chip, chipIdx) => {
                        let chipStyle = "bg-[#0A343D] border border-[#126873] text-[#91B7BA]";
                        if (chip.type === "critical") {
                          chipStyle = "bg-[#FF304F]/15 border border-[#FF304F]/30 text-[#FF536B]";
                        } else if (chip.type === "entry" || chip.type === "important") {
                          chipStyle = "bg-[#19D3D8]/15 border border-[#19D3D8]/30 text-[#19D3D8]";
                        } else if (chip.type === "low") {
                          chipStyle = "bg-[#F5B82E]/15 border border-[#F5B82E]/30 text-[#F5B82E]";
                        }

                        return (
                          <span
                            key={chipIdx}
                            className={`px-2 py-0.5 rounded-[6px] text-[10.5px] sm:text-[11px] font-mono font-bold leading-none ${chipStyle}`}
                          >
                            {chip.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Point 7 Large Progress Bar + Percentage + Arrow */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  {/* Progress Bar (w: 120-220px, h: 10px, track: #0A343D, fill: #FF304F or #19D3D8) */}
                  <div className="w-24 sm:w-36 md:w-44 lg:w-48 h-[9.5px] bg-[#0A343D] rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${score}%`, backgroundColor: barFillColor }}
                    />
                  </div>

                  {/* Percentage Score */}
                  <span className="text-xs sm:text-[13.5px] font-bold font-mono text-[#F4F7F7] w-8 sm:w-9 text-right shrink-0">
                    {score}%
                  </span>

                  {/* Row Chevron Arrow */}
                  <ChevronRight
                    size={16}
                    className="text-[#91B7BA] group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Point 11: Call-To-Action "+63 more entrypoints" Card */}
        {activeEntryPoints.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-1 p-3 sm:px-4 sm:py-3.5 rounded-[16px] bg-[#063942] hover:bg-[#09515A] border border-[#126873] hover:border-[#19D3D8] transition-all flex items-center justify-between text-left cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              {/* 50x50px Plus Icon Tile */}
              <div className="w-[42px] h-[42px] sm:w-[48px] sm:h-[48px] rounded-[12px] bg-[#084A52] border border-[#126873] text-[#19D3D8] flex items-center justify-center shrink-0 font-bold group-hover:border-[#19D3D8] transition-colors">
                {isExpanded ? <ChevronUp size={18} /> : <Plus size={18} className="stroke-[2.6]" />}
              </div>
              <div>
                <div className="text-xs sm:text-[14px] font-bold text-[#F4F7F7] leading-tight group-hover:text-white">
                  {isExpanded
                    ? "Show fewer entrypoints"
                    : `+${activeEntryPoints.length - 5} more entrypoints`}
                </div>
                <div className="text-[11px] sm:text-[11.5px] text-[#91B7BA] mt-0.5 leading-none">
                  Showing {isExpanded ? activeEntryPoints.length : 5} of{" "}
                  {activeEntryPoints.length} entrypoints
                </div>
              </div>
            </div>

            <ChevronRight
              size={18}
              className={`text-[#91B7BA] group-hover:text-[#19D3D8] group-hover:translate-x-1 transition-all ${
                isExpanded ? "-rotate-90" : ""
              }`}
            />
          </button>
        )}
      </motion.div>

    </div>
  );
}