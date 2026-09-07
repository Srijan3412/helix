import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Building2, Zap, ArrowRight, Layers } from 'lucide-react';
import { PLAN_CONFIG } from '../../lib/subscription/subscription';
import type { Plan } from '../../lib/subscription/subscription';

interface PricingProps {
  onSelectPlan: (plan: Plan) => void;
  currentPlan?: Plan;
}

export default function Pricing({ onSelectPlan, currentPlan }: PricingProps) {
  const plans: Plan[] = ['trial', 'professional', 'enterprise'];

  return (
    <section className="relative pt-10 pb-12 sm:pt-14 sm:pb-16 px-6 sm:px-8 bg-transparent overflow-hidden">
      
      {/* ── Background Decorations (Continuous Visual Language) ── */}
      {/* Left Red Circular Shape */}
      <div className="absolute top-1/4 -left-[140px] w-[260px] h-[260px] rounded-full bg-[#FF3344] opacity-85 pointer-events-none z-0" />
      
      {/* Large Soft Ambient Radial Glow behind Pricing Cards */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] max-w-full h-[480px] bg-[radial-gradient(ellipse_at_center,rgba(22,199,161,0.16)_0%,rgba(6,61,72,0)_70%)] blur-3xl pointer-events-none z-0" />

      {/* Top-Right Dotted Matrix Pattern (#8DE7DF) */}
      <div className="absolute top-8 right-10 sm:right-16 grid grid-cols-4 gap-3 pointer-events-none z-0 opacity-60">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#8DE7DF]" />
        ))}
      </div>

      {/* Right-Side Subtle Curved Decorative Line */}
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-[420px] pointer-events-none z-0 opacity-30"
        viewBox="0 0 200 400"
        fill="none"
      >
        <path
          d="M200,0 C100,100 50,250 200,400"
          stroke="#79E1D7"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
      </svg>

      {/* ── Section Container (Max Width 1280px) ── */}
      <div className="max-w-[1280px] w-full mx-auto relative z-10">
        
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 h-7 px-3.5 rounded-full bg-[rgba(0,200,170,0.08)] border border-[rgba(0,220,190,0.25)] mb-3.5 shadow-sm">
            <span className="text-[12px] font-bold uppercase tracking-[3px] text-[#79E1D7]">
              ✦ TRANSPARENT PRICING
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl sm:text-[42px] font-bold text-white tracking-tight leading-tight mb-2.5">
            Choose Your Plan
          </h2>

          {/* Subtitle */}
          <p className="text-[#AFC9CE] text-[15px] sm:text-[16px] leading-relaxed max-w-[700px] mx-auto">
            Start for free with 2 repository scans. Upgrade as your team grows.
          </p>
        </motion.div>

        {/* ── 3 Pricing Cards Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((planKey, idx) => {
            const plan = PLAN_CONFIG[planKey];
            const isPro = planKey === 'professional';
            const isEnterprise = planKey === 'enterprise';
            const isTrial = planKey === 'trial';
            const isCurrent = currentPlan === planKey;

            return (
              <motion.div
                key={planKey}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`relative rounded-[20px] p-8 sm:p-9 min-h-[520px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                  isPro
                    ? 'bg-[#DDF6F1] text-[#073942] border-2 border-[#79E1D7] shadow-[0_12px_40px_rgba(70,230,210,0.18)] scale-[1.02] z-20'
                    : 'bg-[#104957] text-[#D5E8EB] border border-[rgba(121,225,215,0.22)] hover:border-[rgba(121,225,215,0.45)] shadow-lg'
                }`}
              >
                {/* Overlapping RECOMMENDED Badge for Professional with gentle micro-float */}
                {isPro && (
                  <motion.div
                    animate={{ y: [-1, 1, -1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute -top-[16px] left-1/2 -translate-x-1/2 h-8 px-5 rounded-full bg-[#72DDD2] text-[#073942] text-[12px] font-bold uppercase tracking-[1.5px] shadow-md flex items-center justify-center pointer-events-none"
                  >
                    RECOMMENDED
                  </motion.div>
                )}

                <div>
                  {/* Icon Block (64x64px, 16px radius) */}
                  <div className="mb-6">
                    <div className={`w-16 h-16 rounded-[16px] flex items-center justify-center mb-4 ${
                      isPro
                        ? 'bg-[#c2eee5] text-[#073942]'
                        : 'bg-[#185d6e] text-[#79E1D7]'
                    }`}>
                      {isTrial && <Layers className="w-8 h-8" />}
                      {isPro && <Zap className="w-8 h-8 fill-[#073942]" />}
                      {isEnterprise && <Building2 className="w-8 h-8" />}
                    </div>

                    {/* Plan Title & Subtitle */}
                    <h3 className={`text-[24px] font-bold tracking-tight mb-1 ${
                      isPro ? 'text-[#073942]' : 'text-white'
                    }`}>
                      {plan.name}
                    </h3>
                    <p className={`text-[15px] ${
                      isPro ? 'text-[#234B53]' : 'text-[#A9C2C7]'
                    }`}>
                      {isTrial
                        ? 'Get started with Helix.'
                        : isPro
                        ? 'For individuals and growing teams.'
                        : 'For large teams and organizations.'}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="mb-6 pb-2 border-b border-black/5 dark:border-white/10">
                    {plan.price === null ? (
                      <div className="text-[38px] font-extrabold text-white">Custom</div>
                    ) : plan.price === 0 ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[44px] font-extrabold text-white">Free</span>
                        <span className="text-[15px] text-[#A9C2C7] font-medium">/ 14 days</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[50px] font-extrabold text-[#073942] tracking-tight leading-none">
                            ${plan.price}
                          </span>
                          <span className="text-[16px] text-[#3b666e] font-medium">
                            / {plan.period}
                          </span>
                        </div>
                        <div className="text-[12px] text-[#2c5861] mt-1 font-medium">
                          Billed annually or $32/month
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features List (14-15px, 20-22px checkmarks) */}
                  <div className="space-y-3 mb-8 text-[14px] sm:text-[15px]">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isPro
                            ? 'bg-[#79DDD3] text-[#073942]'
                            : 'bg-[#1b6272] text-[#79E1D7]'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className={`leading-snug ${
                          isPro ? 'text-[#073942] font-medium' : 'text-[#D5E8EB]'
                        }`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Action Buttons (Equal Height 54px, Bottom Aligned with mt-auto) ── */}
                <div className="mt-auto pt-4">
                  <button
                    onClick={() => onSelectPlan(planKey)}
                    disabled={isCurrent}
                    className={`group w-full h-[54px] rounded-[12px] font-bold text-[15px] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                      isCurrent
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : isPro
                        ? 'bg-[#F52B36] text-white hover:bg-[#d0232d] shadow-lg shadow-red-500/25 active:scale-[0.98]'
                        : isEnterprise
                        ? 'bg-transparent text-[#F52B36] border-2 border-[#F52B36] hover:bg-[#F52B36] hover:text-white active:scale-[0.98]'
                        : 'bg-[#F52B36] text-white hover:bg-[#d0232d] shadow-md active:scale-[0.98]'
                    }`}
                  >
                    <span>
                      {isCurrent
                        ? 'Current Plan'
                        : isTrial
                        ? 'Start Free'
                        : isEnterprise
                        ? 'Contact Sales'
                        : 'Start Pro'}
                    </span>
                    {!isCurrent && (
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    )}
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
