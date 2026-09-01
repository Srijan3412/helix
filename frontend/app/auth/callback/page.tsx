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
                // 1. Extract session from URL hash or getSession()
                let session: any = null;

                if (typeof window !== 'undefined' && window.location.hash) {
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');

                    if (accessToken) {
                        if (refreshToken && supabase.auth.setSession) {
                            try {
                                const { data: setSessionData } = await supabase.auth.setSession({
                                    access_token: accessToken,
                                    refresh_token: refreshToken,
                                });
                                if (setSessionData?.session) {
                                    session = setSessionData.session;
                                }
                            } catch (e) {
                                console.warn('setSession error, decoding JWT directly:', e);
                            }
                        }

                        // If session not set via supabase SDK, decode JWT directly
                        if (!session) {
                            try {
                                const payloadBase64 = accessToken.split('.')[1];
                                if (payloadBase64) {
                                    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
                                    if (payload && payload.sub) {
                                        session = {
                                            access_token: accessToken,
                                            user: {
                                                id: payload.sub,
                                                email: payload.email || payload.user_metadata?.email || '',
                                                app_metadata: payload.app_metadata || { provider: 'google' },
                                                user_metadata: payload.user_metadata || {},
                                                email_confirmed_at: payload.email_confirmed_at || new Date().toISOString(),
                                            }
                                        };
                                    }
                                }
                            } catch (jwtError) {
                                console.error('JWT decode error:', jwtError);
                            }
                        }
                    }
                }

                // 2. If session still not found, try getSession()
                if (!session) {
                    const { data } = await supabase.auth.getSession();
                    session = data?.session || null;
                }

                if (!session) {
                    console.error('Auth callback error or no session');
                    router.push('/auth?mode=signin');
                    return;
                }

                const user = session.user;
                const isOAuthUser = user?.app_metadata?.provider === 'google' || 
                                    user?.app_metadata?.providers?.includes('google') || 
                                    !!user?.email_confirmed_at ||
                                    !!user?.user_metadata?.email_verified;

                // 3. Fetch or auto-create profile in helix_profiles table
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

                // 4. Check for manual OTP token in URL
                const urlParams = new URLSearchParams(window.location.search);
                const otpToken = urlParams.get('token');
                const userId = urlParams.get('userId');

                if (otpToken && userId) {
                    router.push(`/auth?mode=verify-otp&userId=${userId}&token=${otpToken}`);
                    return;
                }

                // Check if running inside a Google OAuth Popup window
                if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
                    try {
                        window.opener.postMessage({ type: 'SUPABASE_AUTH_COMPLETE', session }, '*');
                        window.close();
                        return;
                    } catch (e) {
                        console.error('Error posting message to opener window:', e);
                    }
                }

                // 5. If Google OAuth user or email confirmed -> Redirect straight to dashboard
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