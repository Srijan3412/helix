import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { supabase } from '../../lib/subscription/supabase';
import {
  Layers,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Terminal,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  MessageSquare,
  Calendar
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
  }, [session, profile, mode, router, initialMode]);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#063D48] relative overflow-hidden px-4 py-12 text-[#F7FAFA]">
      
      {/* ── Decorative Background Elements ────────────────────────────── */}
      
      {/* Top-Left Large Cropped Coral Circle */}
      <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full bg-[#D9334B] absolute -top-32 -left-24 sm:-top-36 sm:-left-28 pointer-events-none z-0 shadow-2xl opacity-95" />

      {/* Top-Left Cyan Dot Grid */}
      <div className="absolute top-36 left-8 sm:left-14 pointer-events-none z-0 grid grid-cols-4 gap-3.5 opacity-35">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#16C7A1]" />
        ))}
      </div>

      {/* Bottom-Left Large Dark Teal Circle with Cyan Border */}
      <div className="w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] rounded-full bg-[rgba(4,52,62,0.60)] border border-[#16C7A1]/30 absolute -bottom-40 -left-32 pointer-events-none z-0" />

      {/* Top-Right Dark Teal Circle with Pale Solid Circle */}
      <div className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full bg-[rgba(4,52,62,0.60)] border border-[#16C7A1]/20 absolute -top-28 -right-24 pointer-events-none z-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F5F5ED] absolute top-14 right-10 shadow-lg" />
      </div>

      {/* Bottom-Right Cyan Dot Grid */}
      <div className="absolute bottom-20 right-8 sm:right-16 pointer-events-none z-0 grid grid-cols-4 gap-3.5 opacity-35">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#16C7A1]" />
        ))}
      </div>

      {/* ── Main Centered Content ─────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[560px] sm:max-w-[580px] flex flex-col items-center">
        
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#16C7A1]/35 bg-[rgba(6,61,72,0.50)] backdrop-blur-md mb-6 shadow-xs">
          <Terminal className="w-3.5 h-3.5 text-[#16C7A1]" />
          <span className="text-[12px] sm:text-[13px] font-semibold tracking-[0.05em] text-[#9BE8E0] uppercase">
            Repository Intelligence
          </span>
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center mb-7 sm:mb-8">
          <h1 className="text-4xl sm:text-[56px] font-extrabold text-[#F7FAFA] tracking-tight leading-[1.05] mb-3">
            {mode === 'signin' ? (
              <>Welcome <span className="text-[#16C7A1]">back</span></>
            ) : mode === 'signup' ? (
              <>Start your <span className="text-[#16C7A1]">free trial</span></>
            ) : (
              <>Verify your <span className="text-[#16C7A1]">email</span></>
            )}
          </h1>
          <p className="text-base sm:text-[18px] text-[#C3D5D8] max-w-md mx-auto">
            {mode === 'signin'
              ? 'Sign in to access your dashboard'
              : mode === 'signup'
                ? '14 days free. No credit card required.'
                : 'Enter the 6-digit verification code sent to your email'}
          </p>
        </div>

        {/* ── Form Card ──────────────────────────────────────────────── */}
        <div className="w-full bg-[rgba(6,61,72,0.42)] border border-[rgba(22,199,161,0.45)] rounded-[18px] p-7 sm:p-10 backdrop-blur-xl shadow-2xl relative text-left">
          
          {successMessage && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FF3344]" />
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
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Email Field */}
                <div>
                  <label className="text-[12px] sm:text-[13px] font-semibold text-[#F7FAFA] uppercase tracking-[0.05em] mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C3D5D8]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-[54px] sm:h-[56px] pl-12 pr-4 bg-[rgba(8,76,88,0.45)] border border-[rgba(155,232,224,0.20)] rounded-[12px] text-[15px] sm:text-[16px] text-[#F7FAFA] placeholder:text-[#8EA9AE] focus:outline-none focus:border-[#16C7A1] focus:ring-1 focus:ring-[#16C7A1]/30 transition"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-[12px] sm:text-[13px] font-semibold text-[#F7FAFA] uppercase tracking-[0.05em] mb-2 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C3D5D8]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-[54px] sm:h-[56px] pl-12 pr-12 bg-[rgba(8,76,88,0.45)] border border-[rgba(155,232,224,0.20)] rounded-[12px] text-[15px] sm:text-[16px] text-[#F7FAFA] placeholder:text-[#8EA9AE] focus:outline-none focus:border-[#16C7A1] focus:ring-1 focus:ring-[#16C7A1]/30 transition"
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C3D5D8] hover:text-[#16C7A1] transition p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Primary Coral Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[56px] rounded-[12px] bg-[#FF3344] hover:bg-[#e02636] active:translate-y-[1px] text-white font-bold text-[16px] shadow-lg shadow-[#FF3344]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgba(155,232,224,0.20)]" />
                </div>
                <div className="relative flex justify-center text-[11px] sm:text-[12px] uppercase">
                  <span className="bg-[#074754] px-3.5 py-0.5 rounded text-[#9BE8E0]/80 font-mono tracking-[0.08em]">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full h-[54px] rounded-[12px] bg-[rgba(8,76,88,0.42)] hover:bg-[rgba(8,76,88,0.65)] border border-[rgba(155,232,224,0.20)] text-[#F7FAFA] text-[15px] sm:text-[16px] font-medium transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#9BE8E0]" />
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

              {/* Mode Switch & Forgot Password Links */}
              <div className="mt-6 text-center space-y-3">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[14px] sm:text-[15px] text-[#C3D5D8] hover:text-white transition cursor-pointer"
                  >
                    {mode === 'signin' ? (
                      <>
                        Don't have an account?{' '}
                        <span className="text-[#16C7A1] font-semibold hover:underline">Sign up</span>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <span className="text-[#16C7A1] font-semibold hover:underline">Sign in</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[13px] sm:text-[14px] text-[#8EA9AE] hover:text-[#16C7A1] transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Bottom Capability Row ──────────────────────────────────── */}
        <div className="mt-7 sm:mt-8 flex items-center justify-center gap-6 sm:gap-8 text-[14px] text-[#C3D5D8] relative z-10">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#16C7A1]" /> 3 repos free
          </span>
          <span className="text-[rgba(155,232,224,0.25)]">|</span>
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#16C7A1]" /> 20 AI chats
          </span>
          <span className="text-[rgba(155,232,224,0.25)]">|</span>
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#16C7A1]" /> 14 days
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