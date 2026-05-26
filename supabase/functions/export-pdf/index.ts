import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { jsPDF } from "npm:jspdf@2.5.2";
import { corsHeaders, json, verifyPro, loadOwnedAnalysis } from "../_shared/verifyPro.ts";

function safeName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_\-]/g, "_").slice(0, 60);
}

function buildPdf(analysis: any, language: string, deep: boolean): ArrayBuffer {
  const isPt = language === "pt-BR";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkPage = (needed: number) => { if (y + needed > 270) addPage(); };

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("DATAVISION PRO", margin, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(deep ? (isPt ? "Análise Profunda" : "Deep Analysis") : (isPt ? "Relatório Executivo" : "Executive Report"), margin, 24);
  doc.setFontSize(9);
  doc.text(`${analysis.file_name}  •  ${new Date(analysis.created_at).toLocaleDateString(language)}`, margin, 32);
  y = 48;

  const sectionTitle = (title: string) => {
    checkPage(20);
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, y, 3, 8, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 6, y + 6);
    y += 14;
  };

  const bodyText = (text: string) => {
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPage(lines.length * 5);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

  const bulletList = (items: string[], color: number[] = [59, 130, 246]) => {
    items.forEach((item) => {
      doc.setFillColor(color[0], color[1], color[2]);
      checkPage(10);
      doc.circle(margin + 2, y - 1, 1.2, "F");
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(item, contentWidth - 8);
      doc.text(lines, margin + 6, y);
      y += lines.length * 4.5 + 3;
    });
  };

  const labeledList = (label: string, items: string[], color: number[] = [59, 130, 246]) => {
    if (!items?.length) return;
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
    checkPage(8); doc.text(label, margin, y); y += 6;
    bulletList(items, color);
  };

  // KPIs as manual table
  const kpis: any[] = Array.isArray(analysis.kpis) ? analysis.kpis : [];
  if (kpis.length) {
    sectionTitle("KPIs");
    const rowH = 7;
    const colW = [contentWidth * 0.4, contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.1];
    const headers = [isPt ? "Indicador" : "Indicator", isPt ? "Valor" : "Value", isPt ? "Variação" : "Change", "Trend"];
    checkPage(rowH * (kpis.length + 1));
    doc.setFillColor(15, 23, 42); doc.rect(margin, y, contentWidth, rowH, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    let cx = margin + 2;
    headers.forEach((h, i) => { doc.text(h, cx, y + 5); cx += colW[i]; });
    y += rowH;
    kpis.forEach((k, idx) => {
      if (idx % 2 === 1) { doc.setFillColor(248, 250, 252); doc.rect(margin, y, contentWidth, rowH, "F"); }
      doc.setTextColor(55, 65, 81); doc.setFont("helvetica", "normal");
      const row = [String(k.name ?? ""), String(k.value ?? ""), String(k.change ?? "-"), k.trend === "up" ? "^" : k.trend === "down" ? "v" : "-"];
      cx = margin + 2;
      row.forEach((cell, i) => {
        const lines = doc.splitTextToSize(cell, colW[i] - 4);
        doc.text(lines[0] ?? "", cx, y + 5);
        cx += colW[i];
      });
      y += rowH;
    });
    y += 6;
  }

  // Deep-only: Executive Score
  if (deep) {
    const d = analysis.diagnosis as any;
    const score = d?.executiveScore;
    if (score) {
      sectionTitle(isPt ? "SCORE EXECUTIVO" : "EXECUTIVE SCORE");
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(margin, y, 40, 22, 2, 2, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont("helvetica", "bold");
      doc.text(`${score.overall ?? 0}/100`, margin + 4, y + 14);
      doc.setTextColor(55, 65, 81); doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const cats = Array.isArray(score.categories) ? score.categories : [];
      cats.forEach((c: any, i: number) => {
        const cy = y + 2 + i * 5;
        doc.text(`${c.name}: ${c.score}/${c.maxScore ?? 100}`, margin + 46, cy + 3);
      });
      y += 28;
      if (score.verdict) bodyText(score.verdict);
    }

    const dq = d?.dataQuality;
    if (dq) {
      sectionTitle(isPt ? "QUALIDADE DOS DADOS" : "DATA QUALITY");
      bodyText(`${isPt ? "Score" : "Score"}: ${dq.score ?? 0}/100 — ${isPt ? "Completude" : "Completeness"}: ${dq.completeness ?? 0}% — ${isPt ? "Consistência" : "Consistency"}: ${dq.consistency ?? 0}%`);
      if (Array.isArray(dq.observations) && dq.observations.length) bulletList(dq.observations);
    }

    const swot = d?.swot;
    if (swot) {
      sectionTitle("SWOT");
      labeledList(isPt ? "Forças:" : "Strengths:", swot.strengths || [], [16, 185, 129]);
      labeledList(isPt ? "Fraquezas:" : "Weaknesses:", swot.weaknesses || [], [220, 38, 38]);
      labeledList(isPt ? "Oportunidades:" : "Opportunities:", swot.opportunities || [], [59, 130, 246]);
      labeledList(isPt ? "Ameaças:" : "Threats:", swot.threats || [], [245, 158, 11]);
    }

    const corrs = d?.correlations;
    if (Array.isArray(corrs) && corrs.length) {
      sectionTitle(isPt ? "CORRELAÇÕES" : "CORRELATIONS");
      corrs.forEach((c: any) => {
        const arrow = c.relationship === "positive" ? "↗" : c.relationship === "negative" ? "↘" : "→";
        bodyText(`${c.factor1} ${arrow} ${c.factor2} (${c.strength}) — ${c.description}`);
      });
    }
  }

  // Diagnosis
  const d = analysis.diagnosis as any;
  if (d) {
    sectionTitle(isPt ? "DIAGNÓSTICO" : "DIAGNOSIS");
    if (d.summary) bodyText(d.summary);
    labeledList(isPt ? "Descobertas:" : "Findings:", d.findings || []);
    labeledList(isPt ? "Gargalos:" : "Bottlenecks:", d.bottlenecks || [], [220, 38, 38]);
  }

  // Insights
  const ins = analysis.insights as any;
  if (ins) {
    sectionTitle("INSIGHTS");
    labeledList(isPt ? "Oportunidades:" : "Opportunities:", ins.opportunities || [], [16, 185, 129]);
    labeledList(isPt ? "Riscos:" : "Risks:", ins.risks || [], [220, 38, 38]);
    labeledList(isPt ? "Padrões:" : "Patterns:", ins.patterns || []);
  }

  // Action Plan
  const ap = analysis.action_plan as any;
  if (ap) {
    sectionTitle(isPt ? "PLANO DE AÇÃO" : "ACTION PLAN");
    labeledList(isPt ? "Curto Prazo:" : "Short Term:", ap.shortTerm || [], [16, 185, 129]);
    labeledList(isPt ? "Médio Prazo:" : "Medium Term:", ap.mediumTerm || []);
    labeledList(isPt ? "Longo Prazo:" : "Long Term:", ap.longTerm || [], [15, 23, 42]);
  }

  // Recommendations
  const recs: string[] = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];
  if (recs.length) {
    sectionTitle(isPt ? "RECOMENDAÇÕES" : "RECOMMENDATIONS");
    recs.forEach((r, i) => {
      checkPage(10);
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(margin, y - 4, 6, 6, 1, 1, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}`, margin + 1.8, y);
      doc.setTextColor(55, 65, 81); doc.setFontSize(9.5); doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(r, contentWidth - 10);
      doc.text(lines, margin + 9, y);
      y += lines.length * 4.5 + 5;
    });
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 282, pageWidth, 15, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`DataVision  •  ${isPt ? "Página" : "Page"} ${i}/${pages}`, margin, 289);
    doc.text(new Date().toLocaleDateString(language), pageWidth - margin - 20, 289);
  }

  const out = doc.output("arraybuffer");
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ctx = await verifyPro(req);
    if (ctx instanceof Response) return ctx;

    const { analysisId, language = "en", deep = false } = await req.json().catch(() => ({}));
    const loaded = await loadOwnedAnalysis(ctx.supabase, analysisId, ctx.user.id);
    if (loaded.error) return loaded.error;

    const buf = buildPdf(loaded.analysis, language, !!deep);
    const fname = `DataVision_${deep ? "Deep_" : ""}${safeName(loaded.analysis.file_name)}.pdf`;
    return new Response(buf, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (err) {
    console.error("[export-pdf] error:", err instanceof Error ? err.message : err);
    return json({ error: "Unable to generate PDF" }, 500);
  }
});
