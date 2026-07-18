"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { daysLeft, PLAN_CONFIG, type Plan, type SubscriptionState, type UsageKey } from "../../lib/subscription";

const storageKey = "helix-subscription";
const initialState: SubscriptionState = { plan: "trial", trialStartedAt: new Date().toISOString(), usage: { repositories: 0, aiChats: 0, tokens: 0 } };

type SubscriptionContextValue = SubscriptionState & {
  trialDaysLeft: number;
  canUse: (key: UsageKey, amount?: number) => boolean;
  recordUsage: (key: UsageKey, amount?: number) => boolean;
  choosePlan: (plan: Plan) => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(() => {
    if (typeof window === "undefined") return initialState;
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) as SubscriptionState : initialState;
    } catch { window.localStorage.removeItem(storageKey); }
    return initialState;
  });
  useEffect(() => { window.localStorage.setItem(storageKey, JSON.stringify(state)); }, [state]);

  const value = useMemo<SubscriptionContextValue>(() => {
    const trialDaysLeft = daysLeft(state.trialStartedAt);
    const canUse = (key: UsageKey, amount = 1) => {
      if (state.plan === "trial" && trialDaysLeft === 0) return false;
      const limit = PLAN_CONFIG[state.plan][key];
      return limit === Infinity || state.usage[key] + amount <= limit;
    };
    return {
      ...state,
      trialDaysLeft,
      canUse,
      recordUsage: (key, amount = 1) => {
        if (!canUse(key, amount)) return false;
        setState((previous) => ({ ...previous, usage: { ...previous.usage, [key]: previous.usage[key] + amount } }));
        return true;
      },
      choosePlan: (plan) => setState((previous) => ({ ...previous, plan })),
    };
  }, [state]);
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return context;
}
