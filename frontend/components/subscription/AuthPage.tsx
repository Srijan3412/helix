import { useState, type FormEvent } from 'react';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { Layers, Mail, Lock, Loader2, AlertCircle, Terminal } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useSubscription();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Repository Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Start your free trial'}
          </h1>
          <p className="text-sm text-neutral-500">
            {mode === 'signin' ? 'Sign in to access your dashboard' : '14 days free. No credit card required.'}
          </p>
        </div>

        <div className="border border-white/8 bg-white/3 rounded-2xl p-8 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition"
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="text-xs text-neutral-500 hover:text-primary transition cursor-pointer"
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-neutral-600">
          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> 3 repos free</span>
          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> 20 AI chats</span>
          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> 14 days</span>
        </div>
      </div>
    </div>
  );
}
