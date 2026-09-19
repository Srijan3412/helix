import React from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle2 } from "lucide-react";

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
  // Findings matching reference design
  const findings = React.useMemo(() => {
    if (evidence && evidence.length > 0) {
      return evidence.slice(0, 4).map((item, idx) => {
        let tag = ".env";
        if (item.toLowerCase().includes("route")) tag = "routes";
        else if (item.toLowerCase().includes("client") || item.toLowerCase().includes("supabase")) tag = "src/lib/supabase.ts";
        else if (item.toLowerCase().includes("secret") || item.toLowerCase().includes("auth")) tag = "auth";
        else if (files[idx]?.path) tag = files[idx].path.split(/[\\/]/).pop() || "src";
        return { text: item, tag };
      });
    }
    return [
      { text: "SUPABASE_URL env var", tag: ".env" },
      { text: "14 auth-related routes (/api/auth/login, /api/auth/signup)", tag: "routes" },
      { text: "21 routes have middleware protection", tag: "routes" },
      { text: "7 high-criticality secret env vars", tag: "env" },
    ];
  }, [evidence, files]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="w-full rounded-[14px] bg-[rgba(7,60,69,0.85)] backdrop-blur-md border border-[rgba(32,214,216,0.18)] p-4 sm:p-4.5 relative overflow-hidden shadow-sm text-left flex flex-col justify-between h-auto min-h-0"
    >
      <div>
        {/* ── Top Header: Document Icon + Title ── */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#094752] text-[#20D6D8] flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F7FAFA] leading-snug">
                Evidence Found
              </h3>
              <p className="text-[11px] text-[#C3D5D8] leading-tight">
                Key findings from repository analysis.
              </p>
            </div>
          </div>
        </div>

        {/* ── Findings List ── */}
        <div className="space-y-1.5 mt-1.5">
          {findings.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2.5 py-1 px-2.5 rounded-[8px] bg-[rgba(5,42,49,0.85)] border border-[rgba(32,214,216,0.10)] hover:border-[rgba(32,214,216,0.25)] transition-all"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-3.5 h-3.5 rounded-full bg-[#094752] flex items-center justify-center shrink-0 text-[#20D6D8]">
                  <CheckCircle2 size={11} />
                </div>
                <span className="text-xs font-medium text-[#E1F1F3] truncate">
                  {item.text}
                </span>
              </div>

              <span className="px-1.5 py-0.5 rounded-[5px] bg-[rgba(4,32,38,0.90)] border border-[rgba(32,214,216,0.18)] text-[10px] font-mono text-[#20D6D8] shrink-0">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
