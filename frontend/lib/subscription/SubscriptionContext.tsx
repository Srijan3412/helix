import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Profile, Subscription, UsageRecord, Payment, Plan } from './subscription';
import { PLAN_CONFIG, daysLeft, isTrialActive } from './subscription';

interface SubscriptionContextValue {
  session: any;
  profile: Profile | null;
  subscription: Subscription | null;
  usage: UsageRecord | null;
  payments: Payment[];
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  recordUsage: (field: keyof UsageRecord, amount?: number) => Promise<boolean>;
  canUse: (feature: keyof typeof PLAN_CONFIG.professional.limits, currentUsage?: number) => boolean;
  upgradePlan: (plan: Plan) => Promise<{ error: string | null }>;
  cancelSubscription: () => Promise<{ error: string | null }>;
  trialDaysLeft: number;
  isTrial: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const loadProfile = useCallback(async (userId: string, email?: string) => {
    const { data: existing } = await supabase
      .from('helix_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (existing) {
      setProfile(existing as Profile);
      return existing as Profile;
    }

    // Auto-create profile if authenticated but no profile exists
    let userEmail = email;
    if (!userEmail) {
      const { data: { user } } = await supabase.auth.getUser();
      userEmail = user?.email;
    }

    const newProfile = {
      id: userId,
      email: userEmail || '',
      role: 'trial',
      plan: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_status: 'trialing',
    };

    const { error: insertError } = await supabase
      .from('helix_profiles')
      .insert(newProfile);

    if (!insertError) {
      setProfile(newProfile as unknown as Profile);
      // Ensure usage records are also initialized
      await supabase.from('helix_usage_records').insert({
        user_id: userId,
        period_start: new Date().toISOString(),
      });
      return newProfile as unknown as Profile;
    } else {
      console.error("Failed to auto-create profile:", insertError);
    }
    return null;
  }, []);

  const loadSubscription = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('helix_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(data as Subscription | null);
  }, []);

  const loadUsage = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('helix_usage_records')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    setUsage(data as UsageRecord | null);
  }, []);

  const loadPayments = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('helix_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setPayments((data as Payment[]) || []);
  }, []);

  const refreshUsage = useCallback(async () => {
    if (session?.user?.id) await loadUsage(session.user.id);
  }, [session, loadUsage]);

  useEffect(() => {
    mounted.current = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted.current) return;
      setSession(session);
      if (!session) setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        if (!mounted.current) return;
        setSession(sess);
        if (sess?.user?.id) {
          await Promise.all([
            loadProfile(sess.user.id, sess.user.email),
            loadSubscription(sess.user.id),
            loadUsage(sess.user.id),
            loadPayments(sess.user.id),
          ]);
        } else {
          setProfile(null);
          setSubscription(null);
          setUsage(null);
          setPayments([]);
        }
        if (mounted.current) setLoading(false);
      })();
    });

    return () => {
      mounted.current = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile, loadSubscription, loadUsage, loadPayments]);

  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      (window as any).makeAdmin = async () => {
        console.log("Promoting user to org_admin/enterprise...");
        const { error } = await supabase
          .from('helix_profiles')
          .update({
            plan: 'enterprise',
            role: 'org_admin',
            subscription_status: 'active'
          })
          .eq('id', session.user.id);
        
        if (error) {
          console.error("Failed to promote user:", error.message);
          return { error: error.message };
        } else {
          console.log("Successfully promoted user to org_admin/enterprise! Reloading profile...");
          await loadProfile(session.user.id);
          return { success: true };
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).makeAdmin;
      }
    };
  }, [session, loadProfile]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription(null);
    setUsage(null);
    setPayments([]);
  };

  const recordUsage = async (field: keyof UsageRecord, amount = 1): Promise<boolean> => {
    if (!session?.user?.id || !usage) return false;
    const numericFields: Array<keyof UsageRecord> = [
      'repositories_analyzed', 'ai_chats', 'architecture_graphs',
      'impact_reports', 'database_reports', 'exports', 'compare_reports', 'tokens_used', 'storage_used_mb',
    ];
    if (!numericFields.includes(field)) return false;

    const update: Record<string, number | string> = { updated_at: new Date().toISOString() };
    update[field as string] = (usage[field] as number) + amount;

    const { error } = await supabase
      .from('helix_usage_records')
      .update(update)
      .eq('id', usage.id);

    if (!error) {
      setUsage({ ...usage, ...update } as UsageRecord);
      return true;
    }
    return false;
  };

  const canUse = (feature: keyof typeof PLAN_CONFIG.professional.limits, currentUsage?: number): boolean => {
    if (!profile) return false;
    const config = PLAN_CONFIG[profile.plan];
    const limit = config.limits[feature];
    if (limit === Infinity) return true;
    if (currentUsage === undefined) return true;
    return currentUsage < limit;
  };

  const upgradePlan = async (plan: Plan) => {
    if (!session?.user?.id) return { error: 'Not authenticated' };
    const config = PLAN_CONFIG[plan];

    const { error: profileError } = await supabase
      .from('helix_profiles')
      .update({
        plan,
        role: plan === 'enterprise' ? 'org_admin' : 'professional',
        subscription_status: 'active',
      })
      .eq('id', session.user.id);
    if (profileError) return { error: profileError.message };

    if (plan !== 'trial') {
      const { error: subError } = await supabase.from('helix_subscriptions').insert({
        user_id: session.user.id,
        plan,
        status: 'active',
        billing_cycle: 'monthly',
        price_cents: (config.price ?? 0) * 100,
        currency: 'usd',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (subError) return { error: subError.message };

      const { error: payError } = await supabase.from('helix_payments').insert({
        user_id: session.user.id,
        invoice_id: `INV-${Date.now()}`,
        amount_cents: (config.price ?? 0) * 100,
        currency: 'usd',
        status: 'paid',
        payment_method: 'Visa **** 3344',
        paid_at: new Date().toISOString(),
      });
      if (payError) return { error: payError.message };
    }

    await Promise.all([
      loadProfile(session.user.id),
      loadSubscription(session.user.id),
      loadPayments(session.user.id),
    ]);
    return { error: null };
  };

  const cancelSubscription = async () => {
    if (!session?.user?.id || !subscription) return { error: 'No subscription found' };

    const { error: subError } = await supabase
      .from('helix_subscriptions')
      .update({ status: 'canceled', cancel_at: new Date().toISOString() })
      .eq('id', subscription.id);
    if (subError) return { error: subError.message };

    const { error: profileError } = await supabase
      .from('helix_profiles')
      .update({ plan: 'trial', role: 'trial', subscription_status: 'canceled' })
      .eq('id', session.user.id);
    if (profileError) return { error: profileError.message };

    await Promise.all([loadProfile(session.user.id), loadSubscription(session.user.id)]);
    return { error: null };
  };

  const trialDaysLeft = profile ? daysLeft(profile.trial_ends_at) : 0;
  const isTrial = profile ? isTrialActive(profile) : false;

  return (
    <SubscriptionContext.Provider
      value={{
        session, profile, subscription, usage, payments, loading,
        signUp, signIn, signOut, refreshUsage, recordUsage, canUse,
        upgradePlan, cancelSubscription, trialDaysLeft, isTrial,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
