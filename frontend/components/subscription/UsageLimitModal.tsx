import { AlertTriangle, X, ArrowRight, Zap } from 'lucide-react';

interface UsageLimitModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  message?: string;
}

export default function UsageLimitModal({ open, onClose, onUpgrade, title, message }: UsageLimitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-neutral-900 border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition z-10 cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {title || 'Free Trial Limit Reached'}
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            {message || 'You have reached the maximum usage for your trial plan. Upgrade to continue without limits.'}
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-left font-sans">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-neutral-300">Unlimited repository analyses</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-left font-sans">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-neutral-300">100,000 AI tokens per month</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-left font-sans">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-neutral-300">PDF exports, impact & compare reports</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onUpgrade}
              className="flex-1 py-3 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              Upgrade <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl border border-white/10 text-neutral-400 font-semibold text-sm hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
