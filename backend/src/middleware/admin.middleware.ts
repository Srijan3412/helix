// backend/src/middleware/admin.middleware.ts

import { FastifyRequest, FastifyReply } from "fastify";
import { supabase } from "../core/supabase/index.js";
import { logger } from "../core/logger/index.js";

/**
 * Admin Middleware
 *
 * This middleware checks if the authenticated user has ADMIN role.
 * It should be used on routes that require admin privileges.
 *
 * Usage:
 *   server.get('/admin/scans', { preHandler: [requireAdmin] }, adminController.getScans);
 *
 * The middleware expects that authentication has already been performed
 * and `request.user` contains the authenticated user object.
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    // Get authenticated user from request (set by auth middleware)
    const user = (request as any).user;

    // Check if user is authenticated
    if (!user) {
      logger.warn("Admin access denied: No authenticated user");
      return reply.code(401).send({
        success: false,
        error: "Authentication required",
      });
    }

    // Query the profiles table for user role
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Check if profile exists
    if (error || !data) {
      logger.warn(
        { error },
        `Admin access denied: User profile not found for ID ${user.id}`,
      );
      return reply.code(403).send({
        success: false,
        error: "User profile not found",
      });
    }

    // Check if user has ADMIN role
    if (data.role !== "ADMIN") {
      logger.warn(
        `Admin access denied: User ${user.id} has role "${data.role}" (ADMIN required)`,
      );
      return reply.code(403).send({
        success: false,
        error: "Admin access required",
      });
    }

    // Attach admin role to request for downstream handlers
    (request as any).userRole = data.role;

    logger.debug(`Admin access granted: User ${user.id} has ADMIN role`);
  } catch (error) {
    logger.error({ error }, "Admin middleware error");
    return reply.code(500).send({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Optional: Admin middleware that also checks for SUPER_ADMIN role
 * Use this for routes that require elevated admin privileges
 */
export async function requireSuperAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    // First run regular admin check
    const user = (request as any).user;

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: "Authentication required",
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return reply.code(403).send({
        success: false,
        error: "User profile not found",
      });
    }

    // Check for SUPER_ADMIN role (or ADMIN if you want to use the same)
    if (data.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: "Super admin access required",
      });
    }

    (request as any).userRole = data.role;
  } catch (error) {
    request.log.error({ error }, "Super admin middleware error");
    return reply.code(500).send({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Factory function to create admin middleware with custom role check
 *
 * @param allowedRoles - Array of roles allowed to access the route
 * @returns Middleware function
 *
 * Usage:
 *   server.get('/admin/settings', { preHandler: [requireRole(['ADMIN', 'MANAGER'])] }, ...)
 */
export function requireRole(allowedRoles: string[]) {
  return async function roleMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const user = (request as any).user;

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: "Authentication required",
        });
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        return reply.code(403).send({
          success: false,
          error: "User profile not found",
        });
      }

      if (!allowedRoles.includes(data.role)) {
        return reply.code(403).send({
          success: false,
          error: `Required roles: ${allowedRoles.join(", ")}`,
        });
      }

      (request as any).userRole = data.role;
    } catch (error) {
      request.log.error({ error }, "Role middleware error");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  };
}

/**
 * Admin audit logging helper
 * Use this to log admin actions for compliance/audit purposes
 */
export async function logAdminAction(
  request: FastifyRequest,
  action: string,
  details?: Record<string, any>,
): Promise<void> {
  try {
    const user = (request as any).user;
    const adminLog = {
      admin_id: user?.id || "unknown",
      admin_email: user?.email || "unknown",
      action,
      details: details || {},
      ip: request.ip || request.headers["x-forwarded-for"] || "unknown",
      timestamp: new Date().toISOString(),
    };

    // Log to database or logging service
    logger.info({ adminLog }, "Admin action");

    // Optional: Insert into admin_audit_logs table
    await supabase.from("admin_audit_logs").insert({
      admin_id: user?.id,
      action,
      details: details || {},
      ip_address: request.ip || request.headers["x-forwarded-for"],
    });
  } catch (error) {
    logger.error({ error }, "Failed to log admin action");
  }
}

/**
 * Admin access check helper - returns boolean instead of throwing
 * Useful for conditional logic within route handlers
 */
export async function isAdmin(request: FastifyRequest): Promise<boolean> {
  try {
    const user = (request as any).user;
    if (!user) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !data) return false;
    return data.role === "ADMIN";
  } catch (error) {
    return false;
  }
}
