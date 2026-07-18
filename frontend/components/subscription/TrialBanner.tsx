import { Rocket, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { PLAN_CONFIG } from '../../lib/subscription/subscription';

interface TrialBannerProps {
  onUpgrade: () => void;
  onDismiss?: () => void;
}

export default function TrialBanner({ onUpgrade, onDismiss }: TrialBannerProps) {
  const { profile, usage, trialDaysLeft, isTrial } = useSubscription();

  if (!profile || !isTrial) return null;

  const config = PLAN_CONFIG.trial.limits;
  const repoUsage = usage?.repositories_analyzed ?? 0;
  const chatUsage = usage?.ai_chats ?? 0;
  const repoPct = Math.min(100, (repoUsage / config.repositories) * 100);
  const chatPct = Math.min(100, (chatUsage / config.aiChats) * 100);
  const isLow = trialDaysLeft <= 3 || repoPct >= 80 || chatPct >= 80;

  return (
    <div className={`relative px-6 py-3 border-b transition-all ${
      isLow
        ? 'bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 border-red-500/20'
        : 'bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20'
    }`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isLow ? 'bg-red-500/20' : 'bg-primary/20'
          }`}>
            {isLow ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Rocket className="w-4 h-4 text-primary" />}
          </div>
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className="shrink-0">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                {isLow ? 'Trial Ending Soon' : 'Free Trial'}
              </div>
              <div className="text-xs text-neutral-400">
                {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Repositories</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{repoUsage} / {config.repositories}</span>
                </div>
                <div className="w-28 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${repoPct >= 80 ? 'bg-red-400' : 'bg-primary'}`} style={{ width: `${repoPct}%` }} />
                </div>
              </div>
              <div className="shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider">AI Credits</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{chatUsage} / {config.aiChats}</span>
                </div>
                <div className="w-28 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${chatPct >= 80 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${chatPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onUpgrade}
            className="px-4 py-2 rounded-lg bg-primary text-neutral-950 text-xs font-bold hover:bg-primary-400 transition flex items-center gap-1.5 cursor-pointer"
          >
            Upgrade Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {onDismiss && (
            <button onClick={onDismiss} className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-white/5 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
