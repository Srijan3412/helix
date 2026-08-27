'use client';

import { useState, useEffect, useRef } from 'react';

interface OTPVerificationProps {
    userId: string;
    email: string;
    onVerify: (otp: string) => Promise<void>;
    onResend: () => Promise<boolean>;
    isVerifying?: boolean;
    error?: string | null;
    onBackToSignIn?: () => void;
}

export default function OTPVerification({
    userId,
    email,
    onVerify,
    onResend,
    isVerifying = false,
    error,
    onBackToSignIn,
}: OTPVerificationProps) {
    const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [resendError, setResendError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all fields are filled
        if (newOtp.every((digit) => digit !== '')) {
            handleSubmit(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setOtp(digits);
            // Auto-submit on paste
            handleSubmit(pastedData);
        }
    };

    const handleSubmit = async (otpCode: string) => {
        if (otpCode.length === 6) {
            await onVerify(otpCode);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || isResending) return;

        setIsResending(true);
        setResendError(null);

        try {
            const success = await onResend();
            if (success) {
                setCooldown(60);
                setOtp(Array(6).fill(''));
                inputRefs.current[0]?.focus();
            }
        } catch (err: any) {
            setResendError(err.message || 'Failed to resend OTP');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="mt-8 space-y-6">
            <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                    Enter the 6-digit verification code sent to <strong>{email}</strong>
                </p>

                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="h-14 w-12 rounded-md border border-gray-300 text-center text-2xl font-semibold focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isVerifying}
                            autoFocus={index === 0}
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-center text-sm text-red-600">{error}</p>
                )}

                {resendError && (
                    <p className="text-center text-sm text-red-600">{resendError}</p>
                )}

                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldown > 0 || isResending || isVerifying}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                    </button>

                    {onBackToSignIn && (
                        <button
                            type="button"
                            onClick={onBackToSignIn}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                            Back to sign in
                        </button>
                    )}
                </div>
            </div>

            {isVerifying && (
                <div className="flex justify-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
                </div>
            )}
        </div>
    );
}