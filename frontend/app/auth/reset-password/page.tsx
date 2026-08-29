// frontend/app/auth/reset-password/page.tsx

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Eye, EyeOff, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/subscription/supabase";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

    // Validate token on load
    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token");
            setIsValidToken(false);
            return;
        }

        // Verify token with Supabase
        const verifyToken = async () => {
            try {
                // Supabase automatically validates the token via the reset password flow
                // We just need to check if the token is valid by trying to get the session
                const { data, error } = await supabase.auth.getSession();

                // If we have a session with the token, it's valid
                // Otherwise, check if the token is valid via the API
                const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
                const responseData = await response.json();

                if (!response.ok) {
                    throw new Error(responseData.error || "Invalid or expired token");
                }

                setIsValidToken(true);
            } catch (err: any) {
                setError(err.message || "This reset link is invalid or has expired");
                setIsValidToken(false);
            }
        };

        verifyToken();
    }, [token]);

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

        setIsLoading(true);

        try {
            // Use Supabase to update password
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                throw new Error(error.message);
            }

            setSuccess(true);

            // Redirect to sign in after 2 seconds
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

    // Invalid token state
    if (isValidToken === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-6 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Invalid Reset Link</h3>
                    <p className="text-sm text-zinc-400 mt-2">
                        {error || "This password reset link is invalid or has expired."}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                        Please request a new password reset link.
                    </p>
                    <button
                        onClick={() => router.push("/auth?mode=signin")}
                        className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-black font-medium hover:bg-primary/90 transition flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </button>
                </motion.div>
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
                        Your password has been reset successfully.
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
                        className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-black font-medium hover:shadow-lg hover:shadow-primary/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
                            className="text-xs text-zinc-500 hover:text-primary transition flex items-center gap-1 mx-auto"
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