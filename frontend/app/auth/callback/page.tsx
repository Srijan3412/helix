// frontend/app/auth/callback/page.tsx

"use client";

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/subscription/supabase';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the session after OAuth or email confirmation
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Auth callback error:', error);
                    router.push('/auth?error=callback_failed');
                    return;
                }

                // Check if user has a session
                if (!data?.session) {
                    console.warn('No session found in auth callback');
                    router.push('/auth?error=no_session');
                    return;
                }

                // Get user from session
                const user = data.session.user;

                // Check if email is confirmed/verified
                // email_confirmed_at is null when email is not verified
                const emailConfirmed = user?.email_confirmed_at !== null;

                // Check if email_verified in profile (custom OTP verification)
                let emailVerified = false;
                let needsVerification = false;

                try {
                    // Fetch profile to check email_verified status
                    const { data: profile, error: profileError } = await supabase
                        .from('helix_profiles')
                        .select('email_verified')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (profileError) {
                        console.warn('Failed to fetch profile:', profileError);
                    }

                    emailVerified = profile?.email_verified === true;

                    // Needs verification if:
                    // 1. Email is not confirmed by Supabase, OR
                    // 2. email_verified is false in profile
                    needsVerification = !emailConfirmed || !emailVerified;

                } catch (profileErr) {
                    console.warn('Error fetching profile:', profileErr);
                    // Fallback: check Supabase confirmation only
                    needsVerification = !emailConfirmed;
                }

                // Also check if there's a verification token in the URL (for OTP flow)
                const urlParams = new URLSearchParams(window.location.search);
                const otpToken = urlParams.get('token');
                const userId = urlParams.get('userId');

                // If OTP token is present, redirect to OTP verification
                if (otpToken && userId) {
                    router.push(`/auth?mode=verify-otp&userId=${userId}&token=${otpToken}`);
                    return;
                }

                // Redirect based on verification status
                if (needsVerification) {
                    // Check if we have a user ID to pass
                    if (user?.id) {
                        router.push(`/auth?mode=verify-otp&userId=${user.id}&email=${encodeURIComponent(user.email || '')}`);
                    } else {
                        router.push('/auth?mode=verify-otp');
                    }
                } else {
                    // All verified - go to dashboard
                    router.push('/dashboard');
                }

            } catch (err) {
                console.error('Auth callback error:', err);
                router.push('/auth?error=callback_failed');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">
            <div className="flex items-center gap-3 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-mono">Verifying your email...</span>
            </div>
            <p className="text-xs text-zinc-600 mt-3">
                Please wait while we confirm your email address
            </p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                    <div className="flex items-center gap-3 text-zinc-500">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-mono">Loading...</span>
                    </div>
                </div>
            }
        >
            <AuthCallbackContent />
        </Suspense>
    );
}