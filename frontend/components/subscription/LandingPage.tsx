import React, { useState } from 'react';
import {
  Terminal, Layers, Network, Database, Zap, Sparkles, Shield,
  GitBranch, Activity, FileText, ChevronDown, CheckCircle2,
  ArrowRight, Bot, GitCompare, Code2, Settings, MessageSquare,
  Cpu, Lock, Search, Play, Rocket, Github, Check, Users, Star, Server,
  Box
} from 'lucide-react';
import Pricing from './Pricing';
import type { Plan } from '../../lib/subscription/subscription';

interface LandingPageProps {
  onGetStarted: () => void;
  onSelectPlan: (plan: Plan) => void;
}

const features = [
  {
    icon: Layers,
    title: 'Architecture Engine',
    desc: 'Understand system architecture and component relationships.',
    badgeBg: 'bg-[#084C58] text-[#9BE8E0]',
  },
  {
    icon: Network,
    title: 'Route Analysis',
    desc: 'Trace routes, analyze flow, and identify patterns.',
    badgeBg: 'bg-[#084C58] text-[#9BE8E0]',
  },
  {
    icon: Zap,
    title: 'Real-time Engine',
    desc: 'Get instant insights as you explore code.',
    badgeBg: 'bg-red-500/20 text-[#FF3344]',
    highlight: true,
  },
  {
    icon: MessageSquare,
    title: 'Interaction Engine',
    desc: 'Ask questions and get natural, contextual answers.',
    badgeBg: 'bg-[#084C58] text-[#9BE8E0]',
  },
  {
    icon: FileText,
    title: 'Decomposition Engine',
    desc: 'Break down complex logic into simple explanations.',
    badgeBg: 'bg-[#084C58] text-[#9BE8E0]',
  },
  {
    icon: Activity,
    title: 'Performance Engine',
    desc: 'Analyze performance bottlenecks and optimization opportunities.',
    badgeBg: 'bg-[#084C58] text-[#9BE8E0]',
  },
  {
    icon: Shield,
    title: 'Security Engine',
    desc: 'Identify security issues and potential vulnerabilities.',
    badgeBg: 'bg-[#084C58] text-[#9BE8E0]',
  },
  {
    icon: Code2,
    title: 'Documentation Engine',
    desc: 'Generate clear, comprehensive documentation automatically.',
    badgeBg: 'bg-[#084C58] text-[#9BE8E0]',
  },
];

const faqs = [
  {
    icon: Box,
    iconBg: 'bg-[#C5F4EF] text-[#063D48]',
    q: 'What is about architecture?',
    a: 'Archaeologist is a codebase intelligence platform, combining hardware-aware analysis with code understanding to help you explore, analyze and optimize complex systems.',
  },
  {
    icon: Database,
    iconBg: 'bg-[#FFE0E2] text-[#063D48]',
    q: 'What is sateral questions?',
    a: 'There are a lot of commonly asked questions about data commands, routing, and integrations. We\'ve compiled the most relevant ones here.',
  },
  {
    icon: FileText,
    iconBg: 'bg-[#C5F4EF] text-[#063D48]',
    q: 'What is the proise plan?',
    a: 'Our Free Trial gives you 14 days of full access to analyze repositories, explore architecture graphs, and run impact diagnostics with no credit card required.',
  },
  {
    icon: Users,
    iconBg: 'bg-[#FFE0E2] text-[#063D48]',
    q: 'How can I exploveall molder?',
    a: 'You can upload repository ZIP files, connect GitHub repositories directly via URL, or point to local codebase paths for immediate parsing and analysis.',
  },
];

export default function LandingPage({ onGetStarted, onSelectPlan }: LandingPageProps) {
  const [openFaqs, setOpenFaqs] = useState<number[]>([0, 1]);

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-[#063D48] text-[#F7FAFA] relative overflow-hidden font-sans selection:bg-[#FF3344] selection:text-white">
      
      {/* ── 1. SIGNATURE BACKGROUND DECORATIVE SHAPES (EXACT REFERENCE) ── */}
      {/* Top-Left Solid Red Quarter-Circle */}
      <div className="absolute top-0 left-0 w-44 h-44 sm:w-60 sm:h-60 rounded-br-full bg-[#FF3344] pointer-events-none z-0 shadow-lg" />
      
      {/* Bottom-Left Solid Red Quarter-Circle (Footer decoration) */}
      <div className="absolute bottom-0 left-0 w-44 h-44 sm:w-56 sm:h-56 rounded-tr-full bg-[#FF3344] pointer-events-none z-0 opacity-95" />

      {/* Left-Middle 3x4 Dot Grid */}
      <div className="absolute top-[280px] left-6 sm:left-12 grid grid-cols-3 gap-3 pointer-events-none z-0 opacity-45">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#9BE8E0]" />
        ))}
      </div>

      {/* Top-Right 4x3 Dot Grid */}
      <div className="absolute top-24 right-8 sm:right-16 grid grid-cols-4 gap-3 pointer-events-none z-0 opacity-45">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#9BE8E0]" />
        ))}
      </div>

      {/* Bottom-Right 4x4 Dot Grid (Near footer) */}
      <div className="absolute bottom-8 right-8 sm:right-16 grid grid-cols-4 gap-3 pointer-events-none z-0 opacity-45">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#9BE8E0]" />
        ))}
      </div>

      {/* ── 2. HEADER NAVIGATION ── */}
      <header className="relative z-50 w-full">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 h-[72px] flex items-center justify-between">
          
          {/* Logo Brand Lockup */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#FF3344] flex items-center justify-center shadow-md font-bold text-white text-lg">
              A
            </div>
            <span className="font-bold text-xl sm:text-2xl text-[#F7FAFA] tracking-tight">
              Archaeologist
            </span>
          </div>

          {/* Right Navigation & CTA */}
          <div className="flex items-center gap-8 sm:gap-10">
            <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#C3D5D8]">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href="#features" className="hover:text-white transition-colors">Docs</a>
            </nav>

            <button
              onClick={onGetStarted}
              className="h-[46px] px-6 rounded-[10px] bg-[#FF3344] hover:bg-[#e02636] text-white text-[15px] font-bold shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── 3. HERO SECTION (2-COLUMN VISUAL SAAS LAYOUT) ── */}
      <section className="relative pt-12 pb-20 px-6 sm:px-8 max-w-[1280px] mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: Messaging & CTA */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#9BE8E0] mb-4">
              CODE BETTER, FASTER
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-[#F7FAFA] tracking-tight leading-[1.02] mb-5">
              Understand Any <br />
              Codebase In <br />
              <span className="text-[#FF3344]">30 Seconds</span>
            </h1>

            <p className="text-[#C3D5D8] text-base sm:text-[17px] leading-[1.55] max-w-[460px] mb-8">
              Understand what any codebase does, from architecture and dependencies to routes, database schemas, and code health diagnostics in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <button
                onClick={onGetStarted}
                className="h-[52px] px-8 rounded-[10px] bg-[#FF3344] hover:bg-[#e02636] text-white text-[15px] font-bold shadow-lg shadow-red-500/20 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#features"
                className="h-[52px] px-7 rounded-[10px] bg-transparent hover:bg-[rgba(155,232,224,0.08)] text-[#F7FAFA] border border-[rgba(155,232,224,0.25)] text-[15px] font-semibold flex items-center transition-all duration-200"
              >
                Explore Features
              </a>
            </div>

            <p className="text-xs text-[#8EA9AE] mb-10">
              No credit card, No credit cards, Don't even.
            </p>

            {/* Proof Statistics Row */}
            <div className="flex items-center gap-7 text-xs sm:text-sm font-semibold text-white">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#9BE8E0]" />
                <div>
                  <div className="font-bold text-[#F7FAFA] text-sm">10K+</div>
                  <div className="text-[11px] text-[#C3D5D8] font-normal">Developers</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#9BE8E0] fill-[#9BE8E0]" />
                <div>
                  <div className="font-bold text-[#F7FAFA] text-sm">4.9/5</div>
                  <div className="text-[11px] text-[#C3D5D8] font-normal">User Rating</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#9BE8E0]" />
                <div>
                  <div className="font-bold text-[#F7FAFA] text-sm">50K+</div>
                  <div className="text-[11px] text-[#C3D5D8] font-normal">Repositories</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Product Mockup & Action Cards */}
          <div className="lg:col-span-7 relative">
            <div className="relative flex items-center">
              
              {/* Main Browser Window Mockup */}
              <div className="w-full max-w-[500px] bg-[#f8fafc] rounded-[20px] shadow-2xl overflow-hidden text-slate-800 border border-slate-200">
                
                {/* Browser Top Controls */}
                <div className="px-4 py-3 bg-[#ffffff] border-b border-slate-200 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                </div>

                {/* Workspace Interior */}
                <div className="grid grid-cols-12 min-h-[360px] bg-white">
                  
                  {/* Mock Left Sidebar */}
                  <div className="col-span-5 bg-[#fafcfd] border-r border-slate-200 p-3.5 flex flex-col justify-between">
                    <div>
                      {/* Inner Logo */}
                      <div className="flex items-center gap-2 mb-4 px-1">
                        <div className="w-5 h-5 rounded bg-[#FF3344] text-white flex items-center justify-center text-[10px] font-bold">
                          A
                        </div>
                        <span className="font-bold text-xs text-slate-800">Archaeologist</span>
                      </div>

                      {/* Navigation Items */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#C5F4EF] text-[#063D48] font-semibold">
                          <Layers size={13} className="text-[#063D48]" />
                          <span>Overview</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
                          <Network size={13} />
                          <span>Engine-Flow</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
                          <Activity size={13} />
                          <span>Analysis</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
                          <MessageSquare size={13} />
                          <span>Interactions</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
                          <FileText size={13} />
                          <span>Documentation</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Main Viewport / Code & Architecture Lines */}
                  <div className="col-span-7 p-4 bg-white flex flex-col justify-center space-y-3">
                    <div className="w-20 h-2 bg-[#FF3344] rounded-full opacity-80" />
                    <div className="w-36 h-2 bg-[#16C7A1] rounded-full opacity-70" />
                    <div className="w-28 h-2 bg-[#FF3344] rounded-full opacity-80" />
                    <div className="w-40 h-2 bg-slate-300 rounded-full" />
                    <div className="w-32 h-2 bg-[#16C7A1] rounded-full opacity-60" />
                    <div className="w-24 h-2 bg-slate-200 rounded-full" />
                    <div className="w-36 h-2 bg-slate-300 rounded-full" />
                    <div className="w-28 h-2 bg-[#FF3344] rounded-full opacity-70" />
                    <div className="w-32 h-2 bg-[#16C7A1] rounded-full opacity-70" />
                  </div>
                </div>
              </div>

              {/* 4 Floating Feature Action Cards (Stacked Right) */}
              <div className="hidden sm:flex flex-col gap-3 absolute -right-6 lg:-right-4 top-4 z-20 w-56">
                
                {/* 1. Engine-Flow Card */}
                <div className="p-3 rounded-[18px] bg-[#C5F4EF] text-[#063D48] shadow-xl flex items-center gap-3 border border-white/40">
                  <div className="w-9 h-9 rounded-xl bg-[#063D48] text-[#9BE8E0] flex items-center justify-center shrink-0">
                    <Layers size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#063D48]">Engine-Flow</div>
                    <div className="text-[10px] text-slate-700 leading-tight">Architecture, routes and logic</div>
                  </div>
                </div>

                {/* 2. Real-time Engine Card */}
                <div className="p-3 rounded-[18px] bg-white text-slate-900 shadow-xl flex items-center gap-3 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-[#FF3344] flex items-center justify-center shrink-0">
                    <Zap size={18} className="fill-[#FF3344]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Real-time Engine</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Get instant insights</div>
                  </div>
                </div>

                {/* 3. Interaction Engine Card */}
                <div className="p-3 rounded-[18px] bg-[#C5F4EF] text-[#063D48] shadow-xl flex items-center gap-3 border border-white/40">
                  <div className="w-9 h-9 rounded-xl bg-[#063D48] text-[#9BE8E0] flex items-center justify-center shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#063D48]">Interaction Engine</div>
                    <div className="text-[10px] text-slate-700 leading-tight">Ask questions naturally</div>
                  </div>
                </div>

                {/* 4. Documentation Engine Card */}
                <div className="p-3 rounded-[18px] bg-white text-slate-900 shadow-xl flex items-center gap-3 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-[#063D48] text-[#9BE8E0] flex items-center justify-center shrink-0">
                    <Settings size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Documentation Engine</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Break down complex logic</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── 4. EIGHT ENGINES GRID (FEATURES SECTION) ── */}
      <section id="features" className="py-20 px-6 sm:px-8 max-w-[1280px] mx-auto relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-[40px] font-bold text-[#F7FAFA] tracking-tight mb-3">
            Eight Engines, <span className="text-[#FF3344]">One Powerful Platform</span>
          </h2>
          <p className="text-[#C3D5D8] text-[15px] sm:text-[16px] max-w-[600px] mx-auto leading-relaxed">
            Comprehensive analysis, clear explanations, and real-time collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-[18px] bg-[rgba(8,55,65,0.72)] border border-[rgba(155,232,224,0.18)] hover:border-[rgba(155,232,224,0.38)] hover:bg-[rgba(12,70,80,0.88)] transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center mb-4 ${f.badgeBg}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#F7FAFA] mb-2 group-hover:text-[#9BE8E0] transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-[#C3D5D8] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. CAPABILITY / PROOF STRIP ── */}
      <section className="py-6 px-6 sm:px-8 max-w-[1280px] mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'AST Analysis', value: '8+ Languages', icon: Terminal },
            { label: 'Route Mapping', value: 'Auto Detection', icon: Network },
            { label: 'Context Intelligence', value: 'Real-time AI', icon: Sparkles },
            { label: 'Dependency Flow', value: 'Interactive Graph', icon: GitBranch },
          ].map((s, i) => (
            <div
              key={i}
              className="p-5 rounded-[18px] bg-[rgba(8,55,65,0.72)] border border-[rgba(155,232,224,0.18)] text-center"
            >
              <s.icon className="w-5 h-5 text-[#9BE8E0] mx-auto mb-2" />
              <div className="text-xl font-bold text-[#F7FAFA]">{s.value}</div>
              <div className="text-[11px] text-[#8EA9AE] mt-0.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. PRICING SECTION ── */}
      <div id="pricing">
        <Pricing onSelectPlan={onSelectPlan} />
      </div>

      {/* ── 7. FAQ SECTION (EXACT REFERENCE SPECIFICATION) ── */}
      <section id="faq" className="py-24 px-6 sm:px-8 max-w-[1280px] mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="text-[13px] font-bold uppercase tracking-[0.22em] text-[#FF3344] mb-3">
            F A Q
          </div>
          <h2 className="text-4xl sm:text-[48px] font-bold text-[#F7FAFA] tracking-tight leading-tight mb-3">
            Frequently Asked <span className="text-[#FF3344]">Questions</span>
          </h2>
          <p className="text-[#C3D5D8] text-[17px] sm:text-[18px] max-w-[640px] mx-auto leading-relaxed">
            Everything you need to know about Archaeologist, in one place.
          </p>
        </div>

        {/* 2-Column FAQ Grid (Exact 20px gap, 20px radius, 56px icon block, 44px round button) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {faqs.map((faq, i) => {
            const isOpen = openFaqs.includes(i);

            return (
              <div
                key={i}
                className={`rounded-[20px] bg-[rgba(8,70,80,0.65)] border transition-all duration-200 p-6 sm:p-7 ${
                  isOpen
                    ? 'border-[#16C7A1] shadow-[0_0_0_1px_rgba(22,199,161,0.15)] bg-[rgba(8,70,80,0.85)]'
                    : 'border-[rgba(155,232,224,0.20)] hover:border-[rgba(155,232,224,0.38)]'
                }`}
              >
                <div
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4 pr-3">
                    {/* 56x56 Icon Block */}
                    <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center shrink-0 ${faq.iconBg}`}>
                      <faq.icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    {/* 20px Question Text */}
                    <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#F7FAFA] leading-snug">
                      {faq.q}
                    </h3>
                  </div>

                  {/* 44x44 Circular Expand Button */}
                  <div className={`w-11 h-11 rounded-full bg-[rgba(155,232,224,0.10)] flex items-center justify-center text-[#9BE8E0] shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-[rgba(22,199,161,0.25)] text-[#16C7A1]' : ''
                  }`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>

                {/* 16px Answer Text */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-[rgba(155,232,224,0.12)] text-[#C3D5D8] text-[15px] sm:text-[16px] leading-[1.55] max-w-[520px]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 8. LARGE CTA BANNER (EXACT REFERENCE SPECIFICATION) ── */}
      <section className="py-10 px-6 sm:px-8 max-w-[1280px] mx-auto relative z-10">
        <div className="min-h-[210px] rounded-[22px] bg-[rgba(8,76,88,0.85)] border border-[rgba(155,232,224,0.20)] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          
          {/* Left Decorative Subtle Arc Background */}
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-[#16C7A1]/10 pointer-events-none" />
          
          {/* Right Decorative Pale Mint Quarter-Circle */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#9BE8E0]/15 pointer-events-none" />

          {/* Left Content */}
          <div className="flex items-center gap-5 text-left z-10">
            {/* Rocket Icon in Glowing Coral Circle */}
            <div className="w-14 h-14 rounded-2xl bg-[#063D48] border border-[rgba(255,51,68,0.35)] flex items-center justify-center text-[#FF3344] shrink-0 shadow-lg">
              <Rocket className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-[34px] font-bold text-[#F7FAFA] tracking-tight leading-tight">
                Ready to understand <span className="text-[#FF3344]">In 30 Seconds?</span>
              </h2>
              <p className="text-[#C3D5D8] text-sm sm:text-base mt-1.5">
                Start your 14-day free trial to craft your precision.
              </p>
            </div>
          </div>

          {/* Right CTA Button & Curved Annotation */}
          <div className="flex flex-col items-center md:items-end gap-2.5 shrink-0 z-10 w-full md:w-auto">
            <button
              onClick={onGetStarted}
              className="w-full md:w-auto h-[52px] px-8 rounded-[10px] bg-[#FF3344] hover:bg-[#e02636] text-white font-bold text-[15px] sm:text-[16px] shadow-xl shadow-red-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
            
            {/* Hand-drawn style sub-annotation */}
            <div className="flex items-center gap-1.5 text-xs text-[#9BE8E0] italic">
              <span>No credit card required!</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer className="border-t border-[rgba(155,232,224,0.15)] py-12 px-6 sm:px-8 relative z-10 text-[13px] text-[#C3D5D8]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#FF3344] flex items-center justify-center font-bold text-white text-xs shadow-sm">
              A
            </div>
            <span className="font-bold text-base text-[#F7FAFA]">Archaeologist</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-[#C3D5D8]">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>

          {/* Copyright */}
          <div className="text-[#8EA9AE]">
            Built with precision to an Archaeologist. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
