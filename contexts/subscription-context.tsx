/**
 * Subscription state (Free vs Lumina/Pro). Loaded after auth; used to gate features and show upgrade CTAs.
 */

import * as api from "@/lib/api";
import { invalidateKey } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache";
import { useAuth } from "@clerk/clerk-expo";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type SubscriptionStatus = api.SubscriptionStatus;

type SubscriptionContextValue = {
  /** Resolved subscription from GET /api/users/me/subscription */
  subscription: SubscriptionStatus | null;
  /** true when status is active/trialing/past_due and planId is truthy */
  isPro: boolean;
  loading: boolean;
  /** Refetch subscription (e.g. after Stripe Checkout or Portal return). Invalidates cache. */
  refetch: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  return ctx;
}

function deriveIsPro(sub: SubscriptionStatus | null): boolean {
  if (!sub) return false;
  const okStatus =
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due";
  return Boolean(okStatus && sub.planId);
}

type SubscriptionProviderProps = { children: React.ReactNode };

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { isSignedIn, getToken } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setSubscription(null);
      return;
    }
    const getTokenFn: api.GetTokenFn = () => getToken();
    try {
      const data = await api.fetchSubscription(getTokenFn);
      setSubscription(data);
    } catch {
      setSubscription(null);
    }
  }, [getToken]);

  const refetch = useCallback(async () => {
    invalidateKey(cacheKeys.subscription());
    await load();
  }, [load]);

  useEffect(() => {
    if (!isSignedIn) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [isSignedIn, load]);

  const value: SubscriptionContextValue = {
    subscription,
    isPro: deriveIsPro(subscription),
    loading,
    refetch,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
