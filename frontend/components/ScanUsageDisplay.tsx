// frontend/components/ScanUsageDisplay.tsx

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ScanUsageDisplayProps {
    scansUsed: number;
    scanLimit: number;
    onStartScan?: () => void;
    isLoading?: boolean;
}

export default function ScanUsageDisplay({
    scansUsed,
    scanLimit,
    onStartScan,
    isLoading = false
}: ScanUsageDisplayProps) {
    const remaining = Math.max(0, scanLimit - scansUsed);
    const isAtLimit = remaining === 0;
    const percentage = Math.min(100, (scansUsed / scanLimit) * 100);

    // Generate dots for visual representation
    const renderDots = () => {
        const dots = [];
        for (let i = 0; i < scanLimit; i++) {
            const isUsed = i < scansUsed;
            dots.push(
                <div
                    key={i}
                    className={`w-6 h-6 rounded-full transition-all duration-300 ${isUsed
                        ? 'bg-primary shadow-lg shadow-primary/30 scale-100'
                        : 'bg-zinc-700/50 border border-zinc-600 scale-90'
                        }`}
                />
            );
        }
        return dots;
    };

    return (
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-zinc-800/60 rounded-2xl p-6 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Repository Scans</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isAtLimit
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                    {scansUsed} / {scanLimit} used
                </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${isAtLimit ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                />
            </div>

            {/* Dots */}
            <div className="flex items-center gap-2 mb-4">
                {renderDots()}
            </div>

            {/* Status & Action */}
            <div className="flex items-center justify-between">
                <div>
                    {isAtLimit ? (
                        <div className="flex items-center gap-2 text-amber-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">📌 Scan limit reached</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold">
                                {remaining} scan{remaining !== 1 ? 's' : ''} remaining
                            </span>
                        </div>
                    )}
                </div>

                {isAtLimit ? (
                    <button
                        onClick={() => window.location.href = '/contact-sales'}
                        className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition"
                    >
                        📧 Contact Us for More Access
                    </button>
                ) : (
                    <button
                        onClick={onStartScan}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-neutral-950 text-xs font-bold hover:shadow-lg hover:shadow-primary/30 transition disabled:opacity-50"
                    >
                        {isLoading ? 'Loading...' : 'Start Scan →'}
                    </button>
                )}
            </div>
        </div>
    );
}