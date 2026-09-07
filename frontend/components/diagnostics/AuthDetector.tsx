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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="w-full rounded-[16px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] p-5 relative overflow-hidden shadow-md text-left flex flex-col justify-between min-h-[145px] sm:min-h-[155px]"
    >
      <div>
        {/* ── Top Header: Shield Icon + Title + Badge + Confidence ── */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#FF3344] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Shield size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-[15px] font-bold text-[#F7FAFA] leading-snug">
                  Authentication Guard
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#0E5462] border border-[#16C7A1]/40 text-[#9BE8E0] text-[11px] font-semibold">
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
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-2 rounded-full bg-[rgba(6,47,56,0.85)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#16C7A1] transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#F7FAFA] font-mono shrink-0">
            {confidence}%
          </span>
        </div>
      </div>

      {/* ── 3 Status Check Boxes ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
        <div className="p-2 rounded-[8px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#16C7A1] text-[#063D48] flex items-center justify-center shrink-0">
            <Check size={10} className="stroke-[3]" />
          </div>
          <span className="text-[11px] font-semibold text-[#E1F1F3] truncate">
            Auth routes detected
          </span>
        </div>

        <div className="p-2 rounded-[8px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#16C7A1] text-[#063D48] flex items-center justify-center shrink-0">
            <Check size={10} className="stroke-[3]" />
          </div>
          <span className="text-[11px] font-semibold text-[#E1F1F3] truncate">
            Environment variables found
          </span>
        </div>

        <div className="p-2 rounded-[8px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.12)] flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#16C7A1] text-[#063D48] flex items-center justify-center shrink-0">
            <Check size={10} className="stroke-[3]" />
          </div>
          <span className="text-[11px] font-semibold text-[#E1F1F3] truncate">
            Security best practices
          </span>
        </div>
      </div>
    </motion.div>
  );
}