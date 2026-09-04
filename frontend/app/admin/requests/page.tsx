// frontend/app/admin/requests/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import {
    Search,
    Loader2,
    ArrowLeft,
    Mail,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    AlertCircle,
    User,
    Building,
    MessageSquare,
    Calendar,
    Filter,
    Eye,
    Check,
    Phone,
    Archive
} from 'lucide-react';

interface ContactRequest {
    id: string;
    name: string;
    email: string;
    request_type: string;
    company: string | null;
    message: string | null;
    status: 'NEW' | 'READ' | 'CONTACTED' | 'CLOSED';
    created_at: string;
    updated_at: string;
}

type StatusType = 'NEW' | 'READ' | 'CONTACTED' | 'CLOSED';

const statusConfig: Record<StatusType, { label: string; color: string; icon: React.ReactNode; order: number }> = {
    NEW: {
        label: 'New',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: <Clock className="w-3 h-3" />,
        order: 1
    },
    READ: {
        label: 'Read',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: <Eye className="w-3 h-3" />,
        order: 2
    },
    CONTACTED: {
        label: 'Contacted',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: <Phone className="w-3 h-3" />,
        order: 3
    },
    CLOSED: {
        label: 'Closed',
        color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        icon: <Archive className="w-3 h-3" />,
        order: 4
    },
};

const requestTypeLabels: Record<string, string> = {
    MORE_SCANS: 'More Scans',
    PROFESSIONAL: 'Professional',
    ENTERPRISE: 'Enterprise',
    TEAM: 'Team Plan',
    GENERAL: 'General Inquiry',
};

export default function AdminRequestsPage() {
    const router = useRouter();
    const { user, isAdmin, loading } = useAuth();
    const [requests, setRequests] = useState<ContactRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
            return;
        }

        fetchRequests();
    }, [loading, isAdmin, router, statusFilter]);

    const fetchRequests = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            const url = statusFilter
                ? `/api/admin/contact-requests?status=${statusFilter}`
                : '/api/admin/contact-requests';

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch requests: ${response.status}`);
            }

            const data = await response.json();
            setRequests(data.data || []);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            setError('Failed to load requests. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'READ' | 'CONTACTED' | 'CLOSED') => {
        setUpdatingId(id);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/admin/contact-requests/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            await fetchRequests();

            // Update selected request if it's the one being viewed
            if (selectedRequest?.id === id) {
                const updated = requests.find(r => r.id === id);
                if (updated) setSelectedRequest(updated);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleViewRequest = (request: ContactRequest) => {
        setSelectedRequest(request);
        setShowDetailModal(true);

        // Auto-mark as READ if it's NEW
        if (request.status === 'NEW') {
            handleUpdateStatus(request.id, 'READ');
        }
    };

    const getStatusBadge = (status: StatusType) => {
        const config = statusConfig[status];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full dash-badge border ${config.color}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    const getRequestTypeBadge = (type: string) => {
        const colorMap: Record<string, string> = {
            MORE_SCANS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            PROFESSIONAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            ENTERPRISE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            TEAM: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            GENERAL: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        };

        return (
            <span className={`px-2 py-0.5 rounded-full dash-badge border ${colorMap[type] || colorMap.GENERAL}`}>
                {requestTypeLabels[type] || type}
            </span>
        );
    };

    const filteredRequests = requests
        .filter(r =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.email.toLowerCase().includes(search.toLowerCase()) ||
            r.request_type.toLowerCase().includes(search.toLowerCase()) ||
            (r.company && r.company.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            // Sort by status order (NEW first, then READ, etc.)
            const orderA = statusConfig[a.status as StatusType]?.order || 999;
            const orderB = statusConfig[b.status as StatusType]?.order || 999;
            if (orderA !== orderB) return orderA - orderB;

            // Then by date (newest first)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    const stats = {
        total: requests.length,
        new: requests.filter(r => r.status === 'NEW').length,
        read: requests.filter(r => r.status === 'READ').length,
        contacted: requests.filter(r => r.status === 'CONTACTED').length,
        closed: requests.filter(r => r.status === 'CLOSED').length,
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex items-center gap-3 text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="dash-metadata">Loading requests...</span>
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
                        <h3 className="dash-card-title text-white mb-2">Failed to Load Requests</h3>
                        <p className="dash-body text-zinc-400">{error}</p>
                        <button
                            onClick={fetchRequests}
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
                            <h1 className="dash-title text-white">Access Requests</h1>
                            <p className="dash-subtitle text-zinc-500">Review and process user access requests</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchRequests}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition dash-btn-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <div className="dash-metadata text-zinc-500 bg-zinc-800/40 px-3 py-2 rounded-lg">
                            {stats.new} new
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                        <div className="dash-metric text-white">{stats.total}</div>
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mt-1">Total</div>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                        <div className="dash-metric text-amber-400">{stats.new}</div>
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mt-1">New</div>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                        <div className="dash-metric text-blue-400">{stats.read}</div>
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mt-1">Read</div>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                        <div className="dash-metric text-emerald-400">{stats.contacted}</div>
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mt-1">Contacted</div>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                        <div className="dash-metric text-zinc-400">{stats.closed}</div>
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mt-1">Closed</div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by name, email, company..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
                    >
                        <option value="">All Status</option>
                        <option value="NEW">🟡 New</option>
                        <option value="READ">🔵 Read</option>
                        <option value="CONTACTED">🟢 Contacted</option>
                        <option value="CLOSED">⚪ Closed</option>
                    </select>
                </div>

                {/* Requests List */}
                <div className="space-y-3">
                    {filteredRequests.map((request) => (
                        <div
                            key={request.id}
                            className={`p-4 bg-zinc-900/60 border rounded-xl transition cursor-pointer hover:border-zinc-700 ${request.status === 'NEW'
                                    ? 'border-amber-500/30'
                                    : 'border-zinc-800/60'
                                }`}
                            onClick={() => handleViewRequest(request)}
                        >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                        <span className="dash-card-title text-white">{request.name}</span>
                                        <a
                                            href={`mailto:${request.email}`}
                                            className="dash-body text-primary hover:underline truncate"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {request.email}
                                        </a>
                                        {getStatusBadge(request.status as StatusType)}
                                        {getRequestTypeBadge(request.request_type)}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 dash-metadata text-zinc-500">
                                        {request.company && (
                                            <span className="flex items-center gap-1">
                                                <Building className="w-3 h-3" />
                                                {request.company}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </span>
                                        {request.message && (
                                            <span className="flex items-center gap-1 text-zinc-400 truncate max-w-[200px]">
                                                <MessageSquare className="w-3 h-3" />
                                                {request.message.slice(0, 60)}{request.message.length > 60 ? '...' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {request.status === 'NEW' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateStatus(request.id, 'READ');
                                            }}
                                            disabled={updatingId === request.id}
                                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition dash-btn-sm disabled:opacity-50"
                                        >
                                            {updatingId === request.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                'Mark Read'
                                            )}
                                        </button>
                                    )}
                                    {(request.status === 'NEW' || request.status === 'READ') && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateStatus(request.id, 'CONTACTED');
                                            }}
                                            disabled={updatingId === request.id}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition dash-btn-sm disabled:opacity-50"
                                        >
                                            {updatingId === request.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                'Contacted'
                                            )}
                                        </button>
                                    )}
                                    {request.status !== 'CLOSED' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateStatus(request.id, 'CLOSED');
                                            }}
                                            disabled={updatingId === request.id}
                                            className="px-3 py-1.5 rounded-lg bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 transition dash-btn-sm disabled:opacity-50"
                                        >
                                            {updatingId === request.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                'Close'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredRequests.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="dash-body">No requests found</p>
                            {search && (
                                <p className="dash-metadata text-zinc-600 mt-1">Try adjusting your search</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="dash-card-title text-white">Request Details</h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="dash-metadata text-zinc-500">Name</label>
                                    <div className="text-white dash-body font-medium">{selectedRequest.name}</div>
                                </div>
                                <div>
                                    <label className="dash-metadata text-zinc-500">Email</label>
                                    <a href={`mailto:${selectedRequest.email}`} className="text-primary dash-body hover:underline block">
                                        {selectedRequest.email}
                                    </a>
                                </div>
                                {selectedRequest.company && (
                                    <div>
                                        <label className="dash-metadata text-zinc-500">Company</label>
                                        <div className="text-white dash-body">{selectedRequest.company}</div>
                                    </div>
                                )}
                                <div>
                                    <label className="dash-metadata text-zinc-500">Request Type</label>
                                    <div>{getRequestTypeBadge(selectedRequest.request_type)}</div>
                                </div>
                                <div>
                                    <label className="dash-metadata text-zinc-500">Status</label>
                                    <div>{getStatusBadge(selectedRequest.status as StatusType)}</div>
                                </div>
                                <div>
                                    <label className="dash-metadata text-zinc-500">Submitted</label>
                                    <div className="dash-metadata text-zinc-400">
                                        {new Date(selectedRequest.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {selectedRequest.message && (
                                <div>
                                    <label className="dash-metadata text-zinc-500">Message</label>
                                    <div className="mt-1 p-4 bg-zinc-800/60 rounded-xl text-zinc-300 dash-body whitespace-pre-wrap">
                                        {selectedRequest.message}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800">
                                {selectedRequest.status === 'NEW' && (
                                    <button
                                        onClick={() => {
                                            handleUpdateStatus(selectedRequest.id, 'READ');
                                            setSelectedRequest({ ...selectedRequest, status: 'READ' });
                                        }}
                                        className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition dash-btn-sm"
                                    >
                                        <Eye className="w-4 h-4 inline mr-1" />
                                        Mark Read
                                    </button>
                                )}
                                {(selectedRequest.status === 'NEW' || selectedRequest.status === 'READ') && (
                                    <button
                                        onClick={() => {
                                            handleUpdateStatus(selectedRequest.id, 'CONTACTED');
                                            setSelectedRequest({ ...selectedRequest, status: 'CONTACTED' });
                                        }}
                                        className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition dash-btn-sm"
                                    >
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        Mark Contacted
                                    </button>
                                )}
                                {selectedRequest.status !== 'CLOSED' && (
                                    <button
                                        onClick={() => {
                                            handleUpdateStatus(selectedRequest.id, 'CLOSED');
                                            setSelectedRequest({ ...selectedRequest, status: 'CLOSED' });
                                        }}
                                        className="px-4 py-2 rounded-lg bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 transition dash-btn-sm"
                                    >
                                        <Archive className="w-4 h-4 inline mr-1" />
                                        Close Request
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}