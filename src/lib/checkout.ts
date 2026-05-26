import { supabase } from "@/integrations/supabase/client";

export type BillingCycle = "monthly" | "yearly";

export async function getProCheckoutUrl(billingCycle: BillingCycle): Promise<string> {
  const returnPath = `${window.location.pathname}${window.location.search}`;
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { billingCycle, returnPath },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Checkout URL missing from response");
  return data.url as string;
}
