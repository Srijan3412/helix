import { useState } from 'react';
import {
  CreditCard, Download, X, Loader2, CheckCircle2, Zap, Calendar,
  Building2, ArrowRight, AlertCircle, FileText, Database, Sparkles
} from 'lucide-react';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { PLAN_CONFIG, daysLeft } from '../../lib/subscription/subscription';
import UpgradeModal from './UpgradeModal';

export default function BillingPage() {
  const { profile, subscription, usage, payments, cancelSubscription } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!profile) return null;

  const plan = PLAN_CONFIG[profile.plan];
  const isTrial = profile.plan === 'trial';
  const trialDays = daysLeft(profile.trial_ends_at);

  const usageItems = [
    { label: 'Repositories', icon: Database, current: usage?.repositories_analyzed ?? 0, limit: plan.limits.repositories },
    { label: 'AI Chats', icon: Sparkles, current: usage?.ai_chats ?? 0, limit: plan.limits.aiChats },
    { label: 'Architecture Graphs', icon: Building2, current: usage?.architecture_graphs ?? 0, limit: plan.limits.architectureGraphs },
    { label: 'Impact Reports', icon: Zap, current: usage?.impact_reports ?? 0, limit: plan.limits.impactReports },
    { label: 'Database Reports', icon: Database, current: usage?.database_reports ?? 0, limit: plan.limits.databaseReports },
    { label: 'Exports', icon: FileText, current: usage?.exports ?? 0, limit: plan.limits.exports },
    { label: 'Compare Reports', icon: FileText, current: usage?.compare_reports ?? 0, limit: plan.limits.compareReports },
    { label: 'Storage (MB)', icon: Database, current: usage?.storage_used_mb ?? 0, limit: plan.limits.storageMb },
    { label: 'AI Tokens', icon: Sparkles, current: usage?.tokens_used ?? 0, limit: plan.tokens },
  ];

  const handleCancel = async () => {
    setCanceling(true);
    setCancelError(null);
    const result = await cancelSubscription();
    setCanceling(false);
    if (result.error) setCancelError(result.error);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Account</p>
        <h2 className="text-2xl font-bold text-white mt-1">Billing & Subscription</h2>
        <p className="text-sm text-neutral-500">Manage your plan, payment method, and usage</p>
      </div>

      {/* Current Plan Card */}
      <div className="border border-white/8 bg-white/3 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isTrial ? <Zap className="w-5 h-5 text-accent" /> : profile.plan === 'enterprise' ? <Building2 className="w-5 h-5 text-secondary-400" /> : <CheckCircle2 className="w-5 h-5 text-primary" />}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              {isTrial && <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">Trial</span>}
            </div>
            <div className="text-3xl font-extrabold text-white">
              {plan.price === null ? 'Custom' : plan.price === 0 ? 'Free' : `$${plan.price}`}
              {plan.price !== null && plan.price !== 0 && <span className="text-sm text-neutral-500 font-normal">/ {plan.period}</span>}
            </div>
          </div>
          {!isTrial && subscription && (
            <div className="text-right">
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Next Renewal</div>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5 justify-end">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          )}
          {isTrial && (
            <div className="text-right">
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Trial Ends</div>
              <div className="text-sm font-semibold text-accent">{trialDays} days left</div>
            </div>
          )}
        </div>

        {/* Payment Method */}
        {!isTrial && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded-md bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Visa **** 3344</div>
                <div className="text-xs text-neutral-500">Expires 12/2027</div>
              </div>
            </div>
            <button className="text-xs text-primary hover:text-primary-400 transition font-semibold cursor-pointer">Update</button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowUpgrade(true)}
            className="flex-1 py-2.5 rounded-xl bg-primary text-neutral-950 text-sm font-bold hover:bg-primary-400 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isTrial ? 'Upgrade Plan' : 'Change Plan'} <ArrowRight className="w-4 h-4" />
          </button>
          {!isTrial && (
            <button
              onClick={handleCancel}
              disabled={canceling}
              className="px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 text-sm font-semibold hover:bg-red-500/10 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {canceling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Cancel
            </button>
          )}
        </div>
        {cancelError && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" /> {cancelError}
          </div>
        )}
      </div>

      {/* Usage Section */}
      <div className="border border-white/8 bg-white/3 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Usage This Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {usageItems.map((item, i) => {
            const pct = item.limit === Infinity ? 0 : Math.min(100, (item.current / item.limit) * 100);
            const isUnlimited = item.limit === Infinity;
            const isHigh = !isUnlimited && pct >= 80;
            return (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-xs text-neutral-400">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-bold text-white">{item.current.toLocaleString()}</span>
                  <span className="text-xs text-neutral-500">
                    / {isUnlimited ? 'Unlimited' : item.limit.toLocaleString()}
                  </span>
                </div>
                {!isUnlimited ? (
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isHigh ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                  </div>
                ) : (
                  <div className="w-full h-1.5 rounded-full bg-primary/20" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      <div className="border border-white/8 bg-white/3 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Invoices</h3>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No invoices yet. Invoices appear here after your first payment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    payment.status === 'paid' ? 'bg-primary/10' : 'bg-red-500/10'
                  }`}>
                    <FileText className={`w-4 h-4 ${payment.status === 'paid' ? 'text-primary' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{payment.invoice_id}</div>
                    <div className="text-xs text-neutral-500">{new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${
                    payment.status === 'paid' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'
                  }`}>{payment.status}</span>
                  <span className="text-sm font-bold text-white">${(payment.amount_cents / 100).toFixed(2)}</span>
                  <button className="p-1.5 rounded-lg text-neutral-500 hover:text-primary hover:bg-white/5 transition cursor-pointer">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
