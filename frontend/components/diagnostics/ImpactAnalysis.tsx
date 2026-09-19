"use client";

import React, { useState, useMemo } from "react";
import {
  Zap,
  FolderGit,
  Network,
  Layers,
  AlertTriangle,
  Activity,
  Search,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  CheckCircle2,
  Split,
  Workflow,
  ArrowUpRight,
  FileCode,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface ImpactAnalysisProps {
  files?: Array<{ path: string; [key: string]: any }>;
  selectedFile?: string;
  onSelectFile: (path: string) => void;
  computedImpact?: {
    directDependents: string[];
    transitiveDependents: string[];
    outgoingDependencies: string[];
    impactScore: number;
    [key: string]: any;
  } | null;
  isLoading?: boolean;
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
        <path d={fillPath} fill={`url(#${gradientId})`} />
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

export default function ImpactAnalysis({
  files = [],
  selectedFile = "",
  onSelectFile,
  computedImpact,
  isLoading = false,
}: ImpactAnalysisProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Filter project files
  const projectFiles = useMemo(() => {
    return files.filter(
      (f) =>
        !f.path.startsWith("ROUTE:") &&
        !f.path.startsWith("ENV:") &&
        !f.path.startsWith("DB:") &&
        !f.path.startsWith("ENTITY:")
    );
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return projectFiles;
    const q = searchQuery.toLowerCase();
    return projectFiles.filter((f) => f.path.toLowerCase().includes(q));
  }, [projectFiles, searchQuery]);

  const directCount = computedImpact?.directDependents?.length ?? 0;
  const transitiveCount = computedImpact?.transitiveDependents?.length ?? 0;
  const impactScore = computedImpact?.impactScore ?? 0;
  const totalAffected = directCount + transitiveCount;

  const handleCopyPath = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getRiskBadge = (score: number) => {
    if (score > 40) {
      return {
        label: "HIGH",
        bg: "bg-[#FF4054]/15",
        text: "text-[#FF4054]",
        border: "border-[#FF4054]/30",
        description: "Significant blast radius",
      };
    }
    if (score > 15) {
      return {
        label: "MED",
        bg: "bg-[#F4B63F]/15",
        text: "text-[#F4B63F]",
        border: "border-[#F4B63F]/30",
        description: "Moderate ripple risk",
      };
    }
    return {
      label: "LOW",
      bg: "bg-[#19C9B7]/15",
      text: "text-[#19C9B7]",
      border: "border-[#19C9B7]/30",
      description: "Minimal risk",
    };
  };

  const riskMeta = getRiskBadge(impactScore);

  return (
    <div className="w-full max-w-[1450px] mx-auto text-left relative space-y-6 select-none font-sans">
      {/* ── AMBIENT BACKGROUND DECORATIONS ── */}
      <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-[#FF4054] opacity-[0.06] blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 -left-20 w-96 h-96 rounded-full bg-[#19C9B7] opacity-[0.05] blur-3xl pointer-events-none -z-10" />

      {/* ── 1. MAIN GLASS CONTAINER (Header + 4 Metric Cards Grouped) ── */}
      <div className="rounded-[22px] bg-[rgba(5,35,40,0.35)] border border-[rgba(45,200,190,0.18)] p-6 sm:p-7 md:p-8 backdrop-blur-md relative overflow-hidden space-y-7">
        {/* Header: Left (Icon + Typography) & Right (Active Target File Card) */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: 72px Soft Coral Icon + Typography */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-[72px] h-[72px] rounded-[16px] bg-[#FF4054] shadow-lg shadow-[#FF4054]/18 border border-[#FF4054]/30 text-white flex items-center justify-center shrink-0">
              <Zap className="w-9 h-9 text-white stroke-[2.4]" />
            </div>

            <div>
              <p className="text-xs sm:text-[13px] font-bold uppercase tracking-[2px] text-[#19C9B7]">
                CHANGE ANALYSIS
              </p>
              <h1 className="text-2xl sm:text-[34px] font-extrabold text-[#F4F7F7] tracking-tight leading-tight mt-0.5">
                <span className="text-[#FF4054]">Impact</span> Analysis
              </h1>
              <p className="text-xs sm:text-[14px] text-[#88B5B8] mt-1.5 font-normal leading-relaxed">
                Analyze blast radius, direct dependencies, and ripple risk across services.
              </p>
            </div>
          </div>

          {/* Right: Active Target Card */}
          {selectedFile && (
            <div className="h-[54px] px-4 rounded-xl bg-[rgba(20,80,85,0.25)] border border-[rgba(25,201,183,0.25)] flex items-center gap-3.5 shrink-0 self-start lg:self-auto transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#19C9B7]/15 border border-[#19C9B7]/30 text-[#19C9B7] flex items-center justify-center shrink-0">
                <FolderGit className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#88B5B8] font-bold uppercase tracking-wider block leading-tight">
                  ACTIVE TARGET
                </span>
                <span className="text-xs font-bold text-[#F4F7F7] font-mono block mt-0.5 max-w-[220px] truncate">
                  {selectedFile.split(/[/\\]/).pop()}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* ── 2. FOUR METRIC CARDS (Subtly Tinted Surfaces & Semantic Colors) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
          
          {/* Card 1: DIRECT IMPACT (Coral Tint: rgba(255, 64, 84, 0.09)) */}
          <div className="rounded-[18px] bg-[rgba(255,64,84,0.09)] border border-[rgba(255,64,84,0.22)] p-5 sm:p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all hover:border-[rgba(255,64,84,0.45)]">
            {/* Top Row: 48x48 Icon + Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#FF4054]/15 border border-[#FF4054]/30 text-[#FF4054] flex items-center justify-center shrink-0">
                  <Network className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#88B5B8]">
                  DIRECT IMPACT
                </span>
              </div>
            </div>

            {/* Middle Row: Prominent Number */}
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#F4F8F8] leading-none">
                {directCount}
              </span>
            </div>

            {/* Bottom Row: Description + Mini Sparkline Chart */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[#FF4054] font-medium truncate max-w-[120px]">
                {directCount === 0 ? "— No direct changes" : `${directCount} direct changes`}
              </span>

              {/* Coral Sparkline */}
              <SparklineChart
                color="#FF4054"
                gradientId="grad-direct-impact"
                points="M 0,28 Q 30,22 60,12 T 100,10"
                fillPath="M 0,28 Q 30,22 60,12 T 100,10 L 100,35 L 0,35 Z"
              />
            </div>
          </div>

          {/* Card 2: TRANSITIVE IMPACT (Amber Tint: rgba(244, 182, 63, 0.09)) */}
          <div className="rounded-[18px] bg-[rgba(244,182,63,0.09)] border border-[rgba(244,182,63,0.22)] p-5 sm:p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all hover:border-[rgba(244,182,63,0.45)]">
            {/* Top Row: 48x48 Icon + Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F4B63F]/15 border border-[#F4B63F]/30 text-[#F4B63F] flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#88B5B8]">
                  TRANSITIVE IMPACT
                </span>
              </div>
            </div>

            {/* Middle Row: Prominent Number */}
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#F4F8F8] leading-none">
                {transitiveCount}
              </span>
            </div>

            {/* Bottom Row: Description + Mini Sparkline Chart */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[#F4B63F] font-medium truncate max-w-[120px]">
                {transitiveCount === 0 ? "— No indirect changes" : `${transitiveCount} indirect ripple`}
              </span>

              {/* Amber Sparkline */}
              <SparklineChart
                color="#F4B63F"
                gradientId="grad-trans-impact"
                points="M 0,30 Q 35,26 65,14 T 100,8"
                fillPath="M 0,30 Q 35,26 65,14 T 100,8 L 100,35 L 0,35 Z"
              />
            </div>
          </div>

          {/* Card 3: RISK SCORE (Coral/Pink Tint: rgba(255, 64, 84, 0.09)) */}
          <div className="rounded-[18px] bg-[rgba(255,64,84,0.09)] border border-[rgba(255,64,84,0.22)] p-5 sm:p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all hover:border-[rgba(255,64,84,0.45)]">
            {/* Top Row: 48x48 Icon + Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#FF4054]/15 border border-[#FF4054]/30 text-[#FF4054] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#88B5B8]">
                  RISK SCORE
                </span>
              </div>
            </div>

            {/* Middle Row: Prominent Number + Badge */}
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#F4F8F8] leading-none">
                {impactScore}%
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${riskMeta.bg} ${riskMeta.text} ${riskMeta.border}`}
              >
                {riskMeta.label}
              </span>
            </div>

            {/* Bottom Row: Description + Mini Sparkline Chart */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[#88B5B8] font-normal truncate max-w-[120px]">
                {riskMeta.description}
              </span>

              {/* Coral Sparkline */}
              <SparklineChart
                color="#FF4054"
                gradientId="grad-risk-impact"
                points="M 0,24 Q 30,16 60,26 T 100,12"
                fillPath="M 0,24 Q 30,16 60,26 T 100,12 L 100,35 L 0,35 Z"
              />
            </div>
          </div>

          {/* Card 4: TOTAL AFFECTED (Teal Tint: rgba(25, 201, 183, 0.09)) */}
          <div className="rounded-[18px] bg-[rgba(25,201,183,0.09)] border border-[rgba(25,201,183,0.20)] p-5 sm:p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all hover:border-[rgba(25,201,183,0.40)]">
            {/* Top Row: 48x48 Icon + Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#19C9B7]/15 border border-[#19C9B7]/30 text-[#19C9B7] flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#88B5B8]">
                  TOTAL AFFECTED
                </span>
              </div>
            </div>

            {/* Middle Row: Prominent Number */}
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#F4F8F8] leading-none">
                {totalAffected}
              </span>
            </div>

            {/* Bottom Row: Description + Mini Sparkline Chart */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[#19C9B7] font-medium truncate max-w-[120px]">
                {totalAffected === 0 ? "— No files affected" : `${totalAffected} files affected`}
              </span>

              {/* Teal Sparkline */}
              <SparklineChart
                color="#19C9B7"
                gradientId="grad-affected-impact"
                points="M 0,28 Q 30,22 55,14 T 100,8"
                fillPath="M 0,28 Q 30,22 55,14 T 100,8 L 100,35 L 0,35 Z"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. 2-COLUMN IMPACT STUDIO (Collapsible Project Files + Target Analysis) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[18px] items-start">
        
        {/* Left Column: Project Files Panel (Collapsible) */}
        <div
          className={`${
            isPanelCollapsed ? "lg:col-span-1" : "lg:col-span-4"
          } rounded-[22px] bg-[rgba(5,35,40,0.35)] border border-[rgba(45,200,190,0.18)] p-5 backdrop-blur-md shadow-xl flex flex-col space-y-3.5 transition-all duration-300`}
        >
          {isPanelCollapsed ? (
            /* Collapsed Rail View */
            <div className="flex flex-col items-center py-2 space-y-4">
              <button
                onClick={() => setIsPanelCollapsed(false)}
                className="w-9 h-9 rounded-xl bg-[rgba(25,201,183,0.15)] border border-[rgba(25,201,183,0.3)] text-[#19C9B7] hover:bg-[#19C9B7] hover:text-[#052A30] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Expand Project Files"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center text-center">
                <FolderGit className="w-4 h-4 text-[#88B5B8]" />
                <span className="text-[11px] font-mono font-bold text-[#F4F7F7] mt-1">
                  {projectFiles.length}
                </span>
              </div>
            </div>
          ) : (
            /* Full Expanded View */
            <>
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(25,201,183,0.15)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#EAF5F5] flex items-center gap-2">
                    <FolderGit size={14} className="text-[#19C9B7]" />
                    PROJECT FILES
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[rgba(25,201,183,0.12)] border border-[rgba(25,201,183,0.25)] text-[#19C9B7] text-[10.5px] font-mono font-bold">
                    {projectFiles.length}
                  </span>
                </div>

                <button
                  onClick={() => setIsPanelCollapsed(true)}
                  className="w-7 h-7 rounded-lg bg-[rgba(5,42,48,0.6)] border border-[rgba(25,201,183,0.2)] text-[#88B5B8] hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Collapse Panel"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search files input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#19C9B7]" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[rgba(5,42,48,0.6)] border border-[rgba(25,201,183,0.25)] rounded-xl text-[#F4F7F7] placeholder-[#79A4A8] focus:outline-none focus:border-[#19C9B7] focus:ring-1 focus:ring-[#19C9B7]/40 transition-colors"
                  placeholder="Search files to analyze impact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Searchable file list */}
              <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                {filteredFiles.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#88B5B8]">
                    No files matching "{searchQuery}"
                  </div>
                ) : (
                  filteredFiles.map((f, i) => {
                    const isSelected = selectedFile === f.path;
                    const fileName = f.path.split(/[/\\]/).pop() || f.path;
                    const dirPath =
                      f.path.substring(0, f.path.lastIndexOf(/[/\\]/.test(f.path) ? f.path.match(/[/\\]/)![0] : "")) || "";
                    const isService = f.path.toLowerCase().includes("service");
                    const isController = f.path.toLowerCase().includes("controller") || f.path.toLowerCase().includes("route");
                    const isModel = f.path.toLowerCase().includes("model") || f.path.toLowerCase().includes("schema");

                    return (
                      <button
                        key={i}
                        onClick={() => onSelectFile(f.path)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between gap-2 group cursor-pointer ${
                          isSelected
                            ? "bg-[rgba(255,64,84,0.10)] border-l-[3px] border-l-[#FF4054] border-t border-t-[rgba(255,64,84,0.3)] border-r border-r-[rgba(255,64,84,0.3)] border-b border-b-[rgba(255,64,84,0.3)] text-white font-bold shadow-sm"
                            : "bg-[rgba(5,42,48,0.5)] hover:bg-[rgba(10,80,88,0.6)] border border-[rgba(25,201,183,0.15)] text-[#C3D5D8] hover:text-white"
                        }`}
                      >
                        <div className="min-w-0 truncate">
                          <div className="truncate text-white font-medium text-[11px]">
                            {fileName}
                          </div>
                          <div className="truncate text-[10px] text-[#88B5B8]">
                            {dirPath || f.path}
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                            isService
                              ? "bg-[rgba(25,201,183,0.15)] text-[#19C9B7]"
                              : isController
                              ? "bg-[rgba(255,64,84,0.15)] text-[#FF4054]"
                              : isModel
                              ? "bg-[rgba(244,182,63,0.15)] text-[#F4B63F]"
                              : "bg-[rgba(25,201,183,0.10)] text-[#8FDAD5]"
                          }`}
                        >
                          {isService ? "SVC" : isController ? "RTE" : isModel ? "MDL" : "FILE"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Target File Analysis & Direct Dependencies */}
        <div
          className={`${
            isPanelCollapsed ? "lg:col-span-11" : "lg:col-span-8"
          } space-y-4.5 transition-all duration-300`}
        >
          {/* Target File Under Analysis Banner */}
          <div className="rounded-[22px] bg-[rgba(5,35,40,0.35)] border border-[rgba(45,200,190,0.18)] p-5 sm:p-6 backdrop-blur-md shadow-xl flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#19C9B7] flex items-center gap-2">
                <FolderGit size={13} className="text-[#19C9B7]" />
                TARGET FILE UNDER ANALYSIS
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-[#F4F7F7] truncate mt-1">
                {selectedFile || "Select a file to calculate blast radius"}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isLoading && (
                <div className="flex items-center gap-1.5 text-xs text-[#19C9B7] font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </div>
              )}

              {/* Copy Path Button with Teal Border & Hover State */}
              {selectedFile && (
                <button
                  onClick={handleCopyPath}
                  className="h-9 px-3 rounded-lg border border-[rgba(25,201,183,0.3)] bg-transparent hover:bg-[#19C9B7] text-[#19C9B7] hover:text-[#052A30] text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Copy full file path"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Path</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Direct Dependencies Section */}
          <div className="rounded-[22px] bg-[rgba(5,35,40,0.35)] border border-[rgba(45,200,190,0.18)] p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(25,201,183,0.15)]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#EAF5F5] flex items-center gap-2">
                    <Network size={15} className="text-[#19C9B7]" />
                    DIRECT DEPENDENCIES
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[rgba(25,201,183,0.12)] border border-[rgba(25,201,183,0.25)] text-[#19C9B7] text-xs font-mono font-bold">
                    {directCount}
                  </span>
                </div>
                <p className="text-[11.5px] text-[#88B5B8] mt-0.5">
                  Click a file to switch the analysis target
                </p>
              </div>
            </div>

            {directCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {computedImpact!.directDependents.map((f: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => onSelectFile(f)}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-[rgba(5,42,48,0.5)] hover:bg-[rgba(10,80,88,0.6)] border border-[rgba(25,201,183,0.15)] hover:border-[rgba(25,201,183,0.40)] text-xs font-mono text-white transition-all flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <span className="truncate text-[#C3D5D8] group-hover:text-white">
                      {f}
                    </span>
                    <ChevronRight size={14} className="text-[#88B5B8] group-hover:text-[#19C9B7] shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              /* Enhanced Informative Empty State */
              <div className="py-7 px-5 text-center bg-[rgba(5,42,48,0.35)] rounded-xl border border-[rgba(25,201,183,0.15)]">
                <CheckCircle2 size={24} className="text-[#19C9B7] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#F4F7F7]">
                  No directly dependent files found
                </p>
                <p className="text-xs text-[#88B5B8] mt-1 max-w-md mx-auto">
                  This file is not directly imported by other analyzed files. Changes here have minimal immediate blast radius.
                </p>
              </div>
            )}
          </div>

          {/* Outgoing Imports & Transitive Cascades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
            {/* Outgoing Imports */}
            <div className="rounded-[22px] bg-[rgba(5,35,40,0.35)] border border-[rgba(45,200,190,0.18)] p-5 backdrop-blur-md shadow-xl space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(25,201,183,0.12)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#EAF5F5] flex items-center gap-1.5">
                  <Split size={14} className="text-[#19C9B7]" />
                  OUTGOING IMPORTS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[rgba(25,201,183,0.12)] border border-[rgba(25,201,183,0.25)] text-[#19C9B7] text-[10.5px] font-mono font-bold">
                  {(computedImpact?.outgoingDependencies || []).length}
                </span>
              </div>
              {(computedImpact?.outgoingDependencies || []).length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {computedImpact!.outgoingDependencies.map((dep: string, i: number) => (
                    <div
                      key={i}
                      className="px-2.5 py-1.5 rounded-lg bg-[rgba(5,42,48,0.5)] border border-[rgba(25,201,183,0.10)] text-[11px] font-mono text-[#C3D5D8] truncate"
                    >
                      {dep}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#88B5B8] py-3 text-center">No internal imports detected.</p>
              )}
            </div>

            {/* Transitive Cascades */}
            <div className="rounded-[22px] bg-[rgba(5,35,40,0.35)] border border-[rgba(45,200,190,0.18)] p-5 backdrop-blur-md shadow-xl space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(25,201,183,0.12)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#EAF5F5] flex items-center gap-1.5">
                  <Workflow size={14} className="text-[#F4B63F]" />
                  TRANSITIVE CASCADES
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[rgba(244,182,63,0.12)] border border-[rgba(244,182,63,0.25)] text-[#F4B63F] text-[10.5px] font-mono font-bold">
                  {(computedImpact?.transitiveDependents || []).length}
                </span>
              </div>
              {(computedImpact?.transitiveDependents || []).length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {computedImpact!.transitiveDependents.map((dep: string, i: number) => (
                    <div
                      key={i}
                      className="px-2.5 py-1.5 rounded-lg bg-[rgba(5,42,48,0.5)] border border-[rgba(244,182,63,0.10)] text-[11px] font-mono text-[#C3D5D8] truncate"
                    >
                      {dep}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#88B5B8] py-3 text-center">No secondary ripple dependents.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
