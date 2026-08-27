"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/subscription/supabase";
import { useSubscription } from "../lib/subscription/SubscriptionContext";

const ADMIN_EMAIL = "admin@projectanalyser.com";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Get subscription context for verification status
  let subscriptionContext: ReturnType<typeof useSubscription> | null = null;
  try {
    subscriptionContext = useSubscription();
  } catch {
    // Not inside SubscriptionProvider - handle gracefully
  }

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            user_metadata: session.user.user_metadata,
          });
        }
      } catch {
        // Supabase not configured – fall through to loading=false
      }
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          user_metadata: session.user.user_metadata,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // ✅ ADD: Check if user needs verification
  const isVerified = subscriptionContext?.profile?.email_verified ?? false;
  const needsVerification = subscriptionContext?.needsVerification ?? !isVerified;

  // ✅ ADD: Function to check if user can access protected routes
  const canAccessProtected = () => {
    return user !== null && isVerified;
  };

  // ✅ ADD: Get verification status with details
  const getVerificationStatus = () => {
    return {
      isVerified,
      needsVerification,
      emailVerified: isVerified,
      requiresAction: needsVerification ? 'verify_email' : 'none',
    };
  };

  return {
    user,
    isAdmin,
    loading,
    // ✅ NEW: Verification guards
    isVerified,
    needsVerification,
    canAccessProtected,
    getVerificationStatus,
    // ✅ NEW: Alias for backward compatibility
    emailVerified: isVerified,
    requiresVerification: needsVerification,
  };
}