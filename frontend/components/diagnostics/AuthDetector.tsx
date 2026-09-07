import React from "react";
import { motion } from "framer-motion";
import { Shield, Check } from "lucide-react";

interface AuthDetectorProps {
  authType: string;
  evidence: string[];
}

export default function AuthDetector({ authType, evidence = [] }: AuthDetectorProps) {
  const isNone = !authType || authType === "None detected" || authType === "None";
  const confidence = evidence.length > 0 ? Math.min(100, Math.round(50 + evidence.length * 15)) : (isNone ? 0 : 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full rounded-[24px] bg-[#F8FBFC] border border-[rgba(80,220,220,0.35)] p-7 sm:p-9 relative overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.12)] text-left mt-6"
    >
      {/* ── Top-Right Subtle Pale Pink Decorative Circle ── */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#FFE5E8]/80 pointer-events-none z-0" />

      <div className="relative z-10">
        {/* ── Top Header: Large Shield Icon + Title + Badge & Confidence ── */}
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Large Shield Container with subtle pink glow */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] bg-gradient-to-br from-[#FF4D5E] to-[#E9232E] text-white flex items-center justify-center shadow-lg shadow-red-500/25 shrink-0">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
          </div>

          {/* Title, Badge & Confidence Row */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3.5 flex-wrap">
              <h2 className="text-2xl sm:text-[32px] lg:text-[36px] font-extrabold text-[#082D3A] tracking-tight leading-none">
                Authentication Guard
              </h2>
              <span className="px-4 py-1 rounded-full bg-[#C5F4EF] text-[#084C58] text-xs sm:text-sm font-bold shadow-sm">
                {isNone ? "None detected" : authType}
              </span>
            </div>

            <div className="text-sm sm:text-base font-medium text-[#4F757D] mt-2">
              Confidence: <span className="font-bold text-[#16C7A1] text-base sm:text-lg">{confidence}%</span>
            </div>
          </div>
        </div>

        {/* ── Full-Width Progress Bar with Percentage Outside ── */}
        <div className="flex items-center gap-4 my-6 sm:my-7">
          <div className="flex-1 h-3.5 sm:h-4 rounded-full bg-[#D7EFEF] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#16C7A1] transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-base sm:text-lg font-black text-[#082D3A] shrink-0">
            {confidence}%
          </span>
        </div>

        {/* ── 3 Large Evidence Panels ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="bg-white/90 border border-[#BCEBE6] rounded-[18px] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#16C7A1] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-5 h-5 stroke-[2.8]" />
            </div>
            <span className="text-[14px] sm:text-[15px] font-bold text-[#082D3A] leading-snug">
              Auth routes detected
            </span>
          </div>

          <div className="bg-white/90 border border-[#BCEBE6] rounded-[18px] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#16C7A1] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-5 h-5 stroke-[2.8]" />
            </div>
            <span className="text-[14px] sm:text-[15px] font-bold text-[#082D3A] leading-snug">
              Environment variables found
            </span>
          </div>

          <div className="bg-white/90 border border-[#BCEBE6] rounded-[18px] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#16C7A1] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-5 h-5 stroke-[2.8]" />
            </div>
            <span className="text-[14px] sm:text-[15px] font-bold text-[#082D3A] leading-snug">
              Security best practices
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}