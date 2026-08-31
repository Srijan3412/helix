// frontend/app/auth/reset-password/page.tsx

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Eye, EyeOff, Lock, ArrowLeft, Loader2, KeyRound, Mail } from "lucide-react";
import { supabase } from "../../../lib/subscription/supabase";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const emailParam = searchParams.get("email") || "";
    const tokenParam = searchParams.get("token") || "";

    const [manualToken, setManualToken] = useState(tokenParam);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (tokenParam) {
            setManualToken(tokenParam);
        }
    }, [tokenParam]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const tokenToUse = manualToken.trim();

        if (!tokenToUse) {
            setError("Please enter the 6-digit OTP verification code sent to your email.");
            return;
        }

        if (!password || password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            // 1. Try resetting password via backend API with the 6-digit OTP
            const apiRes = await fetch(`${backendUrl}/api/auth/reset-password`, {
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
            }

            // 2. Fallback: Supabase Auth updateUser if active session or hash recovery token
            const { error: supabaseError } = await supabase.auth.updateUser({ password });
            if (!supabaseError) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/auth?mode=signin");
                }, 2500);
                return;
            }

            throw new Error(apiData.error || supabaseError.message || "Failed to verify OTP code.");
        } catch (err: any) {
            setError(err.message || "Invalid or expired OTP code. Please check your email and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md"
                >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Password Reset Successful!</h3>
                    <p className="text-sm text-zinc-400 mt-2">
                        Your password has been updated. You can now sign in with your new password.
                    </p>
                    <p className="text-xs text-emerald-400/80 mt-2 font-medium">
                        Redirecting to sign in page...
                    </p>
                    <div className="mt-6 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2.5, ease: "linear" }}
                            className="h-full bg-primary rounded-full"
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10"
            >
                {/* Icon Header */}
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 text-primary">
                    <Lock className="w-7 h-7" />
                </div>

                <h3 className="text-2xl font-extrabold text-white text-center">Verify OTP &amp; Reset Password</h3>
                
                {emailParam ? (
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-3 rounded-full w-fit mx-auto">
                        <Mail className="w-3.5 h-3.5" />
                        <span>OTP sent to <strong>{emailParam}</strong></span>
                    </div>
                ) : (
                    <p className="text-sm text-zinc-400 text-center mt-2">
                        Enter the 6-digit OTP code sent to your email along with your new password.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {/* 6-Digit OTP Verification Code Input */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                            6-Digit OTP Verification Code
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                maxLength={6}
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                                placeholder="Enter 6-digit OTP (e.g. 123456)"
                                className="w-full pl-10 pr-4 py-3 bg-zinc-800/80 border border-zinc-700/60 focus:border-primary/50 rounded-xl text-white text-sm font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/20 transition"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                className="w-full px-4 py-3 bg-zinc-800/80 border border-zinc-700/60 focus:border-primary/50 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/20 transition"
                                required
                                minLength={8}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="w-full px-4 py-3 bg-zinc-800/80 border border-zinc-700/60 focus:border-primary/50 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/20 transition"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                                disabled={isLoading}
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>
                        )}
                        {confirmPassword && password === confirmPassword && (
                            <p className="text-[11px] text-emerald-400 mt-1">✅ Passwords match</p>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-800/40 rounded-xl"
                        >
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <p className="text-xs text-red-300">{error}</p>
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verifying OTP &amp; Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </button>

                    {/* Back to Sign In */}
                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => router.push("/auth?mode=signin")}
                            className="text-xs text-zinc-500 hover:text-primary transition flex items-center gap-1 mx-auto cursor-pointer"
                            disabled={isLoading}
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
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
                    <span className="text-sm font-mono">Loading password reset...</span>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}