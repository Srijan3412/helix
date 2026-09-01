'use client';

import { useState } from 'react';
import { supabase } from '../../lib/subscription/supabase';

interface SignupFormProps {
    onSubmit: (email: string, password: string) => Promise<void>;
    isSubmitting?: boolean;
    onSwitchToSignIn?: () => void;
    error?: string | null;
}

export default function SignupForm({
    onSubmit,
    isSubmitting = false,
    onSwitchToSignIn,
    error,
}: SignupFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters long');
            return;
        }

        if (email && password) {
            await onSubmit(email, password);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${siteUrl}/auth/callback`,
                    skipBrowserRedirect: true,
                },
            });

            if (!error && data?.url) {
                const width = 550;
                const height = 650;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;

                const popup = window.open(
                    data.url,
                    'GoogleAuthPopup',
                    `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
                );

                if (!popup) {
                    window.location.href = data.url;
                    return;
                }

                const timer = setTimeout(() => {
                    setGoogleLoading(false);
                }, 15000);

                const handleMessage = (event: MessageEvent) => {
                    if (event.data?.type === 'SUPABASE_AUTH_COMPLETE') {
                        clearTimeout(timer);
                        setGoogleLoading(false);
                        if (typeof window !== 'undefined') {
                            window.removeEventListener('message', handleMessage);
                        }
                    }
                };

                if (typeof window !== 'undefined') {
                    window.addEventListener('message', handleMessage);
                }
            } else {
                setGoogleLoading(false);
            }
        } catch (e) {
            setGoogleLoading(false);
        }
    };

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 rounded-md shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm"
                        placeholder="you@example.com"
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm"
                        placeholder="••••••••"
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm"
                        placeholder="••••••••"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {(localError || error) && (
                <p className="text-sm text-red-600">{localError || error}</p>
            )}

            <div className="space-y-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500 font-mono">Or continue with</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting || googleLoading}
                    className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>
            </div>
        </form>
    );
}
