// frontend/app/admin/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import {
    Users,
    Database,
    Mail,
    ArrowRight,
    Loader2,
    UserCheck,
    FileText,
    Clock,
    TrendingUp,
    Activity,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw
} from 'lucide-react';

interface DashboardStats {
    totalUsers: number;
    totalScans: number;
    newRequests: number;
    totalRequests: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    scansToday: number;
    requestsToday: number;
}

interface RecentActivity {
    id: string;
    type: 'user' | 'scan' | 'request';
    description: string;
    timestamp: string;
    status?: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isAdmin, loading } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalScans: 0,
        newRequests: 0,
        totalRequests: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        scansToday: 0,
        requestsToday: 0,
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Redirect if not admin
        if (!loading && !isAdmin) {
            router.push('/');
            return;
        }

        // Fetch dashboard data
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('access_token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                };

                // Fetch all data in parallel
                const [usersRes, scansRes, requestsRes] = await Promise.all([
                    fetch('/api/admin/users', { headers }),
                    fetch('/api/admin/scans?limit=100', { headers }),
                    fetch('/api/admin/contact-requests', { headers }),
                ]);

                // Handle responses
                let usersData = { data: [], count: 0 };
                let scansData = { data: [], count: 0 };
                let requestsData = { data: [], count: 0 };

                if (usersRes.ok) {
                    const result = await usersRes.json();
                    usersData = result;
                }

                if (scansRes.ok) {
                    const result = await scansRes.json();
                    scansData = result;
                }

                if (requestsRes.ok) {
                    const result = await requestsRes.json();
                    requestsData = result;
                }

                // Calculate stats
                const users = usersData.data || [];
                const scans = scansData.data || [];
                const requests = requestsData.data || [];

                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const verifiedUsers = users.filter((u: any) => u.email_verified === true).length;
                const unverifiedUsers = users.filter((u: any) => u.email_verified === false).length;

                const scansToday = scans.filter((s: any) => {
                    const scanDate = new Date(s.created_at);
                    return scanDate >= today;
                }).length;

                const requestsToday = requests.filter((r: any) => {
                    const requestDate = new Date(r.created_at);
                    return requestDate >= today;
                }).length;

                const newRequests = requests.filter((r: any) => r.status === 'NEW').length;

                setStats({
                    totalUsers: users.length,
                    totalScans: scans.length,
                    newRequests: newRequests,
                    totalRequests: requests.length,
                    verifiedUsers,
                    unverifiedUsers,
                    scansToday,
                    requestsToday,
                });

                // Generate recent activity
                const activities: RecentActivity[] = [];

                // Add recent requests
                requests.slice(0, 5).forEach((r: any) => {
                    activities.push({
                        id: r.id,
                        type: 'request',
                        description: `New request from ${r.name} (${r.request_type})`,
                        timestamp: r.created_at,
                        status: r.status,
                    });
                });

                // Add recent scans
                scans.slice(0, 3).forEach((s: any) => {
                    activities.push({
                        id: s.id,
                        type: 'scan',
                        description: `Scan completed: ${s.repository_name || s.job_id}`,
                        timestamp: s.created_at || s.completed_at,
                        status: s.status,
                    });
                });

                // Add recent users
                users.slice(0, 3).forEach((u: any) => {
                    activities.push({
                        id: u.id,
                        type: 'user',
                        description: `New user registered: ${u.email}`,
                        timestamp: u.created_at,
                    });
                });

                // Sort by timestamp (newest first)
                activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setRecentActivity(activities.slice(0, 10));

            } catch (error) {
                console.error('Failed to fetch admin dashboard data:', error);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAdmin && !loading) {
            fetchDashboardData();
        }
    }, [loading, isAdmin, router]);

    const handleRefresh = () => {
        window.location.reload();
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex items-center gap-3 text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-sm font-mono">Loading admin dashboard...</span>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
                <div className="max-w-md w-full text-center">
                    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Failed to Load Dashboard</h3>
                        <p className="text-sm text-zinc-400">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const cards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            href: '/admin/users',
            subtext: `${stats.verifiedUsers} verified · ${stats.unverifiedUsers} unverified`,
        },
        {
            title: 'Total Scans',
            value: stats.totalScans,
            icon: Database,
            color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            href: '/admin/scans',
            subtext: `${stats.scansToday} scans today`,
        },
        {
            title: 'New Requests',
            value: stats.newRequests,
            icon: Mail,
            color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            href: '/admin/requests',
            subtext: `${stats.requestsToday} requests today`,
        },
        {
            title: 'Total Requests',
            value: stats.totalRequests,
            icon: FileText,
            color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            href: '/admin/requests',
            subtext: 'All time',
        },
    ];

    const getStatusBadge = (status?: string) => {
        if (!status) return null;

        const config: Record<string, { color: string; icon: React.ReactNode }> = {
            NEW: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/20', icon: <Clock className="w-3 h-3" /> },
            READ: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/20', icon: <CheckCircle className="w-3 h-3" /> },
            CONTACTED: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> },
            CLOSED: { color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/20', icon: <XCircle className="w-3 h-3" /> },
        };

        const configItem = config[status] || config.NEW;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${configItem.color}`}>
                {configItem.icon}
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                <UserCheck className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                                <p className="text-sm text-zinc-500">Manage users, scans, and access requests</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {cards.map((card) => (
                        <button
                            key={card.title}
                            onClick={() => router.push(card.href)}
                            className="p-6 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl hover:border-zinc-700 transition group text-left"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-xl ${card.color}`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
                            </div>
                            <div className="text-3xl font-bold text-white">{card.value}</div>
                            <div className="text-sm text-zinc-500 mt-1">{card.title}</div>
                            {card.subtext && (
                                <div className="text-[10px] text-zinc-600 mt-1">{card.subtext}</div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl hover:border-primary/30 transition text-left group"
                            >
                                <Users className="w-5 h-5 text-primary mb-2" />
                                <div className="text-sm font-semibold text-white">Manage Users</div>
                                <div className="text-xs text-zinc-500">View and manage user profiles</div>
                            </button>
                            <button
                                onClick={() => router.push('/admin/requests')}
                                className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl hover:border-primary/30 transition text-left group"
                            >
                                <Mail className="w-5 h-5 text-amber-400 mb-2" />
                                <div className="text-sm font-semibold text-white">Review Requests</div>
                                <div className="text-xs text-zinc-500">Process access requests</div>
                            </button>
                            <button
                                onClick={() => router.push('/admin/scans')}
                                className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl hover:border-primary/30 transition text-left group"
                            >
                                <Database className="w-5 h-5 text-emerald-400 mb-2" />
                                <div className="text-sm font-semibold text-white">Scan History</div>
                                <div className="text-xs text-zinc-500">View all scans</div>
                            </button>
                            <button
                                onClick={() => router.push('/admin/settings')}
                                className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl hover:border-primary/30 transition text-left group"
                            >
                                <Activity className="w-5 h-5 text-purple-400 mb-2" />
                                <div className="text-sm font-semibold text-white">Settings</div>
                                <div className="text-xs text-zinc-500">System configuration</div>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Recent Activity</h2>
                            <Clock className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-zinc-500 text-center py-4">No recent activity</p>
                            ) : (
                                recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-3 p-3 bg-zinc-800/40 rounded-xl border border-zinc-800/40"
                                    >
                                        <div className="mt-0.5">
                                            {activity.type === 'user' && <Users className="w-4 h-4 text-blue-400" />}
                                            {activity.type === 'scan' && <Database className="w-4 h-4 text-emerald-400" />}
                                            {activity.type === 'request' && <Mail className="w-4 h-4 text-amber-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-zinc-300 truncate">{activity.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-zinc-500">
                                                    {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                                                    {new Date(activity.timestamp).toLocaleTimeString()}
                                                </span>
                                                {activity.status && getStatusBadge(activity.status)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-zinc-600 border-t border-zinc-800/60 pt-6 mt-6">
                    <p>Helix Admin Dashboard v2.0 • {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
}