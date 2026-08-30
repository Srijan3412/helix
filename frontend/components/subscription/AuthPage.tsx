import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { Layers, Mail, Lock, Loader2, AlertCircle, Terminal, CheckCircle2 } from 'lucide-react';
import ForgotPasswordModal from '../auth/ForgotPasswordModal';
import OTPVerification from '../auth/OTPVerification';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup' | 'verify-otp';
  initialEmail?: string;
  initialUserId?: string;
  initialToken?: string;
  initialError?: string;
}

export default function AuthPage({
  initialMode = 'signup',
  initialEmail = '',
  initialUserId = '',
  initialToken = '',
  initialError = '',
}: AuthPageProps) {
  const router = useRouter();
  const { signIn, signUp, verifyOtp, resendOtp } = useSubscription();

  const [mode, setMode] = useState<'signin' | 'signup' | 'verify-otp'>(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [unverifiedUserId, setUnverifiedUserId] = useState(initialUserId);
  const [otpToken, setOtpToken] = useState(initialToken);  // ✅ ADDED

  const [error, setError] = useState<string | null>(initialError || null);  // ✅ MODIFIED
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
    if (initialEmail) setEmail(initialEmail);
    if (initialUserId) setUnverifiedUserId(initialUserId);
    if (initialToken) setOtpToken(initialToken);  // ✅ ADDED
    if (initialError) setError(initialError);     // ✅ ADDED
  }, [initialMode, initialEmail, initialUserId, initialToken, initialError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (mode === 'signin') {
      const result = await signIn(email, password);
      setLoading(false);

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/');
      }
    } else if (mode === 'signup') {
      const result = await signUp(email, password);
      setLoading(false);

      if (result.error) {
        setError(result.error);
      } else if (result.needsVerification && result.userId) {
        setUnverifiedUserId(result.userId);
        setMode('verify-otp');
        setSuccessMessage('Account created! A 6-digit verification code has been sent to your email.');
      } else {
        router.push('/');
      }
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    if (!unverifiedUserId) {
      setError('User ID is missing. Please try signing up again.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setOtpLoading(true);

    const result = await verifyOtp(unverifiedUserId, otpCode);
    setOtpLoading(false);

    if (result.success) {
      setSuccessMessage('Email verified successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else {
      setError(result.error || 'Invalid verification code. Please try again.');
    }
  };

  const handleResendOtp = async (): Promise<boolean> => {
    if (!unverifiedUserId) {
      setError('User ID missing. Please sign up again.');
      return false;
    }

    setError(null);
    const result = await resendOtp(unverifiedUserId);

    if (result.success) {
      setSuccessMessage('A fresh 6-digit verification code has been sent to your email.');
      return true;
    } else {
      setError(result.error || 'Failed to resend verification code.');
      return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              Repository Intelligence
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            {mode === 'signin'
              ? 'Welcome back'
              : mode === 'signup'
                ? 'Start your free trial'
                : 'Verify your email'}
          </h1>
          <p className="text-sm text-neutral-500">
            {mode === 'signin'
              ? 'Sign in to access your dashboard'
              : mode === 'signup'
                ? '14 days free. No credit card required.'
                : 'Enter the 6-digit verification code sent to your email'}
          </p>
        </div>

        <div className="border border-white/8 bg-white/3 rounded-2xl p-8 backdrop-blur-md">
          {successMessage && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'verify-otp' ? (
            <OTPVerification
              userId={unverifiedUserId}
              email={email}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              isVerifying={otpLoading}
              error={null}
              onBackToSignIn={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
            />
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                    Email
                  </label>
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
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                    Password
                  </label>
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
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-neutral-500 hover:text-primary transition cursor-pointer"
                >
                  {mode === 'signin'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-zinc-500 hover:text-primary transition cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-neutral-600">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> 3 repos free
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> 20 AI chats
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> 14 days
          </span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          setSuccessMessage('Password reset link sent to your email.');
        }}
      />
    </div>
  );
}