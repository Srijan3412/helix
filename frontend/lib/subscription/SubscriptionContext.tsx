import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from './supabase';
import { invalidateAuthCache } from '../api/client';

import type { Profile, Subscription, UsageRecord, Payment, Plan, UserStatus, ScanUsage } from './subscription';
import { PLAN_CONFIG, daysLeft, isTrialActive, getScanUsage, canPerformScan, getUserStatus, validateEmail } from './subscription';

// ✅ ADD this import
import {
  signUpApi,
  verifyOtpApi,
  resendOtpApi,
  checkVerificationStatus,
  getScanUsage as getScanUsageApi,
  submitContactRequest
} from '../api/client';

interface SubscriptionContextValue {
  session: any;
  profile: Profile | null;
  subscription: Subscription | null;
  usage: UsageRecord | null;
  payments: Payment[];
  loading: boolean;

  // ✅ MODIFIED: Update signUp to return more info
  signUp: (email: string, password: string) => Promise<{
    error: string | null;
    userId?: string;
    needsVerification?: boolean;
    email?: string;
  }>;

  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;

  // ✅ NEW: OTP verification functions
  verifyOtp: (userId: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (userId: string) => Promise<{ success: boolean; error?: string; cooldownRemaining?: number }>;

  refreshUsage: () => Promise<void>;
  recordUsage: (field: keyof UsageRecord, amount?: number) => Promise<boolean>;
  canUse: (feature: keyof typeof PLAN_CONFIG.professional.limits, currentUsage?: number) => boolean;
  upgradePlan: (plan: Plan) => Promise<{ error: string | null }>;
  cancelSubscription: () => Promise<{ error: string | null }>;
  trialDaysLeft: number;
  isTrial: boolean;

  // ✅ NEW: Scan limit functions
  scanUsage: ScanUsage | null;
  canScan: boolean;
  refreshScanUsage: () => Promise<void>;

  // ✅ NEW: User status
  userStatus: UserStatus | null;
  needsVerification: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW STATE
  const [needsVerification, setNeedsVerification] = useState(false);
  const [scanUsage, setScanUsage] = useState<ScanUsage | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load from sessionStorage only after mount (client-side only)
  // This avoids hydration mismatch (Error #418) since server and client start with identical state
  useEffect(() => {
    try {
      const savedSession = sessionStorage.getItem('sb-session-cache');
      if (savedSession) setSession(JSON.parse(savedSession));

      const savedProfile = sessionStorage.getItem('sb-profile-cache');
      if (savedProfile) setProfile(JSON.parse(savedProfile));

      const savedSub = sessionStorage.getItem('sb-subscription-cache');
      if (savedSub) setSubscription(JSON.parse(savedSub));

      const savedUsage = sessionStorage.getItem('sb-usage-cache');
      if (savedUsage) setUsage(JSON.parse(savedUsage));

      const savedPayments = sessionStorage.getItem('sb-payments-cache');
      if (savedPayments) setPayments(JSON.parse(savedPayments));

      if (savedSession && savedProfile) {
        setLoading(false); // Fast path: Hydrate instantly if cache is present
      }
    } catch (e) {
      console.error("Cache hydration error:", e);
    }

    // Safety fallback: Ensure loading boolean resolves within 2 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const mounted = useRef(true);

  const saveToCache = (key: string, val: any) => {
    if (typeof window !== 'undefined') {
      try {
        if (val) {
          sessionStorage.setItem(key, JSON.stringify(val));
        } else {
          sessionStorage.removeItem(key);
        }
      } catch (e) { }
    }
  };

  const updateSession = useCallback((sess: any) => {
    setSession(sess);
    saveToCache('sb-session-cache', sess);
  }, []);

  const updateProfile = useCallback((prof: Profile | null) => {
    setProfile(prof);
    saveToCache('sb-profile-cache', prof);
  }, []);

  const updateSubscription = useCallback((sub: Subscription | null) => {
    setSubscription(sub);
    saveToCache('sb-subscription-cache', sub);
  }, []);

  const updateUsage = useCallback((usg: UsageRecord | null) => {
    setUsage(usg);
    saveToCache('sb-usage-cache', usg);
  }, []);

  const updatePayments = useCallback((pays: Payment[]) => {
    setPayments(pays);
    saveToCache('sb-payments-cache', pays);
  }, []);



  const loadSubscription = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('helix_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    updateSubscription(data as Subscription | null);
  }, []);

  const loadUsage = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('helix_usage_records')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    updateUsage(data as UsageRecord | null);
  }, []);

  const loadPayments = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('helix_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    updatePayments((data as Payment[]) || []);
  }, []);

  const refreshUsage = useCallback(async () => {
    if (session?.user?.id) await loadUsage(session.user.id);
  }, [session, loadUsage]);

  const loadProfile = useCallback(async (userId: string, email?: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const isGoogleUser = authUser?.app_metadata?.provider === 'google' ||
                         authUser?.app_metadata?.providers?.includes('google') ||
                         !!authUser?.email_confirmed_at ||
                         !!authUser?.user_metadata?.email_verified;

    const { data: existing } = await supabase
      .from('helix_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      if (isGoogleUser && !existing.email_verified) {
        await supabase
          .from('helix_profiles')
          .update({ email_verified: true, email_verified_at: new Date().toISOString() })
          .eq('id', userId);
        existing.email_verified = true;
      }

      updateProfile(existing as Profile);

      if (existing.email_verified === false && !isGoogleUser) {
        setNeedsVerification(true);
      } else {
        setNeedsVerification(false);
      }

      // ✅ ADD: Update scan usage
      const usage = getScanUsage(existing as Profile);
      setScanUsage(usage);

      // ✅ ADD: Update user status
      const status = getUserStatus(existing as Profile);
      setUserStatus(status);

      return existing as Profile;
    }

    // Auto-create profile if authenticated but no profile exists
    let userEmail = email || authUser?.email || '';

    // Only include valid database columns for helix_profiles DB insert/upsert
    const dbProfileData = {
      id: userId,
      email: userEmail,
      role: 'visitor',
      plan: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_status: 'trialing',
      email_verified: isGoogleUser,
      email_verified_at: isGoogleUser ? new Date().toISOString() : null,
    };

    try {
      const { data: upsertData, error: upsertError } = await supabase
        .from('helix_profiles')
        .upsert(dbProfileData, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (upsertError) {
        console.warn("Notice: helix_profiles DB upsert skipped/deferred (handled by trigger or RLS):", upsertError.message);
      }

      try {
        await supabase.from('helix_usage_records').upsert({
          user_id: userId,
          period_start: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (e) {}

      const activeProfile = (upsertData || { ...dbProfileData, scan_limit: 2, scans_used: 0 }) as Profile;
      updateProfile(activeProfile);
      setNeedsVerification(!isGoogleUser && !activeProfile.email_verified);

      const usage = getScanUsage(activeProfile);
      setScanUsage(usage);
      const status = getUserStatus(activeProfile);
      setUserStatus(status);

      return activeProfile;
    } catch (e) {
      const fallbackProfile = { ...dbProfileData, scan_limit: 2, scans_used: 0 } as Profile;
      updateProfile(fallbackProfile);
      setNeedsVerification(!isGoogleUser);
      setScanUsage(getScanUsage(fallbackProfile));
      setUserStatus(getUserStatus(fallbackProfile));
      return fallbackProfile;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    const initSession = async () => {
      try {
        let { data: { session: sess } } = await supabase.auth.getSession();

        if (!sess && typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          try {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            if (accessToken) {
              const payloadBase64 = accessToken.split('.')[1];
              if (payloadBase64) {
                const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
                if (payload && payload.sub) {
                  sess = {
                    access_token: accessToken,
                    user: {
                      id: payload.sub,
                      email: payload.email || payload.user_metadata?.email || '',
                      app_metadata: payload.app_metadata || { provider: 'google' },
                      user_metadata: payload.user_metadata || {},
                      email_confirmed_at: payload.email_confirmed_at || new Date().toISOString(),
                    }
                  } as any;
                }
              }
            }
          } catch (e) {
            console.error("Failed parsing hash token in SubscriptionContext:", e);
          }
        }

        if (!mounted.current) return;
        updateSession(sess);

        if (sess && typeof window !== 'undefined' && window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage({ type: 'SUPABASE_AUTH_COMPLETE', session: sess }, '*');
            window.close();
            return;
          } catch (e) {
            console.error('Error posting message from SubscriptionContext to opener:', e);
          }
        }

        if (sess?.user?.id) {
          try {
            await Promise.all([
              loadProfile(sess.user.id, sess.user.email),
              loadSubscription(sess.user.id),
              loadUsage(sess.user.id),
              loadPayments(sess.user.id),
            ]);
          } catch (err) {
            console.error("Failed loading user data in initSession:", err);
          }
        }
      } catch (err) {
        console.error("Failed initializing session:", err);
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        if (!mounted.current) return;
        updateSession(sess);
        if (sess?.user?.id) {
          try {
            await Promise.all([
              loadProfile(sess.user.id, sess.user.email),
              loadSubscription(sess.user.id),
              loadUsage(sess.user.id),
              loadPayments(sess.user.id),
            ]);
          } catch (err) {
            console.error("Failed loading user data in onAuthStateChange:", err);
          }

          if (profile && profile.email_verified === false) {
            setNeedsVerification(true);
          } else {
            setNeedsVerification(false);
          }
        } else {
          updateProfile(null);
          updateSubscription(null);
          updateUsage(null);
          updatePayments([]);
          setNeedsVerification(false);
          setScanUsage(null);
          setUserStatus(null);
        }
        if (mounted.current) setLoading(false);
      })();
    });

    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_COMPLETE') {
        const sess = event.data.session;
        if (sess) {
          updateSession(sess);
          if (sess.user?.id) {
            try {
              await Promise.all([
                loadProfile(sess.user.id, sess.user.email),
                loadSubscription(sess.user.id),
                loadUsage(sess.user.id),
                loadPayments(sess.user.id),
              ]);
            } catch (e) {
              console.error("Failed loading data from popup auth:", e);
            }
          }
          if (mounted.current) setLoading(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleAuthMessage);
    }

    return () => {
      mounted.current = false;
      authListener.subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleAuthMessage);
      }
    };
  }, [loadProfile, loadSubscription, loadUsage, loadPayments]);



  const signUp = async (email: string, password: string) => {
    // Validate email format
    const validation = validateEmail(email);
    if (!validation.valid) {
      return {
        error: validation.message || 'Invalid email address',
        userId: undefined,
        needsVerification: false,
        email: undefined
      };
    }

    try {
      const response = await signUpApi(email, password);

      // ✅ Store userId for OTP verification
      if (response.success) {
        setNeedsVerification(true);
        return {
          error: null,
          userId: response.userId,
          needsVerification: true,
          email: response.email
        };
      }

      return {
        error: response.message || 'Signup failed',
        userId: undefined,
        needsVerification: false,
        email: undefined
      };
    } catch (err: any) {
      return {
        error: err.message || 'Signup failed',
        userId: undefined,
        needsVerification: false,
        email: undefined
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await loadProfile(user.id, user.email);
      }
    }
    return { error: error?.message || null };
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    invalidateAuthCache();
    updateSession(null);
    updateProfile(null);
    updateSubscription(null);
    updateUsage(null);
    updatePayments([]);

    // Reset verification state
    setNeedsVerification(false);
    setScanUsage(null);
    setUserStatus(null);
    setIsVerifying(false);
  };

  // ✅ ADD NEW: OTP Verification Functions
  const verifyOtp = async (userId: string, otp: string) => {
    if (isVerifying) {
      return { success: false, error: 'Verification already in progress' };
    }

    setIsVerifying(true);
    try {
      const response = await verifyOtpApi(userId, otp);

      if (response.success) {
        // Reload profile with fresh data
        const updatedProfile = await loadProfile(userId);

        // Use updated profile for scan usage
        if (updatedProfile) {
          const usage = getScanUsage(updatedProfile);
          setScanUsage(usage);

          const status = getUserStatus(updatedProfile);
          setUserStatus(status);
        }

        // Clear verification state
        setNeedsVerification(false);

        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification failed' };
    } finally {
      setIsVerifying(false);
    }
  };

  // ✅ ADD NEW: Scan Limit Functions
  const refreshScanUsage = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await getScanUsageApi(session.user.id);
      if (response.success) {
        setScanUsage(response.data);
      }
    } catch (err) {
      console.error('Failed to refresh scan usage:', err);
    }
  }, [session]);

  const canScan = useCallback(() => {
    if (!profile) return false;
    if (!profile.email_verified) return false;

    const usage = getScanUsage(profile);
    return usage.can_scan;
  }, [profile]);

  const resendOtp = async (userId: string) => {
    try {
      const response = await resendOtpApi(userId);
      if (response.success) {
        return {
          success: true,
          error: undefined,
          cooldownRemaining: response.resendCooldown || 60
        };
      } else {
        return {
          success: false,
          error: response.message,
          cooldownRemaining: response.cooldownRemaining
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to resend OTP',
        cooldownRemaining: undefined
      };
    }
  };

  const recordUsage = async (field: keyof UsageRecord, amount = 1): Promise<boolean> => {
    // Admin does not consume or record tokens/usage limits
    if (profile?.role === 'org_admin' || profile?.email === 'admin@projectanalyser.com') {
      return true;
    }
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
      updateUsage({ ...usage, ...update } as UsageRecord);
      return true;
    }
    return false;
  };

  const canUse = (feature: keyof typeof PLAN_CONFIG.professional.limits, currentUsage?: number): boolean => {
    if (!profile) return false;
    // Admin can use everything as much as they want
    if (profile.role === 'org_admin' || profile.email === 'admin@projectanalyser.com') {
      return true;
    }
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
        signUp, signIn, signOut,
        // ✅ ADD NEW FUNCTIONS
        verifyOtp, resendOtp,
        refreshUsage, recordUsage, canUse,
        upgradePlan, cancelSubscription, trialDaysLeft, isTrial,
        // ✅ ADD NEW STATE
        scanUsage,
        canScan: canScan(),
        refreshScanUsage,
        userStatus,
        needsVerification,
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
