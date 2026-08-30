// frontend/app/auth/reset-password/page.tsx

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Eye, EyeOff, Lock, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { supabase } from "../../../lib/subscription/supabase";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [manualToken, setManualToken] = useState("");
    const [resetToken, setResetToken] = useState<string | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [needsTokenInput, setNeedsTokenInput] = useState(false);

    // Validate token / session on load
    useEffect(() => {
        let mounted = true;

        const checkRecoveryState = async () => {
            try {
                // 1. Check for PKCE code in query
                const code = searchParams.get("code");
                if (code) {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (!error && data?.session) {
                        if (mounted) setIsValidToken(true);
                        return;
                    }
                }

                // 2. Check for token in query
                const queryToken = searchParams.get("token");
                if (queryToken) {
                    try {
                        const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(queryToken)}`);
                        const responseData = await response.json();
                        if (response.ok && responseData.valid) {
                            if (mounted) {
                                setResetToken(queryToken);
                                setIsValidToken(true);
                            }
                            return;
                        }
                    } catch (e) {
                        // Fallback to accepting query token directly
                        if (mounted) {
                            setResetToken(queryToken);
                            setIsValidToken(true);
                        }
                        return;
                    }
                }

                // 3. Check for active Supabase session (Implicit flow / Hash token processed by SDK)
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session) {
                    if (mounted) setIsValidToken(true);
                    return;
                }

                // 4. Check location hash for access_token or type=recovery
                if (typeof window !== "undefined" && window.location.hash) {
                    if (window.location.hash.includes("access_token") || window.location.hash.includes("type=recovery")) {
                        if (mounted) setIsValidToken(true);
                        return;
                    }
                }

                // 5. If no automatic token detected, prompt for 6-digit OTP code / token
                if (mounted) {
                    setNeedsTokenInput(true);
                    setIsValidToken(true);
                }
            } catch (err: any) {
                if (mounted) {
                    setNeedsTokenInput(true);
                    setIsValidToken(true);
                }
            }
        };

        // Listen for Supabase auth state change (e.g. PASSWORD_RECOVERY)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
                if (mounted) setIsValidToken(true);
            }
        });

        checkRecoveryState();

        return () => {
            mounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate password
        if (!password || password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const tokenToUse = resetToken || searchParams.get("token") || manualToken.trim();

        if (needsTokenInput && !tokenToUse) {
            setError("Please enter the 6-digit verification code or reset token from your email");
            return;
        }

        setIsLoading(true);

        try {
            // Option A: If custom token is available, use backend API
            if (tokenToUse) {
                const apiRes = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenToUse, password }),
                });

                const apiData = await apiRes.json();

                if (apiRes.ok && apiData.success) {
                    setSuccess(true);
                    setTimeout(() => {
                        router.push("/auth?mode=signin");
                    }, 2500);
                    return;
                } else if (!apiRes.ok && apiData.error) {
                    // Try Supabase auth fallback if backend reset returns error
                    const { error: supabaseError } = await supabase.auth.updateUser({ password });
                    if (!supabaseError) {
                        setSuccess(true);
                        setTimeout(() => {
                            router.push("/auth?mode=signin");
                        }, 2500);
                        return;
                    }
                    throw new Error(apiData.error || supabaseError.message);
                }
            }

            // Option B: Supabase Auth updateUser
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                throw new Error(updateError.message);
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/auth?mode=signin");
            }, 2500);

        } catch (err: any) {
            setError(err.message || "Failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isValidToken === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex items-center gap-3 text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-mono">Verifying reset link...</span>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-6 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Password Reset Successful!</h3>
                    <p className="text-sm text-zinc-400 mt-2">
                        Your password has been updated successfully.
                    </p>
                    <p className="text-xs text-emerald-400/70 mt-1">
                        Redirecting to sign in...
                    </p>
                    <div className="mt-4 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: "linear" }}
                            className="h-full bg-primary rounded-full"
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-6"
            >
                {/* Header */}
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 border border-primary/30 mx-auto mb-4">
                    <Lock className="w-7 h-7 text-primary" />
                </div>

                <h3 className="text-xl font-bold text-white text-center">Set New Password</h3>
                <p className="text-sm text-zinc-400 text-center mt-2">
                    Enter your new password below. It must be at least 8 characters long.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {/* Optional Verification Code / Token input if needed */}
                    {needsTokenInput && (
                        <div>
                            <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                                Verification Code / Token
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    value={manualToken}
                                    onChange={(e) => setManualToken(e.target.value)}
                                    placeholder="Enter 6-digit OTP code or reset token"
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 focus:border-primary/40 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/20 transition"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    )}

                    {/* New Password */}
                    <div>
                        <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className={`w-full px-4 py-2.5 bg-zinc-800/60 border ${error && error.includes("password")
                                        ? "border-red-500/40 focus:border-red-500/60"
                                        : "border-zinc-700/60 focus:border-primary/40"
                                    } rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/20 transition`}
                                required
                                minLength={8}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className={`h-1 flex-1 rounded-full ${password.length === 0 ? 'bg-zinc-800' :
                                    password.length >= 8 ? 'bg-emerald-500' :
                                        password.length >= 4 ? 'bg-amber-500' : 'bg-red-500'
                                }`} />
                            <p className="text-[10px] text-zinc-500">
                                {password.length === 0 ? '8+ characters required' :
                                    password.length >= 8 ? '✅ Strong' :
                                        password.length >= 4 ? `${password.length}/8` : 'Too short'}
                            </p>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className={`w-full px-4 py-2.5 bg-zinc-800/60 border ${confirmPassword && password !== confirmPassword
                                        ? 'border-red-500/40 focus:border-red-500/60'
                                        : confirmPassword && password === confirmPassword
                                            ? 'border-emerald-500/40 focus:border-emerald-500/60'
                                            : 'border-zinc-700/60 focus:border-primary/40'
                                    } rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/20 transition`}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                                disabled={isLoading}
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-[10px] text-red-400 mt-1">Passwords do not match</p>
                        )}
                        {confirmPassword && password === confirmPassword && (
                            <p className="text-[10px] text-emerald-400 mt-1">✅ Passwords match</p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-800/30 rounded-xl"
                        >
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <p className="text-xs text-red-400">{error}</p>
                        </motion.div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-black font-medium hover:shadow-lg hover:shadow-primary/30 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Resetting Password...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </button>

                    {/* Back to Sign In */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => router.push("/auth?mode=signin")}
                            className="text-xs text-zinc-500 hover:text-primary transition flex items-center gap-1 mx-auto cursor-pointer"
                            disabled={isLoading}
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Back to Sign In
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex items-center gap-3 text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-mono">Loading...</span>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}