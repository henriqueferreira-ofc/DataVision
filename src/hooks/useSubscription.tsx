import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type PlanType = "free" | "basic" | "pro";

interface SubscriptionState {
  plan: PlanType;
  subscribed: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  plan: "free",
  subscribed: false,
  subscriptionEnd: null,
  loading: true,
  refresh: async () => {},
});

// Stripe price/product mapping
export const PLANS = {
  basic: {
    monthly: { priceId: "price_1TDP7PJWceWgSe2VBNywAzSR", productId: "prod_UBmgETBLICbzxM" },
    yearly: { priceId: "price_1TDP7qJWceWgSe2VjMAjlCtP", productId: "prod_UBmhkRTvb5KgWP" },
    monthlyPrice: "R$9,90",
    yearlyPrice: "R$49,90",
  },
  pro: {
    monthly: { priceId: "price_1TDP8zJWceWgSe2V2RrNTlbK", productId: "prod_UBmiH7QE3gQkMV" },
    yearly: { priceId: "price_1TDPAzJWceWgSe2V9kh7wZgL", productId: "prod_UBmk2vWMVHeWfa" },
    monthlyPrice: "R$19,90",
    yearlyPrice: "R$99,90",
  },
} as const;

export function isPro(plan: PlanType): boolean {
  return plan === "pro";
}

export function isBasicOrHigher(plan: PlanType): boolean {
  return plan === "basic" || plan === "pro";
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType>("free");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setSubscribed(false);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setPlan(data.plan || "free");
      setSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (err) {
      console.error("Subscription check error:", err);
      setPlan("free");
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <SubscriptionContext.Provider value={{ plan, subscribed, subscriptionEnd, loading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
