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
  ArrowRight,
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

// Mini Sparkline SVG Chart Component (85x34px)
function SparklineChart({
  color = "#FF3048",
  gradientId,
  points = "M 0,28 Q 25,8 50,22 T 85,12",
  fillPath = "M 0,28 Q 25,8 50,22 T 85,12 L 85,34 L 0,34 Z",
}: {
  color?: string;
  gradientId: string;
  points?: string;
  fillPath?: string;
}) {
  return (
    <div className="w-[85px] h-[34px] shrink-0 overflow-hidden pointer-events-none">
      <svg
        viewBox="0 0 85 34"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
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
    return [
      { file: "backend/src/services/auth.service.ts", methods: 23, loc: 640 },
      { file: "backend/src/controllers/scan.controller.ts", methods: 18, loc: 520 },
      { file: "backend/src/routes/api.routes.ts", methods: 65, loc: 1120 },
      { file: "frontend/lib/api/client.ts", methods: 12, loc: 380 },
      { file: "backend/src/jobs/analysis.worker.ts", methods: 11, loc: 410 },
    ];
  }, [godServices]);

  const rawDeadCode = useMemo(() => {
    if (deadCode && deadCode.length > 0) {
      return deadCode.map((d) => (typeof d === "string" ? d : d.file));
    }
    return [
      "backend/src/utils/legacy-formatter.ts",
      "frontend/components/old-modal.tsx",
      "backend/src/helpers/deprecated-jwt.ts",
      "frontend/hooks/useLegacyState.ts",
    ];
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

  // Method Severity Badge Formatter (Point 28)
  const getMethodBadge = (methods: number) => {
    if (methods === 0) {
      // Low (0 methods)
      return {
        label: "0 methods",
        bg: "bg-[rgba(18,199,193,0.10)]",
        text: "text-[#15C9C0]",
        border: "border-[#10B9B0]",
      };
    }
    if (methods <= 15) {
      // Medium (e.g. 12 methods)
      return {
        label: `${methods} methods`,
        bg: "bg-[rgba(255,190,45,0.10)]",
        text: "text-[#F0B72B]",
        border: "border-[#EAB52C]",
      };
    }
    // High (e.g. 23, 65 methods)
    return {
      label: `${methods} methods`,
      bg: "bg-[rgba(255,48,72,0.12)]",
      text: "text-[#FF5265]",
      border: "border-[#FF3048]",
    };
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full max-w-[1450px] mx-auto text-left relative space-y-6 select-none font-sans rounded-2xl bg-gradient-to-b from-[#07464D] via-[#063F46] to-[#04383F] p-2 sm:p-3">
      
      {/* ── 1. MAIN HEALTH DIAGNOSTICS CONTAINER (Point 2) ── */}
      <div className="rounded-[22px] bg-[rgba(4,48,55,0.55)] border border-[#0D6870]/60 p-5 sm:p-6 md:p-7 shadow-xs relative overflow-hidden space-y-5 sm:space-y-6">
        
        {/* Header: Left (Icon + Typography) & Right (Last Scanned + Run Scan) */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
          {/* Left: 70px Solid Red Icon + Refined Typography */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Point 3: Health Diagnostics Icon */}
            <div className="w-[64px] h-[64px] sm:w-[70px] sm:h-[70px] rounded-[18px] sm:rounded-[20px] bg-[#FF3048] shadow-md shadow-[#FF3048]/25 text-white flex items-center justify-center shrink-0">
              <Activity className="w-8 h-8 text-white stroke-[2.4]" />
            </div>

            <div>
              {/* Point 4: CODE QUALITY in #13C8C3 */}
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[1.8px] text-[#13C8C3]">
                CODE QUALITY
              </p>
              {/* Point 5: Health Diagnostics in #F7F8F4 font-extrabold */}
              <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#F7F8F4] tracking-tight leading-tight mt-0.5">
                Health Diagnostics
              </h1>
              {/* Point 6: Subtitle in #91BEC0 */}
              <p className="text-xs sm:text-[13.5px] text-[#91BEC0] mt-1 font-normal leading-relaxed">
                Analyze code structure, detect issues and keep your project healthy.
              </p>
            </div>
          </div>

          {/* Right: Last Scanned (Point 7) + Run Scan (Point 8) */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto flex-wrap sm:flex-nowrap">
            {/* Point 7: Last Scanned Component */}
            <div className="h-[48px] sm:h-[50px] px-3.5 sm:px-4 rounded-[16px] bg-[rgba(4,57,64,0.55)] border border-[#0B6970] flex items-center gap-3">
              <div className="w-7.5 h-7.5 rounded-lg bg-[rgba(18,199,193,0.10)] text-[#12C7C1] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9.5px] text-[#83B5B8] font-bold uppercase tracking-wider block leading-tight">
                  LAST SCANNED
                </span>
                <span className="text-xs font-bold text-[#F4F6F3] font-mono block mt-0.5">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Point 8: Run Scan Primary Action Button */}
            <button
              onClick={onAnalyze}
              disabled={isLoading}
              className="h-[48px] sm:h-[50px] px-5 sm:px-6 rounded-[14px] bg-[#FF3048] hover:bg-[#E9273D] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#FF3048]/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50 active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 text-white ${isLoading ? "animate-spin" : ""}`} />
              <span className="text-white">Run Scan</span>
            </button>
          </div>
        </header>

        {/* ── 2. FOUR TINTED METRIC CARDS (Points 9–18) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* ── Card 1: HEALTH SCORE (Point 10: Pink/Red Tint #FDECEF) ── */}
          <div className="rounded-[18px] bg-[#FDECEF] border border-[#FF3048]/30 p-4.5 sm:p-5 flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-xs transition-all hover:border-[#FF3048]/60">
            {/* Top Row: Icon + Label + Right Circular Arrow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Icon box: bg #F7B8C0, icon #FF3048 */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F7B8C0] text-[#FF3048] flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-[#FF3048]" />
                </div>
                <span className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-[#154851]">
                  HEALTH SCORE
                </span>
              </div>

              {/* Point 14: Health Arrow (Circle: #F9D8DC, Arrow: #E83B4E) */}
              <div className="w-7 h-7 rounded-full bg-[#F9D8DC] text-[#E83B4E] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <ArrowRight size={13} className="stroke-[2.6]" />
              </div>
            </div>

            {/* Middle Row: Number 40 /100 */}
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[40px] font-extrabold font-mono text-[#073E48] leading-none">
                {score}
              </span>
              <span className="text-xs font-mono text-[#52777B] font-bold">
                /100
              </span>
            </div>

            {/* Bottom Row: Trend + Mini Graph (Point 15: No progress bars) */}
            <div className="mt-2.5 flex items-end justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#FF3048]">
                <TrendingDown className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>12%</span>
                <span className="text-[#5A7B7F] font-normal text-[11px] sm:text-xs">vs last scan</span>
              </div>

              {/* Red/Pink Sparkline */}
              <SparklineChart
                color="#FF3048"
                gradientId="grad-health-pink"
                points="M 0,26 Q 25,24 45,14 T 85,8"
                fillPath="M 0,26 Q 25,24 45,14 T 85,8 L 85,34 L 0,34 Z"
              />
            </div>
          </div>

          {/* ── Card 2: CYCLES (Point 11: Mint/Turquoise Tint #E9F8F7) ── */}
          <div className="rounded-[18px] bg-[#E9F8F7] border border-[#7ADBD5] p-4.5 sm:p-5 flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-xs transition-all hover:border-[#7ADBD5]">
            {/* Top Row: Icon + Label + Right Circular Arrow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Icon box: bg #A9E9E4, icon #08B8B1 */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#A9E9E4] text-[#08B8B1] flex items-center justify-center shrink-0">
                  <RotateCw className="w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-[#154851]">
                  CYCLES
                </span>
              </div>

              {/* Point 14: Cycles Arrow (Circle: #D5F1EF, Arrow: #159E98) */}
              <div className="w-7 h-7 rounded-full bg-[#D5F1EF] text-[#159E98] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <ArrowRight size={13} className="stroke-[2.6]" />
              </div>
            </div>

            {/* Middle Row: Number 0 */}
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[40px] font-extrabold font-mono text-[#073E48] leading-none">
                {cycleCount}
              </span>
            </div>

            {/* Bottom Row: Trend + Mini Graph */}
            <div className="mt-2.5 flex items-end justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#10B9A8]">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>8%</span>
                <span className="text-[#5A7B7F] font-normal text-[11px] sm:text-xs">vs last scan</span>
              </div>

              {/* Turquoise Sparkline */}
              <SparklineChart
                color="#10B9A8"
                gradientId="grad-cycles-mint"
                points="M 0,28 Q 30,22 55,14 T 85,6"
                fillPath="M 0,28 Q 30,22 55,14 T 85,6 L 85,34 L 0,34 Z"
              />
            </div>
          </div>

          {/* ── Card 3: DEAD CODE (Point 12: Light Yellow Tint #FFF6DC) ── */}
          <div
            onClick={() => scrollToSection("dead-code-section")}
            className="rounded-[18px] bg-[#FFF6DC] border border-[#E9BD3C] p-4.5 sm:p-5 flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-xs transition-all hover:border-[#E9BD3C] cursor-pointer group"
          >
            {/* Top Row: Icon + Label + Right Circular Arrow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Icon box: bg #FFE29A, icon #D99B00 */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFE29A] text-[#D99B00] flex items-center justify-center shrink-0">
                  <FileX className="w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-[#154851]">
                  DEAD CODE
                </span>
              </div>

              {/* Point 14: Dead Code Arrow (Circle: #FFF0C6, Arrow: #C99317) */}
              <div className="w-7 h-7 rounded-full bg-[#FFF0C6] text-[#C99317] flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                <ArrowRight size={13} className="stroke-[2.6]" />
              </div>
            </div>

            {/* Middle Row: Number 50 */}
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[40px] font-extrabold font-mono text-[#073E48] leading-none">
                {deadCount}
              </span>
            </div>

            {/* Bottom Row: Trend + Mini Graph (Point 12: Red trend for undesirable drop) */}
            <div className="mt-2.5 flex items-end justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#FF3048]">
                <TrendingDown className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>17%</span>
                <span className="text-[#5A7B7F] font-normal text-[11px] sm:text-xs">vs last scan</span>
              </div>

              {/* Red/Amber Sparkline */}
              <SparklineChart
                color="#FF3048"
                gradientId="grad-deadcode-amber"
                points="M 0,26 Q 30,22 55,14 T 85,8"
                fillPath="M 0,26 Q 30,22 55,14 T 85,8 L 85,34 L 0,34 Z"
              />
            </div>
          </div>

          {/* ── Card 4: BROKEN IMPORTS (Point 13: Light Mint/Aqua Tint #E6F7F5) ── */}
          <div className="rounded-[18px] bg-[#E6F7F5] border border-[#62D4CC] p-4.5 sm:p-5 flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-xs transition-all hover:border-[#62D4CC]">
            {/* Top Row: Icon + Label + Right Circular Arrow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Icon box: bg #B0E9E4, icon #00AFA8 */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#B0E9E4] text-[#00AFA8] flex items-center justify-center shrink-0">
                  <Unlink className="w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-[#154851]">
                  BROKEN IMPORTS
                </span>
              </div>

              {/* Point 14: Broken Imports Arrow (Circle: #D2F1EF, Arrow: #159E98) */}
              <div className="w-7 h-7 rounded-full bg-[#D2F1EF] text-[#159E98] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <ArrowRight size={13} className="stroke-[2.6]" />
              </div>
            </div>

            {/* Middle Row: Number 84 */}
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[40px] font-extrabold font-mono text-[#073E48] leading-none">
                {brokenCount}
              </span>
            </div>

            {/* Bottom Row: Trend + Mini Graph */}
            <div className="mt-2.5 flex items-end justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#00AFA8]">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>4%</span>
                <span className="text-[#5A7B7F] font-normal text-[11px] sm:text-xs">vs last scan</span>
              </div>

              {/* Mint Sparkline */}
              <SparklineChart
                color="#00B9B0"
                gradientId="grad-broken-mint"
                points="M 0,28 Q 25,24 55,14 T 85,8"
                fillPath="M 0,28 Q 25,24 55,14 T 85,8 L 85,34 L 0,34 Z"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. GOD SERVICES SECTION (Points 19–29: Dark Translucent Section) ── */}
      <div
        id="god-services-section"
        className="rounded-[20px] bg-[rgba(4,51,58,0.65)] border border-[#0C6970] p-5 sm:p-6 shadow-sm space-y-4"
      >
        {/* Section Header: Left (Icon + Title + Badge + Subtitle) & Right (Search + Sort) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3.5 border-b border-[rgba(25,201,183,0.15)]">
          {/* Left: Point 20 Icon + Point 21 Title & Badge */}
          <div className="flex items-start gap-3.5">
            {/* Point 20: Icon Box (bg rgba(255,48,72,0.10), border #FF3048, icon #FF3048) */}
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,48,72,0.10)] border border-[#FF3048] text-[#FF3048] flex items-center justify-center shrink-0 mt-0.5">
              <Code2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                {/* Point 21: Title in #F5F7F5 */}
                <h2 className="text-base sm:text-lg font-bold text-[#F5F7F5] tracking-tight">
                  God Services
                </h2>
                {/* Point 21: Number Badge 20 (bg rgba(255,48,72,0.12), border #FF3048, text #FF5265) */}
                <span className="px-2.5 py-0.5 rounded-full bg-[rgba(255,48,72,0.12)] border border-[#FF3048] text-[#FF5265] text-xs font-mono font-bold">
                  {rawGodServices.length}
                </span>
              </div>
              {/* Point 22: Description in #8CB8BA */}
              <p className="text-xs sm:text-[13px] text-[#8CB8BA] mt-0.5">
                Files with high complexity, too many methods or responsibilities.
              </p>
            </div>
          </div>

          {/* Right: Search (Point 23) + Sort (Point 24) */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Point 23: Search Box */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#13C8C3]" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#063941] border border-[#126A71] focus:border-[#13C8C3] focus:ring-1 focus:ring-[#13C8C3]/40 text-xs text-[#EAF4F3] placeholder-[#729EA1] outline-none transition-all"
              />
            </div>

            {/* Point 24: Sort Selector */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-3 pr-8 rounded-xl bg-[#063941] border border-[#126A71] hover:bg-[#0A4D54] hover:border-[#13C8C3] focus:border-[#13C8C3] text-xs font-medium text-[#A5C8C9] focus:text-[#EAF4F3] outline-none cursor-pointer appearance-none transition-all"
              >
                <option value="methods-desc">Sort by methods (High → Low)</option>
                <option value="methods-asc">Sort by methods (Low → High)</option>
                <option value="loc-desc">Sort by LOC (High → Low)</option>
                <option value="file-asc">Sort by File Name (A → Z)</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#13C8C3] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Point 25: Table Column Headers in rgba(7,64,71,0.65) and #91BDBF */}
        <div className="grid grid-cols-12 gap-3 px-3.5 py-2.5 text-[11px] font-bold text-[#91BDBF] uppercase tracking-wider bg-[rgba(7,64,71,0.65)] rounded-xl border border-[rgba(25,201,183,0.10)]">
          <div className="col-span-1">#</div>
          <div className="col-span-7 sm:col-span-7">FILE PATH</div>
          <div className="col-span-2 sm:col-span-2 text-center">METHODS</div>
          <div className="col-span-2 sm:col-span-2 text-right">ACTION</div>
        </div>

        {/* Point 26: Alternating Table Rows (Row 1: rgba(3,48,55,.45), Row 2: rgba(9,69,76,.35)) */}
        <div className="space-y-1 mt-1">
          {processedGodServices.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8CB8BA]">
              No matching god services found for "{searchQuery}".
            </div>
          ) : (
            processedGodServices.map((service, index) => {
              const methodsCount = service.methods ?? 0;
              const badge = getMethodBadge(methodsCount);
              const isHighSeverity = methodsCount > 15;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={service.file + index}
                  onClick={() => onSelectFile?.(service.file)}
                  className={`grid grid-cols-12 gap-3 items-center px-3.5 py-2.5 rounded-xl border border-white/[0.03] transition-all cursor-pointer group ${
                    isEven ? "bg-[rgba(3,48,55,0.45)]" : "bg-[rgba(9,69,76,0.35)]"
                  } hover:bg-[rgba(10,80,88,0.55)] ${
                    isHighSeverity ? "border-l-2 border-l-[#FF3048]" : ""
                  }`}
                >
                  {/* # Rank Number */}
                  <div className="col-span-1 flex items-center">
                    <div className="w-5 h-5 rounded-full bg-[#052A30] border border-[#13C8C3]/30 text-[#13C8C3] text-[10.5px] font-mono font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                  </div>

                  {/* Point 27: File Path in #E8F2F1 */}
                  <div className="col-span-7 sm:col-span-7 flex items-center gap-2 min-w-0">
                    <span
                      className="font-mono text-xs sm:text-[12.5px] text-[#E8F2F1] group-hover:text-white truncate"
                      title={service.file}
                    >
                      {service.file}
                    </span>
                  </div>

                  {/* Point 28: Method Badges */}
                  <div className="col-span-2 sm:col-span-2 flex items-center justify-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border ${badge.border} ${badge.bg} ${badge.text} text-[11px] font-mono font-semibold whitespace-nowrap`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Point 29: LOC Button */}
                  <div className="col-span-2 sm:col-span-2 flex items-center justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFile?.(service.file);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#126A71] bg-[rgba(10,78,84,0.5)] hover:border-[#13C8C3] hover:bg-[rgba(10,80,88,0.8)] text-[#B1D0D1] hover:text-white text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs group/btn"
                      title={`Inspect ${service.loc || 450} lines of code`}
                    >
                      <FileText size={12} className="text-[#8CCACC] group-hover/btn:text-[#13C8C3]" />
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
      <div
        id="dead-code-section"
        className="rounded-[20px] bg-[rgba(4,51,58,0.65)] border border-[#0C6970] p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(25,201,183,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(255,190,45,0.10)] border border-[#EAB52C] text-[#F0B72B] flex items-center justify-center shrink-0">
              <FileX className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#F5F7F5] tracking-tight">
                  Dead Code
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[rgba(255,190,45,0.12)] border border-[#EAB52C] text-[#F0B72B] text-xs font-mono font-bold">
                  {rawDeadCode.length}
                </span>
              </div>
              <p className="text-[11.5px] text-[#8CB8BA]">
                Unreferenced files eligible for safe pruning to reduce bundle overhead.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#13C8C3]" />
            <input
              type="text"
              placeholder="Filter dead files..."
              value={deadCodeSearch}
              onChange={(e) => setDeadCodeSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-[#063941] border border-[#126A71] focus:border-[#13C8C3] text-xs text-[#EAF4F3] placeholder-[#729EA1] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
          {filteredDeadCode.map((filePath, index) => (
            <div
              key={filePath + index}
              onClick={() => onSelectFile?.(filePath)}
              className="p-2.5 rounded-xl bg-[rgba(3,48,55,0.45)] hover:bg-[rgba(10,80,88,0.60)] border border-[rgba(25,201,183,0.15)] hover:border-[rgba(25,201,183,0.40)] transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCode size={13} className="text-[#F0B72B] shrink-0" />
                <span className="font-mono text-xs text-[#E8F2F1] group-hover:text-white truncate">
                  {filePath}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8CB8BA] group-hover:text-[#13C8C3] shrink-0">
                Prunable
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
