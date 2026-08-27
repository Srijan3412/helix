// frontend/app/contact-sales/page.tsx

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Sparkles } from 'lucide-react';
import ContactForm from '../../components/ContactForm';
import { useAuth } from '../../hooks/useAuth';

export default function ContactSalesPage() {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            {/* Header */}
            <header className="border-b border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-white">Helix</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-2xl">
                    {/* Hero Section */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                            <Mail className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">Request Access</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                            Request More Repository Scans
                        </h1>
                        <p className="text-zinc-400 max-w-lg mx-auto">
                            Need more than 2 repository scans? Contact us directly and we'll get back to you within 24 hours.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 md:p-8">
                        <ContactForm
                            userEmail={user?.email || ''}
                            userName={user?.user_metadata?.full_name || ''}
                            redirectTo="/dashboard"
                        />
                    </div>

                    {/* Footer Info */}
                    <div className="text-center mt-8">
                        <p className="text-xs text-zinc-600">
                            By submitting this form, you agree to our{' '}
                            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}