// backend/src/routes/contact.routes.ts

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { contactService } from '../modules/contact/contact.service.js';
import { requireAuth } from '../core/auth/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { logger } from '../core/logger/index.js';

// Schema validations
const ContactRequestSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    requestType: z.enum(['MORE_SCANS', 'SUBSCRIPTION', 'PROFESSIONAL', 'ENTERPRISE', 'TEAM', 'GENERAL']),
    company: z.string().optional(),
    message: z.string().optional(),
});

const UpdateStatusSchema = z.object({
    status: z.enum(['READ', 'CONTACTED', 'CLOSED']),
});

const BulkUpdateSchema = z.object({
    requestIds: z.array(z.string().uuid()),
    status: z.enum(['READ', 'CONTACTED', 'CLOSED']),
});

export const contactRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    /**
     * POST /api/contact
     * Submit a contact request (public)
     */
    fastify.post('/api/contact', async (request, reply) => {
        try {
            const validation = ContactRequestSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.code(400).send({
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.format(),
                });
            }

            const data = validation.data;

            // Get user ID if authenticated
            const user = (request as any).user;
            const userId = user?.id;

            const result = await contactService.createRequest({
                ...data,
                userId,
            });

            return reply.code(201).send({
                success: true,
                data: result,
                message: 'Request submitted successfully',
            });
        } catch (error: any) {
            logger.error(error as any, 'Contact request error:');

            // Handle specific errors
            if (error.message === 'Name is required' ||
                error.message === 'Email is required' ||
                error.message === 'Request type is required') {
                return reply.code(400).send({
                    success: false,
                    error: error.message,
                });
            }

            if (error.message === 'Invalid email format') {
                return reply.code(400).send({
                    success: false,
                    error: error.message,
                });
            }

            return reply.code(500).send({
                success: false,
                error: 'Failed to submit contact request. Please try again.',
            });
        }
    });

    /**
     * GET /api/admin/contact-requests
     * Get all contact requests (admin only)
     */
    fastify.get(
        '/api/admin/contact-requests',
        { preHandler: [requireAuth, requireAdmin] },
        async (request, reply) => {
            try {
                const { status } = request.query as { status?: string };
                const requests = await contactService.getAllRequests(status);

                return reply.send({
                    success: true,
                    data: requests,
                    count: requests.length,
                    stats: {
                        total: requests.length,
                        new: requests.filter((r: any) => r.status === 'NEW').length,
                        read: requests.filter((r: any) => r.status === 'READ').length,
                        contacted: requests.filter((r: any) => r.status === 'CONTACTED').length,
                        closed: requests.filter((r: any) => r.status === 'CLOSED').length,
                    }
                });
            } catch (error) {
                logger.error(error as any, 'Failed to get contact requests:');
                return reply.code(500).send({
                    success: false,
                    error: 'Failed to fetch contact requests',
                });
            }
        }
    );

    /**
     * GET /api/admin/contact-requests/:id
     * Get a specific contact request (admin only)
     */
    fastify.get(
        '/api/admin/contact-requests/:id',
        { preHandler: [requireAuth, requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params as { id: string };
                const requestData = await contactService.getRequestById(id);

                return reply.send({
                    success: true,
                    data: requestData,
                });
            } catch (error: any) {
                logger.error(error as any, 'Failed to get contact request:');

                if (error.message === 'Request not found') {
                    return reply.code(404).send({
                        success: false,
                        error: 'Request not found',
                    });
                }

                return reply.code(500).send({
                    success: false,
                    error: 'Failed to fetch contact request',
                });
            }
        }
    );

    /**
     * PATCH /api/admin/contact-requests/:id/status
     * Update request status (admin only)
     */
    fastify.patch(
        '/api/admin/contact-requests/:id/status',
        { preHandler: [requireAuth, requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params as { id: string };

                const validation = UpdateStatusSchema.safeParse(request.body);
                if (!validation.success) {
                    return reply.code(400).send({
                        success: false,
                        error: 'Validation failed',
                        details: validation.error.format(),
                    });
                }

                const { status } = validation.data;
                const result = await contactService.updateRequestStatus(id, status);

                return reply.send({
                    success: true,
                    data: result,
                    message: `Request status updated to ${status}`,
                });
            } catch (error: any) {
                logger.error(error as any, 'Failed to update request status:');

                if (error.message === 'Request not found') {
                    return reply.code(404).send({
                        success: false,
                        error: 'Request not found',
                    });
                }

                return reply.code(500).send({
                    success: false,
                    error: 'Failed to update request status',
                });
            }
        }
    );

    /**
     * PATCH /api/admin/contact-requests/bulk-status
     * Bulk update request status (admin only)
     */
    fastify.patch(
        '/api/admin/contact-requests/bulk-status',
        { preHandler: [requireAuth, requireAdmin] },
        async (request, reply) => {
            try {
                const validation = BulkUpdateSchema.safeParse(request.body);
                if (!validation.success) {
                    return reply.code(400).send({
                        success: false,
                        error: 'Validation failed',
                        details: validation.error.format(),
                    });
                }

                const { requestIds, status } = validation.data;
                const updatedCount = await contactService.bulkUpdateStatus(requestIds, status);

                return reply.send({
                    success: true,
                    message: `${updatedCount} requests updated to ${status}`,
                    updatedCount,
                });
            } catch (error) {
                logger.error(error as any, 'Failed to bulk update request status:');
                return reply.code(500).send({
                    success: false,
                    error: 'Failed to update request statuses',
                });
            }
        }
    );

    /**
     * DELETE /api/admin/contact-requests/:id
     * Delete a contact request (admin only)
     */
    fastify.delete(
        '/api/admin/contact-requests/:id',
        { preHandler: [requireAuth, requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params as { id: string };

                // Check if request exists first
                await contactService.getRequestById(id);

                await contactService.deleteRequest(id);

                return reply.send({
                    success: true,
                    message: 'Request deleted successfully',
                });
            } catch (error: any) {
                logger.error(error as any, 'Failed to delete contact request:');

                if (error.message === 'Request not found') {
                    return reply.code(404).send({
                        success: false,
                        error: 'Request not found',
                    });
                }

                return reply.code(500).send({
                    success: false,
                    error: 'Failed to delete contact request',
                });
            }
        }
    );

    /**
     * GET /api/admin/contact-requests/stats
     * Get contact request statistics (admin only)
     */
    fastify.get(
        '/api/admin/contact-requests/stats',
        { preHandler: [requireAuth, requireAdmin] },
        async (request, reply) => {
            try {
                const stats = await contactService.getRequestStats();

                return reply.send({
                    success: true,
                    data: stats,
                });
            } catch (error) {
                logger.error(error as any, 'Failed to get request stats:');
                return reply.code(500).send({
                    success: false,
                    error: 'Failed to fetch request statistics',
                });
            }
        }
    );

    /**
     * GET /api/user/contact-requests
     * Get current user's contact requests
     */
    fastify.get(
        '/api/user/contact-requests',
        { preHandler: [requireAuth] },
        async (request, reply) => {
            try {
                const user = (request as any).user;
                if (!user?.id) {
                    return reply.code(401).send({
                        success: false,
                        error: 'Unauthorized',
                    });
                }

                const requests = await contactService.getUserRequests(user.id);

                return reply.send({
                    success: true,
                    data: requests,
                    count: requests.length,
                });
            } catch (error) {
                logger.error(error as any, 'Failed to get user contact requests:');
                return reply.code(500).send({
                    success: false,
                    error: 'Failed to fetch contact requests',
                });
            }
        }
    );
};

export default contactRoutes;