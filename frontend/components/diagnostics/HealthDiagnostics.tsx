"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Heart,
  RotateCw,
  AlertTriangle,
  FileX,
  Unlink,
  Search,
  ArrowUpDown,
  FileCode,
  FileText,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Code2,
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
        bg: "bg-[#16C7A1]/15",
        text: "text-[#16C7A1]",
        border: "border-[#16C7A1]/35",
      };
    }
    if (methods <= 10) {
      return {
        label: `${methods} methods`,
        bg: "bg-[#EAB308]/15",
        text: "text-[#FACC15]",
        border: "border-[#EAB308]/35",
      };
    }
    if (methods <= 30) {
      return {
        label: `${methods} methods`,
        bg: "bg-[#F97316]/15",
        text: "text-[#FB923C]",
        border: "border-[#F97316]/35",
      };
    }
    return {
      label: `${methods} methods`,
      bg: "bg-[#EF4444]/15",
      text: "text-[#F87171]",
      border: "border-[#EF4444]/40",
    };
  };

  return (
    <div className="w-full max-w-[1450px] mx-auto text-left relative space-y-6 select-none font-sans">
      {/* ── 1. HEADER WITH CONTROLS (Last Scanned + Run Scan) ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        {/* Left: 64x64 Red Icon + Eyebrow + Title + Subtitle */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#F52F45] to-[#E02438] border border-[#FF5B6D]/40 text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#F52F45]/25">
            <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.4]" />
          </div>

          <div>
            <p className="text-xs sm:text-[13px] font-bold uppercase tracking-[2px] text-[#20D6D8]">
              CODE QUALITY
            </p>
            <h1 className="text-2xl sm:text-[36px] font-extrabold text-white tracking-tight leading-tight mt-0.5">
              Health Diagnostics
            </h1>
            <p className="text-xs sm:text-[14px] text-[#9BC9CE] mt-1 font-normal">
              Analyze code structure, detect issues and keep your project healthy.
            </p>
          </div>
        </div>

        {/* Right: Last Scanned Card & Run Scan Action */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          {/* Last Scanned Card */}
          <div className="bg-[#084851] border border-[#20D6D8]/20 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#20D6D8]/15 border border-[#20D6D8]/30 text-[#20D6D8] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#9BC9CE] font-semibold uppercase tracking-wider block leading-tight">
                Last scanned
              </span>
              <span className="text-xs font-bold text-white font-mono block mt-0.5">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Run Scan Button */}
          <button
            onClick={onAnalyze}
            disabled={isLoading}
            className="h-[46px] px-5 rounded-xl bg-[#F52F45] hover:bg-[#FF4055] text-white font-bold text-xs shadow-md shadow-[#F52F45]/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Scanning..." : "Run Scan"}</span>
          </button>
        </div>
      </header>

      {/* ── 2. FOUR REDESIGNED METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: HEALTH SCORE (Red Accent) */}
        <div className="rounded-2xl bg-[#084851] border border-[rgba(255,57,77,0.35)] p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[rgba(255,57,77,0.6)] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FF394D]/15 border border-[#FF394D]/35 text-[#FF394D] flex items-center justify-center shrink-0">
              <Heart className="w-4.5 h-4.5 fill-[#FF394D]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BC9CE]">
              HEALTH SCORE
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#FF394D] leading-none">
                {score}
              </span>
              <span className="text-xs font-mono text-[#9BC9CE] font-semibold">
                /100
              </span>
            </div>

            {/* Progress Bar (40% filled) */}
            <div className="w-full h-1.5 rounded-full bg-[#053B43] mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#F52F45] to-[#FF394D]"
                style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: CYCLES (Cyan/Teal Accent - Neutral/Healthy) */}
        <div className="rounded-2xl bg-[#084851] border border-[#27D4D8]/25 p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#27D4D8]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#27D4D8]/15 border border-[#27D4D8]/35 text-[#27D4D8] flex items-center justify-center shrink-0">
              <RotateCw className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BC9CE]">
              CYCLES
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#27D4D8] leading-none">
                {cycleCount}
              </span>
            </div>

            {/* Progress Bar (0% filled - Clean track) */}
            <div className="w-full h-1.5 rounded-full bg-[#053B43] mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#27D4D8]"
                style={{ width: `${cycleCount > 0 ? Math.min(100, cycleCount * 20) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: DEAD CODE (Yellow/Amber Accent) */}
        <div className="rounded-2xl bg-[#084851] border border-[#FFC42E]/25 p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#FFC42E]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FFC42E]/15 border border-[#FFC42E]/35 text-[#FFC42E] flex items-center justify-center shrink-0">
              <FileX className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BC9CE]">
              DEAD CODE
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#FFC42E] leading-none">
                {deadCount}
              </span>
            </div>

            {/* Progress Bar (~50% filled) */}
            <div className="w-full h-1.5 rounded-full bg-[#053B43] mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FFC42E]"
                style={{ width: `${Math.min(100, Math.max(10, deadCount))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: BROKEN IMPORTS (Pink/Red Error Accent) */}
        <div className="rounded-2xl bg-[#084851] border border-[#FF5064]/25 p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#FF5064]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FF5064]/15 border border-[#FF5064]/35 text-[#FF5064] flex items-center justify-center shrink-0">
              <Unlink className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BC9CE]">
              BROKEN IMPORTS
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#FF5064] leading-none">
                {brokenCount}
              </span>
            </div>

            {/* Progress Bar (~84% filled) */}
            <div className="w-full h-1.5 rounded-full bg-[#053B43] mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF5064]"
                style={{ width: `${Math.min(100, Math.max(15, brokenCount))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. RESTRUCTURED GOD SERVICES TABLE ── */}
      <div className="rounded-2xl bg-[#084851] border border-[#20D6D8]/20 p-5 shadow-xl">
        {/* Section Header: Icon + Title + Description + Search + Sort Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#20D6D8]/15">
          {/* Left: Red Circular Icon + Title + Subtitle */}
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#F52F45]/15 border border-[#F52F45]/35 text-[#F52F45] flex items-center justify-center shrink-0 mt-0.5">
              <Code2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  God Services
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#F52F45]/15 border border-[#F52F45]/30 text-[#FF6B7D] text-xs font-mono font-bold">
                  {rawGodServices.length}
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-[#9BC9CE] mt-0.5">
                Files with high complexity, too many methods or responsibilities.
              </p>
            </div>
          </div>

          {/* Right: Search Input & Sort Dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#20D6D8]" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#053B43] border border-[#12636A] focus:border-[#20D6D8] focus:ring-1 focus:ring-[#20D6D8]/40 text-xs text-white placeholder-[#79A4A8] outline-none transition-all"
              />
            </div>

            {/* Sort Selector */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-3 pr-8 rounded-xl bg-[#053B43] border border-[#12636A] focus:border-[#20D6D8] text-xs font-medium text-[#9BC9CE] focus:text-white outline-none cursor-pointer appearance-none"
              >
                <option value="methods-desc">Sort by methods (High → Low)</option>
                <option value="methods-asc">Sort by methods (Low → High)</option>
                <option value="loc-desc">Sort by LOC (High → Low)</option>
                <option value="file-asc">Sort by File Name (A → Z)</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#20D6D8] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-3 px-3.5 py-2.5 text-[11px] font-bold text-[#8EA9AE] uppercase tracking-wider border-b border-[#20D6D8]/10 mt-1">
          <div className="col-span-1">#</div>
          <div className="col-span-7 sm:col-span-7">FILE PATH</div>
          <div className="col-span-2 sm:col-span-2 text-center">METHODS</div>
          <div className="col-span-2 sm:col-span-2 text-right">ACTION</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#20D6D8]/10 mt-0.5">
          {processedGodServices.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8EA9AE]">
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
                  className={`grid grid-cols-12 gap-3 items-center px-3.5 py-2.5 rounded-xl hover:bg-[#0A5058]/70 transition-all cursor-pointer group ${
                    isHighSeverity ? "border-l-2 border-l-[#F52F45]" : ""
                  }`}
                >
                  {/* # Rank Number in Circular Badge */}
                  <div className="col-span-1 flex items-center">
                    <div className="w-5 h-5 rounded-full bg-[#063239] border border-[#16C7A1]/30 text-[#16C7A1] text-[10.5px] font-mono font-bold flex items-center justify-center shrink-0">
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
                      className="px-2.5 py-1 rounded-lg border border-[#20D6D8]/20 bg-[#062F38]/70 hover:border-[#20D6D8]/60 hover:bg-[#0A5058] text-[#9BC9CE] hover:text-white text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title={`Inspect ${service.loc || 450} lines of code`}
                    >
                      <FileText size={12} className="text-[#20D6D8]" />
                      <span>{service.loc ? `${service.loc} LOC` : "LOC"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 4. RESTRUCTURED DEAD CODE SECTION ── */}
      <div className="rounded-2xl bg-[#084851] border border-[#20D6D8]/20 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#20D6D8]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFC42E]/15 border border-[#FFC42E]/35 text-[#FFC42E] flex items-center justify-center shrink-0">
              <FileX className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Dead Code
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FFC42E]/15 border border-[#FFC42E]/30 text-[#FFD369] text-xs font-mono font-bold">
                  {rawDeadCode.length}
                </span>
              </div>
              <p className="text-[11.5px] text-[#9BC9CE]">
                Unreferenced files eligible for safe pruning to reduce bundle overhead.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#20D6D8]" />
            <input
              type="text"
              placeholder="Filter dead files..."
              value={deadCodeSearch}
              onChange={(e) => setDeadCodeSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-[#053B43] border border-[#12636A] focus:border-[#20D6D8] text-xs text-white placeholder-[#79A4A8] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          {filteredDeadCode.map((filePath, index) => (
            <div
              key={filePath + index}
              onClick={() => onSelectFile?.(filePath)}
              className="p-2.5 rounded-xl bg-[#053B43]/60 hover:bg-[#0A5058] border border-[#20D6D8]/15 hover:border-[#20D6D8]/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCode size={13} className="text-[#FFC42E] shrink-0" />
                <span className="font-mono text-xs text-[#C3D5D8] group-hover:text-white truncate">
                  {filePath}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8EA9AE] group-hover:text-[#20D6D8] shrink-0">
                Prunable
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
