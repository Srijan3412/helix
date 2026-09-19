"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileSearch,
  AlertCircle,
  Shield,
  Info,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface EvidenceFoundProps {
  evidence?: string[];
  files?: Array<{ path: string }>;
  onViewAll?: () => void;
  onSelectFile?: (file: string) => void;
}

export default function EvidenceFound({
  evidence = [],
  files = [],
  onViewAll,
  onSelectFile,
}: EvidenceFoundProps) {
  // Rich findings data matching exact specification & 2nd screenshot
  const findings = React.useMemo(() => {
    return [
      {
        title: "SUPABASE_URL env var",
        subtitle: "Found in src/lib/supabase.ts",
        tag: "src/lib/supabase.ts",
        severityBorder: "border-l-[4px] border-l-[#FF304F]",
        icon: AlertCircle,
        iconBoxClass: "bg-[#FF304F]/15 border border-[#FF304F]/30 text-[#FF536B]",
        tagClass: "bg-[#FF304F]/15 border border-[#FF304F]/30 text-[#FF536B]",
      },
      {
        title: "14 auth-related routes",
        subtitle: "Found routes: /api/auth/login, /api/auth/signin, /api/auth/signup",
        tag: "routes",
        severityBorder: "border-l-[4px] border-l-[#19D3D8]",
        icon: Shield,
        iconBoxClass: "bg-[#19D3D8]/15 border border-[#19D3D8]/30 text-[#19D3D8]",
        tagClass: "bg-[#19D3D8]/15 border border-[#19D3D8]/30 text-[#19D3D8]",
      },
      {
        title: "21 routes have middleware protection",
        subtitle: "Protected by auth middleware",
        tag: "routes",
        severityBorder: "border-l-[4px] border-l-[#19D3D8]",
        icon: Shield,
        iconBoxClass: "bg-[#19D3D8]/15 border border-[#19D3D8]/30 text-[#19D3D8]",
        tagClass: "bg-[#19D3D8]/15 border border-[#19D3D8]/30 text-[#19D3D8]",
      },
      {
        title: "7 high-criticality secret env vars",
        subtitle: "Found environment variables with high risk",
        tag: "auth",
        severityBorder: "border-l-[4px] border-l-[#168FE5]",
        icon: Info,
        iconBoxClass: "bg-[#168FE5]/15 border border-[#168FE5]/30 text-[#168FE5]",
        tagClass: "bg-[#168FE5]/15 border border-[#168FE5]/30 text-[#168FE5]",
      },
    ];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="w-full rounded-[20px] bg-[#074A52] border border-[#126873] p-5 sm:p-6 shadow-sm text-left flex flex-col justify-between h-auto min-h-0 space-y-4"
    >
      {/* ── Point 1: Header with 64x64px Red/Coral Icon Tile + View All Button ── */}
      <div className="flex items-center justify-between gap-3 pb-1">
        {/* Left: 64x64px Coral Tile + Title + Subtitle */}
        <div className="flex items-center gap-3.5">
          {/* Coral Icon Tile (bg #FF304F, white icon, radius 14px, shadow) */}
          <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-[14px] bg-[#FF304F] shadow-md shadow-[#FF304F]/25 text-white flex items-center justify-center shrink-0">
            <FileSearch className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.4]" />
          </div>

          <div>
            <h2 className="text-xl sm:text-[24px] lg:text-[26px] font-extrabold text-[#F4F7F7] tracking-tight leading-tight">
              Evidence Found
            </h2>
            <p className="text-xs sm:text-[14px] text-[#8EB5B8] mt-0.5 leading-snug">
              Key findings from repository analysis.
            </p>
          </div>
        </div>

        {/* View All (4) Button */}
        <button
          onClick={onViewAll}
          className="h-[40px] sm:h-[44px] px-3.5 sm:px-4.5 rounded-[12px] bg-[#063942] hover:bg-[#19D3D8] border border-[#126873] hover:border-[#19D3D8] text-[#19D3D8] hover:text-[#063E45] text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 group"
        >
          <span>View All (4)</span>
          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform stroke-[2.4]" />
        </button>
      </div>

      {/* ── Points 2–6: Information Cards with Severity Strip, Icons, Tags & Arrow ── */}
      <div className="space-y-2.5">
        {findings.map((item, idx) => {
          const IconComponent = item.icon;

          return (
            <div
              key={idx}
              onClick={() => onSelectFile?.(item.tag)}
              className={`p-3 sm:px-4 sm:py-3.5 rounded-[14px] bg-[#06353D] hover:bg-[#09515A] border border-[#126873]/50 hover:border-[#19D3D8]/40 ${item.severityBorder} transition-all cursor-pointer flex items-center justify-between gap-3 group`}
            >
              {/* Left: Rounded Icon Area + Title & Subtitle */}
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                {/* Point 4: Distinct Rounded Icon Box */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center shrink-0 shadow-xs ${item.iconBoxClass}`}
                >
                  <IconComponent size={18} className="stroke-[2.4]" />
                </div>

                {/* Text Details (Point 2) */}
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-[13.5px] font-bold text-[#F4F7F7] truncate leading-tight group-hover:text-white">
                    {item.title}
                  </div>
                  <div className="text-[11px] sm:text-[11.5px] text-[#8EB5B8] truncate mt-0.5 leading-tight">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {/* Right: Point 5 Filled Tag Pill + Point 6 Arrow */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Filled Tag Badge */}
                <span
                  className={`px-2.5 py-1 rounded-[8px] text-[10.5px] sm:text-[11px] font-mono font-bold leading-none shrink-0 ${item.tagClass}`}
                >
                  {item.tag}
                </span>

                {/* Point 6: Navigation Arrow */}
                <ChevronRight
                  size={16}
                  className="text-[#8EB5B8] group-hover:text-[#19D3D8] group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
