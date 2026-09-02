// frontend/components/ContactForm.tsx

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle2, AlertCircle, Mail, Users, Building, Briefcase, HelpCircle } from 'lucide-react';
import { submitContactRequest } from '../lib/api/client';

interface ContactFormProps {
    userEmail?: string;
    userName?: string;
    onSuccess?: () => void;
    redirectTo?: string;
}

type RequestType = 'MORE_SCANS' | 'PROFESSIONAL' | 'ENTERPRISE' | 'TEAM' | 'GENERAL';

interface ContactFormData {
    name: string;
    email: string;
    company: string;
    requestType: RequestType;
    message: string;
}

export default function ContactForm({
    userEmail,
    userName,
    onSuccess,
    redirectTo = '/dashboard'
}: ContactFormProps) {
    const [formData, setFormData] = useState<ContactFormData>({
        name: userName || '',
        email: userEmail || '',
        company: '',
        requestType: 'MORE_SCANS',
        message: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const requestTypes = [
        {
            value: 'MORE_SCANS',
            label: 'Request More Scans',
            icon: <Mail className="w-4 h-4" />,
            description: 'Need additional repository scans'
        },
        {
            value: 'PROFESSIONAL',
            label: 'Professional Access',
            icon: <Briefcase className="w-4 h-4" />,
            description: 'Unlimited scans and advanced features'
        },
        {
            value: 'ENTERPRISE',
            label: 'Enterprise Access',
            icon: <Building className="w-4 h-4" />,
            description: 'Custom solutions for large teams'
        },
        {
            value: 'TEAM',
            label: 'Team Plan',
            icon: <Users className="w-4 h-4" />,
            description: 'Collaborative access for teams'
        },
        {
            value: 'GENERAL',
            label: 'General Inquiry',
            icon: <HelpCircle className="w-4 h-4" />,
            description: 'Other questions or feedback'
        },
    ];

    const getRequestTypeLabel = (value: string) => {
        const found = requestTypes.find(t => t.value === value);
        return found ? found.label : value;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.name.trim()) {
            setSubmitStatus('error');
            setErrorMessage('Please enter your name');
            return;
        }

        if (!formData.email.trim()) {
            setSubmitStatus('error');
            setErrorMessage('Please enter your email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setSubmitStatus('error');
            setErrorMessage('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            // ✅ USE API CLIENT WITH AUTHENTICATION
            const result = await submitContactRequest({
                name: formData.name,
                email: formData.email,
                requestType: formData.requestType,
                company: formData.company,
                message: formData.message,
            });

            if (result.success) {
                setSubmitStatus('success');

                // Reset form on success
                setFormData({
                    name: '',
                    email: '',
                    company: '',
                    requestType: 'MORE_SCANS',
                    message: '',
                });

                if (onSuccess) {
                    onSuccess();
                }

                // Auto redirect after success
                setTimeout(() => {
                    window.location.href = redirectTo;
                }, 3000);
            } else {
                throw new Error(result.error || result.message || 'Failed to submit request');
            }

        } catch (error) {
            setSubmitStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Contact Sales</h2>
                <p className="text-zinc-400 text-sm">
                    Fill out the form below and our team will get back to you within 24 hours.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition"
                        placeholder="John Doe"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition"
                        placeholder="you@example.com"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {/* Company */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Company / Organization
                    </label>
                    <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition"
                        placeholder="Acme Inc."
                        disabled={isSubmitting}
                    />
                </div>

                {/* Request Type */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                        Request Type <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {requestTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, requestType: type.value as RequestType })}
                                disabled={isSubmitting}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${formData.requestType === type.value
                                    ? 'bg-primary/20 border-primary/50 text-primary shadow-lg shadow-primary/10'
                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/50'
                                    }`}
                            >
                                <span className={`p-1.5 rounded-lg ${formData.requestType === type.value
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-zinc-800/50 text-zinc-500'
                                    }`}>
                                    {type.icon}
                                </span>
                                <div className="text-left">
                                    <div className="text-xs font-semibold">{type.label}</div>
                                    <div className="text-[10px] text-zinc-500">{type.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Message
                    </label>
                    <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition resize-none"
                        placeholder="Tell us about your needs, team size, expected scan volume, or any specific requirements..."
                        disabled={isSubmitting}
                    />
                    <p className="text-[10px] text-zinc-500 mt-1.5">
                        {formData.message.length} / 1000 characters
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-neutral-950 font-bold hover:shadow-lg hover:shadow-primary/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Send Request
                        </>
                    )}
                </button>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400"
                    >
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <span className="text-sm font-medium">Request sent successfully!</span>
                            <p className="text-xs text-emerald-400/70 mt-0.5">
                                We'll contact you soon. Redirecting to dashboard...
                            </p>
                        </div>
                    </motion.div>
                )}

                {submitStatus === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <span className="text-sm font-medium">Something went wrong</span>
                            <p className="text-xs text-red-400/70 mt-0.5">
                                {errorMessage || 'Failed to send request. Please try again.'}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Info note */}
                <p className="text-[10px] text-zinc-600 text-center">
                    By submitting this form, you agree to our privacy policy. We'll never share your information.
                </p>
            </form>
        </div>
    );
}