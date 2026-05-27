import { supabase } from "@/integrations/supabase/client";

export type BillingCycle = "monthly" | "yearly";

function withAppBase(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/" || path.startsWith(base)) return path;
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function getProCheckoutUrl(billingCycle: BillingCycle): Promise<string> {
  const appBasePath = import.meta.env.BASE_URL || "/";
  const returnPath = withAppBase(`${window.location.pathname}${window.location.search}`);
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { billingCycle, returnPath, appBasePath },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Checkout URL missing from response");
  return data.url as string;
}
