export type Plan = "trial" | "professional" | "enterprise";
export type UsageKey = "repositories" | "aiChats" | "tokens";

export const PLAN_CONFIG = {
  trial: { name: "Free Trial", price: 0, repositories: 3, aiChats: 20, tokens: 500, description: "Explore projectAnalyser for 14 days." },
  professional: { name: "Professional", price: 29, repositories: Infinity, aiChats: Infinity, tokens: 100000, description: "Unlimited repositories and analyses with 100k AI tokens per month." },
  enterprise: { name: "Enterprise", price: null, repositories: Infinity, aiChats: Infinity, tokens: Infinity, description: "Custom deployment, SSO, API access, and priority support." },
} as const;

export interface SubscriptionState {
  plan: Plan;
  trialStartedAt: string;
  usage: Record<UsageKey, number>;
}

export function daysLeft(trialStartedAt: string) {
  const endsAt = new Date(trialStartedAt).getTime() + 14 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / (24 * 60 * 60 * 1000)));
}
