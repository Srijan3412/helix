// ============================================
// Subscription Types - Updated for OTP & Scan Limits
// ============================================

export type Plan = 'trial' | 'professional' | 'enterprise';
export type Role = 'visitor' | 'trial' | 'professional' | 'org_admin' | 'org_member' | 'admin';
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'expired' | 'past_due';

// ============================================
// ✅ UPDATED: Profile Interface with Email Verification
// ============================================
export interface Profile {
  id: string;
  email: string;
  role: Role;
  plan: Plan;
  trial_started_at: string;
  trial_ends_at: string;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  created_at: string;

  // ✅ NEW: Email verification fields (Phase 2)
  email_verified?: boolean;
  email_verified_at?: string | null;

  // ✅ NEW: Scan limit fields (Phase 4 & 5)
  scan_limit?: number;        // Default: 2
  scans_used?: number;        // Default: 0
  scan_limit_reset_at?: string | null; // When limit resets (optional)
}

// ============================================
// ✅ NEW: Contact Request Types (Phase 8 & 9)
// ============================================
export type ContactRequestType =
  | 'MORE_SCANS'
  | 'SUBSCRIPTION'
  | 'PROFESSIONAL'
  | 'ENTERPRISE'
  | 'GENERAL';

export type ContactRequestStatus =
  | 'NEW'
  | 'READ'
  | 'CONTACTED'
  | 'CLOSED';

export interface ContactRequest {
  id: string;
  user_id: string;
  name: string;
  email: string;
  request_type: ContactRequestType;
  company?: string;
  message: string;
  status: ContactRequestStatus;
  created_at: string;
  updated_at: string;
}

// ============================================
// ✅ NEW: Verification Status Types (Phase 2)
// ============================================
export interface VerificationStatus {
  exists: boolean;
  verified: boolean;
  attempts_used: number;
  attempts_remaining: number;
  expires_at?: string;
  can_resend: boolean;
  cooldown_seconds?: number;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
  needsVerification?: boolean;
}

// ============================================
// ✅ NEW: Scan Usage Types (Phase 5 & 6)
// ============================================
export interface ScanUsage {
  scan_limit: number;
  scans_used: number;
  scans_remaining: number;
  limit_reached: boolean;
  can_scan: boolean;
  reset_at?: string | null;
}

// ============================================
// ✅ MODIFIED: Subscription Interface
// ============================================
export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  billing_cycle: 'monthly' | 'yearly' | 'custom';
  price_cents: number;
  currency: string;
  stripe_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  created_at: string;
}

// ============================================
// Usage Record (unchanged)
// ============================================
export interface UsageRecord {
  id: string;
  user_id: string;
  repositories_analyzed: number;
  ai_chats: number;
  architecture_graphs: number;
  impact_reports: number;
  database_reports: number;
  exports: number;
  compare_reports: number;
  tokens_used: number;
  storage_used_mb: number;
  period_start: string;
  updated_at: string;
}

// ============================================
// Payment (unchanged)
// ============================================
export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string | null;
  amount_cents: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
}

// ============================================
// ✅ UPDATED: Plan Configuration with Scan Limits
// ============================================
export const PLAN_CONFIG = {
  trial: {
    name: 'Free Trial',
    price: 0,
    period: '14 days',
    tokens: 500,
    scan_limit: 2, // ✅ ADDED: 2 free scans
    limits: {
      repositories: 3,
      aiChats: 20,
      architectureGraphs: 10,
      impactReports: 5,
      databaseReports: 5,
      exports: 3,
      compareReports: 5,
      storageMb: 100,
    },
    features: [
      '2 repository scans', // ✅ UPDATED
      '20 AI chats',
      'Architecture Graph',
      'Overview & basic reports',
      '10 Architecture views',
      '5 Impact analyses',
      '5 Database analyses',
    ],
    excluded: ['PDF Export', 'API Access', 'Team collaboration'],
  },
  professional: {
    name: 'Professional',
    price: 29,
    period: 'month',
    tokens: 100000,
    scan_limit: Infinity, // ✅ ADDED: Unlimited scans
    limits: {
      repositories: Infinity,
      aiChats: Infinity,
      architectureGraphs: Infinity,
      impactReports: Infinity,
      databaseReports: Infinity,
      exports: Infinity,
      compareReports: Infinity,
      storageMb: 50000,
    },
    features: [
      'Unlimited repository scans', // ✅ UPDATED
      'Unlimited AI (100k tokens/mo)',
      'Export Reports (PDF)',
      'Impact Analysis',
      'Architecture Engine',
      'Database Engine',
      'Priority Queue',
      'Compare repositories',
      'Health Analysis',
    ],
    excluded: ['SSO', 'Private deployment', 'API Access'],
  },
  enterprise: {
    name: 'Enterprise',
    price: null as number | null,
    period: 'custom',
    tokens: Infinity,
    scan_limit: Infinity, // ✅ ADDED: Unlimited scans
    limits: {
      repositories: Infinity,
      aiChats: Infinity,
      architectureGraphs: Infinity,
      impactReports: Infinity,
      databaseReports: Infinity,
      exports: Infinity,
      compareReports: Infinity,
      storageMb: Infinity,
    },
    features: [
      'Unlimited repository scans', // ✅ UPDATED
      'Unlimited everything',
      'Custom AI models',
      'SSO & SAML',
      'Private cloud deployment',
      'API Access',
      'Audit logs',
      'Role management',
      'Priority support',
    ],
    excluded: [] as string[],
  },
} as const;

// ============================================
// Token Costs (unchanged)
// ============================================
export const TOKEN_COSTS: Record<string, number> = {
  repository_analysis: 100,
  ai_chat: 10,
  architecture_explanation: 30,
  route_analysis: 20,
  database_analysis: 30,
  impact_analysis: 40,
  compare_repositories: 50,
  ai_refactoring: 40,
  security_scan: 50,
  generate_documentation: 60,
  export_pdf: 15,
};

// ============================================
// ✅ NEW: Scan Limit Helper Functions (Phase 5 & 6)
// ============================================

/**
 * Calculate scan usage for a user
 */
export function getScanUsage(profile: Profile | null): ScanUsage {
  if (!profile) {
    return {
      scan_limit: 0,
      scans_used: 0,
      scans_remaining: 0,
      limit_reached: true,
      can_scan: false,
      reset_at: null,
    };
  }

  const scanLimit = profile.scan_limit ?? 2; // Default to 2
  const scansUsed = profile.scans_used ?? 0;
  const scansRemaining = Math.max(0, scanLimit - scansUsed);
  const limitReached = scansRemaining <= 0;
  const canScan = profile.email_verified === true && !limitReached;

  return {
    scan_limit: scanLimit,
    scans_used: scansUsed,
    scans_remaining: scansRemaining,
    limit_reached: limitReached,
    can_scan: canScan,
    reset_at: profile.scan_limit_reset_at || null,
  };
}

/**
 * Check if user can perform a new scan
 */
export function canPerformScan(profile: Profile | null): boolean {
  if (!profile) return false;
  if (!profile.email_verified) return false;

  const scanLimit = profile.scan_limit ?? 2;
  const scansUsed = profile.scans_used ?? 0;
  return scansUsed < scanLimit;
}

/**
 * Get scan usage percentage for UI progress bar
 */
export function getScanUsagePercentage(profile: Profile | null): number {
  if (!profile) return 0;
  const scanLimit = profile.scan_limit ?? 2;
  const scansUsed = profile.scans_used ?? 0;

  if (scanLimit === Infinity) return 0;
  if (scanLimit === 0) return 100;

  return Math.min(100, (scansUsed / scanLimit) * 100);
}

/**
 * Get scan limit display text
 */
export function getScanLimitDisplay(profile: Profile | null): string {
  if (!profile) return '0 / 0';

  const scanLimit = profile.scan_limit ?? 2;
  const scansUsed = profile.scans_used ?? 0;

  if (scanLimit === Infinity) {
    return `${scansUsed} / ∞`;
  }

  return `${scansUsed} / ${scanLimit}`;
}

/**
 * Check if email verification is required
 */
export function requiresEmailVerification(profile: Profile | null): boolean {
  if (!profile) return true;
  return !profile.email_verified;
}

// ============================================
// Existing Helper Functions (unchanged)
// ============================================

export function daysLeft(trialEndsAt: string): number {
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export function isTrialActive(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.plan !== 'trial') return false;
  return daysLeft(profile.trial_ends_at) > 0;
}

// ============================================
// ✅ NEW: User Status Helper Functions
// ============================================

/**
 * Get overall user status
 */
export interface UserStatus {
  authenticated: boolean;
  emailVerified: boolean;
  canScan: boolean;
  scansRemaining: number;
  plan: Plan | null;
  role: Role | null;
  accountActive: boolean;
  requiresAction: 'none' | 'verify_email' | 'contact_sales' | 'sign_in';
}

export function getUserStatus(profile: Profile | null): UserStatus {
  if (!profile) {
    return {
      authenticated: false,
      emailVerified: false,
      canScan: false,
      scansRemaining: 0,
      plan: null,
      role: null,
      accountActive: false,
      requiresAction: 'sign_in',
    };
  }

  const emailVerified = profile.email_verified || false;
  const scansRemaining = Math.max(0, (profile.scan_limit ?? 2) - (profile.scans_used ?? 0));
  const canScan = emailVerified && scansRemaining > 0;

  let requiresAction: 'none' | 'verify_email' | 'contact_sales' | 'sign_in' = 'none';

  if (!emailVerified) {
    requiresAction = 'verify_email';
  } else if (!canScan && profile.plan !== 'professional' && profile.plan !== 'enterprise') {
    requiresAction = 'contact_sales';
  }

  return {
    authenticated: true,
    emailVerified,
    canScan,
    scansRemaining,
    plan: profile.plan,
    role: profile.role,
    accountActive: true,
    requiresAction,
  };
}

/**
 * Check if user has reached scan limit
 */
export function isScanLimitReached(profile: Profile | null): boolean {
  if (!profile) return true;
  const scanLimit = profile.scan_limit ?? 2;
  const scansUsed = profile.scans_used ?? 0;
  return scansUsed >= scanLimit;
}

/**
 * Check if user is on a paid plan (has unlimited scans)
 */
export function isPaidPlan(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.plan === 'professional' || profile.plan === 'enterprise';
}

// ============================================
// ✅ NEW: Disposable Email Detection (Phase 3)
// ============================================

// List of known disposable email domains
// This is a subset - in production, consider using an API or larger list
export const DISPOSABLE_EMAIL_DOMAINS: string[] = [
  // Mailinator family
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'mailinator.me',
  'mailinator.co',
  'mailinator.club',
  'mailinator.xyz',
  'mailinator.cloud',

  // Temporary email services
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamail.info',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',

  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10minutemail.co',
  '10minutemail.info',
  '10minutemail.us',

  'tempmail.com',
  'tempmail.net',
  'tempmail.org',
  'temp-mail.org',
  'tempemail.com',
  'tempemail.net',
  'email-temp.com',
  'temporary-email.com',
  'temporaryemail.com',
  'temporarily-email.com',
  'temporaryemail.net',
  'temporaryemail.org',

  'throwaway.com',
  'throwaway.email',
  'throwawaymail.com',
  'trashmail.com',
  'trash-mail.com',
  'trash2009.com',
  'trashymail.com',
  'trash2009.com',
  'trashmail.net',
  'trashmail.org',

  'fakeinbox.com',
  'fakeemail.com',
  'fake-mail.com',
  'fakemail.net',
  'fakemail.org',
  'fakemail.com',

  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'yopmail.org',
  'yopmail.info',
  'yopmail.com.ar',

  'maildrop.cc',
  'maildrop.com',
  'maildrop.net',
  'maildrop.org',

  'mohmal.com',
  'mohmal.net',
  'mohmal.org',
  'mohmal.in',
  'mohmal.co',

  'spambox.us',
  'spambox.com',
  'spambox.net',
  'spambox.org',

  'discard.email',
  'discardmail.com',
  'discardmail.net',
  'discardmail.org',
  'discardmail.info',

  'e4ward.com',
  'e4ward.net',
  'e4ward.org',

  'getairmail.com',
  'getairmail.net',
  'getairmail.org',

  'mintemail.com',
  'mintemail.net',
  'mintemail.org',

  'pookmail.com',
  'pookmail.net',
  'pookmail.org',

  'sogetthis.com',
  'sogetthis.net',
  'sogetthis.org',

  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',

  'spamspam.com',
  'spamspam.net',
  'spamspam.org',

  // Common disposable providers
  'mailnesia.com',
  'mailnesia.net',
  'mailnesia.org',
  'mailnesia.co',

  'mailexpire.com',
  'mailexpire.net',
  'mailexpire.org',

  'mailsac.com',
  'mailsac.net',
  'mailsac.org',

  'nada.email',
  'nada.ltd',
  'nada.mx',

  'spam.la',
  'spam.de',
  'spam.fr',
  'spam.es',
  'spam.it',

  // Additional common ones
  'binkmail.com',
  'binkmail.net',
  'binkmail.org',
  'boxmail.co',
  'cached.net',
  'cheatmail.de',
  'cliptik.net',
  'devnull.io',
  'dick.com',
  'dumpmail.com',
  'dustbin.com',
  'emailcow.com',
  'emailgrr.com',
  'emailinfive.com',
  'emailmiser.com',
  'emailo.pro',
  'emailsense.com',
  'emailtemporario.com.br',
  'emailtemporario.net',
  'emailwarden.com',
  'emlhub.com',
  'emltmp.com',
  'evcmail.com',
  'fadingemail.com',
  'filzmail.com',
  'fr33mail.com',
  'front14.org',
  'garrulous.press',
  'ghostmail.com',
  'greenspot.com',
  'gscdn.com',
  'gustr.com',
  'hacked.jp',
  'hartbot.io',
  'honoluluhawaii.us',
  'hot-mail.co',
  'hot-mail.net',
  'hot-mail.org',
  'hot-mail.us',
  'hotmai.com',
  'hotmail.co',
  'imails.info',
  'incognitomail.com',
  'inkomail.com',
  'junkmail.com',
  'kelmet.com',
  'mail-temporaire.fr',
  'mail.by',
  'mail.sb',
  'mail4trash.com',
  'mailbox.blue',
  'mailbox.in.ua',
  'maileven.com',
  'mailfree.xyz',
  'mailinater.com',
  'mailing.xyz',
  'mailita.com',
  'mailme.lv',
  'mailmetrash.com',
  'mailnator.com',
  'mailnull.com',
  'mailpro.site',
  'mailrock.biz',
  'mailshiv.com',
  'mailtemp.xyz',
  'mailtoss.com',
  'mailtraps.com',
  'mailtv.net',
  'mailtv.tv',
  'mailwire.in',
  'mailzilla.org',
  'mailzilla.net',
  'moakt.com',
  'myemail.space',
  'mytrashmail.com',
  'nospam.thanks',
  'nowmymail.com',
  'oneoffemail.com',
  'oneoffmail.com',
  'onetwomail.com',
  'online.ua',
  'owlymail.com',
  'pepbot.com',
  'pleasespamme.com',
  'poofy.org',
  'rcpt.at',
  'receiveee.com',
  'recyclemail.net',
  'reginmail.com',
  'rhyta.com',
  'rocketmail.co',
  'rocketmail.net',
  'rocketmail.org',
  'rocketmail.us',
  'royal.net',
  'safetymail.info',
  'sendspamhere.com',
  'spamcowboy.com',
  'spamcowboy.net',
  'spamcowboy.org',
  'spamday.com',
  'spamex.com',
  'spamfree24.com',
  'spamfree24.net',
  'spamfree24.org',
  'spamgoes.in',
  'spamhere.com',
  'spamherelots.com',
  'spamhereplease.com',
  'spamhole.com',
  'spamify.com',
  'spamkill.net',
  'spaml.com',
  'spaml.de',
  'spammotel.com',
  'spamnull.com',
  'spamoff.com',
  'spamsalad.com',
  'spamserver.org',
  'spamspot.com',
  'spamstack.net',
  'spamthis.com',
  'spamthisplease.com',
  'spamtroll.net',
  'speed.1s.fr',
  'suremail.info',
  'temp-mail.de',
  'temp.mail',
  'tempail.com',
  'tempmail.co',
  'tempmail.de',
  'tempmail.eu',
  'tempmail.info',
  'tempmail.io',
  'tempmail.li',
  'tempmail.pro',
  'tempmail.ru',
  'tempmail.us',
  'tempmail.win',
  'tempmail.xyz',
  'tempomail.fr',
  'temporario.email',
  'temporario.net',
  'temporario.org',
  'temporary.com',
  'temporary.net',
  'temporary.org',
  'temporarymail.com',
  'temporarymail.net',
  'temporarymail.org',
  'tmp.in',
  'tmpmail.net',
  'tmpmail.org',
  'tmpmail.xyz',
  'toomail.com',
  'trialmail.com',
  'trash2009.com',
  'trash2009.net',
  'trash2009.org',
  'trash2010.com',
  'trash2010.net',
  'trash2010.org',
  'trashcanmail.com',
  'trashdevil.com',
  'trashemail.de',
  'trashmail.at',
  'trashmail.co',
  'trashmail.de',
  'trashmail.fr',
  'trashmail.io',
  'trashmail.me',
  'trashmail.ws',
  'trashmailer.com',
  'trashymail.com',
  'twomail.com',
  'twoormore.com',
  'uemail.com',
  'ukryta.poczta',
  'veryrealemail.com',
  'wegwerfmail.com',
  'wegwerfmail.de',
  'wegwerfmail.info',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'wh4f.org',
  'whyspam.me',
  'willselfdestruct.com',
  'winemaven.info',
  'wronghead.com',
  'wuzup.net',
  'xagloo.com',
  'xagloo.co',
  'xagloo.net',
  'xemaps.com',
  'xemaps.net',
  'xemaps.org',
  'xoxy.net',
  'yep.it',
  'yogamail.com',
  'yogamail.net',
  'yogamail.org',
  'yogamail.info',
  'yogamail.biz',
  'zapak.co.in',
  'zippymail.info',
  'zoaxe.com',
  'zoaxe.net',
  'zoaxe.org',
  'zoaxe.info',
  'zoaxe.biz',
  'zoemail.com',
  'zoemail.net',
  'zoemail.org',
  'zoemail.info',
  'zoemail.biz',
];

/**
 * Check if email domain is disposable
 */
export function isDisposableEmail(email: string): boolean {
  if (!email) return false;

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // Check exact match
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return true;
  }

  // Check subdomains (e.g., user@temp.mail.com)
  const domainParts = domain.split('.');
  for (let i = 0; i < domainParts.length - 1; i++) {
    const subdomain = domainParts.slice(i).join('.');
    if (DISPOSABLE_EMAIL_DOMAINS.includes(subdomain)) {
      return true;
    }
  }

  return false;
}

/**
 * Get email validation result
 */
export interface EmailValidationResult {
  valid: boolean;
  formatValid: boolean;
  disposable: boolean;
  domain?: string;
  message?: string;
}

export function validateEmail(email: string): EmailValidationResult {
  // Check if email exists
  if (!email) {
    return {
      valid: false,
      formatValid: false,
      disposable: false,
      message: 'Email is required',
    };
  }

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const formatValid = emailRegex.test(email);

  if (!formatValid) {
    return {
      valid: false,
      formatValid: false,
      disposable: false,
      message: 'Invalid email format',
    };
  }

  const domain = email.split('@')[1]?.toLowerCase();
  const disposable = isDisposableEmail(email);

  return {
    valid: !disposable,
    formatValid: true,
    disposable,
    domain,
    message: disposable ? 'Temporary/disposable email addresses are not allowed' : undefined,
  };
}