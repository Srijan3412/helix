import { useState } from 'react';
import { X, Check, Sparkles, Loader2, Zap, Building2, CreditCard } from 'lucide-react';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { PLAN_CONFIG } from '../../lib/subscription/subscription';
import type { Plan } from '../../lib/subscription/subscription';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
  preselectedPlan?: Plan;
}

export default function UpgradeModal({ open, onClose, reason, preselectedPlan }: UpgradeModalProps) {
  const { upgradePlan, profile } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(preselectedPlan || 'professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    const result = await upgradePlan(selectedPlan);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => { onClose(); setSuccess(false); }, 2000);
    }
  };

  const plans: Plan[] = ['professional', 'enterprise'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg border border-white/10 bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition z-10 cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upgrade Complete!</h3>
            <p className="text-sm text-neutral-400">Your plan is now active. Enjoy unlimited access.</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Upgrade</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {reason || 'Unlock Full Access'}
              </h2>
              <p className="text-sm text-neutral-500">
                {profile?.plan === 'trial' ? 'You are on the Free Trial. Upgrade to remove all limits.' : 'Choose a plan to continue.'}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {plans.map((planKey) => {
                const plan = PLAN_CONFIG[planKey];
                const isSelected = selectedPlan === planKey;
                return (
                  <button
                    key={planKey}
                    onClick={() => setSelectedPlan(planKey)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-white/8 bg-white/3 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {planKey === 'professional' ? <Zap className="w-4 h-4 text-primary" /> : <Building2 className="w-4 h-4 text-secondary-400" />}
                        <span className="text-sm font-bold text-white">{plan.name}</span>
                      </div>
                      <div className="text-right">
                        {plan.price === null ? (
                          <span className="text-sm font-bold text-white">Custom</span>
                        ) : (
                          <span className="text-sm font-bold text-white">${plan.price}<span className="text-xs text-neutral-500">/mo</span></span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <span key={i} className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {selectedPlan === 'enterprise' ? 'Contact Sales' : `Upgrade to ${PLAN_CONFIG[selectedPlan].name}`}
            </button>

            <p className="text-center text-xs text-neutral-600 mt-4">
              Secure payment via Stripe. Cancel anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
