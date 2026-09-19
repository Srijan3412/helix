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
  Copy,
  Check,
  CheckCircle2,
  Split,
  Workflow,
  ArrowRight,
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

// Mini Sparkline SVG Chart Component (75x38px)
function SparklineChart({
  color = "#FF3048",
  gradientId,
  points = "M 0,30 Q 25,26 50,14 T 75,8",
  fillPath = "M 0,30 Q 25,26 50,14 T 75,8 L 75,38 L 0,38 Z",
}: {
  color?: string;
  gradientId: string;
  points?: string;
  fillPath?: string;
}) {
  return (
    <div className="w-[75px] h-[38px] shrink-0 overflow-hidden pointer-events-none">
      <svg
        viewBox="0 0 75 38"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
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

  const activeTargetFile = useMemo(() => {
    if (selectedFile) return selectedFile;
    if (projectFiles.length > 0) return projectFiles[0].path;
    return "backend/data/disposable-domains.ts";
  }, [selectedFile, projectFiles]);

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
    if (!activeTargetFile) return;
    navigator.clipboard.writeText(activeTargetFile);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getRiskBadge = (score: number) => {
    if (score > 40) {
      return {
        label: "HIGH",
        bg: "bg-[#F8D4D9]",
        border: "border-[#FF8995]",
        text: "text-[#E63348]",
        description: "Significant blast radius",
      };
    }
    if (score > 15) {
      return {
        label: "MED",
        bg: "bg-[#FFF0C6]",
        border: "border-[#F0B323]",
        text: "text-[#D69D16]",
        description: "Moderate ripple risk",
      };
    }
    return {
      label: "LOW",
      bg: "bg-[#F8D4D9]",
      border: "border-[#FF8995]",
      text: "text-[#E63348]",
      description: "Minimal risk",
    };
  };

  const riskMeta = getRiskBadge(impactScore);

  return (
    <div className="w-full max-w-[1450px] mx-auto text-left relative space-y-[30px] select-none font-sans rounded-2xl bg-gradient-to-b from-[#07464D] via-[#063F46] to-[#04383F] p-2 sm:p-3">
      
      {/* ── 1. MAIN IMPACT ANALYSIS CONTAINER (Points 1–7) ── */}
      <div className="rounded-[22px] bg-[#073F46] border border-[#0B6970]/60 p-6 sm:p-8 md:p-[32px_38px] shadow-xs relative overflow-hidden space-y-[28px]">
        
        {/* Header: Left (Icon + Title + Description) & Right (Active Target Card) */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: 74px Solid Red Icon + Change Analysis Label + Impact Analysis Title */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Point 3: Icon (74x74px, bg #FF3048, icon white, radius 18px, shadow 0 8px 20px rgba(255,48,72,.15)) */}
            <div className="w-[68px] h-[68px] sm:w-[74px] sm:h-[74px] rounded-[18px] bg-[#FF3048] shadow-[0_8px_20px_rgba(255,48,72,0.15)] text-white flex items-center justify-center shrink-0">
              <Zap className="w-9 h-9 text-white stroke-[2.4] fill-white" />
            </div>

            <div>
              {/* Point 4: CHANGE ANALYSIS Label (#13C8C3, 14px, font 700, tracking 1.8px) */}
              <p className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[1.8px] text-[#13C8C3] leading-none mb-2">
                CHANGE ANALYSIS
              </p>
              {/* Point 5: Title ("Impact" in #FF3048, "Analysis" in #F5F7F5, 42-46px, weight 800) */}
              <h1 className="text-3xl sm:text-[42px] lg:text-[46px] font-extrabold tracking-tight leading-none">
                <span className="text-[#FF3048]">Impact </span>
                <span className="text-[#F5F7F5]">Analysis</span>
              </h1>
              {/* Point 6: Description (#8DBABC, 15-16px, 6-8px below title) */}
              <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#8DBABC] mt-2 font-normal leading-relaxed">
                Analyze blast radius, direct dependencies, and ripple risk across services.
              </p>
            </div>
          </div>

          {/* Point 7: Active Target (w: ~275px, h: ~68px, bg: rgba(5,55,62,.65), border: #0C7076, radius: 16px) */}
          <div className="w-full sm:w-[275px] h-[68px] px-4 rounded-[16px] bg-[rgba(5,55,62,0.65)] border border-[#0C7076] flex items-center justify-between gap-3 shrink-0 self-start lg:self-auto shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon box: 40x40px, bg rgba(19,200,195,.10), icon #13C8C3 */}
              <div className="w-10 h-10 rounded-xl bg-[rgba(19,200,195,0.10)] text-[#13C8C3] flex items-center justify-center shrink-0">
                <FolderGit className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] sm:text-[12px] text-[#7FB2B5] font-bold uppercase tracking-wider block leading-tight">
                  ACTIVE TARGET
                </span>
                <span className="text-[13.5px] sm:text-[14px] font-bold text-[#F3F7F6] font-mono block mt-0.5 truncate" title={activeTargetFile}>
                  {activeTargetFile.split(/[/\\]/).pop()}
                </span>
              </div>
            </div>
            <ChevronRight size={15} className="text-[#7FB2B5] shrink-0" />
          </div>
        </header>

        {/* ── 2. FOUR TINTED METRIC CARDS (Points 8–16) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[16px]">
          
          {/* ── Card 1: DIRECT IMPACT (Point 10: Pale Pink #FDECEF) ── */}
          <div className="rounded-[18px] bg-[#FDECEF] border border-[#FF3048]/60 p-5 flex flex-col justify-between min-h-[175px] sm:min-h-[180px] relative overflow-hidden shadow-xs transition-all hover:border-[#FF3048]">
            {/* Top Row: Icon + Title + Arrow Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Icon box: 46x46px, bg #FF3B50, icon #FFFFFF */}
                <div className="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl bg-[#FF3B50] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Network className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[13.5px] sm:text-[14px] font-bold uppercase tracking-wider text-[#173F47]">
                  DIRECT IMPACT
                </span>
              </div>

              {/* Point 14: Arrow Pill (38x38px, Circle #F9D8DC, Arrow #E9364C) */}
              <div className="w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full bg-[#F9D8DC] text-[#E9364C] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <ArrowRight size={14} className="stroke-[2.6]" />
              </div>
            </div>

            {/* Middle Row: Large Number (#073E48, 38-42px, font 800) */}
            <div className="my-1">
              <span className="text-3xl sm:text-[40px] font-extrabold font-mono text-[#073E48] leading-none">
                {directCount}
              </span>
            </div>

            {/* Bottom Row: Description (#FF3048, 12-13px) + Bottom-Right Sparkline */}
            <div className="flex items-end justify-between">
              <span className="text-[12px] sm:text-[13px] text-[#FF3048] font-bold truncate max-w-[150px]">
                {directCount === 0 ? "— No direct changes" : `${directCount} direct changes`}
              </span>

              {/* Sparkline (75x38px, line #FF3048, fill rgba(255,48,72,.12)) */}
              <SparklineChart
                color="#FF3048"
                gradientId="grad-direct-pink"
                points="M 0,30 Q 25,26 50,14 T 75,8"
                fillPath="M 0,30 Q 25,26 50,14 T 75,8 L 75,38 L 0,38 Z"
              />
            </div>
          </div>

          {/* ── Card 2: TRANSITIVE IMPACT (Point 11: Light Yellow #FFF7E1) ── */}
          <div className="rounded-[18px] bg-[#FFF7E1] border border-[#E6B52D] p-5 flex flex-col justify-between min-h-[175px] sm:min-h-[180px] relative overflow-hidden shadow-xs transition-all hover:border-[#E6B52D]">
            {/* Top Row: Icon + Title + Arrow Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Icon box: 46x46px, bg #FFC83D, icon #FFFFFF */}
                <div className="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl bg-[#FFC83D] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Layers className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[13.5px] sm:text-[14px] font-bold uppercase tracking-wider text-[#173F47]">
                  TRANSITIVE IMPACT
                </span>
              </div>

              {/* Point 14: Arrow Pill (Circle #FFF0C6, Arrow #D99D18) */}
              <div className="w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full bg-[#FFF0C6] text-[#D99D18] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <ArrowRight size={14} className="stroke-[2.6]" />
              </div>
            </div>

            {/* Middle Row: Large Number */}
            <div className="my-1">
              <span className="text-3xl sm:text-[40px] font-extrabold font-mono text-[#073E48] leading-none">
                {transitiveCount}
              </span>
            </div>

            {/* Bottom Row: Description (#D69D16, 12-13px) + Bottom-Right Sparkline */}
            <div className="flex items-end justify-between">
              <span className="text-[12px] sm:text-[13px] text-[#D69D16] font-bold truncate max-w-[150px]">
                {transitiveCount === 0 ? "— No indirect changes" : `${transitiveCount} indirect ripple`}
              </span>

              {/* Sparkline (line #F0B323, fill rgba(240,179,35,.13)) */}
              <SparklineChart
                color="#F0B323"
                gradientId="grad-trans-yellow"
                points="M 0,32 Q 30,28 50,16 T 75,8"
                fillPath="M 0,32 Q 30,28 50,16 T 75,8 L 75,38 L 0,38 Z"
              />
            </div>
          </div>

          {/* ── Card 3: RISK SCORE (Point 12: Light Pink #FDECEF) ── */}
          <div className="rounded-[18px] bg-[#FDECEF] border border-[#FF7A87] p-5 flex flex-col justify-between min-h-[175px] sm:min-h-[180px] relative overflow-hidden shadow-xs transition-all hover:border-[#FF7A87]">
            {/* Top Row: Icon + Title + Arrow Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Icon box: 46x46px, bg #F08C98, icon #FFFFFF */}
                <div className="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl bg-[#F08C98] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[13.5px] sm:text-[14px] font-bold uppercase tracking-wider text-[#173F47]">
                  RISK SCORE
                </span>
              </div>

              {/* Point 14: Arrow Pill (Circle #F8D9DD, Arrow #E9364C) */}
              <div className="w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full bg-[#F8D9DD] text-[#E9364C] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <ArrowRight size={14} className="stroke-[2.6]" />
              </div>
            </div>

            {/* Middle Row: Large Number + LOW Badge */}
            <div className="my-1 flex items-center gap-2.5">
              <span className="text-3xl sm:text-[40px] font-extrabold font-mono text-[#073E48] leading-none">
                {impactScore}%
              </span>
              {/* LOW Badge (bg #F8D4D9, border #FF8995, text #E63348, 11px, weight 700) */}
              <span
                className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${riskMeta.bg} ${riskMeta.border} ${riskMeta.text}`}
              >
                {riskMeta.label}
              </span>
            </div>

            {/* Bottom Row: Minimal risk (#607F83) + Sparkline */}
            <div className="flex items-end justify-between">
              <span className="text-[12px] sm:text-[13px] text-[#607F83] font-medium truncate max-w-[150px]">
                {riskMeta.description}
              </span>

              {/* Sparkline (line #FF3048, fill rgba(255,48,72,.12)) */}
              <SparklineChart
                color="#FF3048"
                gradientId="grad-risk-pink"
                points="M 0,28 Q 25,24 50,26 T 75,10"
                fillPath="M 0,28 Q 25,24 50,26 T 75,10 L 75,38 L 0,38 Z"
              />
            </div>
          </div>

          {/* ── Card 4: TOTAL AFFECTED (Point 13: Light Mint #E5F8F6) ── */}
          <div className="rounded-[18px] bg-[#E5F8F6] border border-[#5CCFC6] p-5 flex flex-col justify-between min-h-[175px] sm:min-h-[180px] relative overflow-hidden shadow-xs transition-all hover:border-[#5CCFC6]">
            {/* Top Row: Icon + Title + Arrow Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Icon box: 46x46px, bg #5ED8D0, icon #06464D (dark icon) */}
                <div className="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl bg-[#5ED8D0] text-[#06464D] flex items-center justify-center shrink-0 shadow-xs">
                  <Activity className="w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="text-[13.5px] sm:text-[14px] font-bold uppercase tracking-wider text-[#173F47]">
                  TOTAL AFFECTED
                </span>
              </div>

              {/* Point 14: Arrow Pill (Circle #D0F1EE, Arrow #0BAEA6) */}
              <div className="w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full bg-[#D0F1EE] text-[#0BAEA6] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <ArrowRight size={14} className="stroke-[2.6]" />
              </div>
            </div>

            {/* Middle Row: Large Number */}
            <div className="my-1">
              <span className="text-3xl sm:text-[40px] font-extrabold font-mono text-[#073E48] leading-none">
                {totalAffected}
              </span>
            </div>

            {/* Bottom Row: Description (#0AAFA5, 12-13px) + Bottom-Right Sparkline */}
            <div className="flex items-end justify-between">
              <span className="text-[12px] sm:text-[13px] text-[#0AAFA5] font-bold truncate max-w-[150px]">
                {totalAffected === 0 ? "— No files affected" : `${totalAffected} files affected`}
              </span>

              {/* Sparkline (line #08B8AF, fill rgba(8,184,175,.13)) */}
              <SparklineChart
                color="#08B8AF"
                gradientId="grad-affected-mint"
                points="M 0,30 Q 30,26 50,16 T 75,8"
                fillPath="M 0,30 Q 30,26 50,16 T 75,8 L 75,38 L 0,38 Z"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. 2-COLUMN IMPACT STUDIO (Points 17–21: Dark Transparent Panels) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-[18px] items-start">
        
        {/* Left Column: Project Files Panel (Points 17–19: bg rgba(4,52,59,.60), border #0B6870, radius 20px) */}
        <div
          className={`${
            isPanelCollapsed ? "lg:col-span-1" : "lg:col-span-4"
          } rounded-[20px] bg-[rgba(4,52,59,0.60)] border border-[#0B6870] p-4.5 sm:p-5 shadow-sm flex flex-col space-y-3.5 transition-all duration-300`}
        >
          {isPanelCollapsed ? (
            /* Collapsed Rail View */
            <div className="flex flex-col items-center py-2 space-y-4">
              <button
                onClick={() => setIsPanelCollapsed(false)}
                className="w-9 h-9 rounded-xl bg-[rgba(19,200,195,0.15)] border border-[#0C8588] text-[#13C8C3] hover:bg-[#13C8C3] hover:text-[#052A30] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Expand Project Files"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center text-center">
                <FolderGit className="w-4 h-4 text-[#759EA1]" />
                <span className="text-[11px] font-mono font-bold text-[#EAF4F3] mt-1">
                  {projectFiles.length}
                </span>
              </div>
            </div>
          ) : (
            /* Full Expanded View */
            <>
              {/* Point 18: Header ([folder #13C8C3] PROJECT FILES #EAF4F3, 223 badge: bg rgba(19,200,195,.10), border #0C8588, text #13C8C3) */}
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(25,201,183,0.15)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#EAF4F3] flex items-center gap-2">
                    <FolderGit size={14} className="text-[#13C8C3]" />
                    PROJECT FILES
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[rgba(19,200,195,0.10)] border border-[#0C8588] text-[#13C8C3] text-[10.5px] font-mono font-bold">
                    {projectFiles.length}
                  </span>
                </div>

                <button
                  onClick={() => setIsPanelCollapsed(true)}
                  className="w-7 h-7 rounded-lg bg-[#063A41] border border-[#0B6970] text-[#759EA1] hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Collapse Panel"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Point 19: Search files input (bg #063A41, border #0B6970, icon #13C8C3, placeholder #759EA1, h: ~42px) */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#13C8C3]" />
                <input
                  type="text"
                  className="w-full h-[42px] pl-9 pr-3 text-xs font-mono bg-[#063A41] border border-[#0B6970] rounded-xl text-[#EAF4F3] placeholder-[#759EA1] focus:outline-none focus:border-[#13C8C3] focus:ring-1 focus:ring-[#13C8C3]/40 transition-colors"
                  placeholder="Search files to analyze impact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Searchable file list */}
              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredFiles.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#759EA1]">
                    No files matching "{searchQuery}"
                  </div>
                ) : (
                  filteredFiles.map((f, i) => {
                    const isSelected = activeTargetFile === f.path;
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
                            ? "bg-[rgba(255,48,72,0.12)] border-l-[3px] border-l-[#FF3048] border-t border-t-[rgba(255,48,72,0.3)] border-r border-r-[rgba(255,48,72,0.3)] border-b border-b-[rgba(255,48,72,0.3)] text-white font-bold shadow-xs"
                            : "bg-[rgba(5,42,48,0.5)] hover:bg-[rgba(10,80,88,0.6)] border border-[rgba(25,201,183,0.15)] text-[#C3D5D8] hover:text-white"
                        }`}
                      >
                        <div className="min-w-0 truncate">
                          <div className="truncate text-white font-medium text-[11px]">
                            {fileName}
                          </div>
                          <div className="truncate text-[10px] text-[#759EA1]">
                            {dirPath || f.path}
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                            isService
                              ? "bg-[rgba(19,200,195,0.15)] text-[#13C8C3]"
                              : isController
                              ? "bg-[rgba(255,48,72,0.15)] text-[#FF3048]"
                              : isModel
                              ? "bg-[rgba(240,179,35,0.15)] text-[#F0B323]"
                              : "bg-[rgba(19,200,195,0.10)] text-[#8FDAD5]"
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
          } space-y-4 transition-all duration-300`}
        >
          {/* Points 20–21: Target File Under Analysis Banner (bg rgba(5,57,64,.65), border #0B6970, radius 20px) */}
          <div className="rounded-[20px] bg-[rgba(5,57,64,0.65)] border border-[#0B6970] p-4.5 sm:p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#13C8C3] flex items-center gap-2">
                <FolderGit size={14} className="text-[#13C8C3]" />
                TARGET FILE UNDER ANALYSIS
              </div>
              <div className="text-base sm:text-[17px] font-bold font-mono text-[#F1F6F5] truncate mt-1">
                {activeTargetFile}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isLoading && (
                <div className="flex items-center gap-1.5 text-xs text-[#13C8C3] font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </div>
              )}

              {/* Point 21: Copy Path Button (h: 44px, w: 125-135px, border #0D7378, text/icon #13C8C3) */}
              <button
                onClick={handleCopyPath}
                className="h-[44px] w-[130px] rounded-xl border border-[#0D7378] bg-[rgba(13,115,120,0.15)] hover:bg-[rgba(13,115,120,0.35)] text-[#13C8C3] hover:text-white text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Copy full file path"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#13C8C3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#13C8C3]" />
                    <span>Copy Path</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Dependencies Section */}
          <div className="rounded-[20px] bg-[rgba(4,52,59,0.60)] border border-[#0B6870] p-4.5 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(25,201,183,0.15)]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#EAF4F3] flex items-center gap-2">
                    <Network size={15} className="text-[#13C8C3]" />
                    DIRECT DEPENDENCIES
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[rgba(19,200,195,0.10)] border border-[#0C8588] text-[#13C8C3] text-xs font-mono font-bold">
                    {directCount}
                  </span>
                </div>
                <p className="text-[11.5px] text-[#759EA1] mt-0.5">
                  Click a file to switch the analysis target
                </p>
              </div>
            </div>

            {directCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {computedImpact!.directDependents.map((f: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => onSelectFile(f)}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-[rgba(5,42,48,0.5)] hover:bg-[rgba(10,80,88,0.6)] border border-[rgba(25,201,183,0.15)] hover:border-[rgba(25,201,183,0.40)] text-xs font-mono text-white transition-all flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <span className="truncate text-[#C3D5D8] group-hover:text-white">
                      {f}
                    </span>
                    <ChevronRight size={14} className="text-[#759EA1] group-hover:text-[#13C8C3] shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              /* Informative Empty State */
              <div className="py-6 px-4 text-center bg-[rgba(5,42,48,0.35)] rounded-xl border border-[rgba(25,201,183,0.15)]">
                <CheckCircle2 size={22} className="text-[#13C8C3] mx-auto mb-1.5" />
                <p className="text-sm font-semibold text-[#F4F7F7]">
                  No directly dependent files found
                </p>
                <p className="text-xs text-[#759EA1] mt-1 max-w-md mx-auto">
                  This file is not directly imported by other analyzed files. Changes here have minimal immediate blast radius.
                </p>
              </div>
            )}
          </div>

          {/* Outgoing Imports & Transitive Cascades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Outgoing Imports */}
            <div className="rounded-[20px] bg-[rgba(4,52,59,0.60)] border border-[#0B6870] p-4.5 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(25,201,183,0.12)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#EAF4F3] flex items-center gap-1.5">
                  <Split size={14} className="text-[#13C8C3]" />
                  OUTGOING IMPORTS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[rgba(19,200,195,0.10)] border border-[#0C8588] text-[#13C8C3] text-[10.5px] font-mono font-bold">
                  {(computedImpact?.outgoingDependencies || []).length}
                </span>
              </div>
              {(computedImpact?.outgoingDependencies || []).length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
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
                <p className="text-xs text-[#759EA1] py-3 text-center">No internal imports detected.</p>
              )}
            </div>

            {/* Transitive Cascades */}
            <div className="rounded-[20px] bg-[rgba(4,52,59,0.60)] border border-[#0B6870] p-4.5 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(25,201,183,0.12)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#EAF4F3] flex items-center gap-1.5">
                  <Workflow size={14} className="text-[#F0B323]" />
                  TRANSITIVE CASCADES
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[rgba(240,179,35,0.12)] border border-[#F0B323]/40 text-[#F0B323] text-[10.5px] font-mono font-bold">
                  {(computedImpact?.transitiveDependents || []).length}
                </span>
              </div>
              {(computedImpact?.transitiveDependents || []).length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {computedImpact!.transitiveDependents.map((dep: string, i: number) => (
                    <div
                      key={i}
                      className="px-2.5 py-1.5 rounded-lg bg-[rgba(5,42,48,0.5)] border border-[rgba(240,179,35,0.10)] text-[11px] font-mono text-[#C3D5D8] truncate"
                    >
                      {dep}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#759EA1] py-3 text-center">No secondary ripple dependents.</p>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
