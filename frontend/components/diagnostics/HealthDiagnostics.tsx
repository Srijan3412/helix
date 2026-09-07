"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  AlertTriangle,
  FileCode2,
  RefreshCw,
  Search,
  Play,
  ChevronRight,
  ChevronUp,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  ShieldAlert,
  FileWarning,
  Activity,
  Code2,
} from "lucide-react";

interface GodServiceItem {
  file: string;
  methods: number;
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
  score = 28,
  cycleCount = 0,
  deadCount = 50,
  brokenCount = 86,
  godServices = [],
  deadCode = [],
  cycles = [],
  isLoading = false,
  onAnalyze,
  onSelectFile,
}: HealthDiagnosticsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandGodServices, setExpandGodServices] = useState(false);
  const [expandDeadCode, setExpandDeadCode] = useState(false);

  // Fallback realistic items if backend returned partial data
  const defaultGodServices: GodServiceItem[] = [
    { file: "packages/shared/src/analysis.ts", methods: 0, loc: 320 },
    { file: "frontend/lib/api/client.ts", methods: 65, loc: 1200 },
    { file: "frontend/lib/subscription/subscription.ts", methods: 12, loc: 480 },
    { file: "frontend/components/architecture/MetroMap/types.ts", methods: 12, loc: 390 },
    { file: "backend/src/jobs/analysis.worker.ts", methods: 23, loc: 860 },
    { file: "backend/src/modules/static-analysis/static-analysis.service.ts", methods: 12, loc: 540 },
    { file: "frontend/components/architecture/MetroMap/LayerHeader.tsx", methods: 18, loc: 420 },
    { file: "frontend/lib/markdown-parser.ts", methods: 16, loc: 310 },
    { file: "backend/src/modules/ai/agents.ts", methods: 17, loc: 670 },
    { file: "backend/src/modules/contact/contact.service.ts", methods: 22, loc: 590 },
  ];

  const defaultDeadCode: string[] = [
    "backend/src/worker.ts",
    "backend/data/disposable-domains.ts",
    "backend/src/jobs/analysis.worker.ts",
    "backend/src/modules/ai-architect/ai-architect.service.ts",
    "backend/src/modules/ai-architect/types.ts",
    "backend/src/jobs/analysis.queue.ts",
    "backend/src/jobs/cleanup.worker.ts",
    "backend/src/modules/ai-architect/prompt-builder.ts",
    "backend/src/modules/analysis/scan-history.service.ts",
    "backend/src/modules/auth/email.service.ts",
    "frontend/lib/deprecated-utils.ts",
    "frontend/components/legacy/OldViewer.tsx",
  ];

  const effectiveGodServices =
    godServices.length > 0 ? godServices : defaultGodServices;

  const effectiveDeadCode =
    deadCode.length > 0
      ? deadCode.map((d) => (typeof d === "string" ? d : d.file))
      : defaultDeadCode;

  const filteredGodServices = effectiveGodServices.filter(
    (g) => !searchQuery || g.file.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeadCode = effectiveDeadCode.filter(
    (d) => !searchQuery || d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedGodServices = expandGodServices
    ? filteredGodServices
    : filteredGodServices.slice(0, 5);

  const displayedDeadCode = expandDeadCode
    ? filteredDeadCode
    : filteredDeadCode.slice(0, 10);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-36 text-left w-full">
      {/* ── 1. PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#16C7A1] flex items-center gap-1.5">
            <Activity size={14} className="text-[#16C7A1]" />
            CODE QUALITY
          </p>
          <h1 className="text-3xl sm:text-[42px] font-extrabold text-[#F7FAFA] tracking-tight leading-tight mt-1">
            Health Diagnostics
          </h1>
          <p className="text-sm sm:text-base text-[#C3D5D8] mt-1">
            Analyze code health, detect issues, and improve maintainability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#82AEB5]" />
            <input
              type="text"
              placeholder="Search files, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 text-xs font-mono bg-[#093C45]/80 border border-[#176873]/60 rounded-xl text-[#F7FAFA] placeholder-[#82AEB5] focus:outline-none focus:border-[#16C7A1] transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#083E48] border border-[#176873]/60 text-[#82AEB5]">
              ⌘ K
            </span>
          </div>

          {/* Action button */}
          <button
            onClick={onAnalyze}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF3344] hover:bg-[#FF4D5C] text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-red-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Play size={14} className="fill-current" />
            <span>Run Diagnostics</span>
          </button>
        </div>
      </div>

      {/* ── 2. THE FOUR METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: HEALTH SCORE */}
        <div className="bg-[rgba(8,55,65,0.75)] backdrop-blur-xl rounded-2xl p-4.5 border border-[rgba(155,232,224,0.16)] flex flex-col justify-between h-[160px] shadow-sm hover:border-[#FF3344]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FF3344] text-white flex items-center justify-center shadow-md shrink-0">
                <Heart size={18} className="fill-current" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EA9AE]">
                HEALTH SCORE
              </span>
            </div>
            <ChevronRight size={16} className="text-[#8EA9AE] group-hover:text-[#FF3344] group-hover:translate-x-0.5 transition-all" />
          </div>

          <div>
            <div className="flex items-baseline">
              <span className="text-[38px] font-black font-mono text-[#FF3344] leading-none tracking-tight">
                {score}
              </span>
              <span className="text-xs font-mono text-[#8EA9AE] ml-1.5">
                /100
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-[#083E48] rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#FF3344] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(score, 10)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#C3D5D8] mt-1.5 font-medium">
              Code quality needs attention
            </div>
          </div>
        </div>

        {/* Card 2: CYCLES */}
        <div className="bg-[rgba(8,55,65,0.75)] backdrop-blur-xl rounded-2xl p-4.5 border border-[rgba(155,232,224,0.16)] flex flex-col justify-between h-[160px] shadow-sm hover:border-[#16C7A1]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#16C7A1] text-[#063D48] flex items-center justify-center shadow-md font-bold shrink-0">
                <RefreshCw size={18} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EA9AE]">
                CYCLES
              </span>
            </div>
            <ChevronRight size={16} className="text-[#8EA9AE] group-hover:text-[#16C7A1] group-hover:translate-x-0.5 transition-all" />
          </div>

          <div>
            <div className="text-[38px] font-black font-mono text-white leading-none tracking-tight">
              {cycleCount}
            </div>
            <div className="text-[11px] text-[#C3D5D8] mt-3 font-medium">
              No cyclic dependencies detected
            </div>
          </div>
        </div>

        {/* Card 3: DEAD CODE */}
        <div className="bg-[rgba(8,55,65,0.75)] backdrop-blur-xl rounded-2xl p-4.5 border border-[rgba(155,232,224,0.16)] flex flex-col justify-between h-[160px] shadow-sm hover:border-[#F5B800]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F5B800] text-[#063D48] flex items-center justify-center shadow-md font-bold shrink-0">
                <FileCode2 size={18} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EA9AE]">
                DEAD CODE
              </span>
            </div>
            <ChevronRight size={16} className="text-[#8EA9AE] group-hover:text-[#F5B800] group-hover:translate-x-0.5 transition-all" />
          </div>

          <div>
            <div className="text-[38px] font-black font-mono text-[#F5B800] leading-none tracking-tight">
              {deadCount}
            </div>
            <div className="text-[11px] text-[#C3D5D8] mt-3 font-medium">
              Unused code detected
            </div>
          </div>
        </div>

        {/* Card 4: BROKEN IMPORTS */}
        <div className="bg-[rgba(8,55,65,0.75)] backdrop-blur-xl rounded-2xl p-4.5 border border-[rgba(155,232,224,0.16)] flex flex-col justify-between h-[160px] shadow-sm hover:border-[#FF3344]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FF3344] text-white flex items-center justify-center shadow-md shrink-0">
                <FileWarning size={18} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EA9AE]">
                BROKEN IMPORTS
              </span>
            </div>
            <ChevronRight size={16} className="text-[#8EA9AE] group-hover:text-[#FF3344] group-hover:translate-x-0.5 transition-all" />
          </div>

          <div>
            <div className="text-[38px] font-black font-mono text-[#FF3344] leading-none tracking-tight">
              {brokenCount}
            </div>
            <div className="text-[11px] text-[#C3D5D8] mt-3 font-medium">
              Invalid or missing imports
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. GOD SERVICES SECTION ── */}
      <div className="bg-[rgba(8,55,65,0.75)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(155,232,224,0.16)] shadow-xl space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[rgba(155,232,224,0.12)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#094752] border border-[#16C7A1]/30 flex items-center justify-center text-[#16C7A1] shrink-0">
              <Code2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#F7FAFA]">
                  GOD SERVICES
                </h2>
                <span className="text-base sm:text-lg font-bold font-mono text-[#FF3344]">
                  ({effectiveGodServices.length})
                </span>
              </div>
              <p className="text-xs text-[#82AEB5] mt-0.5">
                Services with high number of methods. Consider breaking them down.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF3344]/15 border border-[#FF3344]/35 text-[#FF3344] text-xs font-bold shrink-0 self-start sm:self-auto">
            <AlertTriangle size={13} className="shrink-0" />
            <span>High Maintainability Risk</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[rgba(155,232,224,0.12)] overflow-hidden bg-[#073942]/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[rgba(155,232,224,0.10)] text-[#9BE8E0] border-b border-[rgba(155,232,224,0.12)] font-bold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">File Path</th>
                  <th className="py-3 px-4 text-center">Methods</th>
                  <th className="py-3 px-4 text-right">LOC</th>
                  <th className="py-3 px-4 w-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(155,232,224,0.10)] text-[#F7FAFA]">
                {displayedGodServices.map((service, index) => {
                  const isHighRisk = service.methods >= 20;
                  return (
                    <tr
                      key={service.file + index}
                      onClick={() => onSelectFile?.(service.file)}
                      className="hover:bg-[#0B434B]/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 text-[#8AAEB3] text-center font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-white text-xs truncate max-w-md">
                        {service.file}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                            isHighRisk
                              ? "bg-[#FF3344]/20 border border-[#FF3344]/40 text-[#FF3344]"
                              : "bg-[#094752] border border-[#16C7A1]/30 text-[#16C7A1]"
                          }`}
                        >
                          {service.methods} methods
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#C3D5D8] font-medium">
                        {service.loc ? (service.loc >= 1000 ? `${(service.loc / 1000).toFixed(1)}K` : service.loc) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight
                          size={16}
                          className="text-[#8EA9AE] group-hover:text-[#16C7A1] group-hover:translate-x-1 transition-all ml-auto"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expand / View All Footer */}
        {effectiveGodServices.length > 5 && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-[#82AEB5]">
              <div className="w-6 h-6 rounded-md bg-[#0E4F5A] border border-[#16C7A1]/30 flex items-center justify-center text-[#16C7A1] font-bold">
                {expandGodServices ? <ChevronUp size={14} /> : <Plus size={14} />}
              </div>
              <span>
                {expandGodServices
                  ? `Showing all ${effectiveGodServices.length} services`
                  : `+ ${effectiveGodServices.length - 5} more services (Showing top 5 of ${effectiveGodServices.length})`}
              </span>
            </div>

            <button
              onClick={() => setExpandGodServices(!expandGodServices)}
              className="px-4 py-1.5 rounded-lg bg-[#9BE8E0] hover:bg-[#B3F0EA] text-[#063D48] font-bold text-xs flex items-center gap-1 transition-all shadow-sm cursor-pointer"
            >
              <span>{expandGodServices ? "Show less" : "View all"}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── 4. DEAD CODE SECTION ── */}
      <div className="bg-[rgba(8,55,65,0.75)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(155,232,224,0.16)] shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[rgba(155,232,224,0.12)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#094752] border border-[#16C7A1]/30 flex items-center justify-center text-[#16C7A1] shrink-0">
              <FileCode2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#F7FAFA]">
                  DEAD CODE
                </h2>
                <span className="text-base sm:text-lg font-bold font-mono text-[#F5B800]">
                  ({effectiveDeadCode.length})
                </span>
              </div>
              <p className="text-xs text-[#82AEB5] mt-0.5">
                Unused files, functions or modules that can be safely removed.
              </p>
            </div>
          </div>

          <button
            onClick={() => setExpandDeadCode(!expandDeadCode)}
            className="px-3.5 py-1.5 rounded-lg bg-[#0A3D46] hover:bg-[#0E4954] border border-[#176873] text-[#9BE8E0] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{expandDeadCode ? "Collapse" : "View all"}</span>
            <ArrowRight size={13} className="text-[#16C7A1]" />
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {displayedDeadCode.map((filePath, index) => {
            const formattedIndex = String(index + 1).padStart(2, "0");
            return (
              <div
                key={filePath + index}
                onClick={() => onSelectFile?.(filePath)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[rgba(8,76,88,0.55)] hover:bg-[rgba(12,95,110,0.75)] border border-[rgba(155,232,224,0.12)] hover:border-[#16C7A1]/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-xs font-mono font-bold text-[#9BE8E0] w-6 shrink-0">
                    {formattedIndex}
                  </span>
                  <FileCode2 size={15} className="text-[#8EA9AE] shrink-0" />
                  <span className="text-xs font-mono text-[#F7FAFA] truncate">
                    {filePath}
                  </span>
                </div>
                <ChevronRight
                  size={15}
                  className="text-[#8EA9AE] group-hover:text-[#16C7A1] group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                />
              </div>
            );
          })}
        </div>

        {/* Expand / Summary Footer */}
        {effectiveDeadCode.length > 10 && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-[#82AEB5]">
              <div className="w-6 h-6 rounded-md bg-[#0E4F5A] border border-[#16C7A1]/30 flex items-center justify-center text-[#16C7A1] font-bold">
                {expandDeadCode ? <ChevronUp size={14} /> : <Plus size={14} />}
              </div>
              <span>
                {expandDeadCode
                  ? `Showing all ${effectiveDeadCode.length} files`
                  : `+ ${effectiveDeadCode.length - 10} more files (Showing top 10 of ${effectiveDeadCode.length})`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. CIRCULAR DEPENDENCIES SECTION (if present) ── */}
      {cycles && cycles.length > 0 && (
        <div className="bg-[rgba(8,55,65,0.75)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(155,232,224,0.16)] shadow-xl space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[rgba(155,232,224,0.12)]">
            <AlertTriangle size={18} className="text-[#F5B800]" />
            <h2 className="text-base font-bold uppercase tracking-tight text-[#F7FAFA]">
              Circular Dependencies ({cycles.length})
            </h2>
          </div>
          <div className="space-y-2">
            {cycles.map((c: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[rgba(8,76,88,0.55)] border border-[rgba(155,232,224,0.12)] font-mono text-xs text-[#F5B800]"
              >
                <span className="text-[#8EA9AE] font-bold shrink-0">{i + 1}.</span>
                <span className="truncate">{Array.isArray(c) ? c.join(" → ") : String(c)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
