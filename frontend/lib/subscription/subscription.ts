export type Plan = 'trial' | 'professional' | 'enterprise';
export type Role = 'visitor' | 'trial' | 'professional' | 'org_admin' | 'org_member';
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'expired' | 'past_due';

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
}

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

export const PLAN_CONFIG = {
  trial: {
    name: 'Free Trial',
    price: 0,
    period: '14 days',
    tokens: 500,
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
      '3 repositories',
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
      'Unlimited repositories',
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
