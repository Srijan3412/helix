import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { supabase } from "../core/supabase/index.js";
import { otpService } from "../modules/auth/otp.service.js";
import { EmailService } from "../modules/auth/email.service.js";
import { logger } from "../core/logger/index.js";

// Schema Validations
const SignupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

const VerifyOtpSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
});

const ResendOtpSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
});

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

  /**
   * POST /api/auth/signup
   * Creates pending user account and sends email OTP verification code
   */
  fastify.post("/api/auth/signup", async (request, reply) => {
    const parseResult = SignupSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return {
        success: false,
        error: "Validation failed",
        details: parseResult.error.format()
      };
    }

    const { email, password } = parseResult.data;

    try {
      // 1. Check if user already exists
      const { data: existingUser } = await supabase
        .from('helix_profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (existingUser) {
        reply.code(409);
        return {
          success: false,
          error: "User with this email already exists. Please sign in instead."
        };
      }

      // 2. Create account via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`,
        }
      });

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes('already registered')) {
          reply.code(409);
          return {
            success: false,
            error: "Email already registered. Please sign in instead."
          };
        }

        logger.error({ error: authError, email }, "Supabase auth signup failed");
        reply.code(400);
        return { success: false, error: authError.message };
      }

      const userId = authData.user?.id;
      if (!userId) {
        logger.error({ authData }, "No user ID returned from Supabase auth");
        reply.code(500);
        return {
          success: false,
          error: "User creation failed on auth provider."
        };
      }

      // 3. Create profile entry if not automatically created
      const { error: profileError } = await supabase
        .from('helix_profiles')
        .upsert({
          id: userId,
          email: email,
          email_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        logger.error({ error: profileError, userId }, "Failed to create profile");
        // Continue anyway - profile might be created by trigger
      }

      // 4. Generate OTP verification record
      const otp = await otpService.createVerification(userId, email);

      if (!otp) {
        logger.error({ userId }, "Failed to generate OTP");
        reply.code(500);
        return {
          success: false,
          error: "Failed to generate verification code. Please try again."
        };
      }

      // 5. Send email OTP
      const emailSent = await EmailService.sendOTPEmail(email, otp);

      if (!emailSent && process.env.NODE_ENV === 'production') {
        logger.error({ email, userId }, "Failed to send OTP email in production");
        // Still return success but log the error
        // In production, you might want to fail here
      }

      reply.code(201);
      return {
        success: true,
        userId,
        email,
        message: "Account created! A 6-digit verification code has been sent to your email.",
        needsVerification: true
      };

    } catch (err: any) {
      logger.error({ err, email }, "Signup route exception");
      reply.code(500);
      return {
        success: false,
        error: err.message || "Signup failed due to internal error."
      };
    }
  });

  /**
   * POST /api/auth/verify-otp
   * Validates submitted 6-digit OTP code and activates user profile
   */
  fastify.post("/api/auth/verify-otp", async (request, reply) => {
    const parseResult = VerifyOtpSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return {
        success: false,
        error: "Validation failed",
        details: parseResult.error.format()
      };
    }

    const { userId, otp } = parseResult.data;

    try {
      // 1. Validate OTP
      const result = await otpService.validateOTP(userId, otp);

      if (!result.valid) {
        reply.code(400);
        return {
          success: false,
          error: result.message
        };
      }

      // 2. Get updated user profile
      const { data: profile } = await supabase
        .from('helix_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 3. Generate session token (optional - if using custom sessions)
      // Or return the user data for frontend to handle

      return {
        success: true,
        message: result.message,
        user: {
          id: userId,
          email: profile?.email,
          email_verified: true,
          email_verified_at: new Date().toISOString()
        },
        // Optional: Return a session token or redirect URL
        redirectUrl: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`
      };

    } catch (err: any) {
      logger.error({ err, userId }, "Verify OTP route exception");
      reply.code(500);
      return {
        success: false,
        error: err.message || "Verification failed due to internal error."
      };
    }
  });

  /**
   * POST /api/auth/resend-otp
   * Generates and dispatches a fresh 6-digit OTP code
   */
  fastify.post("/api/auth/resend-otp", async (request, reply) => {
    const parseResult = ResendOtpSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return {
        success: false,
        error: "Validation failed",
        details: parseResult.error.format()
      };
    }

    const { userId } = parseResult.data;

    try {
      // 1. Get user email first
      const { data: profile } = await supabase
        .from('helix_profiles')
        .select('email, email_verified')
        .eq('id', userId)
        .single();

      if (!profile) {
        reply.code(404);
        return {
          success: false,
          error: "User not found. Please sign up again."
        };
      }

      if (profile.email_verified) {
        reply.code(400);
        return {
          success: false,
          error: "Email already verified. Please sign in."
        };
      }

      // 2. Resend OTP with cooldown check
      const result = await otpService.resendOTP(userId, profile.email);

      // Check if result is a string (OTP) or an object (error)
      if (typeof result === 'string') {
        // result is the OTP
        const emailSent = await EmailService.sendOTPEmail(profile.email, result);

        if (!emailSent && process.env.NODE_ENV === 'production') {
          logger.error({ email: profile.email, userId }, "Failed to resend OTP email");
          reply.code(500);
          return {
            success: false,
            error: "Failed to send verification email. Please try again."
          };
        }

        return {
          success: true,
          message: "A new 6-digit verification code has been sent to your email.",
          resendCooldown: 60 // seconds
        };
      } else if (typeof result === 'object' && 'success' in result) {
        // result is an error response from resendOTP
        reply.code(400);
        return {
          success: false,
          error: result.message,
          cooldownRemaining: result.cooldownRemaining
        };
      } else {
        throw new Error("Unexpected response from OTP service");
      }

    } catch (err: any) {
      logger.error({ err, userId }, "Resend OTP route exception");
      reply.code(500);
      return {
        success: false,
        error: err.message || "Failed to resend verification code."
      };
    }
  });

  /**
   * GET /api/auth/check-verification
   * Check if a user's email is verified
   */
  fastify.get("/api/auth/check-verification/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    if (!userId) {
      reply.code(400);
      return {
        success: false,
        error: "User ID is required"
      };
    }

    try {
      const isVerified = await otpService.isEmailVerified(userId);
      const status = await otpService.getVerificationStatus(userId);

      return {
        success: true,
        data: {
          verified: isVerified,
          status
        }
      };
    } catch (err: any) {
      logger.error({ err, userId }, "Check verification route exception");
      reply.code(500);
      return {
        success: false,
        error: err.message || "Failed to check verification status."
      };
    }
  });

  /**
   * GET /api/auth/verification-status
   * Get detailed verification status for a user
   */
  fastify.get("/api/auth/verification-status/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    if (!userId) {
      reply.code(400);
      return {
        success: false,
        error: "User ID is required"
      };
    }

    try {
      const status = await otpService.getVerificationStatus(userId);

      return {
        success: true,
        data: status
      };
    } catch (err: any) {
      logger.error({ err, userId }, "Verification status route exception");
      reply.code(500);
      return {
        success: false,
        error: err.message || "Failed to get verification status."
      };
    }
  });

  /**
   * DELETE /api/auth/cleanup-expired
   * Admin endpoint to clean up expired verifications
   */
  fastify.delete("/api/auth/cleanup-expired", async (request, reply) => {
    // Add admin check here if needed
    // const isAdmin = await checkIsAdmin(request);
    // if (!isAdmin) {
    //   reply.code(403);
    //   return { success: false, error: "Unauthorized" };
    // }

    try {
      await otpService.cleanupExpiredVerifications();

      return {
        success: true,
        message: "Expired verifications cleaned up successfully"
      };
    } catch (err: any) {
      logger.error({ err }, "Cleanup expired route exception");
      reply.code(500);
      return {
        success: false,
        error: err.message || "Failed to cleanup expired verifications."
      };
    }
  });
};

export default authRoutes;