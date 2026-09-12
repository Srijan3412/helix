'use client';

import React from 'react';
import { ArrowDown, Check, Code2, ArrowRight } from 'lucide-react';

export const ContextualOverlays: React.FC = () => {
  return (
    <>
      {/* 1. TOP ANNOTATION: Incoming Requests */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#081318]/90 border border-[#00D2FF]/40 shadow-[0_0_15px_rgba(0,210,255,0.25)] backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-ping" />
          <span className="text-[11px] font-black text-[#60A5FA] tracking-wider uppercase">
            Incoming Requests
          </span>
        </div>
        <div className="flex flex-col items-center mt-1">
          <div className="w-0.5 h-4 bg-gradient-to-b from-[#00D2FF] to-transparent animate-pulse" />
          <ArrowDown size={14} className="text-[#00D2FF] -mt-1 animate-bounce" />
        </div>
      </div>

      {/* 2. TOP-RIGHT: HTTP Request Card */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex flex-col gap-2 p-3 rounded-xl bg-[#071216]/90 border border-[#00D2FF]/30 shadow-2xl backdrop-blur-md min-w-[200px] pointer-events-none">
        <div className="text-[9px] font-extrabold uppercase text-[#60A5FA] tracking-wider">
          HTTP Request
        </div>
        {/* Method tags */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00D2FF]/20 text-[#00E5FF] border border-[#00D2FF]/40">
            GET
          </span>
          <span className="text-[9px] font-mono text-[#9FB0B3]/60 px-1 py-0.5">POST</span>
          <span className="text-[9px] font-mono text-[#9FB0B3]/60 px-1 py-0.5">PUT</span>
          <span className="text-[9px] font-mono text-[#9FB0B3]/60 px-1 py-0.5">DELETE</span>
        </div>
        {/* URL Endpoint Bar */}
        <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0A1820] border border-white/5 font-mono text-[10px] text-[#9FB0B3]">
          <span className="text-emerald-400 font-semibold">/api/v1/users</span>
          <ArrowRight size={10} className="text-[#60A5FA]" />
        </div>
      </div>

      {/* 3. MID-RIGHT: Response Card */}
      <div className="absolute top-36 right-4 z-20 hidden md:flex flex-col gap-1.5 p-3 rounded-xl bg-[#071216]/90 border border-[#16C7A3]/30 shadow-2xl backdrop-blur-md min-w-[190px] pointer-events-none">
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <span className="text-[9px] font-extrabold uppercase text-[#9FB0B3] tracking-wider">
            Response
          </span>
          <span className="text-[9px] font-mono font-bold text-[#16C7A3] bg-[#16C7A3]/10 px-1.5 py-0.5 rounded border border-[#16C7A3]/30">
            200 OK
          </span>
        </div>
        {/* JSON Code Snippet */}
        <pre className="font-mono text-[9px] text-[#9FB0B3] leading-tight bg-[#0A1820] p-2 rounded border border-white/5 overflow-hidden">
          <span className="text-white">{'{'}</span>{'\n'}
          {'  '}<span className="text-[#60A5FA]">"status"</span>: <span className="text-emerald-400">"success"</span>,{'\n'}
          {'  '}<span className="text-[#60A5FA]">"data"</span>: [ ... ]{'\n'}
          <span className="text-white">{'}'}</span>
        </pre>
      </div>

      {/* 4. LEFT-MID: Validation & Business Rules Callout */}
      <div className="absolute top-32 left-4 z-20 hidden lg:flex flex-col gap-1 p-2.5 rounded-xl bg-[#071216]/90 border border-[#8B5CF6]/40 shadow-2xl backdrop-blur-md max-w-[160px] pointer-events-none">
        <div className="text-[8px] font-black uppercase text-[#C084FC] tracking-wider">
          Rules & Pipeline
        </div>
        <div className="flex flex-col gap-0.5 font-mono text-[9px] text-[#9FB0B3]">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#8B5CF6]" />
            <span>Validation</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#F5A623]" />
            <span>Transformation</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#16C7A3]" />
            <span>Business Rules</span>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM TAGLINE */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <span className="text-[10px] font-mono text-[#9FB0B3]/70 tracking-wider">
          Code Today <span className="text-[#60A5FA]">➔</span> Cleaner Architecture Tomorrow
        </span>
      </div>
    </>
  );
};
