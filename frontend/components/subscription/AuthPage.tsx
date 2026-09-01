import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { supabase } from '../../lib/subscription/supabase';
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
  const { session, profile, signIn, signUp, verifyOtp, resendOtp } = useSubscription();

  const [mode, setMode] = useState<'signin' | 'signup' | 'verify-otp'>(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [unverifiedUserId, setUnverifiedUserId] = useState(initialUserId);
  const [otpToken, setOtpToken] = useState(initialToken);

  const [error, setError] = useState<string | null>(initialError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    // Only redirect authenticated user to dashboard if email is verified and not in OTP verification mode
    if (session?.user && profile?.email_verified && mode !== 'verify-otp' && initialMode !== 'verify-otp') {
      router.push('/');
      return;
    }
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      router.push(`/auth/callback${window.location.hash}`);
      return;
    }

    if (initialMode) setMode(initialMode);
    if (initialEmail) setEmail(initialEmail);
    if (initialUserId) setUnverifiedUserId(initialUserId);
    if (initialToken) setOtpToken(initialToken);
    if (initialError) setError(initialError);
  }, [session, profile, mode, router, initialMode, initialEmail, initialUserId, initialToken, initialError]);

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

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setGoogleLoading(false);
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
      setSuccessMessage('Email verified successfully! Redirecting to sign in...');
      setTimeout(() => {
        setMode('signin');
        setSuccessMessage('Email verified! Please sign in with your password. (2 free trial scans activated)');
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

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-neutral-900/90 px-3 text-neutral-500 font-mono tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

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