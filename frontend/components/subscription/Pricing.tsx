import { Check, X, Sparkles, Building2, Zap, ArrowRight } from 'lucide-react';
import { PLAN_CONFIG } from '../../lib/subscription/subscription';
import type { Plan } from '../../lib/subscription/subscription';

interface PricingProps {
  onSelectPlan: (plan: Plan) => void;
  currentPlan?: Plan;
}

export default function Pricing({ onSelectPlan, currentPlan }: PricingProps) {
  const plans: Plan[] = ['trial', 'professional', 'enterprise'];

  return (
    <section className="relative py-24 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold tracking-wider text-primary uppercase">Pricing</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Choose Your Plan</h2>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
          Start free for 14 days. Upgrade when you're ready. Cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((planKey) => {
          const plan = PLAN_CONFIG[planKey];
          const isPro = planKey === 'professional';
          const isEnterprise = planKey === 'enterprise';
          const isCurrent = currentPlan === planKey;

          return (
            <div
              key={planKey}
              className={`relative rounded-2xl p-8 backdrop-blur-md transition-all duration-300 ${
                isPro
                  ? 'border-2 border-primary/40 bg-primary/5 shadow-2xl shadow-primary/10 scale-[1.02]'
                  : 'border border-white/8 bg-white/3'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-neutral-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Recommended
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {planKey === 'trial' && <Zap className="w-5 h-5 text-neutral-400" />}
                  {isPro && <Sparkles className="w-5 h-5 text-primary" />}
                  {isEnterprise && <Building2 className="w-5 h-5 text-secondary-400" />}
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  {plan.price === null ? (
                    <span className="text-3xl font-extrabold text-white">Custom</span>
                  ) : plan.price === 0 ? (
                    <>
                      <span className="text-4xl font-extrabold text-white">Free</span>
                      <span className="text-sm text-neutral-500">/ {plan.period}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                      <span className="text-sm text-neutral-500">/ {plan.period}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isPro ? 'bg-primary/20' : 'bg-white/5'
                    }`}>
                      <Check className={`w-3 h-3 ${isPro ? 'text-primary' : 'text-neutral-400'}`} />
                    </div>
                    <span className="text-sm text-neutral-300">{feature}</span>
                  </div>
                ))}
                {plan.excluded.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5 opacity-40">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white/5">
                      <X className="w-3 h-3 text-neutral-500" />
                    </div>
                    <span className="text-sm text-neutral-500 line-through">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onSelectPlan(planKey)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-white/5 text-neutral-500 cursor-not-allowed'
                    : isPro
                    ? 'bg-primary text-neutral-950 hover:bg-primary-400'
                    : isEnterprise
                    ? 'bg-white/10 text-white border border-white/15 hover:bg-white/15'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {isCurrent ? 'Current Plan' : planKey === 'trial' ? 'Start Free' : isEnterprise ? 'Contact Sales' : 'Start Pro'}
                {!isCurrent && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
