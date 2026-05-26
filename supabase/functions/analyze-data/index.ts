import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[ANALYZE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let analysisId: string | undefined;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    analysisId = body.analysisId;
    const { fileContent, fileName, language } = body;
    logStep("Request received", { analysisId, fileName, contentLength: fileContent?.length });

    if (!analysisId) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify ownership before any write (prevents IDOR via service-role bypass of RLS)
    const { data: existing, error: ownerErr } = await supabase
      .from("analyses").select("user_id").eq("id", analysisId).maybeSingle();
    if (ownerErr || !existing || existing.user_id !== user.id) {
      logStep("Ownership check failed", { analysisId, userId: user.id });
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine plan via Stripe (server-side, not client trusted)
    let userIsPro = false;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey && user.email) {
      try {
        const stripeRes = await fetch("https://api.stripe.com/v1/customers?" + new URLSearchParams({ email: user.email, limit: "1" }), {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        const customers = await stripeRes.json();
        const cid = customers?.data?.[0]?.id;
        if (cid) {
          const subRes = await fetch("https://api.stripe.com/v1/subscriptions?" + new URLSearchParams({ customer: cid, status: "active", limit: "1" }), {
            headers: { Authorization: `Bearer ${stripeKey}` },
          });
          const subs = await subRes.json();
          userIsPro = Array.isArray(subs?.data) && subs.data.length > 0;
        }
      } catch (e) {
        logStep("Plan check failed, defaulting to free", { err: String(e) });
      }
    }
    logStep("Plan determined", { userIsPro });

    await supabase.from("analyses").update({ status: "processing" }).eq("id", analysisId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await supabase.from("analyses").update({ status: "error" }).eq("id", analysisId);
      return new Response(JSON.stringify({ error: "AI API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = language === "pt-BR" ? "Portuguese (Brazil)" : "English";
    const dataContent = (fileContent || "").substring(0, 20000);

    if (!dataContent || dataContent.length < 10) {
      await supabase.from("analyses").update({ status: "error" }).eq("id", analysisId);
      return new Response(JSON.stringify({ error: "File content is empty or too short" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `You are an elite business analyst, senior data scientist, and strategic management consultant with 20+ years of experience across Fortune 500 companies. Perform an exhaustive analysis of the data from "${fileName}".

Respond in ${lang}. Return ONLY valid JSON (no markdown, no code blocks).

REQUIRED JSON STRUCTURE:
{
  "diagnosis": {
    "summary": "Comprehensive executive summary (5-8 sentences covering scope, methodology, key findings and strategic implications)",
    "findings": ["detailed finding 1 with data evidence", "finding 2", "finding 3", "finding 4", "finding 5"],
    "bottlenecks": ["bottleneck 1 with impact assessment", "bottleneck 2", "bottleneck 3"]
  },
  "insights": {
    "opportunities": ["opportunity 1 with estimated impact", "opportunity 2", "opportunity 3", "opportunity 4"],
    "risks": ["risk 1 with probability and severity", "risk 2", "risk 3", "risk 4"],
    "patterns": ["pattern 1 with statistical backing", "pattern 2", "pattern 3"]
  },
  "swot": {
    "strengths": ["strength 1 derived from data", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1 derived from data", "weakness 2", "weakness 3"],
    "opportunities": ["external opportunity 1", "external opportunity 2", "external opportunity 3"],
    "threats": ["external threat 1", "external threat 2", "external threat 3"]
  },
  "executiveScore": {
    "overall": 72,
    "categories": [
      {"name": "Performance", "score": 75, "maxScore": 100},
      {"name": "Growth", "score": 68, "maxScore": 100},
      {"name": "Efficiency", "score": 80, "maxScore": 100},
      {"name": "Risk", "score": 65, "maxScore": 100}
    ],
    "verdict": "A concise 2-sentence executive verdict about overall health"
  },
  "correlations": [
    {"factor1": "Variable A", "factor2": "Variable B", "relationship": "positive|negative|neutral", "strength": "strong|moderate|weak", "description": "How A influences B based on data"},
    {"factor1": "Variable C", "factor2": "Variable D", "relationship": "negative", "strength": "moderate", "description": "Inverse relationship observed"}
  ],
  "dataQuality": {
    "score": 85,
    "completeness": 90,
    "consistency": 80,
    "observations": ["observation about data quality 1", "observation 2"]
  },
  "actionPlan": {
    "shortTerm": ["action 1 with expected outcome", "action 2", "action 3"],
    "mediumTerm": ["action 1 with expected outcome", "action 2", "action 3"],
    "longTerm": ["action 1 with expected outcome", "action 2", "action 3"]
  },
  "recommendations": ["recommendation 1 with ROI estimate", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"],
  "kpis": [
    {"name": "KPI Name", "value": "formatted value", "trend": "up|down|stable", "change": "+X%"},
    {"name": "KPI 2", "value": "value", "trend": "up", "change": "+Y%"}
  ],
  "charts": [
    {
      "title": "Chart title describing what it shows",
      "type": "bar",
      "data": [{"name": "Category A", "value": 100}, {"name": "Category B", "value": 200}]
    },
    {
      "title": "Distribution title",
      "type": "pie",
      "data": [{"name": "Segment A", "value": 40}, {"name": "Segment B", "value": 60}]
    },
    {
      "title": "Trend over time",
      "type": "line",
      "data": [{"name": "Jan", "value": 100}, {"name": "Feb", "value": 120}]
    },
    {
      "title": "Comparison",
      "type": "area",
      "data": [{"name": "Q1", "value": 100, "value2": 80}, {"name": "Q2", "value": 120, "value2": 90}]
    }
  ]
}

CRITICAL RULES:
- EVERY user-facing string in the JSON must be written in ${lang}: KPI names, chart titles, chart category names, SWOT items, recommendations, observations, verdicts, and action plan items.
- Do not mix Portuguese and English in the same response. If ${lang} is English, all labels and narratives must be English. If ${lang} is Portuguese (Brazil), all labels and narratives must be Portuguese (Brazil).
- Generate exactly 4-6 charts. MANDATORY: at least 1 bar, 1 pie, 1 line, and 1 area chart. Each MUST be a DIFFERENT type.
- KPIs: include 4-6 real calculated metrics from the data with real numbers.
- executiveScore.overall: 0-100 score. categories must have 4 items scored 0-100.
- correlations: identify 3-5 real correlations from the data.
- dataQuality: score/completeness/consistency are 0-100 percentages.
- swot: derive from the actual data, not generic statements.
- Each chart data array must have at least 3 items with real values from the dataset.
- All analysis text must be SPECIFIC to this dataset - never generic.

DATA:
${dataContent}`;

    logStep("Calling Lovable AI Gateway");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a world-class business data analyst and strategic consultant. Return valid JSON only. No markdown code blocks. Generate diverse chart types with real data values. Include SWOT analysis, executive scoring, correlations, and data quality assessment." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      logStep("AI Gateway error", { status: aiResponse.status, body: errText.substring(0, 500) });
      await supabase.from("analyses").update({ status: "error" }).eq("id", analysisId);
      const userMsg = aiResponse.status === 429 ? "Rate limit exceeded, please try again later" : aiResponse.status === 402 ? "AI credits exhausted" : `AI error: ${aiResponse.status}`;
      return new Response(JSON.stringify({ error: userMsg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";
    logStep("AI response received", { length: rawText.length });

    if (!rawText) {
      await supabase.from("analyses").update({ status: "error" }).eq("id", analysisId);
      return new Response(JSON.stringify({ error: "Empty AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let cleanText = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    let analysis;
    try {
      analysis = JSON.parse(jsonMatch?.[0] || "{}");
      logStep("JSON parsed successfully", { keys: Object.keys(analysis) });
    } catch (parseErr) {
      logStep("JSON parse failed, using fallback", { error: String(parseErr) });
      analysis = {
        diagnosis: { summary: rawText.substring(0, 500), findings: [], bottlenecks: [] },
        insights: { opportunities: [], risks: [], patterns: [] },
        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        executiveScore: { overall: 0, categories: [], verdict: "" },
        correlations: [],
        dataQuality: { score: 0, completeness: 0, consistency: 0, observations: [] },
        actionPlan: { shortTerm: [], mediumTerm: [], longTerm: [] },
        recommendations: [rawText.substring(0, 300)],
        kpis: [],
        charts: [],
      };
    }

    // Migrate old chartsData format
    let charts = Array.isArray(analysis.charts) ? analysis.charts : [];
    if (charts.length === 0 && analysis.chartsData) {
      const cd = analysis.chartsData;
      if (cd.categories && cd.values) {
        charts = [{
          title: language === "pt-BR" ? "Visão geral" : "Overview",
          type: cd.chartType || "bar",
          data: cd.categories.map((cat: string, i: number) => ({ name: cat, value: cd.values[i] })),
        }];
      }
    }

    const safeAnalysis = {
      diagnosis: analysis.diagnosis || { summary: "No diagnosis available", findings: [], bottlenecks: [] },
      insights: analysis.insights || { opportunities: [], risks: [], patterns: [] },
      swot: analysis.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      executiveScore: analysis.executiveScore || { overall: 0, categories: [], verdict: "" },
      correlations: Array.isArray(analysis.correlations) ? analysis.correlations : [],
      dataQuality: analysis.dataQuality || { score: 0, completeness: 0, consistency: 0, observations: [] },
      actionPlan: analysis.actionPlan || { shortTerm: [], mediumTerm: [], longTerm: [] },
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      kpis: Array.isArray(analysis.kpis) ? analysis.kpis : [],
      charts,
    };

    // Enforce plan-based gating on stored content
    const finalCharts = userIsPro ? safeAnalysis.charts : safeAnalysis.charts.slice(0, 2);
    const enrichedDiagnosis = userIsPro
      ? {
          ...safeAnalysis.diagnosis,
          swot: safeAnalysis.swot,
          executiveScore: safeAnalysis.executiveScore,
          correlations: safeAnalysis.correlations,
          dataQuality: safeAnalysis.dataQuality,
        }
      : safeAnalysis.diagnosis;

    const { error: updateError } = await supabase.from("analyses").update({
      status: "completed",
      diagnosis: enrichedDiagnosis,
      insights: safeAnalysis.insights,
      action_plan: safeAnalysis.actionPlan,
      recommendations: safeAnalysis.recommendations,
      kpis: safeAnalysis.kpis,
      charts_data: finalCharts,
    }).eq("id", analysisId);

    if (updateError) {
      logStep("ERROR updating analysis", { error: updateError.message });
      return new Response(JSON.stringify({ error: "Failed to save analysis" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    logStep("Analysis saved successfully", { analysisId, chartsCount: charts.length, kpisCount: safeAnalysis.kpis.length });

    const responseAnalysis = userIsPro
      ? safeAnalysis
      : {
          ...safeAnalysis,
          swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
          executiveScore: { overall: 0, categories: [], verdict: "" },
          correlations: [],
          dataQuality: { score: 0, completeness: 0, consistency: 0, observations: [] },
          charts: finalCharts,
        };

    return new Response(JSON.stringify({ success: true, analysis: responseAnalysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("FATAL ERROR", { message: msg, stack: error instanceof Error ? error.stack?.substring(0, 300) : undefined });
    if (analysisId) {
      await supabase.from("analyses").update({ status: "error" }).eq("id", analysisId).catch(() => {});
    }
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
