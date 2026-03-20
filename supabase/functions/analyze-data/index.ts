import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { analysisId, fileContent, fileName, language } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = language === "pt-BR" ? "Portuguese (Brazil)" : "English";

    const prompt = `You are an expert business analyst, strategic consultant, and data scientist. Analyze the following data from "${fileName}" and provide a comprehensive business analysis.

Respond in ${lang}. Return ONLY valid JSON with this exact structure:
{
  "diagnosis": {
    "summary": "Brief overview of what the data shows",
    "findings": ["finding1", "finding2", ...],
    "bottlenecks": ["bottleneck1", ...]
  },
  "insights": {
    "opportunities": ["opportunity1", ...],
    "risks": ["risk1", ...],
    "patterns": ["pattern1", ...]
  },
  "actionPlan": {
    "shortTerm": ["action1", ...],
    "mediumTerm": ["action1", ...],
    "longTerm": ["action1", ...]
  },
  "recommendations": ["Strategic recommendation 1", ...],
  "kpis": [
    {"name": "KPI Name", "value": "value", "trend": "up|down|stable", "change": "+X%"}
  ],
  "chartsData": {
    "categories": ["cat1", "cat2"],
    "values": [10, 20],
    "chartType": "bar|line|pie"
  }
}

DATA:
${fileContent.substring(0, 15000)}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    let analysis;
    try {
      analysis = JSON.parse(jsonMatch?.[0] || "{}");
    } catch {
      analysis = { diagnosis: { summary: rawText, findings: [], bottlenecks: [] }, insights: { opportunities: [], risks: [], patterns: [] }, actionPlan: { shortTerm: [], mediumTerm: [], longTerm: [] }, recommendations: [rawText], kpis: [], chartsData: null };
    }

    // Update analysis in database
    await supabase.from("analyses").update({
      status: "completed",
      diagnosis: analysis.diagnosis,
      insights: analysis.insights,
      action_plan: analysis.actionPlan,
      recommendations: analysis.recommendations,
      kpis: analysis.kpis,
      charts_data: analysis.chartsData,
    }).eq("id", analysisId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
