import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, json, verifyPro, loadOwnedAnalysis } from "../_shared/verifyPro.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ctx = await verifyPro(req);
    if (ctx instanceof Response) return ctx;

    const { analysisId } = await req.json().catch(() => ({}));
    const loaded = await loadOwnedAnalysis(ctx.supabase, analysisId, ctx.user.id);
    if (loaded.error) return loaded.error;

    return json({ analysis: loaded.analysis });
  } catch (err) {
    console.error("[get-deep-analysis] error:", err instanceof Error ? err.message : err);
    return json({ error: "Unable to load analysis" }, 500);
  }
});
