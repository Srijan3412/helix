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
                // 1. Get the session after OAuth or email confirmation
                const { data, error } = await supabase.auth.getSession();

                if (error || !data?.session) {
                    console.error('Auth callback error or no session:', error);
                    router.push('/auth?mode=signin');
                    return;
                }

                const user = data.session.user;
                const isOAuthUser = user?.app_metadata?.provider === 'google' || user?.app_metadata?.providers?.includes('google') || !!user?.email_confirmed_at;

                // 2. Fetch or auto-create profile in helix_profiles table
                const { data: profile } = await supabase
                    .from('helix_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!profile) {
                    // Create new profile row in DB for Google user
                    const newProfile = {
                        id: user.id,
                        email: user.email || '',
                        role: 'visitor',
                        plan: 'trial',
                        trial_started_at: new Date().toISOString(),
                        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                        subscription_status: 'trialing',
                        email_verified: isOAuthUser,
                        scan_limit: 2,
                        scans_used: 0,
                    };
                    
                    await supabase.from('helix_profiles').insert(newProfile);

                    // Ensure usage records initialized
                    await supabase.from('helix_usage_records').insert({
                        user_id: user.id,
                        period_start: new Date().toISOString(),
                    });
                } else if (isOAuthUser && !profile.email_verified) {
                    // Mark as verified if signed in via Google OAuth
                    await supabase
                        .from('helix_profiles')
                        .update({ email_verified: true, email_verified_at: new Date().toISOString() })
                        .eq('id', user.id);
                }

                // 3. Check for manual OTP token in URL
                const urlParams = new URLSearchParams(window.location.search);
                const otpToken = urlParams.get('token');
                const userId = urlParams.get('userId');

                if (otpToken && userId) {
                    router.push(`/auth?mode=verify-otp&userId=${userId}&token=${otpToken}`);
                    return;
                }

                // 4. If Google OAuth user or email confirmed -> Redirect straight to dashboard
                if (isOAuthUser || profile?.email_verified) {
                    router.push('/');
                } else {
                    router.push(`/auth?mode=verify-otp&userId=${user.id}&email=${encodeURIComponent(user.email || '')}`);
                }

            } catch (err) {
                console.error('Auth callback exception:', err);
                router.push('/auth?mode=signin');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">
            <div className="flex items-center gap-3 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-mono">Completing sign in...</span>
            </div>
            <p className="text-xs text-zinc-600 mt-3">
                Setting up your account and saving your details...
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