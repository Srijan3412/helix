// backend/src/utils/email-validator.ts

import { DISPOSABLE_DOMAINS } from '../data/disposable-domains.js';

/**
 * Check if an email domain is a disposable/temporary email provider
 */
export function isDisposableEmail(email: string): boolean {
    if (!email || !email.includes('@')) {
        return false;
    }

    const domain = email.split('@')[1].toLowerCase().trim();

    // Check against disposable domains list
    return DISPOSABLE_DOMAINS.includes(domain);
}

/**
 * Validate email format and check for disposable domains
 * Returns { valid: boolean, reason?: string }
 */
export function validateEmail(email: string): { valid: boolean; reason?: string } {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, reason: 'Invalid email format' };
    }

    // Check for disposable domain
    if (isDisposableEmail(email)) {
        return {
            valid: false,
            reason: 'Temporary/disposable email addresses are not allowed. Please use a permanent email address.'
        };
    }

    return { valid: true };
}

/**
 * Get the domain from an email address
 */
export function getEmailDomain(email: string): string | null {
    if (!email || !email.includes('@')) {
        return null;
    }
    return email.split('@')[1].toLowerCase().trim();
}