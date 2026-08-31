// frontend/components/auth/ForgotPasswordModal.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Loader2, AlertCircle } from 'lucide-react';

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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            const apiRes = await fetch(`${backendUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await apiRes.json();

            if (!apiRes.ok && data.error) {
                setError(data.error || 'Failed to send reset email. Please try again.');
                setIsLoading(false);
                return;
            }

            if (onSuccess) onSuccess();
            onClose();

            // ✅ Redirect directly to /auth/reset-password page with email pre-filled
            router.push(`/auth/reset-password?email=${encodeURIComponent(email.trim())}`);
        } catch (err: any) {
            // Fallback: Redirect to reset-password page regardless
            if (onSuccess) onSuccess();
            onClose();
            router.push(`/auth/reset-password?email=${encodeURIComponent(email.trim())}`);
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
                        Enter your email address to receive a 6-digit OTP verification code.
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
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending OTP...
                            </>
                        ) : (
                            'Send Verification Code (OTP)'
                        )}
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