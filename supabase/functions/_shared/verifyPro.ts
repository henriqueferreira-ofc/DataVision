import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "Content-Disposition",
};

export const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });

export type AuthContext = {
  user: { id: string; email: string };
  supabase: SupabaseClient;
};

export type ProContext = AuthContext & {
  isPro: boolean;
};

/** Authenticate the request via Supabase JWT. Returns 401 Response on failure. */
export async function authenticate(req: Request): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return json({ error: "Unauthorized" }, 401);

  return { user: { id: data.user.id, email: data.user.email }, supabase };
}

/** Authenticate + verify the user has an active Pro Stripe subscription. */
export async function verifyPro(req: Request): Promise<ProContext | Response> {
  const auth = await authenticate(req);
  if (auth instanceof Response) return auth;

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("[verifyPro] STRIPE_SECRET_KEY not set");
    return json({ error: "Service misconfigured" }, 500);
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: auth.user.email, limit: 1 });
    if (customers.data.length === 0) {
      return json({ error: "PRO subscription required" }, 403);
    }
    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });
    if (subs.data.length === 0) return json({ error: "PRO subscription required" }, 403);

    return { ...auth, isPro: true };
  } catch (err) {
    console.error("[verifyPro] stripe error:", err instanceof Error ? err.message : err);
    return json({ error: "Unable to verify subscription" }, 500);
  }
}

/** Verify the analysis exists and belongs to the user. */
export async function loadOwnedAnalysis(supabase: SupabaseClient, analysisId: string, userId: string) {
  if (!analysisId || typeof analysisId !== "string") {
    return { error: json({ error: "Invalid analysis id" }, 400) };
  }
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .maybeSingle();
  if (error || !data) return { error: json({ error: "Not found" }, 404) };
  if (data.user_id !== userId) return { error: json({ error: "Forbidden" }, 403) };
  return { analysis: data };
}
