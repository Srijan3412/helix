import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../logger/index.js";

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  email_verified?: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ✅ Add: List of public auth routes that don't require authentication
const PUBLIC_AUTH_ROUTES = [
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/signin',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/check-verification',
  '/api/auth/verification-status',
  '/api/auth/forgot-password',
  '/api/auth/verify-reset-token',
  '/api/auth/reset-password',
];

// ✅ Add: Health check routes
const HEALTH_ROUTES = [
  '/health',
  '/health/redis',
];

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const url = request.url;

  // ✅ MODIFIED: Check if route is public
  // Check health routes
  if (HEALTH_ROUTES.some(route => url === route || url.endsWith(route))) {
    return;
  }

  // ✅ MODIFIED: Check if route is a public auth route
  // Bypass authentication for public auth endpoints
  if (PUBLIC_AUTH_ROUTES.some(route => url.startsWith(route))) {
    logger.debug({ url }, "Public auth route - bypassing authentication");
    return;
  }

  // ✅ MODIFIED: Also bypass for auth callback routes if any
  if (url.startsWith('/api/auth/callback') || url.includes('/auth/callback')) {
    logger.debug({ url }, "Auth callback route - bypassing authentication");
    return;
  }

  // Get authorization header
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn({ url }, "Request rejected: missing authorization header");
    reply.code(401);
    return reply.send({
      error: "Unauthorized: Missing token",
      code: "MISSING_TOKEN"
    });
  }

  const token = authHeader.split(" ")[1];

  // Check Supabase configuration
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.error("Supabase environment configuration is missing on backend server.");
    reply.code(500);
    return reply.send({
      error: "Server Configuration Error: Authentication system not configured on backend",
      code: "SERVER_CONFIG_ERROR"
    });
  }

  // Support built-in admin mock token
  if (token === "mock-admin-access-token") {
    request.user = {
      id: "11111111-2222-3333-4444-444444444444",
      email: "admin@projectanalyser.com",
      role: "org_admin",
      email_verified: true,
    };
    return;
  }

  try {
    if (token.length < 20) {
      logger.warn({ url }, "Token appears malformed (too short)");
      reply.code(401);
      return reply.send({
        error: "Unauthorized: Invalid token format",
        code: "INVALID_TOKEN_FORMAT"
      });
    }

    // Verify token with Supabase Auth
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.warn({
        url,
        status: response.status,
        error: errorText
      }, "Token verification failed against Supabase Auth API");

      reply.code(401);
      return reply.send({
        error: "Unauthorized: Invalid or expired session token",
        code: "INVALID_SESSION"
      });
    }

    const userData = (await response.json()) as any;

    // Fetch profile for verification & role from database
    let emailVerified = false;
    let userRole = userData.role || 'user';

    try {
      const profileResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/helix_profiles?select=email_verified,role,plan_id,scan_limit&id=eq.${userData.id}`,
        {
          method: "GET",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (profileResponse.ok) {
        const profiles = await profileResponse.json();
        if (profiles && profiles.length > 0) {
          emailVerified = profiles[0].email_verified ?? true;
          if (profiles[0].role) {
            userRole = profiles[0].role;
          }
        }
      }
    } catch (profileError) {
      logger.warn({ userId: userData.id }, "Failed to fetch profile verification status from database");
    }

    // Set user object with all available info
    request.user = {
      id: userData.id,
      email: userData.email,
      role: userRole,
      email_verified: emailVerified,
    };

    // ✅ ADD: Log successful authentication
    logger.debug({
      userId: userData.id,
      email: userData.email,
      role: userRole,
      emailVerified
    }, "User authenticated successfully");

  } catch (err: any) {
    logger.error({
      error: err.message,
      stack: err.stack,
      url
    }, "Exception encountered in requireAuth middleware fetch call");

    reply.code(500);
    return reply.send({
      error: "Internal Server Error during auth verification",
      code: "VERIFICATION_ERROR"
    });
  }
}

// ✅ ADD: Helper function to check if a route is public
export function isPublicRoute(url: string): boolean {
  return HEALTH_ROUTES.some(route => url === route || url.endsWith(route)) ||
    PUBLIC_AUTH_ROUTES.some(route => url.startsWith(route)) ||
    url.startsWith('/api/auth/callback');
}

// ✅ ADD: Helper function to get user from request
export function getUser(request: FastifyRequest): AuthUser | null {
  return request.user || null;
}

// ✅ ADD: Middleware to require email verification
export async function requireVerifiedEmail(request: FastifyRequest, reply: FastifyReply) {
  // First, run the authentication check
  await requireAuth(request, reply);

  // If authentication failed, the response would have been sent
  if (!request.user) {
    return;
  }

  // Admin roles bypass email verification restriction
  const userRole = (request.user.role || '').toLowerCase();
  if (userRole === 'org_admin' || userRole === 'admin') {
    return;
  }

  // Check if email is verified
  if (!request.user.email_verified) {
    logger.warn({
      userId: request.user.id,
      email: request.user.email
    }, "Access denied: Email not verified");

    reply.code(403);
    return reply.send({
      error: "Forbidden: Email verification required",
      code: "EMAIL_NOT_VERIFIED",
      requiresVerification: true
    });
  }
}

// ✅ ADD: Optional - Admin only middleware
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);

  if (!request.user) {
    return;
  }

  const role = (request.user.role || '').toLowerCase();
  const isAdminUser = role === 'org_admin' || role === 'admin';

  if (!isAdminUser) {
    logger.warn({
      userId: request.user.id,
      role: request.user.role
    }, "Access denied: Admin role required");

    reply.code(403);
    return reply.send({
      error: "Forbidden: Admin access required",
      code: "ADMIN_REQUIRED"
    });
  }
}