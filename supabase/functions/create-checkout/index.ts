import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRO_PRICES = {
  // Use the well-branded "DataVision - Plano Mensal Pro" / "DataVision - Plano Anual Pro"
  // products (with logo and full feature description) instead of the older bare products.
  monthly: "price_1TabzsJWceWgSe2VPy9Dynzw",
  yearly: "price_1TabuHJWceWgSe2VAbaToo6j",
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const { billingCycle = "monthly", returnPath = "/", appBasePath = "/" } = await req.json().catch(() => ({}));
    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      return new Response(JSON.stringify({ error: "Invalid billing cycle" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    const selectedPriceId = PRO_PRICES[billingCycle];

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Try to identify the user if logged in (optional — guest checkout supported)
    let userEmail: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userEmail = data.user?.email ?? undefined;
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const safeBasePath =
      typeof appBasePath === "string" && appBasePath.startsWith("/") && !appBasePath.startsWith("//")
        ? appBasePath
        : "/";
    const normalizedBasePath = safeBasePath.endsWith("/") ? safeBasePath : `${safeBasePath}/`;

    // Ensure returnPath is prefixed with the app's base path (important for GitHub Pages subpath hosting)
    let safeReturnPath =
      typeof returnPath === "string" && returnPath.startsWith("/") && !returnPath.startsWith("//")
        ? returnPath
        : "/";
    if (normalizedBasePath !== "/" && !safeReturnPath.startsWith(normalizedBasePath)) {
      safeReturnPath = `${normalizedBasePath.replace(/\/$/, "")}${safeReturnPath}`;
    }

    const checkoutSuccessPath =
      normalizedBasePath === "/" ? "/signup" : `${normalizedBasePath}signup`;

    // Only allow http(s) origins to prevent open-redirect; fallback to this project's published URL
    const DEFAULT_ORIGIN = Deno.env.get("APP_ORIGIN") || "https://insight-forge-pro-50.lovable.app";
    const requestOrigin = req.headers.get("origin") ?? "";
    const isValidOrigin = /^https?:\/\/[^\s]+$/.test(requestOrigin);
    const origin = isValidOrigin ? requestOrigin : DEFAULT_ORIGIN;
    const cancelUrl = new URL(safeReturnPath, origin);
    cancelUrl.searchParams.set("checkout", "cancel");

    const successUrl = new URL(checkoutSuccessPath, origin);
    successUrl.searchParams.set("checkout", "success");
    successUrl.searchParams.set("plan", "pro");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        metadata: { plan: "pro", billing_cycle: billingCycle },
      },
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-checkout error:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: "Unable to start checkout" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
