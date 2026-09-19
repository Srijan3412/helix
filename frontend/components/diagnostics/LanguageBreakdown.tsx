"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  FileText,
  Database,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  ArrowRight,
  FileCode2,
} from "lucide-react";

interface EntryPointItem {
  filePath?: string;
  path?: string;
  name?: string;
  confidence: number;
  role?: string;
  description?: string;
}

interface LanguageBreakdownProps {
  languages: Record<string, number>;
  totalLines?: number;
  entryPoints: EntryPointItem[];
}

// Visual color palette matching reference design
const languageConfig: Record<
  string,
  { color: string; bg: string; text: string; label: string }
> = {
  TypeScript: {
    color: "#16C7A1",
    bg: "bg-[#16C7A1]/20",
    text: "text-[#16C7A1]",
    label: "TS",
  },
  JavaScript: {
    color: "#38BDF8",
    bg: "bg-[#38BDF8]/20",
    text: "text-[#38BDF8]",
    label: "JS",
  },
  JSON: {
    color: "#F52B35",
    bg: "bg-[#F52B35]/20",
    text: "text-[#F52B35]",
    label: "JSON",
  },
  Markdown: {
    color: "#E2E8F0",
    bg: "bg-[#E2E8F0]/20",
    text: "text-[#E2E8F0]",
    label: "MD",
  },
  YAML: {
    color: "#67E8F9",
    bg: "bg-[#67E8F9]/20",
    text: "text-[#67E8F9]",
    label: "YML",
  },
  CSS: {
    color: "#A855F7",
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
  "#16C7A1",
  "#F52B35",
  "#E2E8F0",
  "#67E8F9",
  "#38BDF8",
  "#A855F7",
  "#FBBF24",
  "#10B981",
];

// Helper to get extension badge label & color
function getFileBadge(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  if (ext === "ts" || ext === "tsx") {
    return { label: "TS", bg: "bg-[#0A4A57]", text: "text-[#38BDF8]" };
  }
  if (ext === "js" || ext === "jsx" || ext === "mjs" || ext === "cjs") {
    return { label: "JS", bg: "bg-[#5A3A10]", text: "text-[#F59E0B]" };
  }
  if (ext === "py") {
    return { label: "PY", bg: "bg-[#0E4A35]", text: "text-[#34D399]" };
  }
  if (ext === "go") {
    return { label: "GO", bg: "bg-[#0C4754]", text: "text-[#22D3EE]" };
  }
  if (ext === "rs") {
    return { label: "RS", bg: "bg-[#4D2810]", text: "text-[#FB923C]" };
  }
  if (ext === "json") {
    return { label: "JSON", bg: "bg-[#4A1518]", text: "text-[#F87171]" };
  }
  if (ext === "yml" || ext === "yaml") {
    return { label: "YML", bg: "bg-[#0C4754]", text: "text-[#67E8F9]" };
  }
  return { label: "FILE", bg: "bg-[#08424D]", text: "text-[#16C7A1]" };
}

// Helper to determine inferred file role/description
function getFileDescription(filePath: string, customDesc?: string): string {
  if (customDesc) return customDesc;
  const lower = filePath.toLowerCase();
  if (lower.includes("app.ts") || lower.includes("main.ts") || lower.includes("index.ts") && !lower.includes("core/")) {
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
    return "ESLint configuration";
  }
  if (lower.includes("auth")) {
    return "Authentication & middleware";
  }
  if (lower.includes("turnstile")) {
    return "Turnstile verification service";
  }
  if (lower.includes("admin")) {
    return "Admin middleware & handler";
  }
  if (lower.includes("agent") || lower.includes("ai")) {
    return "AI agents & context engine";
  }
  if (lower.includes("trace")) {
    return "Execution trace analyzer";
  }
  if (lower.includes("framework")) {
    return "Framework detection layer";
  }
  return "Core repository module";
}

export default function LanguageBreakdown({
  languages = {},
  totalLines: customTotalLines,
  entryPoints = [],
}: LanguageBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const calculatedTotalLines = Object.values(languages).reduce((a, b) => a + b, 0);
  const totalLines = customTotalLines || calculatedTotalLines || 51815;
  const sortedLanguages = Object.entries(languages).sort((a, b) => b[1] - a[1]);

  // If no languages provided, provide fallback for visual rendering
  const displayLanguages: Array<[string, number]> =
    sortedLanguages.length > 0
      ? sortedLanguages
      : [
          ["TypeScript", 170],
          ["JSON", 9],
          ["Markdown", 4],
          ["YAML", 2],
          ["JavaScript", 1],
          ["CSS", 1],
        ];

  // SVG Donut Chart Calculation (Compact Sizing)
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
      Math.max((lines / totalLines) * 100, 1.2)
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

  const visibleEntrypoints = isExpanded ? entryPoints : entryPoints.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4 items-start text-left w-full h-auto min-h-0">
      {/* ─── LEFT: LANGUAGE BREAKDOWN ─── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[rgba(7,60,69,0.85)] backdrop-blur-md rounded-[14px] p-4 sm:p-4.5 border border-[rgba(32,214,216,0.18)] shadow-sm flex flex-col h-auto min-h-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#094752] border border-[#20D6D8]/30 flex items-center justify-center text-[#20D6D8] shrink-0">
              <Code2 size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-[0.08em] uppercase text-[#F2F7F7]">
                Language Breakdown
              </h3>
              <p className="text-[11px] text-[#82AEB5] mt-0.5">
                Distribution of code across your repository
              </p>
            </div>
          </div>
        </div>

        {/* Content: Donut + Language list */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-2">
          {/* Donut Chart */}
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
                  stroke="#052A31"
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
                <span className="text-lg sm:text-xl font-black text-white font-mono tracking-tight leading-tight">
                  {totalLines.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#82AEB5] font-medium mt-0.5 leading-none">
                  Total Lines
                </span>
                <span className="text-[10px] text-[#82AEB5] font-medium leading-none">
                  of Code
                </span>
              </div>
            </div>
          </div>

          {/* Language Rows List */}
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
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="font-semibold text-[#F2F7F7]">{lang}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[#82AEB5] font-mono text-[10.5px]">
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

                  {/* Micro Progress Bar */}
                  <div className="h-1 w-full bg-[#052A31] rounded-full overflow-hidden mt-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(rawPercentage, 1)}%` }}
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
        <div className="mt-2 p-2.5 px-3 rounded-[10px] bg-[rgba(5,42,49,0.85)] border border-[rgba(32,214,216,0.12)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-[#094752] border border-[#20D6D8]/30 flex items-center justify-center text-[#20D6D8] shrink-0">
              <Database size={14} />
            </div>
            <div>
              <div className="text-[11.5px] font-semibold text-[#F2F7F7]">
                Total Lines of Code
              </div>
              <div className="text-[10px] text-[#82AEB5]">
                Across {displayLanguages.length} languages
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-white font-mono leading-tight">
              {totalLines.toLocaleString()}
            </div>
            <div className="text-[9.5px] text-[#20D6D8] font-semibold flex items-center justify-end gap-0.5">
              <span>↑ +0%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── RIGHT: CORE ENTRYPOINTS ─── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04 }}
        className="bg-[rgba(7,60,69,0.85)] backdrop-blur-md rounded-[14px] p-4 sm:p-4.5 border border-[rgba(32,214,216,0.18)] shadow-sm flex flex-col h-auto min-h-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#094752] border border-[#20D6D8]/30 flex items-center justify-center text-[#20D6D8] shrink-0">
              <FileText size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-[0.08em] uppercase text-[#F2F7F7]">
                Core Entrypoints
              </h3>
              <p className="text-[11px] text-[#82AEB5] mt-0.5">
                Most important files in your codebase
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable / Stacked Entrypoints List */}
        <div
          className={`space-y-1.5 ${
            isExpanded
              ? "max-h-[380px] overflow-y-auto pr-1 custom-scrollbar"
              : ""
          }`}
        >
          {visibleEntrypoints.map((entry, index) => {
            const entryPath =
              entry.filePath || entry.path || entry.name || "Unknown";
            const badge = getFileBadge(entryPath);
            const description = getFileDescription(
              entryPath,
              entry.description || entry.role
            );
            const score = Math.round(
              entry.confidence <= 1 ? entry.confidence * 100 : entry.confidence
            );

            return (
              <motion.div
                key={entryPath + index}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="flex items-center justify-between p-2 px-3 rounded-[10px] bg-[#093C45]/80 hover:bg-[#0E4954]/90 border border-[#176873]/50 transition-colors group"
              >
                {/* Left: Extension Badge + Path & Subtitle */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-6 h-6 rounded-[6px] ${badge.bg} border border-[#176873]/60 flex items-center justify-center ${badge.text} text-[10px] font-bold shrink-0 font-mono`}
                  >
                    {badge.label}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-medium text-[#F2F7F7] truncate font-mono">
                      {entryPath}
                    </div>
                    <div className="text-[10.5px] text-[#82AEB5] truncate">
                      {description}
                    </div>
                  </div>
                </div>

                {/* Right: Confidence Bar + Score */}
                <div className="flex items-center gap-2.5 shrink-0 ml-2.5">
                  <div className="w-14 sm:w-16 h-1.5 bg-[#083E48] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#16C7A1] rounded-full transition-all duration-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold font-mono text-[#F2F7F7] w-8 text-right">
                    {score}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Expandable Footer Button */}
        {entryPoints.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 p-2 px-3 rounded-[10px] bg-[#093C45]/60 hover:bg-[#0E4954]/80 border border-[#176873]/40 transition-colors flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-[6px] bg-[#0E4F5A] border border-[#16C7A1]/30 flex items-center justify-center text-[#16C7A1] shrink-0 font-bold">
                {isExpanded ? <ChevronUp size={13} /> : <Plus size={13} />}
              </div>
              <div>
                <div className="text-[11.5px] font-semibold text-[#F2F7F7]">
                  {isExpanded
                    ? "Show fewer entrypoints"
                    : `+${entryPoints.length - 5} more entrypoints`}
                </div>
                <div className="text-[10px] text-[#82AEB5]">
                  Showing {isExpanded ? entryPoints.length : 5} of{" "}
                  {entryPoints.length} entrypoints
                </div>
              </div>
            </div>

            <ChevronRight
              size={14}
              className={`text-[#82AEB5] transform transition-transform duration-200 ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        )}
      </motion.div>
    </div>
  );
}