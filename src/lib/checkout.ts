import { supabase } from "@/integrations/supabase/client";

export type BillingCycle = "monthly" | "yearly";

const paymentLinks: Record<BillingCycle, string | undefined> = {
  monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PAYMENT_LINK,
  yearly: import.meta.env.VITE_STRIPE_PRO_YEARLY_PAYMENT_LINK,
};

export async function getProCheckoutUrl(billingCycle: BillingCycle): Promise<string> {
  const paymentLink = paymentLinks[billingCycle]?.trim();
  if (paymentLink) return paymentLink;

  // Fallback: create a Stripe Checkout Session via edge function (supports guest checkout)
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { billingCycle },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Checkout URL missing from response");
  return data.url as string;
}
