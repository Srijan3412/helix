// frontend/components/ScanUsageDisplay.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3, AlertCircle, CheckCircle2, Zap, ArrowRight } from "lucide-react";

interface ScanUsageDisplayProps {
  scansUsed: number;
  scanLimit: number;
  onStartScan?: () => void;
  isLoading?: boolean;
  isAdmin?: boolean;
  plan?: string;
}

export default function ScanUsageDisplay({
  scansUsed,
  scanLimit,
  onStartScan,
  isLoading = false,
  isAdmin = false,
  plan = "free",
}: ScanUsageDisplayProps) {
  const isUnlimited =
    isAdmin || scanLimit === Infinity || scanLimit >= 999 || plan === "enterprise" || plan === "professional";
  const remaining = isUnlimited ? Infinity : Math.max(0, scanLimit - scansUsed);
  const isAtLimit = !isUnlimited && remaining === 0;
  const percentage = isUnlimited ? 100 : Math.min(100, (scansUsed / scanLimit) * 100);

  const handleStartScanClick = () => {
    if (onStartScan) {
      onStartScan();
    } else {
      const inputEl = document.getElementById("repo-url-input") || document.querySelector("input[type='url']");
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
        (inputEl as HTMLElement).focus();
      }
    }
  };

  return (
    <div className="w-full max-w-[1000px] sm:max-w-[1040px] mx-auto rounded-[20px] sm:rounded-[24px] bg-[rgba(5,48,58,0.82)] backdrop-blur-xl border border-[rgba(155,232,224,0.18)] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between text-left">
      
      {/* ── Top Header Row ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Coral Icon + Title + Subtitle */}
        <div className="flex items-center gap-4 sm:gap-4.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] sm:rounded-[16px] bg-[#FF3344] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#FF3344]/25">
            <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-[20px] font-extrabold text-[#F7FAFA] uppercase tracking-wider leading-tight">
              Repository Scans
            </h2>
            <p className="text-sm sm:text-[15px] text-[#C3D5D8] font-normal mt-1">
              Analyze and understand any repository
            </p>
          </div>
        </div>

        {/* Right: Scan Counter Pill Badge */}
        <div className="flex items-center self-start sm:self-center">
          <div
            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full border text-xs sm:text-[14px] font-semibold tracking-wide flex items-center gap-2 shrink-0 ${
              isAtLimit
                ? "border-[rgba(255,51,68,0.35)] bg-[rgba(255,51,68,0.08)] text-[#FF4D5E]"
                : "border-[rgba(22,199,161,0.35)] bg-[rgba(22,199,161,0.08)] text-[#16C7A1]"
            }`}
          >
            {isUnlimited ? (
              <>
                <span className="text-base leading-none">∞</span>
                <span>{scansUsed} / Unlimited used</span>
              </>
            ) : (
              <span>
                {scansUsed} / {scanLimit} used
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Progress Bar ───────────────────────────────────── */}
      <div className="w-full h-2 sm:h-2.5 rounded-full overflow-hidden bg-[rgba(4,38,46,0.85)] border border-[rgba(155,232,224,0.12)] my-5 sm:my-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full transition-all duration-500 ${
            isUnlimited
              ? "bg-gradient-to-r from-[#16C7A1] via-[#63E0D0] to-[#9BE8E0]"
              : isAtLimit
              ? "bg-[#FF3344]"
              : percentage > 80
              ? "bg-[#F5B800]"
              : "bg-gradient-to-r from-[#16C7A1] to-[#63E0D0]"
          }`}
        />
      </div>

      {/* ── Access Details & CTA Action ───────────────────────────── */}
      <div className="space-y-4">
        {/* Capability Row 1: Unlimited / Standard Scanner Access */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[12px] bg-[rgba(22,199,161,0.12)] border border-[rgba(22,199,161,0.25)] text-[#16C7A1] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#16C7A1]" />
          </div>
          <div>
            <div className="text-sm sm:text-[16px] font-bold text-[#F7FAFA] leading-tight">
              {isUnlimited
                ? "Unlimited Scanner Access"
                : plan === "professional" || plan === "enterprise"
                ? "Professional Scanner Access"
                : "Limited Scanner Access"}
            </div>
            <div className="text-xs sm:text-[14px] text-[#C3D5D8] font-normal mt-0.5">
              {isUnlimited
                ? "Full repository analysis with no limits"
                : "Standard repository analysis for your account tier"}
            </div>
          </div>
        </div>

        {/* Capability Row 2: Remaining Scans + Action CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] flex items-center justify-center shrink-0 ${
                isAtLimit
                  ? "bg-[rgba(255,51,68,0.12)] border border-[rgba(255,51,68,0.25)] text-[#FF4D5E]"
                  : "bg-[rgba(22,199,161,0.12)] border border-[rgba(22,199,161,0.25)] text-[#16C7A1]"
              }`}
            >
              {isAtLimit ? (
                <AlertCircle className="w-5 h-5 text-[#FF4D5E]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#16C7A1]" />
              )}
            </div>
            <div>
              <div
                className={`text-sm sm:text-[16px] font-bold leading-tight ${
                  isAtLimit ? "text-[#FF4D5E]" : "text-[#F7FAFA]"
                }`}
              >
                {isUnlimited
                  ? "Unlimited scans remaining"
                  : isAtLimit
                  ? "Scan limit reached"
                  : `${remaining} scan${remaining !== 1 ? "s" : ""} remaining`}
              </div>
              <div className="text-xs sm:text-[14px] text-[#C3D5D8] font-normal mt-0.5">
                {isUnlimited
                  ? "Analyze as many repositories as you need"
                  : isAtLimit
                  ? "Upgrade subscription or contact sales for scans"
                  : `${scansUsed} of ${scanLimit} scans used on plan`}
              </div>
            </div>
          </div>

          {/* CTA Action Button */}
          <div className="self-end sm:self-auto shrink-0">
            {isAtLimit ? (
              <button
                onClick={() => (window.location.href = "/contact-sales")}
                className="h-12 sm:h-14 px-6 sm:px-8 rounded-[12px] bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                📧 Contact Us for More Access
              </button>
            ) : (
              <button
                onClick={handleStartScanClick}
                disabled={isLoading}
                className="h-12 sm:h-14 px-7 sm:px-9 rounded-[12px] bg-[#FF3344] hover:bg-[#e02636] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#FF3344]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:translate-y-[1px]"
              >
                <span>{isLoading ? "Starting..." : "Start Scan"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}