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

    const prompt = `You are an elite business analyst, data scientist, and strategic consultant. Analyze the data from "${fileName}" with deep expertise.

Respond in ${lang}. Return ONLY valid JSON (no markdown, no code blocks). Generate MULTIPLE charts showing different perspectives of the data. Include at least 4-6 KPIs.

REQUIRED JSON STRUCTURE:
{
  "diagnosis": {
    "summary": "Detailed executive summary (3-5 sentences)",
    "findings": ["detailed finding 1", "detailed finding 2", "finding 3", "finding 4", "finding 5"],
    "bottlenecks": ["bottleneck 1", "bottleneck 2", "bottleneck 3"]
  },
  "insights": {
    "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
    "risks": ["risk 1", "risk 2", "risk 3"],
    "patterns": ["pattern 1", "pattern 2", "pattern 3"]
  },
  "actionPlan": {
    "shortTerm": ["action 1", "action 2", "action 3"],
    "mediumTerm": ["action 1", "action 2", "action 3"],
    "longTerm": ["action 1", "action 2", "action 3"]
  },
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"],
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

IMPORTANT: 
- You MUST generate exactly 4-6 charts. MANDATORY: at least 1 bar, 1 pie, 1 line, and 1 area chart. Each chart must have a DIFFERENT type.
- KPIs should show real calculated metrics from the data with real numbers.
- All text analysis should be detailed and actionable, not generic.
- Each chart "data" array must have at least 3 items with real values from the dataset.
- DO NOT return all charts as "bar". Mix the types!

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
          { role: "system", content: "You are an expert business data analyst. Return valid JSON only. No markdown code blocks. Generate multiple diverse chart types with real data values." },
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
        actionPlan: { shortTerm: [], mediumTerm: [], longTerm: [] },
        recommendations: [rawText.substring(0, 300)],
        kpis: [],
        charts: [],
      };
    }

    // Migrate old chartsData format to new charts array
    let charts = Array.isArray(analysis.charts) ? analysis.charts : [];
    if (charts.length === 0 && analysis.chartsData) {
      const cd = analysis.chartsData;
      if (cd.categories && cd.values) {
        charts = [{
          title: "Overview",
          type: cd.chartType || "bar",
          data: cd.categories.map((cat: string, i: number) => ({ name: cat, value: cd.values[i] })),
        }];
      }
    }

    const safeAnalysis = {
      diagnosis: analysis.diagnosis || { summary: "No diagnosis available", findings: [], bottlenecks: [] },
      insights: analysis.insights || { opportunities: [], risks: [], patterns: [] },
      actionPlan: analysis.actionPlan || { shortTerm: [], mediumTerm: [], longTerm: [] },
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      kpis: Array.isArray(analysis.kpis) ? analysis.kpis : [],
      charts,
    };

    const { error: updateError } = await supabase.from("analyses").update({
      status: "completed",
      diagnosis: safeAnalysis.diagnosis,
      insights: safeAnalysis.insights,
      action_plan: safeAnalysis.actionPlan,
      recommendations: safeAnalysis.recommendations,
      kpis: safeAnalysis.kpis,
      charts_data: safeAnalysis.charts,
    }).eq("id", analysisId);

    if (updateError) {
      logStep("ERROR updating analysis", { error: updateError.message });
      return new Response(JSON.stringify({ error: "Failed to save analysis" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    logStep("Analysis saved successfully", { analysisId, chartsCount: charts.length, kpisCount: safeAnalysis.kpis.length });

    return new Response(JSON.stringify({ success: true, analysis: safeAnalysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logStep("FATAL ERROR", { message: error.message, stack: error.stack?.substring(0, 300) });
    if (analysisId) {
      await supabase.from("analyses").update({ status: "error" }).eq("id", analysisId).catch(() => {});
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
