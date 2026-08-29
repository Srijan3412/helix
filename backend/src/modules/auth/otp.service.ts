import { randomInt, createHash } from 'crypto';
import { supabase } from '../../core/supabase/index.js';
import { logger } from '../../core/logger/index.js';

type EmailVerification = any;
type EmailVerificationInsert = any;
type EmailVerificationUpdate = any;

export class OTPService {
    private readonly OTP_LENGTH = 6;
    private readonly EXPIRY_MINUTES = 10;
    private readonly MAX_ATTEMPTS = 5;
    private readonly RESEND_COOLDOWN_SECONDS = 60;

    /**
     * Generate a cryptographically secure 6-digit OTP
     */
    generateOTP(): string {
        const code = randomInt(100000, 999999);
        return code.toString().padStart(this.OTP_LENGTH, '0');
    }

    /**
     * Hash OTP using SHA-256 with salt for secure storage
     */
    hashOTP(otp: string): string {
        // Using SHA-256 with a fixed salt for deterministic hashing
        // For production, consider using bcrypt with per-record salt
        const salt = process.env.OTP_SALT || 'helix-auth-salt-2026';
        const saltedOTP = otp + salt;
        return createHash('sha256').update(saltedOTP).digest('hex');
    }

    /**
     * Verify if OTP matches the stored hash
     */
    verifyOTP(otp: string, hash: string): boolean {
        const computedHash = this.hashOTP(otp);
        return computedHash === hash;
    }

    /**
     * Create or update verification record for a user
     */
    /**
     * Create or update verification record for a user
     */
    async createVerification(userId: string, email: string): Promise<string> {
        const otp = this.generateOTP();
        const otpHash = this.hashOTP(otp);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRY_MINUTES);

        try {
            // Atomic upsert into email_verifications table
            const { error } = await supabase
                .from('email_verifications')
                .upsert({
                    user_id: userId,
                    email: email,
                    otp_hash: otpHash,
                    expires_at: expiresAt.toISOString(),
                    attempts: 0,
                    verified_at: null,
                    created_at: new Date().toISOString()
                }, { onConflict: 'user_id,email' });

            if (error) {
                logger.error({ error, userId, email }, "Supabase upsert into email_verifications failed");
                throw error;
            }

            // Return OTP for email sending
            return otp;
        } catch (error: any) {
            logger.error({ error: error?.message || error, userId, email }, 'Error creating verification:');
            throw new Error(`Failed to create verification record: ${error?.message || 'Database error'}`);
        }
    }

    /**
     * Validate OTP with attempt limiting and expiry checking
     */
    async validateOTP(userId: string, otp: string): Promise<{
        valid: boolean;
        message?: string;
        emailVerified?: boolean;
    }> {
        try {
            // Get verification record safely
            const { data: verification, error } = await supabase
                .from('email_verifications')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error || !verification) {
                return {
                    valid: false,
                    message: 'No verification record found. Please request a new OTP.'
                };
            }

            // Check if already verified
            if (verification.verified_at) {
                return {
                    valid: false,
                    message: 'Email already verified. Please sign in.'
                };
            }

            // Check attempts limit
            if (verification.attempts >= this.MAX_ATTEMPTS) {
                return {
                    valid: false,
                    message: `Maximum attempts (${this.MAX_ATTEMPTS}) exceeded. Please request a new OTP.`
                };
            }

            // Check expiry
            const now = new Date();
            const expiresAt = new Date(verification.expires_at);
            if (now > expiresAt) {
                return {
                    valid: false,
                    message: 'OTP has expired. Please request a new OTP.'
                };
            }

            // Verify OTP
            const isValid = this.verifyOTP(otp, verification.otp_hash);

            if (!isValid) {
                // Increment attempts
                await supabase
                    .from('email_verifications')
                    .update({ attempts: verification.attempts + 1 })
                    .eq('user_id', userId);

                const remainingAttempts = this.MAX_ATTEMPTS - (verification.attempts + 1);
                return {
                    valid: false,
                    message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
                };
            }

            // OTP is valid - mark as verified
            const nowISO = new Date().toISOString();

            // Update email_verifications table
            const { error: updateError } = await supabase
                .from('email_verifications')
                .update({
                    verified_at: nowISO,
                    attempts: verification.attempts + 1
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            // Update helix_profiles table
            const { error: profileError } = await supabase
                .from('helix_profiles')
                .update({
                    email_verified: true,
                    email_verified_at: nowISO
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            return {
                valid: true,
                message: 'Email verified successfully!',
                emailVerified: true
            };

        } catch (error) {
            logger.error({ error }, 'Error validating OTP:');
            throw new Error('Failed to validate OTP');
        }
    }

    /**
     * Resend OTP with cooldown enforcement
     */
    async resendOTP(userId: string, email: string): Promise<{
        success: boolean;
        message: string;
        cooldownRemaining?: number;
        otp?: string;
    }> {
        try {
            // Get verification record safely
            const { data: verification, error } = await supabase
                .from('email_verifications')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error || !verification) {
                // Create new verification if none exists
                const otp = await this.createVerification(userId, email);
                return {
                    success: true,
                    message: 'OTP sent successfully!',
                    otp
                };
            }

            // Check if already verified
            if (verification.verified_at) {
                return {
                    success: false,
                    message: 'Email already verified. Please sign in.'
                };
            }

            // Check cooldown
            const now = new Date();
            const createdAt = new Date(verification.created_at);
            const secondsSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / 1000);

            if (secondsSinceCreation < this.RESEND_COOLDOWN_SECONDS) {
                const remaining = this.RESEND_COOLDOWN_SECONDS - secondsSinceCreation;
                return {
                    success: false,
                    message: `Please wait ${remaining} seconds before requesting a new OTP.`,
                    cooldownRemaining: remaining
                };
            }

            // Generate new OTP
            const newOTP = this.generateOTP();
            const newHash = this.hashOTP(newOTP);
            const newExpiry = new Date();
            newExpiry.setMinutes(newExpiry.getMinutes() + this.EXPIRY_MINUTES);

            // Update verification record
            const { error: updateError } = await supabase
                .from('email_verifications')
                .update({
                    otp_hash: newHash,
                    expires_at: newExpiry.toISOString(),
                    attempts: 0,
                    created_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            // Return new OTP for email sending
            return {
                success: true,
                message: 'OTP sent successfully!',
                otp: newOTP
            };

        } catch (error) {
            logger.error({ error }, 'Error resending OTP:');
            throw new Error('Failed to resend OTP');
        }
    }

    /**
     * Check if a user's email is verified
     */
    async isEmailVerified(userId: string): Promise<boolean> {
        try {
            const { data: profile, error } = await supabase
                .from('helix_profiles')
                .select('email_verified')
                .eq('id', userId)
                .maybeSingle();

            if (error || !profile) {
                return false;
            }

            return profile.email_verified || false;
        } catch (error) {
            logger.error({ error }, 'Error checking email verification:');
            return false;
        }
    }

    /**
     * Clean up expired verification records (can be run as a cron job)
     */
    async cleanupExpiredVerifications(): Promise<void> {
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('email_verifications')
                .delete()
                .lt('expires_at', now)
                .is('verified_at', null);

            if (error) throw error;
        } catch (error) {
            logger.error({ error }, 'Error cleaning up expired verifications:');
        }
    }

    /**
     * Get verification status and remaining attempts
     */
    async getVerificationStatus(userId: string): Promise<{
        exists: boolean;
        verified: boolean;
        attemptsUsed: number;
        attemptsRemaining: number;
        expiresAt?: Date;
        canResend: boolean;
        cooldownSeconds?: number;
    }> {
        try {
            const { data: verification, error } = await supabase
                .from('email_verifications')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error || !verification) {
                return {
                    exists: false,
                    verified: false,
                    attemptsUsed: 0,
                    attemptsRemaining: this.MAX_ATTEMPTS,
                    canResend: true
                };
            }

            const now = new Date();
            const createdAt = new Date(verification.created_at);
            const secondsSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
            const canResend = secondsSinceCreation >= this.RESEND_COOLDOWN_SECONDS;

            return {
                exists: true,
                verified: !!verification.verified_at,
                attemptsUsed: verification.attempts || 0,
                attemptsRemaining: this.MAX_ATTEMPTS - (verification.attempts || 0),
                expiresAt: new Date(verification.expires_at),
                canResend: canResend && !verification.verified_at,
                cooldownSeconds: canResend ? 0 : this.RESEND_COOLDOWN_SECONDS - secondsSinceCreation
            };
        } catch (error) {
            logger.error({ error }, 'Error getting verification status:');
            throw new Error('Failed to get verification status');
        }
    }
}

// Singleton instance for app-wide use
export const otpService = new OTPService();