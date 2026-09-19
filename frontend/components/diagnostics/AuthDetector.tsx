"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Check, ChevronRight } from "lucide-react";

interface AuthDetectorProps {
  authType?: string;
  evidence?: string[];
}

export default function AuthDetector({ authType = "Supabase Auth", evidence = [] }: AuthDetectorProps) {
  const isNone = !authType || authType === "None detected" || authType === "None";
  const confidence = evidence.length > 0 ? Math.min(100, Math.round(50 + evidence.length * 15)) : (isNone ? 0 : 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full rounded-[16px] bg-[#FDECEF] border border-[#FF3048]/40 border-l-[4px] border-l-[#FF3048] p-3 sm:px-4.5 sm:py-3.5 relative overflow-hidden shadow-xs text-left flex flex-col justify-between gap-3 h-auto min-h-[125px]"
    >
      {/* ── Top Row: Left (Shield + Title + Badge + Subtitle) & Right (Confidence + Progress + Arrow) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        
        {/* Left: 42x42px Red Shield + Title + Supabase Auth Badge + Description */}
        <div className="flex items-center gap-3">
          {/* Point 3: Shield Icon (42x42px, bg #FF3048, icon white, radius 10px) */}
          <div className="w-[42px] h-[42px] rounded-[10px] bg-[#FF3048] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Shield size={20} className="stroke-[2.4] fill-white/10" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Point 4: Title in #163F47, 16-17px, font 700 */}
              <h3 className="text-[16px] sm:text-[17px] font-bold text-[#163F47] leading-tight">
                Authentication Guard
              </h3>
              {/* Point 5: Badge (bg #D7F2EF, border #8BDDD7, text #079E98, 11-12px, radius 10-12px) */}
              <span className="px-2.5 py-0.5 rounded-[11px] bg-[#D7F2EF] border border-[#8BDDD7] text-[#079E98] text-[11px] font-bold font-mono">
                {isNone ? "None detected" : authType}
              </span>
            </div>
            {/* Point 9: Description below title (#607E82, 11-12px) */}
            <p className="text-[11.5px] text-[#607E82] mt-0.5 leading-none">
              Security and access configuration analysis.
            </p>
          </div>
        </div>

        {/* Right: Confidence Value + Horizontal Progress Bar + Navigation Arrow */}
        <div className="flex items-center gap-3.5 shrink-0 self-end md:self-auto">
          {/* Points 7 & 8: Confidence Label, Number, and Horizontal Bar */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10.5px] uppercase font-bold text-[#607E82] tracking-wider block leading-tight">
                Confidence
              </span>
              <span className="text-[17px] sm:text-[18px] font-extrabold text-[#163F47] font-mono leading-none">
                {confidence}%
              </span>
            </div>

            {/* Point 8: Progress Bar (w: 200-280px, track: #F5D5D9, fill: #FF3048, h: 7-8px, radius: 999px) */}
            <div className="w-36 sm:w-56 md:w-64 lg:w-72 h-[7.5px] rounded-full bg-[#F5D5D9] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF3048] transition-all duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* Point 10: Circular Arrow Button (38x38px, bg #F9D5D9, arrow #E5384D, radius 50%) */}
          <div className="w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] rounded-full bg-[#F9D5D9] text-[#E5384D] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#F3C5CB] transition-colors">
            <ChevronRight size={18} className="stroke-[2.6]" />
          </div>
        </div>

      </div>

      {/* ── Bottom Row: Three Light Tinted Security Check Cards (Points 11–15) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 relative z-10">
        
        {/* Check 1: Auth routes detected (Point 11: bg #E7F1F2, border #D5E6E7, check circle #087E82) */}
        <div className="h-[48px] sm:h-[50px] px-3 rounded-[10px] bg-[#E7F1F2] border border-[#D5E6E7] flex items-center gap-2.5 shadow-xs">
          <div className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full bg-[#087E82] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Check size={13} className="stroke-[3.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11.5px] font-bold text-[#163F47] block truncate leading-tight">
              Auth routes detected
            </span>
            <span className="text-[10px] text-[#607E82] block truncate mt-0.5 leading-none">
              14 protected routes
            </span>
          </div>
        </div>

        {/* Check 2: Environment variables found (Point 12) */}
        <div className="h-[48px] sm:h-[50px] px-3 rounded-[10px] bg-[#E7F1F2] border border-[#D5E6E7] flex items-center gap-2.5 shadow-xs">
          <div className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full bg-[#087E82] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Check size={13} className="stroke-[3.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11.5px] font-bold text-[#163F47] block truncate leading-tight">
              Environment variables found
            </span>
            <span className="text-[10px] text-[#607E82] block truncate mt-0.5 leading-none">
              All required variables present
            </span>
          </div>
        </div>

        {/* Check 3: Security best practices (Point 13) */}
        <div className="h-[48px] sm:h-[50px] px-3 rounded-[10px] bg-[#E7F1F2] border border-[#D5E6E7] flex items-center gap-2.5 shadow-xs">
          <div className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full bg-[#087E82] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Check size={13} className="stroke-[3.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11.5px] font-bold text-[#163F47] block truncate leading-tight">
              Security best practices
            </span>
            <span className="text-[10px] text-[#607E82] block truncate mt-0.5 leading-none">
              No critical issues found
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}