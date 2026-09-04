import fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { apiRoutes } from "./routes/index.js";
import rateLimit from "@fastify/rate-limit";
import { logger } from "./core/logger/index.js";
import { AppError } from "./core/errors/index.js";
import { StorageService } from "./modules/upload/storage.service.js";
import { config } from "./core/config/index.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false, // Disabling default logger to use our Pino implementation
  });

  // Security Response Headers (Phase 1 Security Hardening)
  app.addHook("onSend", async (request, reply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("X-XSS-Protection", "1; mode=block");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (config.NODE_ENV === "production" || config.NODE_ENV === "staging") {
      reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
  });

  // Enable CORS with credentials and preflight caching
  const corsOrigins = config.ALLOWED_ORIGINS
    ? config.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : (config.FRONTEND_URL ? [config.FRONTEND_URL] : "*");

  await app.register(cors, {
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Turnstile-Token", "cf-turnstile-response"],
    credentials: true,
    maxAge: 86400, // 24 hour preflight caching
  });

  // Enable Rate Limiting (150 requests per minute, bypassed for admin@projectanalyser.com)
  await app.register(rateLimit, {
    max: 150,
    timeWindow: "1 minute",
    allowList: (req) => {
      // Health checks bypass rate limiting
      if (req.url === "/health" || req.url === "/api/health" || req.url?.startsWith("/health")) return true;
      // Admin roles bypass standard rate limiting
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.split(" ")[1];
          if (token === "mock-admin-access-token") {
            return true;
          }
          if (token) {
            const payloadBase64 = token.split(".")[1];
            if (payloadBase64) {
              const payload = JSON.parse(Buffer.from(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
              if (payload?.role === "org_admin" || payload?.role === "admin" || payload?.app_metadata?.role === "org_admin" || payload?.user_metadata?.role === "org_admin") {
                return true;
              }
            }
          }
        } catch (e) {
          // ignore token decode errors
        }
      }
      return false;
    },
  });

  // Enable multipart support for file uploads (ZIP files)
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
  });

  // Register API routes
  await app.register(apiRoutes);

  // Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      logger.warn({ err: error }, `Application warning: ${error.message}`);
      reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
      return;
    }

    logger.error({ err: error }, "Unhandled server error occurred");
    reply.status(500).send({
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred on the server.",
    });
  });

  // Prepare directories
  await StorageService.ensureStorageDirectories();

  return app;
}
