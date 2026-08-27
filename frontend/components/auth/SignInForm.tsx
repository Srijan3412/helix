'use client';

import { useState } from 'react';

interface SignInFormProps {
    onSubmit: (email: string, password: string) => Promise<void>;
    isSubmitting?: boolean;
    onSwitchToSignUp?: () => void;
    error?: string | null;
}

export default function SignInForm({
    onSubmit,
    isSubmitting = false,
    onSwitchToSignUp,
    error,
}: SignInFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            await onSubmit(email, password);
        }
    };

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 rounded-md shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm"
                        placeholder="you@example.com"
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm"
                        placeholder="••••••••"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
            </div>
        </form>
    );
}
