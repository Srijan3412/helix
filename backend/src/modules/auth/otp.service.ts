import { randomInt, createHash } from 'crypto';
import { supabase } from '../../core/supabase/index.js';
import { logger } from '../../core/logger/index.js';
import { EmailService } from './email.service.js';

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
    async createVerification(userId: string, email: string): Promise<string> {
        const otp = this.generateOTP();
        const otpHash = this.hashOTP(otp);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRY_MINUTES);

        try {
            const { error } = await supabase
                .from('email_verifications')
                .upsert({
                    user_id: userId,
                    email: email.trim().toLowerCase(),
                    otp_hash: otpHash,
                    expires_at: expiresAt.toISOString(),
                    attempts: 0,
                    verified_at: null,
                    created_at: new Date().toISOString()
                }, { onConflict: 'user_id,email' });

            if (error) {
                logger.error({ error, userId, email }, "Supabase upsert into email_verifications failed");
                if (error.message?.includes('row-level security') || error.code === '42501') {
                    throw new Error(
                        'Database RLS policy error on email_verifications. Please set SUPABASE_SERVICE_ROLE_KEY in your Render environment variables or run the SQL script in Supabase SQL Editor.'
                    );
                }
                throw error;
            }

            return otp;
        } catch (error: any) {
            logger.error({ error: error?.message || error, userId, email }, 'Error creating verification:');
            throw new Error(error?.message || 'Failed to create verification record: Database error');
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

            if (verification.verified_at) {
                return {
                    valid: false,
                    message: 'Email already verified. Please sign in.'
                };
            }

            if (verification.attempts >= this.MAX_ATTEMPTS) {
                return {
                    valid: false,
                    message: `Maximum attempts (${this.MAX_ATTEMPTS}) exceeded. Please request a new OTP.`
                };
            }

            const now = new Date();
            const expiresAt = new Date(verification.expires_at);
            if (now > expiresAt) {
                return {
                    valid: false,
                    message: 'OTP has expired. Please request a new OTP.'
                };
            }

            const isValid = this.verifyOTP(otp, verification.otp_hash);

            if (!isValid) {
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

            const nowISO = new Date().toISOString();

            const { error: updateError } = await supabase
                .from('email_verifications')
                .update({
                    verified_at: nowISO,
                    attempts: verification.attempts + 1
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            const { error: profileError } = await supabase
                .from('helix_profiles')
                .update({
                    email_verified: true,
                    email_verified_at: nowISO
                })
                .eq('id', userId);

            if (profileError) {
                logger.warn({ profileError, userId }, "Could not update helix_profiles email_verified (may require service role key)");
            }

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
            const { data: verification, error } = await supabase
                .from('email_verifications')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error || !verification) {
                const otp = await this.createVerification(userId, email);
                return {
                    success: true,
                    message: 'OTP sent successfully!',
                    otp
                };
            }

            if (verification.verified_at) {
                return {
                    success: false,
                    message: 'Email already verified. Please sign in.'
                };
            }

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

            const newOTP = this.generateOTP();
            const newHash = this.hashOTP(newOTP);
            const newExpiry = new Date();
            newExpiry.setMinutes(newExpiry.getMinutes() + this.EXPIRY_MINUTES);

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
            const { data: profile } = await supabase
                .from('helix_profiles')
                .select('email_verified')
                .eq('id', userId)
                .maybeSingle();

            return profile?.email_verified || false;
        } catch (error) {
            logger.error({ error }, 'Error checking email verification:');
            return false;
        }
    }

    /**
     * Clean up expired verification records
     */
    async cleanupExpiredVerifications(): Promise<void> {
        try {
            const now = new Date().toISOString();
            await supabase
                .from('email_verifications')
                .delete()
                .lt('expires_at', now)
                .is('verified_at', null);
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

    /**
     * ── Password Reset OTP ──
     * Send password reset OTP to user's email
     */
    async sendPasswordResetOTP(email: string): Promise<void> {
        try {
            const cleanEmail = email.trim().toLowerCase();
            let userId: string | null = null;

            // 1. Try lookup in helix_profiles (case-insensitive)
            const { data: profileUser } = await supabase
                .from('helix_profiles')
                .select('id, email')
                .ilike('email', cleanEmail)
                .maybeSingle();

            if (profileUser?.id) {
                userId = profileUser.id;
            }

            // 2. If not found in helix_profiles (e.g. blocked by RLS or not created yet),
            // check email_verifications table (which is accessible via RLS FOR ALL)
            if (!userId) {
                const { data: verificationUser } = await supabase
                    .from('email_verifications')
                    .select('user_id')
                    .ilike('email', cleanEmail)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (verificationUser?.user_id) {
                    userId = verificationUser.user_id;
                }
            }

            // 3. Check Supabase Auth Admin listUsers if service role key available
            if (!userId) {
                try {
                    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
                    if (!authError && authUsers?.users) {
                        const authUser = authUsers.users.find((u: any) => u.email?.toLowerCase() === cleanEmail);
                        if (authUser) {
                            userId = authUser.id;
                        }
                    }
                } catch (e) {
                    logger.warn('Could not query supabase.auth.admin.listUsers (SUPABASE_SERVICE_ROLE_KEY missing or unauthorized)');
                }
            }

            // 4. If user ID was not found:
            if (!userId) {
                logger.warn(
                    { email: cleanEmail },
                    '⚠️ Password reset requested for email, but no user ID could be resolved.\n' +
                    '   If this user exists in Supabase, ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables so RLS is bypassed.'
                );
                // Return gracefully for anti-enumeration security, but log the warning for developer debugging
                return;
            }

            // 5. Generate OTP and save to email_verifications
            const otp = this.generateOTP();
            const otpHash = this.hashOTP(otp);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            const { error: saveError } = await supabase
                .from('email_verifications')
                .upsert({
                    user_id: userId,
                    email: cleanEmail,
                    otp_hash: otpHash,
                    expires_at: expiresAt.toISOString(),
                    attempts: 0,
                    verified_at: null,
                    created_at: new Date().toISOString()
                }, { onConflict: 'user_id,email' });

            if (saveError) {
                logger.error({ error: saveError, email: cleanEmail }, 'Failed to save password reset OTP');
                throw saveError;
            }

            const baseUrl = process.env.APP_URL || 'http://localhost:3000';
            const resetLink = `${baseUrl}/auth/reset-password?token=${otp}`;

            // Send email with direct reset link & OTP
            const sent = await EmailService.sendPasswordResetEmail(cleanEmail, otp, resetLink);

            if (!sent) {
                logger.error({ email: cleanEmail }, '❌ EmailService failed to dispatch password reset email');
            } else {
                logger.info({ email: cleanEmail, resetLink }, '✅ Password reset email & OTP sent successfully');
            }
        } catch (error: any) {
            logger.error({ error: error?.message || error, email }, 'Error sending password reset OTP:');
            throw new Error(`Failed to send password reset OTP: ${error?.message || 'Unknown error'}`);
        }
    }

    /**
     * ── Verify Reset Token ──
     * Verify if a password reset token is valid
     */
    async verifyResetToken(token: string): Promise<boolean> {
        try {
            const hashedToken = this.hashOTP(token);
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('email_verifications')
                .select('id, user_id, expires_at, verified_at')
                .eq('otp_hash', hashedToken)
                .gt('expires_at', now)
                .is('verified_at', null)
                .maybeSingle();

            if (error || !data) {
                logger.warn({ token }, 'Invalid or expired reset token');
                return false;
            }

            return true;
        } catch (error) {
            logger.error({ error }, 'Error verifying reset token:');
            return false;
        }
    }

    /**
     * ── Reset Password ──
     * Reset user password using a valid OTP token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            const hashedToken = this.hashOTP(token);
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('email_verifications')
                .select('id, user_id')
                .eq('otp_hash', hashedToken)
                .gt('expires_at', now)
                .is('verified_at', null)
                .maybeSingle();

            if (error || !data) {
                logger.warn({ token }, 'Invalid or expired reset token for password reset');
                throw new Error('Invalid or expired reset token');
            }

            const { error: updateError } = await supabase.auth.admin.updateUserById(
                data.user_id,
                { password: newPassword }
            );

            if (updateError) {
                logger.error({ error: updateError, userId: data.user_id }, 'Failed to update user password');
                throw new Error(updateError.message || 'Failed to update password');
            }

            await supabase
                .from('email_verifications')
                .update({ verified_at: new Date().toISOString() })
                .eq('id', data.id);

            logger.info({ userId: data.user_id }, 'Password reset successfully');
        } catch (error: any) {
            logger.error({ error: error?.message || error }, 'Error resetting password:');
            throw new Error(error?.message || 'Failed to reset password');
        }
    }
}

export const otpService = new OTPService();