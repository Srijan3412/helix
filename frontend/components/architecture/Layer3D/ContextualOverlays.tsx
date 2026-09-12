'use client';

import React from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';

export const ContextualOverlays: React.FC = () => {
  return (
    <>
      {/* ── 1. TOP ANNOTATION: Incoming Requests (Directly above Routes beam) ── */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#08151D]/90 border border-[#00D2FF]/40 shadow-[0_0_16px_rgba(0,210,255,0.25)] backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
          <span className="text-[11px] font-mono font-black text-[#F4F7F7] tracking-wider uppercase">
            INCOMING REQUESTS
          </span>
        </div>
        <div className="flex flex-col items-center mt-1">
          <div className="w-0.5 h-3.5 bg-gradient-to-b from-[#00E5FF] to-transparent animate-pulse" />
          <ArrowDown size={13} className="text-[#00E5FF] -mt-0.5 animate-bounce" />
        </div>
      </div>

      {/* ── 2. TOP-RIGHT: HTTP Request Card ── */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#08151E]/90 border border-[#00E5FF]/25 shadow-xl backdrop-blur-md min-w-[190px] pointer-events-none text-left">
        <div className="text-[9px] font-mono font-black uppercase text-[#60A5FA] tracking-wider">
          HTTP Request
        </div>
        {/* Method tags */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
            GET
          </span>
          <span className="text-[9px] font-mono text-[#9FB0B3]/50 px-1 py-0.5">POST</span>
          <span className="text-[9px] font-mono text-[#9FB0B3]/50 px-1 py-0.5">PUT</span>
          <span className="text-[9px] font-mono text-[#9FB0B3]/50 px-1 py-0.5">DELETE</span>
        </div>
        {/* URL Endpoint Bar */}
        <div className="flex items-center justify-between px-2 py-1 rounded bg-[#050D12] border border-white/5 font-mono text-[9.5px]">
          <span className="text-emerald-400 font-bold truncate">/api/v1/users</span>
          <ArrowRight size={10} className="text-[#60A5FA] shrink-0 ml-1" />
        </div>
      </div>

      {/* ── 3. MID-RIGHT: Response Card ── */}
      <div className="absolute top-28 right-4 z-20 hidden md:flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#08151E]/90 border border-[#16C7A3]/25 shadow-xl backdrop-blur-md min-w-[190px] pointer-events-none text-left">
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <span className="text-[9px] font-mono font-black uppercase text-[#9FB0B3] tracking-wider">
            Response
          </span>
          <span className="text-[9px] font-mono font-bold text-[#16C7A3] bg-[#16C7A3]/10 px-1.5 py-0.5 rounded border border-[#16C7A3]/30">
            200 OK
          </span>
        </div>
        {/* JSON Code Snippet */}
        <pre className="font-mono text-[9px] text-[#9FB0B3] leading-tight bg-[#050D12] p-1.5 rounded border border-white/5 overflow-hidden">
          <span className="text-white">{'{'}</span>{'\n'}
          {'  '}<span className="text-[#60A5FA]">"status"</span>: <span className="text-emerald-400">"success"</span>,{'\n'}
          {'  '}<span className="text-[#60A5FA]">"data"</span>: [ ... ]{'\n'}
          <span className="text-white">{'}'}</span>
        </pre>
      </div>
    </>
  );
};
