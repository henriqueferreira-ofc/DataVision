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

    // Update status to processing
    await supabase.from("analyses").update({ status: "processing" }).eq("id", analysisId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      logStep("ERROR: No LOVABLE_API_KEY");
      await supabase.from("analyses").update({ status: "error" }).eq("id", analysisId);
      return new Response(JSON.stringify({ error: "AI API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = language === "pt-BR" ? "Portuguese (Brazil)" : "English";
    const dataContent = (fileContent || "").substring(0, 15000);

    if (!dataContent || dataContent.length < 10) {
      logStep("ERROR: File content too short", { length: dataContent.length });
      await supabase.from("analyses").update({ status: "error" }).eq("id", analysisId);
      return new Response(JSON.stringify({ error: "File content is empty or too short" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `You are an expert business analyst, strategic consultant, and data scientist. Analyze the following data from "${fileName}" and provide a comprehensive business analysis.

Respond in ${lang}. Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "diagnosis": {
    "summary": "Brief overview of what the data shows",
    "findings": ["finding1", "finding2"],
    "bottlenecks": ["bottleneck1"]
  },
  "insights": {
    "opportunities": ["opportunity1"],
    "risks": ["risk1"],
    "patterns": ["pattern1"]
  },
  "actionPlan": {
    "shortTerm": ["action1"],
    "mediumTerm": ["action1"],
    "longTerm": ["action1"]
  },
  "recommendations": ["Strategic recommendation 1"],
  "kpis": [
    {"name": "KPI Name", "value": "123", "trend": "up", "change": "+5%"}
  ],
  "chartsData": {
    "categories": ["Category A", "Category B"],
    "values": [100, 200],
    "chartType": "bar"
  }
}

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
          { role: "system", content: "You are an expert business data analyst. Always respond with valid JSON only, no markdown." },
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
    logStep("AI response received", { length: rawText.length, preview: rawText.substring(0, 200) });

    if (!rawText) {
      logStep("ERROR: Empty Gemini response");
      await supabase.from("analyses").update({ status: "error" }).eq("id", analysisId);
      return new Response(JSON.stringify({ error: "Empty AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Extract JSON from response - handle code blocks
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
        chartsData: null,
      };
    }

    // Ensure all fields exist with defaults
    const safeAnalysis = {
      diagnosis: analysis.diagnosis || { summary: "No diagnosis available", findings: [], bottlenecks: [] },
      insights: analysis.insights || { opportunities: [], risks: [], patterns: [] },
      actionPlan: analysis.actionPlan || { shortTerm: [], mediumTerm: [], longTerm: [] },
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      kpis: Array.isArray(analysis.kpis) ? analysis.kpis : [],
      chartsData: analysis.chartsData || null,
    };

    // Update analysis in database
    const { error: updateError } = await supabase.from("analyses").update({
      status: "completed",
      diagnosis: safeAnalysis.diagnosis,
      insights: safeAnalysis.insights,
      action_plan: safeAnalysis.actionPlan,
      recommendations: safeAnalysis.recommendations,
      kpis: safeAnalysis.kpis,
      charts_data: safeAnalysis.chartsData,
    }).eq("id", analysisId);

    if (updateError) {
      logStep("ERROR updating analysis", { error: updateError.message });
      return new Response(JSON.stringify({ error: "Failed to save analysis" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    logStep("Analysis saved successfully", { analysisId });

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
