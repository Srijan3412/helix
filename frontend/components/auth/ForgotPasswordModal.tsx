// frontend/components/auth/ForgotPasswordModal.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/subscription/supabase';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function ForgotPasswordModal({
    isOpen,
    onClose,
    onSuccess,
}: ForgotPasswordModalProps) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        setSuccess(false);

        try {
            const siteUrl = typeof window !== 'undefined'
                ? window.location.origin
                : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

            // ✅ Call Supabase Auth directly so Supabase sends the reset email
            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${siteUrl}/auth/reset-password`,
            });

            if (resetErr) {
                // If rate limited or invalid email, surface the error
                if (resetErr.status === 429 || resetErr.message?.includes('rate limit')) {
                    setError('Email send rate limit reached. Please wait a few minutes before requesting another email.');
                } else {
                    setError(resetErr.message || 'Failed to send reset email via Supabase.');
                }
                return;
            }

            setSuccess(true);
            if (onSuccess) onSuccess();

            // Auto-redirect after 4 seconds
            setTimeout(() => {
                router.push('/auth/reset-password');
            }, 4000);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToResetPage = () => {
        router.push('/auth/reset-password');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-md w-full relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-neutral-500 hover:text-white transition cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
                    <p className="text-sm text-neutral-500">
                        Enter your email address and Supabase will send you a password reset link.
                    </p>
                </div>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-800/80 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary/40 transition"
                                    placeholder="you@example.com"
                                    disabled={isLoading}
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
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoading ? 'Sending via Supabase...' : 'Send Password Reset Email'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-sm mb-1">Check your email!</p>
                                <p className="text-emerald-400/80">
                                    Supabase has sent a password reset email to <strong>{email}</strong>. Click the link in the email to set a new password.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleGoToResetPage}
                            className="w-full py-3 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Go to Reset Password Page
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        <p className="text-center text-xs text-neutral-600">
                            Redirecting automatically in 4 seconds...
                        </p>
                    </div>
                )}

                <div className="mt-4 text-center">
                    <button
                        onClick={onClose}
                        className="text-xs text-neutral-500 hover:text-primary transition cursor-pointer"
                    >
                        Back to sign in
                    </button>
                </div>
            </div>
        </div>
    );
}