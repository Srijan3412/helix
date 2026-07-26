import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../logger/index.js";

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  // Bypass authentication for health check endpoints
  const url = request.url;
  if (url === "/health" || url === "/health/redis" || url.endsWith("/health") || url.endsWith("/health/redis")) {
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Request rejected: missing authorization header");
    reply.code(401);
    return reply.send({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];

  // Bypass token verification for the mock admin token in local testing
  if (token === "mock-admin-access-token") {
    request.user = {
      id: "mock-admin-uuid-1111-2222-3333-444444444444",
      email: "admin@projectanalyser.com",
      role: "org_admin",
    };
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.error("Supabase environment configuration is missing on backend server.");
    reply.code(500);
    return reply.send({ error: "Server Configuration Error: Authentication system not configured on backend" });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      logger.warn("Token verification failed against Supabase Auth API");
      reply.code(401);
      return reply.send({ error: "Unauthorized: Invalid or expired session token" });
    }

    const userData = (await response.json()) as any;
    request.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    };
  } catch (err: any) {
    logger.error(err, "Exception encountered in requireAuth middleware fetch call");
    reply.code(500);
    return reply.send({ error: "Internal Server Error during auth verification" });
  }
}
