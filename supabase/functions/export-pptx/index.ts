import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import PptxGenJS from "npm:pptxgenjs@3.12.0";
import { corsHeaders, json, verifyPro, loadOwnedAnalysis } from "../_shared/verifyPro.ts";

const COLORS = {
  navy: "0F172A", blue: "3B82F6", white: "FFFFFF",
  gray100: "F1F5F9", gray400: "94A3B8", gray600: "475569",
  green: "10B981", red: "DC2626", amber: "F59E0B",
};

function safeName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_\-]/g, "_").slice(0, 60);
}

async function buildPptx(analysis: any, language: string, deep: boolean): Promise<ArrayBuffer> {
  const isPt = language === "pt-BR";
  const pptx = new PptxGenJS();
  pptx.author = "DataVision";
  pptx.title = `${isPt ? "Relatório" : "Report"} - ${analysis.file_name}`;
  pptx.layout = "LAYOUT_WIDE";

  const footer = (slide: any) => {
    slide.addText(
      [
        { text: "DataVision", options: { bold: true, color: COLORS.gray400, fontSize: 8 } },
        { text: `  •  ${new Date(analysis.created_at).toLocaleDateString(language)}`, options: { color: COLORS.gray400, fontSize: 8 } },
      ],
      { x: 0.5, y: 7.0, w: 5, h: 0.3 },
    );
  };

  // Cover
  const cover = pptx.addSlide();
  cover.background = { fill: COLORS.navy };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: COLORS.blue } });
  cover.addText("D A T A V I S I O N", { x: 1, y: 1.5, w: 10, fontSize: 16, color: COLORS.blue, bold: true });
  cover.addText(deep ? (isPt ? "Análise Profunda" : "Deep Analysis") : (isPt ? "Relatório Executivo" : "Executive Report"), {
    x: 1, y: 2.5, w: 10, fontSize: 36, color: COLORS.white, bold: true,
  });
  cover.addText(analysis.file_name, { x: 1, y: 4.0, w: 10, fontSize: 18, color: COLORS.gray400 });
  cover.addText(new Date(analysis.created_at).toLocaleDateString(language, { year: "numeric", month: "long", day: "numeric" }), {
    x: 1, y: 4.6, w: 10, fontSize: 14, color: COLORS.gray400,
  });

  // KPIs
  const kpis: any[] = Array.isArray(analysis.kpis) ? analysis.kpis : [];
  if (kpis.length) {
    const slide = pptx.addSlide();
    slide.background = { fill: COLORS.white };
    slide.addText("KPIs", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
    const cols = Math.min(kpis.length, 4);
    const cardW = (12 - 1) / cols - 0.2;
    kpis.slice(0, 8).forEach((kpi: any, i: number) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = 0.5 + col * (cardW + 0.2);
      const yp = 1.3 + row * 2.2;
      slide.addShape(pptx.ShapeType.rect, { x, y: yp, w: cardW, h: 1.8, fill: { color: COLORS.gray100 }, rectRadius: 0.1 });
      slide.addText(String(kpi.name ?? ""), { x: x + 0.2, y: yp + 0.15, w: cardW - 0.4, fontSize: 10, color: COLORS.gray600, bold: true });
      slide.addText(String(kpi.value ?? ""), { x: x + 0.2, y: yp + 0.55, w: cardW - 0.4, fontSize: 28, color: COLORS.navy, bold: true });
      if (kpi.change) {
        const trendColor = kpi.trend === "up" ? COLORS.green : kpi.trend === "down" ? COLORS.red : COLORS.gray400;
        const arrow = kpi.trend === "up" ? "▲ " : kpi.trend === "down" ? "▼ " : "→ ";
        slide.addText(arrow + kpi.change, { x: x + 0.2, y: yp + 1.2, w: cardW - 0.4, fontSize: 11, color: trendColor, bold: true });
      }
    });
    footer(slide);
  }

  const d = analysis.diagnosis as any;

  if (deep) {
    // Executive Score
    const score = d?.executiveScore;
    if (score) {
      const slide = pptx.addSlide();
      slide.background = { fill: COLORS.white };
      slide.addText(isPt ? "Score Executivo" : "Executive Score", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
      slide.addShape(pptx.ShapeType.ellipse, { x: 0.8, y: 1.5, w: 3.5, h: 3.5, fill: { color: COLORS.blue } });
      slide.addText(`${score.overall ?? 0}\n/100`, { x: 0.8, y: 1.5, w: 3.5, h: 3.5, fontSize: 48, color: COLORS.white, bold: true, align: "center", valign: "middle" });
      const cats = Array.isArray(score.categories) ? score.categories : [];
      cats.slice(0, 6).forEach((c: any, i: number) => {
        slide.addText(`${c.name}: ${c.score}/${c.maxScore ?? 100}`, { x: 5, y: 1.6 + i * 0.7, w: 7, h: 0.6, fontSize: 16, color: COLORS.gray600 });
      });
      if (score.verdict) slide.addText(score.verdict, { x: 0.5, y: 5.5, w: 12, h: 1.2, fontSize: 12, color: COLORS.gray600, italic: true });
      footer(slide);
    }

    // SWOT
    const swot = d?.swot;
    if (swot) {
      const slide = pptx.addSlide();
      slide.background = { fill: COLORS.white };
      slide.addText("SWOT", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
      const quadrants = [
        { key: "strengths", title: isPt ? "Forças" : "Strengths", color: COLORS.green, x: 0.5, y: 1.2 },
        { key: "weaknesses", title: isPt ? "Fraquezas" : "Weaknesses", color: COLORS.red, x: 6.5, y: 1.2 },
        { key: "opportunities", title: isPt ? "Oportunidades" : "Opportunities", color: COLORS.blue, x: 0.5, y: 4.3 },
        { key: "threats", title: isPt ? "Ameaças" : "Threats", color: COLORS.amber, x: 6.5, y: 4.3 },
      ];
      quadrants.forEach((q) => {
        slide.addShape(pptx.ShapeType.rect, { x: q.x, y: q.y, w: 6, h: 2.8, fill: { color: COLORS.gray100 }, rectRadius: 0.1 });
        slide.addText(q.title, { x: q.x + 0.2, y: q.y + 0.15, w: 5.6, fontSize: 14, color: q.color, bold: true });
        const items = swot[q.key] || [];
        items.slice(0, 4).forEach((item: string, ii: number) => {
          slide.addText([
            { text: "● ", options: { color: q.color, fontSize: 9 } },
            { text: item, options: { color: COLORS.gray600, fontSize: 9 } },
          ], { x: q.x + 0.3, y: q.y + 0.7 + ii * 0.5, w: 5.5, h: 0.45, valign: "top", wrap: true });
        });
      });
      footer(slide);
    }

    // Correlations
    const corrs = d?.correlations;
    if (Array.isArray(corrs) && corrs.length) {
      const slide = pptx.addSlide();
      slide.background = { fill: COLORS.white };
      slide.addText(isPt ? "Correlações" : "Correlations", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
      corrs.slice(0, 6).forEach((c: any, i: number) => {
        const arrow = c.relationship === "positive" ? "↗" : c.relationship === "negative" ? "↘" : "→";
        slide.addText(`${c.factor1} ${arrow} ${c.factor2}`, { x: 0.5, y: 1.3 + i * 0.9, w: 12, h: 0.4, fontSize: 14, color: COLORS.navy, bold: true });
        slide.addText(c.description, { x: 0.7, y: 1.7 + i * 0.9, w: 12, h: 0.4, fontSize: 10, color: COLORS.gray600 });
      });
      footer(slide);
    }
  }

  // Diagnosis
  if (d) {
    const slide = pptx.addSlide();
    slide.background = { fill: COLORS.white };
    slide.addText(isPt ? "Diagnóstico" : "Diagnosis", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
    if (d.summary) slide.addText(d.summary, { x: 0.5, y: 1.0, w: 12, h: 1.4, fontSize: 12, color: COLORS.gray600, valign: "top", wrap: true });
    let yo = 2.6;
    if (d.findings?.length) {
      slide.addText(isPt ? "Descobertas" : "Findings", { x: 0.5, y: yo, w: 5, fontSize: 14, color: COLORS.navy, bold: true });
      yo += 0.4;
      d.findings.slice(0, 4).forEach((f: string) => {
        slide.addText([{ text: "● ", options: { color: COLORS.blue, fontSize: 10 } }, { text: f, options: { color: COLORS.gray600, fontSize: 10 } }],
          { x: 0.7, y: yo, w: 11.5, h: 0.45, valign: "top", wrap: true });
        yo += 0.5;
      });
    }
    if (d.bottlenecks?.length) {
      yo += 0.2;
      slide.addText(isPt ? "Gargalos" : "Bottlenecks", { x: 0.5, y: yo, w: 5, fontSize: 14, color: COLORS.red, bold: true });
      yo += 0.4;
      d.bottlenecks.slice(0, 3).forEach((b: string) => {
        slide.addText([{ text: "● ", options: { color: COLORS.red, fontSize: 10 } }, { text: b, options: { color: COLORS.gray600, fontSize: 10 } }],
          { x: 0.7, y: yo, w: 11.5, h: 0.45, valign: "top", wrap: true });
        yo += 0.5;
      });
    }
    footer(slide);
  }

  // Insights
  const ins = analysis.insights as any;
  if (ins) {
    const slide = pptx.addSlide();
    slide.background = { fill: COLORS.white };
    slide.addText("Insights", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
    const columns = [
      { title: isPt ? "Oportunidades" : "Opportunities", items: ins.opportunities || [], color: COLORS.green },
      { title: isPt ? "Riscos" : "Risks", items: ins.risks || [], color: COLORS.red },
      { title: isPt ? "Padrões" : "Patterns", items: ins.patterns || [], color: COLORS.blue },
    ];
    columns.forEach((col, ci) => {
      const x = 0.5 + ci * 4;
      slide.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3.7, h: 5.2, fill: { color: COLORS.gray100 }, rectRadius: 0.1 });
      slide.addText(col.title, { x: x + 0.2, y: 1.3, w: 3.3, fontSize: 14, color: col.color, bold: true });
      col.items.slice(0, 5).forEach((item: string, ii: number) => {
        slide.addText([{ text: "● ", options: { color: col.color, fontSize: 9 } }, { text: item, options: { color: COLORS.gray600, fontSize: 9 } }],
          { x: x + 0.3, y: 1.85 + ii * 0.7, w: 3.2, h: 0.6, valign: "top", wrap: true });
      });
    });
    footer(slide);
  }

  // Action Plan
  const ap = analysis.action_plan as any;
  if (ap) {
    const slide = pptx.addSlide();
    slide.background = { fill: COLORS.white };
    slide.addText(isPt ? "Plano de Ação" : "Action Plan", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
    const terms = [
      { label: isPt ? "Curto Prazo" : "Short Term", items: ap.shortTerm || [], color: COLORS.green },
      { label: isPt ? "Médio Prazo" : "Medium Term", items: ap.mediumTerm || [], color: COLORS.blue },
      { label: isPt ? "Longo Prazo" : "Long Term", items: ap.longTerm || [], color: COLORS.navy },
    ];
    terms.forEach((term, ti) => {
      const x = 0.5 + ti * 4;
      slide.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3.7, h: 0.5, fill: { color: term.color }, rectRadius: 0.08 });
      slide.addText(term.label, { x, y: 1.2, w: 3.7, h: 0.5, fontSize: 13, color: COLORS.white, bold: true, align: "center", valign: "middle" });
      term.items.slice(0, 5).forEach((item: string, ii: number) => {
        slide.addText(`${ii + 1}. ${item}`, { x: x + 0.15, y: 1.9 + ii * 0.7, w: 3.4, h: 0.6, fontSize: 9.5, color: COLORS.gray600, valign: "top", wrap: true });
      });
    });
    footer(slide);
  }

  // Recommendations
  const recs: string[] = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];
  if (recs.length) {
    const slide = pptx.addSlide();
    slide.background = { fill: COLORS.navy };
    slide.addText(isPt ? "Recomendações Estratégicas" : "Strategic Recommendations", {
      x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.white, bold: true,
    });
    recs.slice(0, 6).forEach((r, i) => {
      const yp = 1.3 + i * 0.95;
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: yp, w: 0.55, h: 0.55, fill: { color: COLORS.blue }, rectRadius: 0.06 });
      slide.addText(`${i + 1}`, { x: 0.5, y: yp, w: 0.55, h: 0.55, fontSize: 14, color: COLORS.white, bold: true, align: "center", valign: "middle" });
      slide.addText(r, { x: 1.2, y: yp, w: 11, h: 0.7, fontSize: 12, color: COLORS.gray100, valign: "top", wrap: true });
    });
  }

  const buf = await pptx.write({ outputType: "arraybuffer" });
  return buf as ArrayBuffer;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ctx = await verifyPro(req);
    if (ctx instanceof Response) return ctx;

    const { analysisId, language = "en", deep = false } = await req.json().catch(() => ({}));
    const loaded = await loadOwnedAnalysis(ctx.supabase, analysisId, ctx.user.id);
    if (loaded.error) return loaded.error;

    const buf = await buildPptx(loaded.analysis, language, !!deep);
    const fname = `DataVision_${deep ? "Deep_" : ""}${safeName(loaded.analysis.file_name)}.pptx`;
    return new Response(buf, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (err) {
    console.error("[export-pptx] error:", err instanceof Error ? err.message : err);
    return json({ error: "Unable to generate PPTX" }, 500);
  }
});
