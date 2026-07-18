import { useState } from 'react';
import {
  CreditCard, Lock, Shield, Check, Loader2, ArrowLeft, CheckCircle2,
  Sparkles, Zap, Building2, Calendar, Download, AlertCircle
} from 'lucide-react';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { PLAN_CONFIG } from '../../lib/subscription/subscription';
import type { Plan } from '../../lib/subscription/subscription';

interface PaymentPageProps {
  onBack: () => void;
  preselectedPlan?: Plan;
}

export default function PaymentPage({ onBack, preselectedPlan }: PaymentPageProps) {
  const { upgradePlan, payments } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(preselectedPlan || 'professional');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/27');
  const [cvc, setCvc] = useState('334');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const plan = PLAN_CONFIG[selectedPlan];
  const isEnterprise = selectedPlan === 'enterprise';

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const handlePay = async () => {
    if (isEnterprise) return;
    setLoading(true);
    setError(null);
    const result = await upgradePlan(selectedPlan);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="text-center max-w-md animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Payment Successful</h1>
          <p className="text-neutral-500 mb-8">
            Welcome to {plan.name}. Your subscription is now active and you have unlimited access to all features.
          </p>
          <div className="border border-white/8 bg-white/3 rounded-2xl p-6 mb-6 text-left">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/8">
              <span className="text-sm text-neutral-400">Plan</span>
              <span className="text-sm font-bold text-white">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/8">
              <span className="text-sm text-neutral-400">Amount</span>
              <span className="text-sm font-bold text-white">${plan.price}/month</span>
            </div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/8">
              <span className="text-sm text-neutral-400">Billing Cycle</span>
              <span className="text-sm font-bold text-white">Monthly</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Next Renewal</span>
              <span className="text-sm font-bold text-white">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Payment Handling</h1>
            <p className="text-xs text-neutral-500">Secure checkout powered by Stripe</p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">256-bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Plan Selection + Payment Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Plan Selection */}
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">1. Select Plan</h2>
              <div className="grid grid-cols-2 gap-3">
                {(['professional', 'enterprise'] as Plan[]).map((planKey) => {
                  const p = PLAN_CONFIG[planKey];
                  const isSelected = selectedPlan === planKey;
                  return (
                    <button
                      key={planKey}
                      onClick={() => setSelectedPlan(planKey)}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/20'
                          : 'border-white/8 bg-white/3 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {planKey === 'professional' ? <Zap className="w-4 h-4 text-primary" /> : <Building2 className="w-4 h-4 text-secondary-400" />}
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary ml-auto" />}
                      </div>
                      <div className="text-2xl font-extrabold text-white mb-1">
                        {p.price === null ? 'Custom' : `$${p.price}`}
                        {p.price !== null && <span className="text-xs text-neutral-500 font-normal">/mo</span>}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {planKey === 'professional' ? '100k tokens/mo' : 'Unlimited tokens'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Form */}
            {!isEnterprise ? (
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">2. Payment Details</h2>
                <div className="border border-white/8 bg-white/3 rounded-2xl p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Cardholder Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary/40 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="4242 4242 4242 4242"
                        className="w-full pl-10 pr-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary/40 transition font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Expiry</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary/40 transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">CVC</label>
                      <input
                        type="text"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        className="w-full px-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary/40 transition font-mono"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Pay ${plan.price} / month
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-neutral-600">
                    <Shield className="w-3.5 h-3.5" />
                    Your payment information is encrypted and secure
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-white/8 bg-white/3 rounded-2xl p-8 text-center">
                <Building2 className="w-10 h-10 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Contact Our Sales Team</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  Enterprise plans include SSO, private deployment, API access, audit logs, and custom AI models.
                  Our team will work with you to design a plan that fits your organization.
                </p>
                <button className="px-6 py-3 rounded-xl bg-secondary-500 text-white font-bold text-sm hover:bg-secondary-400 transition cursor-pointer">
                  Contact Sales
                </button>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="border border-white/8 bg-white/3 rounded-2xl p-6 sticky top-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Order Summary</h3>

              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
                {selectedPlan === 'professional' ? <Zap className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-secondary-400" />}
                <div>
                  <div className="text-sm font-bold text-white">{plan.name}</div>
                  <div className="text-xs text-neutral-500">{plan.tokens === Infinity ? 'Unlimited tokens' : `${plan.tokens.toLocaleString()} tokens/mo`}</div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Subtotal</span>
                  <span className="text-white font-semibold">${plan.price ?? 0}.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Tax</span>
                  <span className="text-white font-semibold">$0.00</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-lg font-extrabold text-white">${plan.price ?? 0}.00<span className="text-xs text-neutral-500 font-normal">/mo</span></span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">What's Included</div>
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-300">{f}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">30-day money back</span>
                </div>
                <p className="text-xs text-neutral-500">Not satisfied? Get a full refund within 30 days, no questions asked.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Payment History</h2>
            <div className="border border-white/8 bg-white/3 rounded-2xl overflow-hidden">
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${payment.status === 'paid' ? 'bg-primary/10' : 'bg-red-500/10'}`}>
                        <CreditCard className={`w-4 h-4 ${payment.status === 'paid' ? 'text-primary' : 'text-red-500'}`} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{payment.invoice_id}</div>
                        <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${payment.status === 'paid' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                        {payment.status}
                      </span>
                      <span className="text-sm font-bold text-white">${(payment.amount_cents / 100).toFixed(2)}</span>
                      <button className="p-1.5 rounded-lg text-neutral-500 hover:text-primary hover:bg-white/5 transition cursor-pointer">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
