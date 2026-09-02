// backend/src/modules/contact/contact.service.ts

import { supabase } from '../../core/supabase/index.js';
import { logger } from '../../core/logger/index.js';
import { emailService } from '../notification/email.service.js';

export interface ContactRequestInput {
    name: string;
    email: string;
    requestType: 'MORE_SCANS' | 'PROFESSIONAL' | 'ENTERPRISE' | 'TEAM' | 'GENERAL';
    company?: string;
    message?: string;
    userId?: string;
}

export interface ContactRequestUpdate {
    status: 'READ' | 'CONTACTED' | 'CLOSED';
}

export class ContactService {
    private static instance: ContactService;

    private constructor() { }

    static getInstance(): ContactService {
        if (!ContactService.instance) {
            ContactService.instance = new ContactService();
        }
        return ContactService.instance;
    }

    /**
     * Create a new contact request
     */
    async createRequest(data: ContactRequestInput): Promise<any> {
        try {
            // Validate input
            if (!data.name || !data.name.trim()) {
                throw new Error('Name is required');
            }
            if (!data.email || !data.email.trim()) {
                throw new Error('Email is required');
            }
            if (!data.requestType) {
                throw new Error('Request type is required');
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                throw new Error('Invalid email format');
            }

            // Check for duplicate requests (prevent spam)
            const { data: existing, error: checkError } = await supabase
                .from('contact_requests')
                .select('id, created_at')
                .eq('email', data.email)
                .eq('status', 'NEW')
                .order('created_at', { ascending: false })
                .limit(1);

            if (!checkError && existing && existing.length > 0) {
                const lastRequest = existing[0];
                const timeSince = Date.now() - new Date(lastRequest.created_at).getTime();
                const hoursSince = timeSince / (1000 * 60 * 60);

                if (hoursSince < 24) {
                    logger.warn(`Duplicate contact request from ${data.email} within 24 hours`);
                    // Still allow submission but log it
                }
            }

            // Insert into database
            const { data: request, error } = await supabase
                .from('contact_requests')
                .insert({
                    user_id: data.userId || null,
                    name: data.name.trim(),
                    email: data.email.trim().toLowerCase(),
                    request_type: data.requestType,
                    company: data.company ? data.company.trim() : null,
                    message: data.message ? data.message.trim() : null,
                    status: 'NEW',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                logger.error(error as any, 'Failed to create contact request:');
                throw new Error(`Database error: ${error.message}`);
            }

            logger.info(`✅ Contact request created: ${request.id} from ${data.email}`);

            // Send email notifications (fire and forget)
            this.sendNotifications(request).catch((emailError) => {
                logger.error(emailError as any, 'Failed to send email notifications:');
            });

            return request;
        } catch (error) {
            logger.error(error as any, 'Failed to create contact request:');
            throw error;
        }
    }

    /**
     * Send email notifications for a new request
     */
    private async sendNotifications(request: any): Promise<void> {
        try {
            // Send admin notification
            await emailService.sendAdminContactNotification({
                name: request.name,
                email: request.email,
                requestType: request.request_type,
                company: request.company,
                message: request.message,
                requestId: request.id,
            });

            // Send user confirmation
            await emailService.sendUserConfirmation({
                name: request.name,
                email: request.email,
                requestType: request.request_type,
            });

            logger.info(`✅ Email notifications sent for request ${request.id}`);
        } catch (error) {
            logger.error(error as any, 'Failed to send email notifications:');
            throw error;
        }
    }

    /**
     * Get all contact requests (admin only)
     */
    async getAllRequests(status?: string): Promise<any[]> {
        try {
            let query = supabase
                .from('contact_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (status && status !== 'ALL') {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) {
                logger.error(error as any, 'Failed to get contact requests:');
                throw new Error(`Database error: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            logger.error(error as any, 'Failed to get contact requests:');
            throw error;
        }
    }

    /**
     * Get contact requests for a specific user
     */
    async getUserRequests(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('contact_requests')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                logger.error(error as any, 'Failed to get user contact requests:');
                throw new Error(`Database error: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            logger.error(error as any, 'Failed to get user contact requests:');
            throw error;
        }
    }

    /**
     * Update request status (admin only)
     */
    async updateRequestStatus(
        requestId: string,
        status: 'READ' | 'CONTACTED' | 'CLOSED'
    ): Promise<any> {
        try {
            // Validate status
            const validStatuses = ['READ', 'CONTACTED', 'CLOSED'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}`);
            }

            // Check if request exists
            const { data: existing, error: checkError } = await supabase
                .from('contact_requests')
                .select('id, status')
                .eq('id', requestId)
                .single();

            if (checkError) {
                throw new Error('Request not found');
            }

            if (existing.status === status) {
                return existing; // Already in that status
            }

            // Update status
            const { data, error } = await supabase
                .from('contact_requests')
                .update({
                    status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', requestId)
                .select()
                .single();

            if (error) {
                logger.error(error as any, 'Failed to update request status:');
                throw new Error(`Database error: ${error.message}`);
            }

            logger.info(`✅ Contact request ${requestId} status updated to ${status}`);
            return data;
        } catch (error) {
            logger.error(error as any, 'Failed to update request status:');
            throw error;
        }
    }

    /**
     * Get request by ID
     */
    async getRequestById(requestId: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('contact_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new Error('Request not found');
                }
                logger.error(error as any, 'Failed to get contact request:');
                throw new Error(`Database error: ${error.message}`);
            }

            return data;
        } catch (error) {
            logger.error(error as any, 'Failed to get contact request:');
            throw error;
        }
    }

    /**
     * Get request statistics
     */
    async getRequestStats(): Promise<{
        total: number;
        new: number;
        read: number;
        contacted: number;
        closed: number;
    }> {
        try {
            const { data, error } = await supabase
                .from('contact_requests')
                .select('status');

            if (error) {
                logger.error(error as any, 'Failed to get request stats:');
                throw new Error(`Database error: ${error.message}`);
            }

            const stats = {
                total: data.length,
                new: data.filter((r: any) => r.status === 'NEW').length,
                read: data.filter((r: any) => r.status === 'READ').length,
                contacted: data.filter((r: any) => r.status === 'CONTACTED').length,
                closed: data.filter((r: any) => r.status === 'CLOSED').length,
            };

            return stats;
        } catch (error) {
            logger.error(error as any, 'Failed to get request stats:');
            throw error;
        }
    }

    /**
     * Delete a contact request (admin only)
     */
    async deleteRequest(requestId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('contact_requests')
                .delete()
                .eq('id', requestId);

            if (error) {
                logger.error(error as any, 'Failed to delete contact request:');
                throw new Error(`Database error: ${error.message}`);
            }

            logger.info(`✅ Contact request ${requestId} deleted`);
        } catch (error) {
            logger.error(error as any, 'Failed to delete contact request:');
            throw error;
        }
    }

    /**
     * Bulk update request status (admin only)
     */
    async bulkUpdateStatus(requestIds: string[], status: 'READ' | 'CONTACTED' | 'CLOSED'): Promise<number> {
        try {
            const validStatuses = ['READ', 'CONTACTED', 'CLOSED'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}`);
            }

            const { data, error } = await supabase
                .from('contact_requests')
                .update({
                    status,
                    updated_at: new Date().toISOString(),
                })
                .in('id', requestIds)
                .select();

            if (error) {
                logger.error(error as any, 'Failed to bulk update request status:');
                throw new Error(`Database error: ${error.message}`);
            }

            logger.info(`✅ ${data.length} contact requests status updated to ${status}`);
            return data.length;
        } catch (error) {
            logger.error(error as any, 'Failed to bulk update request status:');
            throw error;
        }
    }

    // ============================================================
    // ✅ NEW METHODS: Scan Granting on Request Approval
    // ============================================================

    /**
     * Approve a contact request and grant additional scans
     */
    async approveRequest(requestId: string, additionalScans: number = 10): Promise<any> {
        try {
            // Get the request first
            const request = await this.getRequestById(requestId);

            if (!request) {
                throw new Error('Request not found');
            }

            if (!request.user_id) {
                throw new Error('User not associated with this request');
            }

            // Update user's scan limit using raw SQL increment
            // First, get current profile
            const { data: currentProfile, error: fetchError } = await supabase
                .from('helix_profiles')
                .select('scan_limit')
                .eq('id', request.user_id)
                .single();

            if (fetchError) {
                logger.error({ error: fetchError, userId: request.user_id }, 'Failed to fetch current profile');
                throw new Error(`Failed to fetch profile: ${fetchError.message}`);
            }

            // Calculate new scan limit
            const currentLimit = currentProfile?.scan_limit ?? 0;
            const newLimit = currentLimit + additionalScans;

            // Update user's scan limit
            const { data: profile, error: profileError } = await supabase
                .from('helix_profiles')
                .update({
                    scan_limit: newLimit,
                    updated_at: new Date().toISOString()
                })
                .eq('id', request.user_id)
                .select()
                .single();

            if (profileError) {
                logger.error({ error: profileError, requestId, userId: request.user_id }, 'Failed to update scan limit');
                throw new Error(`Failed to update scan limit: ${profileError.message}`);
            }

            // Update request status to CONTACTED
            await this.updateRequestStatus(requestId, 'CONTACTED');

            logger.info({
                requestId,
                userId: request.user_id,
                additionalScans,
                newScanLimit: profile?.scan_limit
            }, '✅ Request approved and scans granted');

            return {
                success: true,
                userId: request.user_id,
                additionalScans,
                newScanLimit: profile?.scan_limit,
                request
            };
        } catch (error) {
            logger.error({ error, requestId }, 'Failed to approve request');
            throw error;
        }
    }

    /**
     * Reject a contact request
     */
    async rejectRequest(requestId: string, reason?: string): Promise<any> {
        try {
            // Get the request first
            const request = await this.getRequestById(requestId);

            if (!request) {
                throw new Error('Request not found');
            }

            // Update request status to CLOSED
            await this.updateRequestStatus(requestId, 'CLOSED');

            logger.info({
                requestId,
                userId: request.user_id,
                reason
            }, '❌ Request rejected and closed');

            return {
                success: true,
                requestId,
                status: 'CLOSED',
                reason
            };
        } catch (error) {
            logger.error({ error, requestId }, 'Failed to reject request');
            throw error;
        }
    }

    /**
     * Grant scans to a user without a contact request (admin override)
     */
    async grantScansDirectly(userId: string, additionalScans: number = 10, reason?: string): Promise<any> {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            if (additionalScans <= 0) {
                throw new Error('Additional scans must be greater than 0');
            }

            // Update user's scan limit using raw SQL increment
            const { data: profile, error: profileError } = await supabase
                .from('helix_profiles')
                .update({
                    scan_limit: supabase.raw('scan_limit + ?', [additionalScans]),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (profileError) {
                logger.error({ error: profileError, userId }, 'Failed to grant scans directly');
                throw new Error(`Failed to update scan limit: ${profileError.message}`);
            }

            logger.info({
                userId,
                additionalScans,
                newScanLimit: profile?.scan_limit,
                reason
            }, '✅ Scans granted directly by admin');

            return {
                success: true,
                userId,
                additionalScans,
                newScanLimit: profile?.scan_limit,
                reason
            };
        } catch (error) {
            logger.error({ error, userId }, 'Failed to grant scans directly');
            throw error;
        }
    }
}

// Export singleton instance
export const contactService = ContactService.getInstance();