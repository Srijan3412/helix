'use client';

import { useState, useEffect } from 'react';
import { useSubscription } from '../../lib/subscription/SubscriptionContext';
import { useRouter } from 'next/navigation';
import { validateEmail } from '../../lib/subscription/subscription';

// Import your existing sign-in form
// Import your new sign-up form and OTP verification components
import SignInForm from '../auth/SignInForm';
import SignupForm from '../auth/SignupForm';
import OTPVerification from '../auth/OTPVerification';

// Types for the auth modes
type AuthMode = 'signin' | 'signup' | 'verify-otp';

interface AuthPageProps {
    redirectTo?: string;
    className?: string;
}

export default function AuthPage({ redirectTo = '/dashboard', className = '' }: AuthPageProps) {
    const router = useRouter();
    const {
        session,
        profile,
        loading,
        signIn,
        signUp,
        verifyOtp,
        resendOtp,
        needsVerification,
        userStatus,
        canScan
    } = useSubscription();

    // ============================
    // 1. STATE
    // ============================
    const [mode, setMode] = useState<AuthMode>('signin');
    const [userId, setUserId] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);

    // ============================
    // 2. EFFECTS
    // ============================

    // Redirect if already authenticated and email is verified
    useEffect(() => {
        if (!loading && session && profile) {
            // If email is verified, redirect to dashboard
            if (profile.email_verified) {
                router.push(redirectTo);
            } else {
                // If not verified, switch to OTP verification
                setMode('verify-otp');
                if (session?.user?.id) {
                    setUserId(session.user.id);
                    setEmail(session.user.email || profile.email || '');
                }
            }
        }
    }, [session, profile, loading, redirectTo, router]);

    // Check if user needs verification after signup
    useEffect(() => {
        if (needsVerification && userId && email) {
            setMode('verify-otp');
        }
    }, [needsVerification, userId, email]);

    // ============================
    // 3. HANDLERS
    // ============================

    const handleSignIn = async (email: string, password: string) => {
        setAuthError(null);
        setIsSubmitting(true);

        try {
            // Validate email format
            const validation = validateEmail(email);
            if (!validation.valid) {
                setAuthError(validation.message || 'Invalid email address');
                setIsSubmitting(false);
                return;
            }

            const { error } = await signIn(email, password);

            if (error) {
                setAuthError(error);
                setIsSubmitting(false);
                return;
            }

            // Sign in successful - the useEffect will handle redirect
            setIsSubmitting(false);
        } catch (err: any) {
            setAuthError(err.message || 'Sign in failed');
            setIsSubmitting(false);
        }
    };

    const handleSignUp = async (email: string, password: string) => {
        setAuthError(null);
        setIsSubmitting(true);
        setSignupSuccess(false);

        try {
            // Validate email format
            const validation = validateEmail(email);
            if (!validation.valid) {
                setAuthError(validation.message || 'Invalid email address');
                setIsSubmitting(false);
                return;
            }

            // Validate password strength
            if (password.length < 6) {
                setAuthError('Password must be at least 6 characters long');
                setIsSubmitting(false);
                return;
            }

            const result = await signUp(email, password);

            if (result.error) {
                setAuthError(result.error);
                setIsSubmitting(false);
                return;
            }

            // Sign up successful - store userId and email for OTP
            if (result.userId) {
                setUserId(result.userId);
                setEmail(result.email || email);
                setMode('verify-otp');
                setSignupSuccess(true);
            } else {
                setAuthError('Signup failed: No user ID returned');
                setIsSubmitting(false);
            }
        } catch (err: any) {
            setAuthError(err.message || 'Sign up failed');
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async (otp: string) => {
        setAuthError(null);
        setIsSubmitting(true);

        try {
            const result = await verifyOtp(userId, otp);

            if (result.success) {
                // Verification successful - redirect to dashboard
                setMode('signin');
                // Let the useEffect handle redirect
                router.push(redirectTo);
            } else {
                setAuthError(result.error || 'Verification failed');
                setIsSubmitting(false);
            }
        } catch (err: any) {
            setAuthError(err.message || 'Verification failed');
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        setAuthError(null);

        try {
            const result = await resendOtp(userId);

            if (!result.success) {
                setAuthError(result.error || 'Failed to resend OTP');
                return false;
            }

            return true;
        } catch (err: any) {
            setAuthError(err.message || 'Failed to resend OTP');
            return false;
        }
    };

    const switchToSignIn = () => {
        setMode('signin');
        setAuthError(null);
        setSignupSuccess(false);
    };

    const switchToSignUp = () => {
        setMode('signup');
        setAuthError(null);
        setSignupSuccess(false);
    };

    const handleSignOut = async () => {
        // This will be handled by the subscription context
        // Just clear local state
        setUserId('');
        setEmail('');
        setMode('signin');
        setAuthError(null);
        setSignupSuccess(false);
    };

    // ============================
    // 4. RENDER
    // ============================

    // Show loading state
    if (loading) {
        return (
            <div className={`flex min-h-screen items-center justify-center ${className}`}>
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-4 text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // If already authenticated and verified, show nothing (will redirect)
    if (session && profile?.email_verified) {
        return null;
    }

    return (
        <div className={`flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 ${className}`}>
            <div className="w-full max-w-md space-y-8">
                {/* Logo / Header */}
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        {mode === 'signin' && 'Sign in to your account'}
                        {mode === 'signup' && 'Create your account'}
                        {mode === 'verify-otp' && 'Verify your email'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {mode === 'signin' && 'Welcome back! Please sign in to continue.'}
                        {mode === 'signup' && 'Get started with your free trial.'}
                        {mode === 'verify-otp' && `We sent a verification code to ${email}`}
                    </p>
                </div>

                {/* Auth Error Display */}
                {authError && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{authError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Signup Success Message */}
                {signupSuccess && (
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">
                                    Account created! Please check your email for the verification code.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Conditional Rendering of Auth Forms */}
                {mode === 'signin' && (
                    <SignInForm
                        onSubmit={handleSignIn}
                        isSubmitting={isSubmitting}
                        onSwitchToSignUp={switchToSignUp}
                        error={authError}
                    />
                )}

                {mode === 'signup' && (
                    <SignupForm
                        onSubmit={handleSignUp}
                        isSubmitting={isSubmitting}
                        onSwitchToSignIn={switchToSignIn}
                        error={authError}
                    />
                )}

                {mode === 'verify-otp' && (
                    <OTPVerification
                        userId={userId}
                        email={email}
                        onVerify={handleVerifyOtp}
                        onResend={handleResendOtp}
                        isVerifying={isSubmitting}
                        error={authError}
                        onBackToSignIn={switchToSignIn}
                    />
                )}

                {/* Footer */}
                <div className="text-center text-sm text-gray-500">
                    <p>
                        {mode === 'signin' && "Don't have an account? "}
                        {mode === 'signup' && "Already have an account? "}
                        {mode === 'verify-otp' && "Changed your mind? "}
                        {mode === 'signin' && (
                            <button
                                onClick={switchToSignUp}
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Sign up
                            </button>
                        )}
                        {mode === 'signup' && (
                            <button
                                onClick={switchToSignIn}
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Sign in
                            </button>
                        )}
                        {mode === 'verify-otp' && (
                            <button
                                onClick={switchToSignIn}
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Back to sign in
                            </button>
                        )}
                    </p>
                    {mode === 'verify-otp' && (
                        <p className="mt-2 text-xs text-gray-400">
                            Check your spam folder if you don't see the email within a few minutes.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}