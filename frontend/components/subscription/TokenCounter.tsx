import { Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { PLAN_CONFIG, TOKEN_COSTS } from '../../lib/subscription/subscription';

export default function TokenCounter() {
  const { profile, usage } = useSubscription();
  if (!profile) return null;

  const plan = PLAN_CONFIG[profile.plan];
  const used = usage?.tokens_used ?? 0;
  const total = plan.tokens;
  const isUnlimited = total === Infinity;
  const pct = isUnlimited ? 0 : Math.min(100, (used / total) * 100);
  const remaining = isUnlimited ? Infinity : Math.max(0, total - used);
  const isLow = !isUnlimited && pct >= 80;
  const isExhausted = !isUnlimited && remaining === 0;

  return (
    <div className={`rounded-xl p-3 border transition-all ${
      isExhausted
        ? 'bg-red-500/10 border-red-500/20'
        : isLow
        ? 'bg-amber-500/10 border-amber-500/20'
        : 'bg-white/5 border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isExhausted ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">AI Tokens</span>
        </div>
        <span className={`text-[10px] font-mono font-bold ${
          isExhausted ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-neutral-300'
        }`}>
          {isUnlimited ? `${used.toLocaleString()} used` : `${remaining.toLocaleString()} / ${total.toLocaleString()}`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
          <div className={`h-full rounded-full transition-all ${isExhausted ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
        </div>
      )}

      {isExhausted ? (
        <div className="text-[10px] text-red-500 font-semibold">
          AI credits exhausted. Upgrade to Professional.
        </div>
      ) : isLow ? (
        <div className="text-[10px] text-amber-500">
          Running low on tokens. Consider upgrading soon.
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[9px] text-neutral-600">
          <Zap className="w-2.5 h-2.5" />
          <span>Chat: {TOKEN_COSTS.ai_chat}t · Analysis: {TOKEN_COSTS.repository_analysis}t</span>
        </div>
      )}
    </div>
  );
}
