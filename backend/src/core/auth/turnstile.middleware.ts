import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../logger/index.js";

const TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

/**
 * Middleware to verify Cloudflare Turnstile token on public or sensitive POST endpoints.
 * In development or if the secret key is not set, validation passes with a warning.
 */
export async function verifyTurnstile(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // If Turnstile secret is not configured, bypass verification (useful for dev/test environments)
  if (!TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("CLOUDFLARE_TURNSTILE_SECRET_KEY is not set in production. Turnstile check bypassed.");
    }
    return;
  }

  const body = (request.body as any) || {};
  const headers = request.headers;

  // Accept token from body (turnstileToken, cf-turnstile-response) or header (x-turnstile-token)
  const turnstileToken =
    body.turnstileToken ||
    body["cf-turnstile-response"] ||
    headers["x-turnstile-token"] ||
    headers["cf-turnstile-response"];

  if (!turnstileToken) {
    logger.warn({ url: request.url, ip: request.ip }, "Turnstile validation failed: missing token");
    reply.code(400);
    return reply.send({
      success: false,
      error: "Security verification required. Please complete the captcha check.",
      code: "TURNSTILE_REQUIRED",
    });
  }

  try {
    const remoteIp = request.ip;
    const formData = new URLSearchParams();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", turnstileToken);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as { success: boolean; "error-codes"?: string[] };

    if (!result.success) {
      logger.warn(
        { url: request.url, ip: request.ip, errorCodes: result["error-codes"] },
        "Turnstile verification failed: invalid token"
      );
      reply.code(403);
      return reply.send({
        success: false,
        error: "Security verification challenge failed. Please try again.",
        code: "TURNSTILE_FAILED",
      });
    }

    logger.debug({ url: request.url }, "Turnstile challenge verified successfully");
  } catch (err: any) {
    logger.error({ err, url: request.url }, "Error connecting to Cloudflare Turnstile service");
    reply.code(500);
    return reply.send({
      success: false,
      error: "Security verification service temporarily unavailable.",
      code: "TURNSTILE_ERROR",
    });
  }
}
