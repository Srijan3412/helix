// frontend/app/admin/scans/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import {
    Search,
    Loader2,
    ArrowLeft,
    Database,
    Calendar,
    Clock,
    Eye,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    FileCode,
    GitBranch,
    Activity,
    BarChart3
} from 'lucide-react';

interface ScanSession {
    id: string;
    user_id: string;
    job_id: string;
    repo_name: string;
    repo_path: string;
    total_files: number;
    total_routes: number;
    health_score: number;
    status: string;
    scanned_at: string;
    deleted_at: string | null;
    profiles?: {
        email: string;
    };
}

type SortField = keyof ScanSession;

export default function AdminScansPage() {
    const router = useRouter();
    const { user, isAdmin, loading } = useAuth();
    const [scans, setScans] = useState<ScanSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('scanned_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [showDeleted, setShowDeleted] = useState(false);
    const [selectedScan, setSelectedScan] = useState<ScanSession | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
            return;
        }

        fetchScans();
    }, [loading, isAdmin, router]);

    const fetchScans = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/admin/scans?includeDeleted=${showDeleted}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch scans: ${response.status}`);
            }

            const data = await response.json();
            setScans(data.data || []);
        } catch (error) {
            console.error('Failed to fetch scans:', error);
            setError('Failed to load scans. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteScan = async (scanId: string) => {
        if (!confirm('Are you sure you want to delete this scan? This action can be undone.')) return;

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/admin/scans/${scanId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete scan');
            }

            await fetchScans();
        } catch (error) {
            console.error('Failed to delete scan:', error);
        }
    };

    const handleRestoreScan = async (scanId: string) => {
        if (!confirm('Are you sure you want to restore this scan?')) return;

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/admin/scans/${scanId}/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to restore scan');
            }

            await fetchScans();
        } catch (error) {
            console.error('Failed to restore scan:', error);
        }
    };

    const handlePermanentDelete = async (scanId: string) => {
        if (!confirm('⚠️ Are you sure you want to PERMANENTLY delete this scan? This action cannot be undone!')) return;

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/admin/scans/${scanId}/permanent`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to permanently delete scan');
            }

            await fetchScans();
        } catch (error) {
            console.error('Failed to permanently delete scan:', error);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc'
            ? '↑'
            : '↓';
    };

    const filteredScans = scans
        .filter(s =>
            s.repo_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.job_id?.toLowerCase().includes(search.toLowerCase()) ||
            s.profiles?.email?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];

            if (aVal === undefined || bVal === undefined) return 0;

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            return 0;
        });

    const getStatusBadge = (status: string, deleted: boolean | string | null) => {
        if (deleted) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    <XCircle className="w-3 h-3" />
                    Deleted
                </span>
            );
        }

        const config: Record<string, { color: string; icon: React.ReactNode }> = {
            completed: {
                color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                icon: <CheckCircle className="w-3 h-3" />
            },
            processing: {
                color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                icon: <Loader2 className="w-3 h-3 animate-spin" />
            },
            failed: {
                color: 'bg-red-500/10 text-red-400 border-red-500/20',
                icon: <XCircle className="w-3 h-3" />
            },
            queued: {
                color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                icon: <Clock className="w-3 h-3" />
            },
        };

        const configItem = config[status] || config.processing;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${configItem.color}`}>
                {configItem.icon}
                {status}
            </span>
        );
    };

    const getHealthColor = (score: number) => {
        if (score >= 70) return 'text-emerald-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-red-400';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex items-center gap-3 text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="dash-metadata">Loading scans...</span>
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
                <div className="max-w-md w-full text-center">
                    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h3 className="dash-card-title text-white mb-2">Failed to Load Scans</h3>
                        <p className="dash-body text-zinc-400">{error}</p>
                        <button
                            onClick={fetchScans}
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl dash-btn-sm transition flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin')}
                            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="dash-eyebrow text-emerald-400">ADMIN CONTROL</p>
                            <h1 className="dash-title text-white">All Scans</h1>
                            <p className="dash-subtitle text-zinc-500">View all repository scans across users</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchScans}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition dash-btn-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <label className="flex items-center gap-2 dash-body text-zinc-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showDeleted}
                                onChange={(e) => setShowDeleted(e.target.checked)}
                                className="rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary"
                            />
                            Show deleted
                        </label>
                        <div className="dash-metadata text-zinc-500 bg-zinc-800/40 px-3 py-2 rounded-lg">
                            {filteredScans.length} scan{filteredScans.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                        <div className="dash-metric text-white">{scans.length}</div>
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mt-1">Total Scans</div>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                        <div className="dash-metric text-emerald-400">
                            {scans.filter(s => s.status === 'completed' && !s.deleted_at).length}
                        </div>
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mt-1">Completed</div>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                        <div className="dash-metric text-amber-400">
                            {scans.filter(s => s.status !== 'completed' && !s.deleted_at).length}
                        </div>
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mt-1">Processing</div>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                        <div className="dash-metric text-red-400">
                            {scans.filter(s => s.deleted_at).length}
                        </div>
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mt-1">Deleted</div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by repository, job ID, or user email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 dash-body"
                    />
                </div>

                {/* Scan Cards */}
                <div className="space-y-3">
                    {filteredScans.map((scan) => (
                        <div
                            key={scan.id}
                            className={`p-4 bg-zinc-900/60 border rounded-xl transition ${scan.deleted_at
                                    ? 'border-red-800/30 opacity-60'
                                    : 'border-zinc-800/60 hover:border-zinc-700'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                        <Database className={`w-4 h-4 ${scan.deleted_at ? 'text-red-500' : 'text-primary'} flex-shrink-0`} />
                                        <span className="dash-card-title text-white truncate">{scan.repo_name || 'Unnamed Repository'}</span>
                                        {getStatusBadge(scan.status, scan.deleted_at)}
                                        {scan.deleted_at && (
                                            <span className="dash-metadata text-zinc-500">
                                                Deleted: {formatDate(scan.deleted_at)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 dash-metadata text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(scan.scanned_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileCode className="w-3 h-3" />
                                            {scan.total_files || 0} files
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <GitBranch className="w-3 h-3" />
                                            {scan.total_routes || 0} routes
                                        </span>
                                        <span className={`flex items-center gap-1 font-bold ${getHealthColor(scan.health_score || 0)}`}>
                                            <Activity className="w-3 h-3" />
                                            Health: {scan.health_score || 0}%
                                        </span>
                                        {scan.profiles?.email && (
                                            <span className="flex items-center gap-1 text-zinc-400">
                                                <BarChart3 className="w-3 h-3" />
                                                {scan.profiles.email}
                                            </span>
                                        )}
                                    </div>
                                    <div className="dash-metadata text-zinc-600 mt-1">
                                        Job: <span className="dash-filepath">{scan.job_id}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => router.push(`/scan/${scan.job_id}`)}
                                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
                                        title="View scan details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    {scan.deleted_at ? (
                                        <>
                                            <button
                                                onClick={() => handleRestoreScan(scan.id)}
                                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                                                title="Restore scan"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDelete(scan.id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                                                title="Permanently delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleDeleteScan(scan.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                                            title="Delete scan"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredScans.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No scans found</p>
                            {search && (
                                <p className="text-xs text-zinc-600 mt-1">Try adjusting your search</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}