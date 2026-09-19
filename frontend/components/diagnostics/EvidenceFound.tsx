"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

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
  // Findings with semantic colored status dots & matching tags
  const findings = React.useMemo(() => {
    return [
      {
        text: "SUPABASE_URL env var",
        tag: "src/lib/supabase.ts",
        dotColor: "#FF3045", // Red dot
        tagClass: "bg-[#FF3045]/15 text-[#FF6B7D] border-[#FF3045]/30",
      },
      {
        text: "14 auth-related routes (/api/auth/login, /api/auth/signin, ...)",
        tag: "routes",
        dotColor: "#F4EDE5", // Cream dot
        tagClass: "bg-[#8EDBD5]/15 text-[#8EDBD5] border-[#8EDBD5]/30",
      },
      {
        text: "21 routes have middleware protection",
        tag: "routes",
        dotColor: "#40D3A2", // Mint dot
        tagClass: "bg-[#20C7CF]/15 text-[#20C7CF] border-[#20C7CF]/30",
      },
      {
        text: "7 high-criticality secret env vars",
        tag: "auth",
        dotColor: "#F2C84B", // Yellow dot
        tagClass: "bg-[#F2C84B]/15 text-[#F2C84B] border-[#F2C84B]/30",
      },
    ];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="w-full rounded-[14px] bg-[#084B52] border border-[#20C7CF]/20 border-l-4 border-l-[#20C7CF] p-4 sm:p-4.5 relative overflow-hidden shadow-md text-left flex flex-col justify-between h-auto min-h-0"
    >
      <div>
        {/* ── Top Header: Document Icon + Title ── */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#06363D] text-[#8EDBD5] flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4EDE5] leading-snug">
                Evidence Found
              </h3>
              <p className="text-[11px] text-[#8EDBD5] leading-tight">
                Key findings from repository analysis.
              </p>
            </div>
          </div>
        </div>

        {/* ── Findings List with Semantic Status Dots & Badges ── */}
        <div className="space-y-2 mt-1.5">
          {findings.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2.5 py-1.5 px-3 rounded-[8px] bg-[#06363D] hover:bg-[#0B555C] border border-[rgba(32,199,207,0.10)] hover:border-[rgba(32,199,207,0.25)] transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Status Dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.dotColor }}
                />
                <span className="text-xs font-medium text-[#F4EDE5] truncate group-hover:text-white">
                  {item.text}
                </span>
              </div>

              {/* Corresponding Badge Tag */}
              <span
                className={`px-2 py-0.5 rounded-[6px] border text-[10.5px] font-mono shrink-0 font-medium ${item.tagClass}`}
              >
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

