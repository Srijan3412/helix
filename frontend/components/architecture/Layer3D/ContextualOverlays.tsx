'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ContextualOverlaysProps {
  routes?: any[];
  dbType?: string;
}

export const ContextualOverlays: React.FC<ContextualOverlaysProps> = ({ routes = [], dbType }) => {
  const primaryRoute = routes && routes.length > 0 ? routes[0] : null;
  const rawPath = primaryRoute?.path ? String(primaryRoute.path).replace(/^ROUTE:/, '') : '/api/v1/users';
  const method = (primaryRoute?.method || 'GET').toUpperCase();
  const isPost = method === 'POST' || method === 'PUT';

  return (
    <>
      {/* ── 1. TOP-RIGHT: HTTP Request Card ── */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#08151E]/90 border border-[#00E5FF]/25 shadow-xl backdrop-blur-md min-w-[200px] pointer-events-none text-left">
        <div className="text-[9px] font-mono font-black uppercase text-[#60A5FA] tracking-wider">
          HTTP Request
        </div>
        {/* Method tags */}
        <div className="flex items-center gap-1">
          {(['GET', 'POST', 'PUT', 'DELETE'] as const).map((m) => {
            const isActive = method === m;
            return (
              <span
                key={m}
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isActive
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40'
                    : 'text-[#9FB0B3]/50'
                }`}
              >
                {m}
              </span>
            );
          })}
        </div>
        {/* URL Endpoint Bar */}
        <div className="flex items-center justify-between px-2 py-1 rounded bg-[#050D12] border border-white/5 font-mono text-[9.5px]">
          <span className="text-emerald-400 font-bold truncate max-w-[150px]" title={rawPath}>
            {rawPath}
          </span>
          <ArrowRight size={10} className="text-[#60A5FA] shrink-0 ml-1" />
        </div>
      </div>

      {/* ── 2. MID-RIGHT: Response Card ── */}
      <div className="absolute top-28 right-4 z-20 hidden md:flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#08151E]/90 border border-[#16C7A3]/25 shadow-xl backdrop-blur-md min-w-[200px] pointer-events-none text-left">
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <span className="text-[9px] font-mono font-black uppercase text-[#9FB0B3] tracking-wider">
            Response
          </span>
          <span className="text-[9px] font-mono font-bold text-[#16C7A3] bg-[#16C7A3]/10 px-1.5 py-0.5 rounded border border-[#16C7A3]/30">
            {isPost ? '201 Created' : '200 OK'}
          </span>
        </div>
        {/* JSON Code Snippet */}
        <pre className="font-mono text-[9px] text-[#9FB0B3] leading-tight bg-[#050D12] p-1.5 rounded border border-white/5 overflow-hidden">
          <span className="text-white">{'{'}</span>{'\n'}
          {'  '}<span className="text-[#60A5FA]">"status"</span>: <span className="text-emerald-400">"success"</span>,{'\n'}
          {'  '}<span className="text-[#60A5FA]">"endpoint"</span>: <span className="text-amber-300">"{rawPath.slice(0, 18)}"</span>,{'\n'}
          {'  '}<span className="text-[#60A5FA]">"data"</span>: [ ... ]{'\n'}
          <span className="text-white">{'}'}</span>
        </pre>
      </div>
    </>
  );
};
