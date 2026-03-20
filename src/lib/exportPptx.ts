import PptxGenJS from "pptxgenjs";

interface AnalysisData {
  file_name: string;
  created_at: string;
  diagnosis: any;
  insights: any;
  action_plan: any;
  recommendations: any;
  kpis: any[];
  charts_data: any;
}

const COLORS = {
  navy: "0F172A",
  blue: "3B82F6",
  white: "FFFFFF",
  gray100: "F1F5F9",
  gray400: "94A3B8",
  gray600: "475569",
  green: "10B981",
  red: "DC2626",
};

export function exportAnalysisPptx(analysis: AnalysisData, language: string) {
  const isPt = language === "pt-BR";
  const pptx = new PptxGenJS();
  pptx.author = "Datavision Pro";
  pptx.title = `${isPt ? "Relatório" : "Report"} - ${analysis.file_name}`;
  pptx.layout = "LAYOUT_WIDE";

  const addFooter = (slide: any) => {
    slide.addText(
      [
        { text: "Datavision Pro", options: { bold: true, color: COLORS.gray400, fontSize: 8 } },
        { text: `  •  ${new Date(analysis.created_at).toLocaleDateString(language)}`, options: { color: COLORS.gray400, fontSize: 8 } },
      ],
      { x: 0.5, y: 7.0, w: 5, h: 0.3 }
    );
  };

  // ── Slide 1: Cover ──
  const cover = pptx.addSlide();
  cover.background = { fill: COLORS.navy };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: COLORS.blue } });
  cover.addText("DATAVISION PRO", { x: 1, y: 1.5, w: 10, fontSize: 16, color: COLORS.blue, bold: true, letterSpacing: 4 });
  cover.addText(isPt ? "Relatório Executivo" : "Executive Report", { x: 1, y: 2.5, w: 10, fontSize: 36, color: COLORS.white, bold: true });
  cover.addText(analysis.file_name, { x: 1, y: 4.0, w: 10, fontSize: 18, color: COLORS.gray400 });
  cover.addText(new Date(analysis.created_at).toLocaleDateString(language, { year: "numeric", month: "long", day: "numeric" }), {
    x: 1, y: 4.6, w: 10, fontSize: 14, color: COLORS.gray400,
  });

  // ── Slide 2: KPIs ──
  const kpis = analysis.kpis as any[];
  if (kpis?.length) {
    const kpiSlide = pptx.addSlide();
    kpiSlide.background = { fill: COLORS.white };
    kpiSlide.addText("KPIs", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
    kpiSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 1.5, h: 0.06, fill: { color: COLORS.blue } });

    const cols = Math.min(kpis.length, 4);
    const cardW = (12 - 1) / cols - 0.2;
    kpis.slice(0, 8).forEach((kpi: any, i: number) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = 0.5 + col * (cardW + 0.2);
      const yPos = 1.3 + row * 2.2;
      kpiSlide.addShape(pptx.ShapeType.rect, { x, y: yPos, w: cardW, h: 1.8, fill: { color: COLORS.gray100 }, rectRadius: 0.1 });
      kpiSlide.addText(kpi.name, { x: x + 0.2, y: yPos + 0.15, w: cardW - 0.4, fontSize: 10, color: COLORS.gray600, bold: true });
      kpiSlide.addText(kpi.value, { x: x + 0.2, y: yPos + 0.55, w: cardW - 0.4, fontSize: 28, color: COLORS.navy, bold: true });
      if (kpi.change) {
        const trendColor = kpi.trend === "up" ? COLORS.green : kpi.trend === "down" ? COLORS.red : COLORS.gray400;
        const arrow = kpi.trend === "up" ? "▲ " : kpi.trend === "down" ? "▼ " : "→ ";
        kpiSlide.addText(arrow + kpi.change, { x: x + 0.2, y: yPos + 1.2, w: cardW - 0.4, fontSize: 11, color: trendColor, bold: true });
      }
    });
    addFooter(kpiSlide);
  }

  // ── Slide 3: Diagnosis ──
  const d = analysis.diagnosis as any;
  if (d) {
    const diagSlide = pptx.addSlide();
    diagSlide.background = { fill: COLORS.white };
    diagSlide.addText(isPt ? "Diagnóstico" : "Diagnosis", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
    diagSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 1.5, h: 0.06, fill: { color: COLORS.blue } });

    if (d.summary) {
      diagSlide.addText(d.summary, { x: 0.5, y: 1.2, w: 12, h: 1.2, fontSize: 13, color: COLORS.gray600, valign: "top", wrap: true });
    }

    let yOffset = 2.6;
    if (d.findings?.length) {
      diagSlide.addText(isPt ? "Descobertas" : "Findings", { x: 0.5, y: yOffset, w: 5, fontSize: 14, color: COLORS.navy, bold: true });
      yOffset += 0.4;
      d.findings.slice(0, 4).forEach((f: string) => {
        diagSlide.addText([
          { text: "● ", options: { color: COLORS.blue, fontSize: 10 } },
          { text: f, options: { color: COLORS.gray600, fontSize: 10 } },
        ], { x: 0.7, y: yOffset, w: 11.5, h: 0.45, valign: "top", wrap: true });
        yOffset += 0.5;
      });
    }

    if (d.bottlenecks?.length) {
      yOffset += 0.2;
      diagSlide.addText(isPt ? "Gargalos" : "Bottlenecks", { x: 0.5, y: yOffset, w: 5, fontSize: 14, color: COLORS.red, bold: true });
      yOffset += 0.4;
      d.bottlenecks.slice(0, 3).forEach((b: string) => {
        diagSlide.addText([
          { text: "● ", options: { color: COLORS.red, fontSize: 10 } },
          { text: b, options: { color: COLORS.gray600, fontSize: 10 } },
        ], { x: 0.7, y: yOffset, w: 11.5, h: 0.45, valign: "top", wrap: true });
        yOffset += 0.5;
      });
    }
    addFooter(diagSlide);
  }

  // ── Slide 4: Insights ──
  const ins = analysis.insights as any;
  if (ins) {
    const insSlide = pptx.addSlide();
    insSlide.background = { fill: COLORS.white };
    insSlide.addText("Insights", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
    insSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 1.5, h: 0.06, fill: { color: COLORS.blue } });

    const columns = [
      { title: isPt ? "Oportunidades" : "Opportunities", items: ins.opportunities || [], color: COLORS.green },
      { title: isPt ? "Riscos" : "Risks", items: ins.risks || [], color: COLORS.red },
      { title: isPt ? "Padrões" : "Patterns", items: ins.patterns || [], color: COLORS.blue },
    ];

    columns.forEach((col, ci) => {
      const x = 0.5 + ci * 4;
      insSlide.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3.7, h: 5.2, fill: { color: COLORS.gray100 }, rectRadius: 0.1 });
      insSlide.addText(col.title, { x: x + 0.2, y: 1.3, w: 3.3, fontSize: 14, color: col.color, bold: true });
      col.items.slice(0, 5).forEach((item: string, ii: number) => {
        insSlide.addText([
          { text: "● ", options: { color: col.color, fontSize: 9 } },
          { text: item, options: { color: COLORS.gray600, fontSize: 9 } },
        ], { x: x + 0.3, y: 1.85 + ii * 0.7, w: 3.2, h: 0.6, valign: "top", wrap: true });
      });
    });
    addFooter(insSlide);
  }

  // ── Slide 5: Action Plan ──
  const ap = analysis.action_plan as any;
  if (ap) {
    const apSlide = pptx.addSlide();
    apSlide.background = { fill: COLORS.white };
    apSlide.addText(isPt ? "Plano de Ação" : "Action Plan", { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.navy, bold: true });
    apSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 1.5, h: 0.06, fill: { color: COLORS.blue } });

    const terms = [
      { label: isPt ? "Curto Prazo" : "Short Term", items: ap.shortTerm || [], color: COLORS.green },
      { label: isPt ? "Médio Prazo" : "Medium Term", items: ap.mediumTerm || [], color: COLORS.blue },
      { label: isPt ? "Longo Prazo" : "Long Term", items: ap.longTerm || [], color: COLORS.navy },
    ];

    terms.forEach((term, ti) => {
      const x = 0.5 + ti * 4;
      apSlide.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3.7, h: 0.5, fill: { color: term.color }, rectRadius: 0.08 });
      apSlide.addText(term.label, { x, y: 1.2, w: 3.7, h: 0.5, fontSize: 13, color: COLORS.white, bold: true, align: "center", valign: "middle" });
      term.items.slice(0, 5).forEach((item: string, ii: number) => {
        apSlide.addText(`${ii + 1}. ${item}`, { x: x + 0.15, y: 1.9 + ii * 0.7, w: 3.4, h: 0.6, fontSize: 9.5, color: COLORS.gray600, valign: "top", wrap: true });
      });
    });
    addFooter(apSlide);
  }

  // ── Slide 6: Recommendations ──
  const recs = analysis.recommendations as any;
  if (recs?.length) {
    const recSlide = pptx.addSlide();
    recSlide.background = { fill: COLORS.navy };
    recSlide.addText(isPt ? "Recomendações Estratégicas" : "Strategic Recommendations", {
      x: 0.5, y: 0.3, w: 10, fontSize: 24, color: COLORS.white, bold: true,
    });
    recSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 1.5, h: 0.06, fill: { color: COLORS.blue } });

    recs.slice(0, 6).forEach((r: string, i: number) => {
      const yPos = 1.3 + i * 0.95;
      recSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: yPos, w: 0.55, h: 0.55, fill: { color: COLORS.blue }, rectRadius: 0.06 });
      recSlide.addText(`${i + 1}`, { x: 0.5, y: yPos, w: 0.55, h: 0.55, fontSize: 14, color: COLORS.white, bold: true, align: "center", valign: "middle" });
      recSlide.addText(r, { x: 1.2, y: yPos, w: 11, h: 0.7, fontSize: 12, color: COLORS.gray100, valign: "top", wrap: true });
    });
  }

  pptx.writeFile({ fileName: `Datavision_Report_${analysis.file_name.replace(/\.[^.]+$/, "")}.pptx` });
}
