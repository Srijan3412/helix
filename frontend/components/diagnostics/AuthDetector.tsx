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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="w-full rounded-[14px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] p-4 sm:p-4.5 relative overflow-hidden shadow-sm text-left flex flex-col justify-between h-auto min-h-0"
    >
      <div className="relative z-10">
        {/* ── Top Header: Shield Icon + Title + Badge + Confidence ── */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#FF3344] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Shield size={15} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[#F7FAFA] leading-snug">
                  Authentication Guard
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#0D5B66] border border-[#16C7A1]/30 text-[#9BE8E0] text-[10.5px] font-semibold">
                  {isNone ? "None detected" : authType}
                </span>
              </div>
              <div className="text-[11px] text-[#C3D5D8] mt-0.5">
                Confidence: <span className="font-bold text-[#16C7A1]">{confidence}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Full-Width Progress Bar ── */}
        <div className="flex items-center gap-2.5 my-1.5">
          <div className="flex-1 h-2 rounded-full bg-[rgba(6,47,56,0.85)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#16C7A1] transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-[#9BE8E0] font-mono shrink-0">
            {confidence}%
          </span>
        </div>
      </div>

      {/* ── 3 Status Check Boxes ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1 relative z-10">
        <div className="p-2 rounded-[8px] bg-[rgba(6,47,56,0.60)] border border-[rgba(155,232,224,0.08)] flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#16C7A1] text-[#063F47] flex items-center justify-center shrink-0">
            <Check size={10} className="stroke-[3]" />
          </div>
          <span className="text-[11px] font-medium text-[#E1F1F3] truncate">
            Auth routes detected
          </span>
        </div>

        <div className="p-2 rounded-[8px] bg-[rgba(6,47,56,0.60)] border border-[rgba(155,232,224,0.08)] flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#16C7A1] text-[#063F47] flex items-center justify-center shrink-0">
            <Check size={10} className="stroke-[3]" />
          </div>
          <span className="text-[11px] font-medium text-[#E1F1F3] truncate">
            Environment variables found
          </span>
        </div>

        <div className="p-2 rounded-[8px] bg-[rgba(6,47,56,0.60)] border border-[rgba(155,232,224,0.08)] flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#16C7A1] text-[#063F47] flex items-center justify-center shrink-0">
            <Check size={10} className="stroke-[3]" />
          </div>
          <span className="text-[11px] font-medium text-[#E1F1F3] truncate">
            Security best practices
          </span>
        </div>
      </div>
    </motion.div>
  );
}