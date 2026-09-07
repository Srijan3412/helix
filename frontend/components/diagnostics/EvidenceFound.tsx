import React from "react";
import { motion } from "framer-motion";
import { FileText, ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="w-full rounded-[16px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] p-5 relative overflow-hidden shadow-md text-left flex flex-col justify-between min-h-[220px] sm:min-h-[235px]"
    >
      <div>
        {/* ── Top Header: Document Icon + Title + View All Button ── */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#084C58] text-[#9BE8E0] flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-[15px] font-bold text-[#F7FAFA] leading-snug">
                Evidence Found
              </h3>
              <p className="text-[11px] text-[#C3D5D8] leading-tight">
                Key findings from repository analysis.
              </p>
            </div>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#9BE8E0] hover:text-white flex items-center gap-1 transition shrink-0 cursor-pointer"
          >
            View All <ArrowRight size={12} />
          </button>
        </div>

        {/* ── Findings List ── */}
        <div className="space-y-2 mt-2">
          {findings.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 py-1 px-2.5 rounded-[8px] bg-[rgba(6,47,56,0.60)] border border-[rgba(155,232,224,0.08)] hover:border-[rgba(155,232,224,0.20)] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-4 h-4 rounded-full bg-[#0E5462] flex items-center justify-center shrink-0 text-[#9BE8E0]">
                  <CheckCircle2 size={12} />
                </div>
                <span className="text-xs font-medium text-[#E1F1F3] truncate">
                  {item.text}
                </span>
              </div>

              <span className="px-2 py-0.5 rounded-[6px] bg-[rgba(4,38,46,0.85)] border border-[rgba(155,232,224,0.15)] text-[10.5px] font-mono text-[#9BE8E0] shrink-0">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
