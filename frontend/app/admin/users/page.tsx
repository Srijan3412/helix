// frontend/app/admin/users/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import {
    Search,
    Loader2,
    ArrowLeft,
    User,
    Mail,
    Calendar,
    ChevronUp,
    ChevronDown,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    Edit,
    Save,
    Trash2
} from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    scan_limit: number;
    scans_used: number;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
}

type SortField = keyof UserProfile;

export default function AdminUsersPage() {
    const router = useRouter();
    const { user, isAdmin, loading } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [updatingLimit, setUpdatingLimit] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
            return;
        }

        fetchUsers();
    }, [loading, isAdmin, router]);

    

    const handleUpdateLimit = async (userId: string, newLimit: number) => {
        setUpdatingLimit(userId);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/admin/users/limit', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, scanLimit: newLimit }),
            });

            if (!response.ok) {
                throw new Error('Failed to update limit');
            }

            await fetchUsers();
        } catch (error) {
            console.error('Failed to update limit:', error);
        } finally {
            setUpdatingLimit(null);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        setUpdatingRole(userId);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/admin/users/role', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, role: newRole }),
            });

            if (!response.ok) {
                throw new Error('Failed to update role');
            }

            await fetchUsers();
        } catch (error) {
            console.error('Failed to update role:', error);
        } finally {
            setUpdatingRole(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            await fetchUsers();
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete user:', error);
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
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />;
    };

    const filteredUsers = users
        .filter(u => u.email.toLowerCase().includes(search.toLowerCase()))
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

            if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
                return sortDirection === 'asc'
                    ? (aVal === bVal ? 0 : aVal ? 1 : -1)
                    : (aVal === bVal ? 0 : aVal ? -1 : 1);
            }

            return 0;
        });

    const getRoleBadge = (role: string) => {
        const config: Record<string, { color: string; label: string }> = {
            ADMIN: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Admin' },
            org_admin: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Org Admin' },
            professional: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Professional' },
            trial: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Trial' },
            visitor: { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', label: 'Visitor' },
        };

        const configItem = config[role] || config.visitor;
        return (
            <span className={`px-2 py-1 rounded-full dash-badge uppercase border ${configItem.color}`}>
                {configItem.label}
            </span>
        );
    };

    const getUsageStatus = (scansUsed: number, scanLimit: number) => {
        if (scansUsed >= scanLimit) {
            return { color: 'bg-red-500', label: 'Limit Reached' };
        }
        if (scansUsed > scanLimit * 0.7) {
            return { color: 'bg-amber-500', label: 'Almost Full' };
        }
        return { color: 'bg-emerald-500', label: 'Available' };
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex items-center gap-3 text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="dash-metadata">Loading users...</span>
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
                        <h3 className="dash-card-title text-white mb-2">Failed to Load Users</h3>
                        <p className="dash-body text-zinc-400">{error}</p>
                        <button
                            onClick={fetchUsers}
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
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin')}
                            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="dash-eyebrow text-emerald-400">ADMIN CONTROL</p>
                            <h1 className="dash-title text-white">Users</h1>
                            <p className="dash-subtitle text-zinc-500">Manage user scan limits and roles</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchUsers}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition dash-btn-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <div className="dash-metadata text-zinc-500 bg-zinc-800/40 px-3 py-2 rounded-lg">
                            {users.length} user{users.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 dash-body"
                    />
                </div>

                {/* Table */}
                <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-800/40 border-b border-zinc-800">
                                <tr>
                                    <th
                                        className="px-4 py-3 text-left dash-metadata text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center gap-1">
                                            User
                                            {getSortIcon('email')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left dash-metadata text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
                                        onClick={() => handleSort('role')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Role
                                            {getSortIcon('role')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left dash-metadata text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
                                        onClick={() => handleSort('email_verified')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Verified
                                            {getSortIcon('email_verified')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left dash-metadata text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
                                        onClick={() => handleSort('scans_used')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Usage
                                            {getSortIcon('scans_used')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left dash-metadata text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
                                        onClick={() => handleSort('scan_limit')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Limit
                                            {getSortIcon('scan_limit')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left dash-metadata text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Joined
                                            {getSortIcon('created_at')}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-right dash-metadata text-zinc-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {filteredUsers.map((user) => {
                                    const usageStatus = getUsageStatus(user.scans_used, user.scan_limit);

                                    return (
                                        <tr key={user.id} className="hover:bg-white/5 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="dash-value text-white truncate max-w-[200px]">
                                                            {user.email}
                                                        </div>
                                                        <div className="dash-metadata text-zinc-500">
                                                            ID: {user.id.slice(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                    disabled={updatingRole === user.id}
                                                    className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-white dash-metadata focus:outline-none focus:border-primary/40 disabled:opacity-50"
                                                >
                                                    <option value="visitor">Visitor</option>
                                                    <option value="trial">Trial</option>
                                                    <option value="professional">Professional</option>
                                                    <option value="org_admin">Org Admin</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.email_verified ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-400" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden max-w-24">
                                                        <div
                                                             className={`h-full rounded-full ${usageStatus.color}`}
                                                             style={{ width: `${Math.min(100, (user.scans_used / Math.max(user.scan_limit, 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="dash-filepath text-zinc-400">
                                                        {user.scans_used}/{user.scan_limit}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={user.scan_limit}
                                                    onChange={(e) => handleUpdateLimit(user.id, parseInt(e.target.value))}
                                                    disabled={updatingLimit === user.id}
                                                    className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-white dash-metadata focus:outline-none focus:border-primary/40 disabled:opacity-50"
                                                >
                                                    {[2, 5, 10, 25, 50, 100, 500].map(limit => (
                                                        <option key={limit} value={limit}>{limit}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 dash-metadata text-zinc-400">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {updatingLimit === user.id || updatingRole === user.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowDeleteConfirm(user.id)}
                                                            className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No users found</p>
                            {search && (
                                <p className="text-xs text-zinc-600 mt-1">Try adjusting your search</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full">
                            <h3 className="text-lg font-bold text-white mb-2">Delete User</h3>
                            <p className="text-sm text-zinc-400 mb-6">
                                Are you sure you want to delete this user? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                                    className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}