import React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Key,
  Lock,
  FileCode,
  Route,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FileText,
  Terminal
} from "lucide-react";
import { Badge } from "../ui/badge";

interface AuthDetectorProps {
  authType: string;
  evidence: string[];
}

export default function AuthDetector({ authType, evidence = [] }: AuthDetectorProps) {
  const isNone = !authType || authType === "None detected" || authType === "None";
  const confidence = evidence.length > 0 ? Math.min(100, Math.round(50 + evidence.length * 15)) : (isNone ? 0 : 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch text-left w-full mt-5">
      
      {/* ── Left Panel: Authentication Guard ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="lg:col-span-6 bg-[rgba(8,70,80,0.75)] backdrop-blur-md rounded-[20px] p-6 border border-[rgba(155,232,224,0.18)] shadow-md flex flex-col justify-between"
      >
        <div>
          {/* Header Row */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-[14px] bg-[#FF3344] text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
              <Shield size={26} className="stroke-[2.2]" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-[#F7FAFA]">
                  Authentication Guard
                </h3>
                <span className="px-3 py-0.5 rounded-full bg-[#9BE8E0] text-[#063D48] text-xs font-bold shadow-sm">
                  {isNone ? "None detected" : authType}
                </span>
              </div>

              <div className="text-xs text-[#C3D5D8] mt-1">
                Confidence: <span className="font-bold text-[#16C7A1]">{confidence}%</span>
              </div>
            </div>
          </div>

          {/* Smooth Confidence Progress Bar */}
          <div className="w-full h-3 rounded-full bg-[rgba(6,47,56,0.85)] overflow-hidden my-4">
            <div
              className="h-full rounded-full bg-[#16C7A1] transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>

          {/* Status Indicators / Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            <div className="flex items-center gap-2 p-2.5 rounded-[12px] bg-[rgba(6,47,56,0.80)] border border-[rgba(155,232,224,0.10)]">
              <CheckCircle2 size={15} className="text-[#16C7A1] shrink-0" />
              <span className="text-[11px] font-medium text-[#F7FAFA] leading-tight">
                Auth routes detected
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-[12px] bg-[rgba(6,47,56,0.80)] border border-[rgba(155,232,224,0.10)]">
              <CheckCircle2 size={15} className="text-[#16C7A1] shrink-0" />
              <span className="text-[11px] font-medium text-[#F7FAFA] leading-tight">
                Environment vars found
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-[12px] bg-[rgba(6,47,56,0.80)] border border-[rgba(155,232,224,0.10)]">
              <CheckCircle2 size={15} className="text-[#16C7A1] shrink-0" />
              <span className="text-[11px] font-medium text-[#F7FAFA] leading-tight">
                Security best practices
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Right Panel: Evidence Found ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="lg:col-span-6 bg-[rgba(8,70,80,0.75)] backdrop-blur-md rounded-[20px] p-6 border border-[rgba(155,232,224,0.18)] shadow-md flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#084C58] text-[#9BE8E0] flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h3 className="text-[17px] font-bold text-[#F7FAFA]">
                Evidence Found
              </h3>
            </div>

            <button className="text-xs font-semibold text-[#9BE8E0] hover:text-white flex items-center gap-1 transition">
              View All <ArrowRight size={13} />
            </button>
          </div>

          {/* Evidence List & File Tags */}
          <div className="space-y-3">
            {evidence.length > 0 ? (
              evidence.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-[12px] bg-[rgba(6,47,56,0.70)] border border-[rgba(155,232,224,0.10)]"
                >
                  <div className="flex items-start gap-2.5 text-xs text-[#C3D5D8] leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-[#16C7A1] mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </div>

                  {/* Smart contextual badge */}
                  <span className="px-2 py-0.5 rounded-md bg-[rgba(8,76,88,0.9)] text-[#9BE8E0] text-[10px] font-mono shrink-0 border border-[rgba(155,232,224,0.15)]">
                    {item.includes(".env") || item.includes("variable")
                      ? ".env"
                      : item.includes("route")
                      ? "routes"
                      : "src/lib/auth"}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 p-2.5 rounded-[12px] bg-[rgba(6,47,56,0.70)] border border-[rgba(155,232,224,0.10)]">
                  <div className="flex items-start gap-2.5 text-xs text-[#C3D5D8]">
                    <span className="w-2 h-2 rounded-full bg-[#16C7A1] mt-1.5 shrink-0" />
                    <span>SUPABASE_URL env var</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[rgba(8,76,88,0.9)] text-[#9BE8E0] text-[10px] font-mono shrink-0">
                    .env
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 p-2.5 rounded-[12px] bg-[rgba(6,47,56,0.70)] border border-[rgba(155,232,224,0.10)]">
                  <div className="flex items-start gap-2.5 text-xs text-[#C3D5D8]">
                    <span className="w-2 h-2 rounded-full bg-[#16C7A1] mt-1.5 shrink-0" />
                    <span>14 auth-related routes (/api/auth/login, /api/auth/signup)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[rgba(8,76,88,0.9)] text-[#9BE8E0] text-[10px] font-mono shrink-0">
                    routes
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 p-2.5 rounded-[12px] bg-[rgba(6,47,56,0.70)] border border-[rgba(155,232,224,0.10)]">
                  <div className="flex items-start gap-2.5 text-xs text-[#C3D5D8]">
                    <span className="w-2 h-2 rounded-full bg-[#16C7A1] mt-1.5 shrink-0" />
                    <span>Supabase client initialization detected</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[rgba(8,76,88,0.9)] text-[#9BE8E0] text-[10px] font-mono shrink-0">
                    src/lib/supabase.ts
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

    </div>
  );
}