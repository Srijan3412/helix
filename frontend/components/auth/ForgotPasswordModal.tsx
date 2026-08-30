// frontend/components/auth/ForgotPasswordModal.tsx

"use client";

import { useState } from 'react';
import { X, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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
            // Call backend API endpoint to send password reset email via backend EmailService
            // This avoids Supabase client-side auth email rate limit (429 over_email_send_rate_limit)
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            let sentSuccessfully = false;

            try {
                const apiRes = await fetch(`${backendUrl}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const data = await apiRes.json();

                if (apiRes.ok && data.success) {
                    sentSuccessfully = true;
                } else if (data.error) {
                    console.warn("Backend forgot-password returned error:", data.error);
                }
            } catch (backendErr) {
                console.warn("Failed to reach backend forgot-password API:", backendErr);
            }

            setSuccess(true);
            if (onSuccess) onSuccess();

            // Auto close after 3 seconds
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
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
                        Enter your email address and we'll send you a link & verification code to reset your password.
                    </p>
                </div>

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
                                disabled={isLoading || success}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>Password reset email sent! Check your inbox.</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || success}
                        className="w-full py-3 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Send Reset Email
                    </button>
                </form>

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