"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Heart,
  RotateCw,
  FileX,
  Unlink,
  Search,
  ArrowUpDown,
  FileCode,
  FileText,
  RefreshCw,
  Calendar,
  Code2,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

interface GodServiceItem {
  file: string;
  methods?: number;
  loc?: number;
}

interface HealthDiagnosticsProps {
  score?: number;
  cycleCount?: number;
  deadCount?: number;
  brokenCount?: number;
  godServices?: GodServiceItem[];
  deadCode?: Array<string | { file: string; type?: string }>;
  cycles?: any[];
  isLoading?: boolean;
  onAnalyze?: () => void;
  onSelectFile?: (file: string) => void;
}

// Mini Sparkline SVG Chart Component (100x35px)
function SparklineChart({
  color = "#FF4054",
  gradientId,
  points = "M 0,28 Q 25,8 50,22 T 100,12",
  fillPath = "M 0,28 Q 25,8 50,22 T 100,12 L 100,35 L 0,35 Z",
}: {
  color?: string;
  gradientId: string;
  points?: string;
  fillPath?: string;
}) {
  return (
    <div className="w-[95px] h-[34px] shrink-0 overflow-hidden pointer-events-none">
      <svg
        viewBox="0 0 100 35"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Subtle Area Fill under curve */}
        <path d={fillPath} fill={`url(#${gradientId})`} />
        {/* Line Stroke */}
        <path
          d={points}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function HealthDiagnostics({
  score = 40,
  cycleCount = 0,
  deadCount = 50,
  brokenCount = 84,
  godServices = [],
  deadCode = [],
  cycles = [],
  isLoading = false,
  onAnalyze,
  onSelectFile,
}: HealthDiagnosticsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"methods-desc" | "methods-asc" | "loc-desc" | "file-asc">("methods-desc");
  const [deadCodeSearch, setDeadCodeSearch] = useState("");

  // Extract god services dynamically if not provided by backend static report
  const rawGodServices = useMemo(() => {
    if (godServices && godServices.length > 0) return godServices;
    return [];
  }, [godServices]);

  const rawDeadCode = useMemo(() => {
    if (deadCode && deadCode.length > 0) {
      return deadCode.map((d) => (typeof d === "string" ? d : d.file));
    }
    return [];
  }, [deadCode]);

  // Filter & Sort God Services
  const processedGodServices = useMemo(() => {
    let list = [...rawGodServices];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.file.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const methodsA = a.methods ?? 0;
      const methodsB = b.methods ?? 0;
      const locA = a.loc ?? 0;
      const locB = b.loc ?? 0;

      if (sortBy === "methods-desc") return methodsB - methodsA;
      if (sortBy === "methods-asc") return methodsA - methodsB;
      if (sortBy === "loc-desc") return locB - locA;
      if (sortBy === "file-asc") return a.file.localeCompare(b.file);
      return 0;
    });

    return list;
  }, [rawGodServices, searchQuery, sortBy]);

  // Filter Dead Code
  const filteredDeadCode = useMemo(() => {
    if (!deadCodeSearch.trim()) return rawDeadCode;
    const q = deadCodeSearch.toLowerCase();
    return rawDeadCode.filter((d) => d.toLowerCase().includes(q));
  }, [rawDeadCode, deadCodeSearch]);

  // Method Severity Badge Formatter
  const getMethodBadge = (methods: number) => {
    if (methods === 0) {
      return {
        label: "0 methods",
        bg: "bg-[#19C9B7]/15",
        text: "text-[#19C9B7]",
        border: "border-[#19C9B7]/35",
      };
    }
    if (methods <= 10) {
      return {
        label: `${methods} methods`,
        bg: "bg-[#F4B63F]/15",
        text: "text-[#F4B63F]",
        border: "border-[#F4B63F]/35",
      };
    }
    if (methods <= 30) {
      return {
        label: `${methods} methods`,
        bg: "bg-[#FB923C]/15",
        text: "text-[#FB923C]",
        border: "border-[#FB923C]/35",
      };
    }
    return {
      label: `${methods} methods`,
      bg: "bg-[#FF4054]/15",
      text: "text-[#FF4054]",
      border: "border-[#FF4054]/40",
    };
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full max-w-[1450px] mx-auto text-left relative space-y-6 select-none font-sans">
      {/* ── AMBIENT BACKGROUND DECORATIONS (Very subtle 0.08 opacity circles) ── */}
      <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-[#19C9B7] opacity-[0.06] blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 -left-20 w-96 h-96 rounded-full bg-[#FF4054] opacity-[0.05] blur-3xl pointer-events-none -z-10" />

      {/* ── 1. MAIN GLASS CONTAINER (Header + Metric Cards Grouped) ── */}
      <div className="rounded-[22px] bg-[rgba(5,35,40,0.35)] border border-[rgba(45,200,190,0.18)] p-6 sm:p-7 md:p-8 backdrop-blur-md relative overflow-hidden space-y-7">
        
        {/* Header: Left (Icon + Typography) & Right (Last Scanned + Run Scan) */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: 72px Soft Red Icon + Strong Typography Hierarchy */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-[72px] h-[72px] rounded-[16px] bg-[#FF4054] shadow-lg shadow-[#FF4054]/20 border border-[#FF4054]/30 text-white flex items-center justify-center shrink-0">
              <Activity className="w-9 h-9 text-white stroke-[2.4]" />
            </div>

            <div>
              <p className="text-xs sm:text-[13px] font-bold uppercase tracking-[2px] text-[#19C9B7]">
                CODE QUALITY
              </p>
              <h1 className="text-2xl sm:text-[34px] font-extrabold text-[#F5F7F7] tracking-tight leading-tight mt-0.5">
                Health Diagnostics
              </h1>
              <p className="text-xs sm:text-[14px] text-[#8FB7BA] mt-1.5 font-normal leading-relaxed">
                Analyze code structure, detect issues and keep your project healthy.
              </p>
            </div>
          </div>

          {/* Right: Last Scanned utility card + Run Scan primary action */}
          <div className="flex items-center gap-3.5 shrink-0 self-start lg:self-auto flex-wrap sm:flex-nowrap">
            {/* Utility Card: Last Scanned */}
            <div className="h-[52px] px-4 rounded-xl bg-[rgba(20,80,85,0.25)] border border-[rgba(25,201,183,0.25)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#19C9B7]/15 border border-[#19C9B7]/30 text-[#19C9B7] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#8FB7BA] font-bold uppercase tracking-wider block leading-tight">
                  LAST SCANNED
                </span>
                <span className="text-xs font-bold text-[#F5F7F7] font-mono block mt-0.5">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Run Scan Button: Coral Primary Action */}
            <button
              onClick={onAnalyze}
              disabled={isLoading}
              className="h-[52px] px-6 rounded-[13px] bg-[#FF4054] hover:bg-[#ff5567] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#FF4054]/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer shrink-0 disabled:opacity-50 active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Scanning..." : "Run Scan"}</span>
            </button>
          </div>
        </header>

        {/* ── 2. FOUR METRIC CARDS (Subtly Tinted Translucent Surfaces) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
          
          {/* Card 1: HEALTH SCORE (Subtle Red Tint: rgba(255, 64, 84, 0.10)) */}
          <div className="rounded-[18px] bg-[rgba(255,64,84,0.10)] border border-[rgba(255,64,84,0.22)] p-5 sm:p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all hover:border-[rgba(255,64,84,0.45)]">
            {/* Top Row: 48x48 Icon + Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#FF4054]/15 border border-[#FF4054]/30 text-[#FF4054] flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-[#FF4054]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8FB7BA]">
                  HEALTH SCORE
                </span>
              </div>
            </div>

            {/* Middle Row: Prominent Number 40 /100 */}
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#F4F8F8] leading-none">
                {score}
              </span>
              <span className="text-xs font-mono text-[#8FB7BA] font-semibold">
                /100
              </span>
            </div>

            {/* Bottom Row: Trend Pill + Mini Sparkline Chart */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF4054]">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>12%</span>
                <span className="text-[#8FB7BA] font-normal text-[11px]">vs last scan</span>
              </div>

              {/* Red Sparkline */}
              <SparklineChart
                color="#FF4054"
                gradientId="grad-health"
                points="M 0,14 Q 25,28 50,16 T 100,28"
                fillPath="M 0,14 Q 25,28 50,16 T 100,28 L 100,35 L 0,35 Z"
              />
            </div>
          </div>

          {/* Card 2: CYCLES (Subtle Teal Tint: rgba(25, 201, 183, 0.08)) */}
          <div className="rounded-[18px] bg-[rgba(25,201,183,0.08)] border border-[rgba(25,201,183,0.20)] p-5 sm:p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all hover:border-[rgba(25,201,183,0.40)]">
            {/* Top Row: 48x48 Icon + Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#19C9B7]/15 border border-[#19C9B7]/30 text-[#19C9B7] flex items-center justify-center shrink-0">
                  <RotateCw className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8FB7BA]">
                  CYCLES
                </span>
              </div>
            </div>

            {/* Middle Row: Prominent Number 0 */}
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#F4F8F8] leading-none">
                {cycleCount}
              </span>
            </div>

            {/* Bottom Row: Trend Pill + Mini Sparkline Chart */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#19C9B7]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>8%</span>
                <span className="text-[#8FB7BA] font-normal text-[11px]">vs last scan</span>
              </div>

              {/* Teal Sparkline */}
              <SparklineChart
                color="#19C9B7"
                gradientId="grad-cycles"
                points="M 0,28 Q 30,22 55,14 T 100,8"
                fillPath="M 0,28 Q 30,22 55,14 T 100,8 L 100,35 L 0,35 Z"
              />
            </div>
          </div>

          {/* Card 3: DEAD CODE (Subtle Amber Tint: rgba(244, 182, 63, 0.10)) */}
          <div
            onClick={() => scrollToSection("dead-code-section")}
            className="rounded-[18px] bg-[rgba(244,182,63,0.10)] border border-[rgba(244,182,63,0.22)] p-5 sm:p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all hover:border-[rgba(244,182,63,0.45)] cursor-pointer group"
          >
            {/* Top Row: 48x48 Icon + Label + Interactive Arrow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F4B63F]/15 border border-[#F4B63F]/30 text-[#F4B63F] flex items-center justify-center shrink-0">
                  <FileX className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8FB7BA]">
                  DEAD CODE
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#F4B63F]/10 text-[#F4B63F] flex items-center justify-center group-hover:bg-[#F4B63F]/20 group-hover:translate-x-0.5 transition-all">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Middle Row: Prominent Number 50 */}
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#F4F8F8] leading-none">
                {deadCount}
              </span>
            </div>

            {/* Bottom Row: Trend Pill + Mini Sparkline Chart */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F4B63F]">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>17%</span>
                <span className="text-[#8FB7BA] font-normal text-[11px]">vs last scan</span>
              </div>

              {/* Amber Sparkline */}
              <SparklineChart
                color="#F4B63F"
                gradientId="grad-deadcode"
                points="M 0,10 Q 30,16 60,24 T 100,16"
                fillPath="M 0,10 Q 30,16 60,24 T 100,16 L 100,35 L 0,35 Z"
              />
            </div>
          </div>

          {/* Card 4: BROKEN IMPORTS (Subtle Tint: rgba(25, 201, 183, 0.08) with Coral/Mint Issue Accents) */}
          <div className="rounded-[18px] bg-[rgba(25,201,183,0.08)] border border-[rgba(25,201,183,0.20)] p-5 sm:p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all hover:border-[rgba(25,201,183,0.40)]">
            {/* Top Row: 48x48 Icon + Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#19C9B7]/15 border border-[#19C9B7]/30 text-[#19C9B7] flex items-center justify-center shrink-0">
                  <Unlink className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8FB7BA]">
                  BROKEN IMPORTS
                </span>
              </div>
            </div>

            {/* Middle Row: Prominent Number 84 */}
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#F4F8F8] leading-none">
                {brokenCount}
              </span>
            </div>

            {/* Bottom Row: Trend Pill + Mini Sparkline Chart */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#19C9B7]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>4%</span>
                <span className="text-[#8FB7BA] font-normal text-[11px]">vs last scan</span>
              </div>

              {/* Mint/Teal Sparkline */}
              <SparklineChart
                color="#19C9B7"
                gradientId="grad-broken"
                points="M 0,28 Q 25,24 55,14 T 100,10"
                fillPath="M 0,28 Q 25,24 55,14 T 100,10 L 100,35 L 0,35 Z"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. GOD SERVICES SECTION ── */}
      <div id="god-services-section" className="rounded-[22px] bg-[rgba(5,35,40,0.35)] border border-[rgba(45,200,190,0.18)] p-6 sm:p-7 backdrop-blur-md shadow-xl">
        {/* Section Header: [icon] God Services 20 on Left, Search + Sort on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[rgba(25,201,183,0.15)]">
          {/* Left: Icon + Title + Issue Badge + Subtitle */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,64,84,0.12)] border border-[rgba(255,64,84,0.35)] text-[#FF4054] flex items-center justify-center shrink-0 mt-0.5">
              <Code2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-[#F5F7F7] tracking-tight">
                  God Services
                </h2>
                {/* God Services 20 Issue Badge */}
                <span className="px-2.5 py-0.5 rounded-full bg-[rgba(255,64,84,0.12)] border border-[rgba(255,64,84,0.35)] text-[#FF4054] text-xs font-mono font-bold">
                  {rawGodServices.length}
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-[#8FB7BA] mt-0.5">
                Files with high complexity, too many methods or responsibilities.
              </p>
            </div>
          </div>

          {/* Right: Search & Sort (Secondary Dark Translucent Controls) */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#19C9B7]" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[rgba(5,42,48,0.6)] border border-[rgba(25,201,183,0.25)] focus:border-[#19C9B7] focus:ring-1 focus:ring-[#19C9B7]/40 text-xs text-[#F5F7F7] placeholder-[#79A4A8] outline-none transition-all"
              />
            </div>

            {/* Sort Selector */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-3 pr-8 rounded-xl bg-[rgba(5,42,48,0.6)] border border-[rgba(25,201,183,0.25)] focus:border-[#19C9B7] text-xs font-medium text-[#8FB7BA] focus:text-[#F5F7F7] outline-none cursor-pointer appearance-none"
              >
                <option value="methods-desc">Sort by methods (High → Low)</option>
                <option value="methods-asc">Sort by methods (Low → High)</option>
                <option value="loc-desc">Sort by LOC (High → Low)</option>
                <option value="file-asc">Sort by File Name (A → Z)</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#19C9B7] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-3 px-3.5 py-2.5 text-[11px] font-bold text-[#8FB7BA] uppercase tracking-wider border-b border-[rgba(25,201,183,0.10)] mt-1">
          <div className="col-span-1">#</div>
          <div className="col-span-7 sm:col-span-7">FILE PATH</div>
          <div className="col-span-2 sm:col-span-2 text-center">METHODS</div>
          <div className="col-span-2 sm:col-span-2 text-right">ACTION</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[rgba(25,201,183,0.08)] mt-0.5">
          {processedGodServices.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8FB7BA]">
              No matching god services found for "{searchQuery}".
            </div>
          ) : (
            processedGodServices.map((service, index) => {
              const methodsCount = service.methods ?? 0;
              const badge = getMethodBadge(methodsCount);
              const isHighSeverity = methodsCount > 30;

              return (
                <div
                  key={service.file + index}
                  onClick={() => onSelectFile?.(service.file)}
                  className={`grid grid-cols-12 gap-3 items-center px-3.5 py-2.5 rounded-xl hover:bg-[rgba(10,80,88,0.45)] transition-all cursor-pointer group ${
                    isHighSeverity ? "border-l-2 border-l-[#FF4054]" : ""
                  }`}
                >
                  {/* # Rank Number in Circular Badge */}
                  <div className="col-span-1 flex items-center">
                    <div className="w-5 h-5 rounded-full bg-[#052A30] border border-[#19C9B7]/30 text-[#19C9B7] text-[10.5px] font-mono font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                  </div>

                  {/* File Path */}
                  <div className="col-span-7 sm:col-span-7 flex items-center gap-2 min-w-0">
                    <span
                      className="font-mono text-xs sm:text-[12.5px] text-[#C3D5D8] group-hover:text-white truncate"
                      title={service.file}
                    >
                      {service.file}
                    </span>
                  </div>

                  {/* Method Badge */}
                  <div className="col-span-2 sm:col-span-2 flex items-center justify-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border ${badge.border} ${badge.bg} ${badge.text} text-[11px] font-mono font-semibold whitespace-nowrap`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* LOC Action Button */}
                  <div className="col-span-2 sm:col-span-2 flex items-center justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFile?.(service.file);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[rgba(25,201,183,0.20)] bg-[rgba(6,47,56,0.7)] hover:border-[rgba(25,201,183,0.60)] hover:bg-[rgba(10,80,88,0.8)] text-[#8FB7BA] hover:text-white text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title={`Inspect ${service.loc || 450} lines of code`}
                    >
                      <FileText size={12} className="text-[#19C9B7]" />
                      <span>{service.loc ? `${service.loc} LOC` : "LOC"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 4. DEAD CODE SECTION ── */}
      <div id="dead-code-section" className="rounded-[22px] bg-[rgba(5,35,40,0.35)] border border-[rgba(45,200,190,0.18)] p-6 sm:p-7 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(25,201,183,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(244,182,63,0.12)] border border-[rgba(244,182,63,0.35)] text-[#F4B63F] flex items-center justify-center shrink-0">
              <FileX className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#F5F7F7] tracking-tight">
                  Dead Code
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[rgba(244,182,63,0.12)] border border-[rgba(244,182,63,0.35)] text-[#F4B63F] text-xs font-mono font-bold">
                  {rawDeadCode.length}
                </span>
              </div>
              <p className="text-[11.5px] text-[#8FB7BA]">
                Unreferenced files eligible for safe pruning to reduce bundle overhead.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#19C9B7]" />
            <input
              type="text"
              placeholder="Filter dead files..."
              value={deadCodeSearch}
              onChange={(e) => setDeadCodeSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-[rgba(5,42,48,0.6)] border border-[rgba(25,201,183,0.25)] focus:border-[#19C9B7] text-xs text-[#F5F7F7] placeholder-[#79A4A8] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-3.5">
          {filteredDeadCode.map((filePath, index) => (
            <div
              key={filePath + index}
              onClick={() => onSelectFile?.(filePath)}
              className="p-2.5 rounded-xl bg-[rgba(5,42,48,0.5)] hover:bg-[rgba(10,80,88,0.6)] border border-[rgba(25,201,183,0.15)] hover:border-[rgba(25,201,183,0.40)] transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCode size={13} className="text-[#F4B63F] shrink-0" />
                <span className="font-mono text-xs text-[#C3D5D8] group-hover:text-white truncate">
                  {filePath}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8FB7BA] group-hover:text-[#19C9B7] shrink-0">
                Prunable
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

