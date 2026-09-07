import React from "react";
import { motion } from "framer-motion";
import { FileText, Info, ArrowRight, ChevronRight } from "lucide-react";

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
  onSelectFile
}: EvidenceFoundProps) {
  // Default dynamic evidence list
  const defaultEvidence = [
    "SUPABASE_URL env var",
    "14 auth-related routes (/api/auth/login, /api/auth/signup)",
    "Supabase client initialization detected",
    "21 routes have middleware protection"
  ];

  const displayEvidence = evidence.length > 0 ? evidence : defaultEvidence;

  // Extract or compute related files
  const relatedFiles = React.useMemo(() => {
    const list = [".env", "routes", "src/lib/supabase.ts"];
    if (files && files.length > 0) {
      const detected = files.slice(0, 3).map((f) => f.path);
      if (detected.length > 0) return detected;
    }
    return list;
  }, [files]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="w-full rounded-[26px] bg-[rgba(6,55,66,0.85)] border border-[rgba(155,232,224,0.18)] p-7 sm:p-9 relative overflow-hidden shadow-2xl text-left mt-6 backdrop-blur-md"
    >
      {/* ── Background Subtle Radial Glow & Curve ── */}
      <div className="absolute top-0 right-0 w-[420px] h-[320px] bg-[radial-gradient(ellipse_at_80%_20%,rgba(22,199,161,0.14)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10">
        {/* ── Top Header: Document Icon + Title/Subtitle + View All Button ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
          <div className="flex items-center gap-5">
            {/* 70-80px Document Icon Container */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[18px] bg-[rgba(8,76,88,0.9)] border border-[rgba(155,232,224,0.25)] text-[#9BE8E0] flex items-center justify-center shrink-0 shadow-lg">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-[#9BE8E0] stroke-[2.2]" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-2xl sm:text-[34px] font-bold text-[#F7FAFA] tracking-tight leading-none">
                Evidence <span className="text-[#9BE8E0]">Found</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#8EA9AE] mt-1.5 font-medium">
                Key findings from repository analysis.
              </p>
            </div>
          </div>

          {/* Large Outlined Action Button */}
          <button
            onClick={onViewAll}
            className="h-12 px-6 rounded-[14px] border border-[rgba(155,232,224,0.30)] hover:border-[#16C7A1] bg-[rgba(8,76,88,0.40)] hover:bg-[rgba(8,76,88,0.75)] text-[#F7FAFA] font-bold text-sm flex items-center justify-center gap-2.5 transition-all self-start sm:self-auto shrink-0 shadow-sm hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>View All</span>
            <ArrowRight size={16} className="text-[#9BE8E0]" />
          </button>
        </div>

        {/* ── Two-Column Main Content (68% Evidence / 32% Related Files) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* Left Column: Main Clickable Evidence Rows (~68% width) */}
          <div className="lg:col-span-8 space-y-3.5">
            {displayEvidence.map((item, idx) => (
              <div
                key={idx}
                className="group p-4 sm:p-5 rounded-[18px] bg-[rgba(5,46,55,0.85)] border border-[rgba(155,232,224,0.14)] hover:border-[rgba(155,232,224,0.38)] hover:bg-[rgba(8,60,72,0.95)] flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5"
              >
                {/* 44px Information Icon Circle */}
                <div className="w-10 h-10 rounded-full bg-[#9BE8E0] text-[#063D48] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <Info size={20} className="stroke-[2.5]" />
                </div>

                {/* Evidence Text */}
                <span className="text-[14px] sm:text-[15px] font-bold text-[#F7FAFA] flex-1 leading-snug">
                  {item}
                </span>

                {/* Right Arrow */}
                <ChevronRight size={18} className="text-[#9BE8E0] shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            ))}
          </div>

          {/* Right Column: Related Files Panel (~32% width) */}
          <div className="lg:col-span-4 lg:pl-2">
            <div className="text-[11px] sm:text-[12px] font-bold tracking-[0.16em] uppercase text-[#8EA9AE] mb-3.5">
              RELATED FILES
            </div>

            <div className="space-y-3">
              {relatedFiles.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectFile?.(file)}
                  className="group p-3.5 sm:p-4 rounded-[16px] bg-[rgba(5,46,55,0.75)] border border-[rgba(155,232,224,0.12)] hover:border-[rgba(155,232,224,0.30)] hover:bg-[rgba(8,60,72,0.9)] flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className="text-[#9BE8E0] shrink-0" />
                    <span className="text-xs sm:text-sm font-mono text-[#D0E1E3] group-hover:text-white truncate">
                      {file}
                    </span>
                  </div>

                  <ChevronRight size={16} className="text-[#9BE8E0] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
