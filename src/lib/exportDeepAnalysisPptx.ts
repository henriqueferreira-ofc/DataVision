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

const C = {
  navy: "0F172A",
  blue: "3B82F6",
  white: "FFFFFF",
  gray50: "F8FAFC",
  gray100: "F1F5F9",
  gray400: "94A3B8",
  gray600: "475569",
  green: "10B981",
  red: "DC2626",
  yellow: "F59E0B",
  purple: "8B5CF6",
};

const CHART_COLORS = ["3B82F6", "10B981", "8B5CF6", "F59E0B", "DC2626", "06B6D4", "F97316", "6366F1"];

function mapChartType(type: string): "bar" | "line" | "area" | "pie" | "doughnut" {
  switch (type) {
    case "pie": return "pie";
    case "line": return "line";
    case "area": return "area";
    default: return "bar";
  }
}

export function exportDeepAnalysisPptx(analysis: AnalysisData, language: string) {
  const pt = language === "pt-BR";
  const pptx = new PptxGenJS();
  pptx.author = "Datavision Pro";
  pptx.title = `${pt ? "Análise Profunda" : "Deep Analysis"} - ${analysis.file_name}`;
  pptx.layout = "LAYOUT_WIDE";

  const footer = (slide: any) => {
    slide.addText(
      [
        { text: "Datavision Pro", options: { bold: true, color: C.gray400, fontSize: 8 } },
        { text: `  •  ${pt ? "Análise Profunda" : "Deep Analysis"}  •  ${new Date(analysis.created_at).toLocaleDateString(language)}`, options: { color: C.gray400, fontSize: 8 } },
      ],
      { x: 0.5, y: 7.0, w: 8, h: 0.3 }
    );
  };

  const slideTitle = (slide: any, title: string) => {
    slide.addText(title, { x: 0.5, y: 0.3, w: 10, fontSize: 24, color: C.navy, bold: true });
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 1.5, h: 0.06, fill: { color: C.blue } });
  };

  // ── Slide 1: Cover ──
  const cover = pptx.addSlide();
  cover.background = { fill: C.navy };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: C.blue } });
  cover.addText("D A T A V I S I O N   P R O", { x: 1, y: 1.2, w: 10, fontSize: 16, color: C.blue, bold: true });
  cover.addText(pt ? "Análise Profunda" : "Deep Analysis", { x: 1, y: 2.2, w: 10, fontSize: 40, color: C.white, bold: true });
  cover.addShape(pptx.ShapeType.rect, { x: 1, y: 3.3, w: 1.2, h: 0.35, fill: { color: C.yellow }, rectRadius: 0.04 });
  cover.addText("PRO", { x: 1, y: 3.3, w: 1.2, h: 0.35, fontSize: 12, color: C.navy, bold: true, align: "center", valign: "middle" });
  cover.addText(analysis.file_name, { x: 1, y: 4.2, w: 10, fontSize: 18, color: C.gray400 });
  cover.addText(new Date(analysis.created_at).toLocaleDateString(language, { year: "numeric", month: "long", day: "numeric" }), {
    x: 1, y: 4.8, w: 10, fontSize: 14, color: C.gray400,
  });

  // ── Slide 2: KPIs ──
  const kpis = (analysis.kpis as any[]) || [];
  if (kpis.length) {
    const s = pptx.addSlide();
    s.background = { fill: C.white };
    slideTitle(s, pt ? "Indicadores-Chave de Performance" : "Key Performance Indicators");

    const cols = Math.min(kpis.length, 3);
    const cardW = (12 - 1) / cols - 0.2;
    kpis.slice(0, 9).forEach((kpi: any, i: number) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = 0.5 + col * (cardW + 0.2);
      const yPos = 1.2 + row * 1.8;
      s.addShape(pptx.ShapeType.rect, { x, y: yPos, w: cardW, h: 1.5, fill: { color: C.gray100 }, rectRadius: 0.1 });
      s.addText(kpi.name, { x: x + 0.2, y: yPos + 0.1, w: cardW - 0.4, fontSize: 9, color: C.gray600, bold: true });
      s.addText(String(kpi.value), { x: x + 0.2, y: yPos + 0.45, w: cardW - 0.4, fontSize: 26, color: C.navy, bold: true });
      if (kpi.change) {
        const tc = kpi.trend === "up" ? C.green : kpi.trend === "down" ? C.red : C.gray400;
        const arrow = kpi.trend === "up" ? "▲ " : kpi.trend === "down" ? "▼ " : "→ ";
        s.addText(arrow + kpi.change, { x: x + 0.2, y: yPos + 1.0, w: cardW - 0.4, fontSize: 10, color: tc, bold: true });
      }
    });
    footer(s);
  }

  // ── Chart Slides: Native pptxgenjs charts ──
  const chartsRaw = analysis.charts_data as any;
  const charts: any[] = Array.isArray(chartsRaw) ? chartsRaw : [];
  charts.forEach((chart: any, ci: number) => {
    if (!chart.data?.length) return;
    const s = pptx.addSlide();
    s.background = { fill: C.white };
    slideTitle(s, chart.title || `${pt ? "Gráfico" : "Chart"} ${ci + 1}`);

    const labels = chart.data.map((d: any) => String(d.name || ""));
    const values = chart.data.map((d: any) => Number(d.value) || 0);
    const hasValue2 = chart.data[0]?.value2 !== undefined;
    const values2 = hasValue2 ? chart.data.map((d: any) => Number(d.value2) || 0) : null;

    const chartType = mapChartType(chart.type);

    const chartData: any[] = [
      { name: "Value", labels, values, color: CHART_COLORS[ci % CHART_COLORS.length] },
    ];
    if (values2) {
      chartData.push({ name: "Value 2", labels, values: values2, color: CHART_COLORS[(ci + 1) % CHART_COLORS.length] });
    }

    const commonOpts: any = {
      x: 0.5,
      y: 1.1,
      w: 12,
      h: 5.5,
      showLegend: true,
      legendPos: "b",
      legendFontSize: 9,
      showValue: false,
      catAxisLabelFontSize: 9,
      valAxisLabelFontSize: 9,
      catAxisOrientation: "minMax",
      valAxisOrientation: "minMax",
      chartColors: CHART_COLORS.slice(0, Math.max(chart.data.length, 2)),
    };

    if (chartType === "pie") {
      // Pie charts use a single series with colors per slice
      s.addChart(pptx.ChartType.pie, [{ name: "Values", labels, values }], {
        ...commonOpts,
        showPercent: true,
        showValue: false,
        showLegend: true,
        legendPos: "r",
        dataLabelPosition: "outEnd",
        dataLabelFontSize: 10,
      });
    } else if (chartType === "line") {
      s.addChart(pptx.charts.LINE, chartData, {
        ...commonOpts,
        lineSize: 2.5,
        lineDataSymbolSize: 6,
        showMarker: true,
        catGridLine: { style: "dash", size: 0.5, color: "E2E8F0" },
        valGridLine: { style: "dash", size: 0.5, color: "E2E8F0" },
      });
    } else if (chartType === "area") {
      s.addChart(pptx.charts.AREA, chartData, {
        ...commonOpts,
        opacity: 30,
        catGridLine: { style: "dash", size: 0.5, color: "E2E8F0" },
        valGridLine: { style: "dash", size: 0.5, color: "E2E8F0" },
      });
    } else {
      // Bar chart
      s.addChart(pptx.charts.BAR, chartData, {
        ...commonOpts,
        barDir: "col",
        barGapWidthPct: 80,
        catGridLine: { style: "none" },
        valGridLine: { style: "dash", size: 0.5, color: "E2E8F0" },
      });
    }

    // Add data table below chart title
    s.addText(`${pt ? "Tipo" : "Type"}: ${chart.type || "bar"}`, {
      x: 0.5, y: 6.7, w: 5, fontSize: 8, color: C.gray400, italic: true,
    });

    footer(s);
  });

  // ── Slide: Strategic Diagnosis ──
  const d = analysis.diagnosis as any;
  if (d) {
    const s = pptx.addSlide();
    s.background = { fill: C.white };
    slideTitle(s, pt ? "Diagnóstico Estratégico" : "Strategic Diagnosis");

    let yOff = 1.2;
    if (d.summary) {
      s.addText(d.summary, { x: 0.5, y: yOff, w: 12, h: 1.0, fontSize: 12, color: C.gray600, valign: "top", wrap: true });
      yOff += 1.2;
    }

    if (d.findings?.length) {
      s.addText(pt ? "Descobertas" : "Findings", { x: 0.5, y: yOff, w: 5, fontSize: 13, color: C.navy, bold: true });
      yOff += 0.35;
      d.findings.slice(0, 6).forEach((f: string, i: number) => {
        s.addShape(pptx.ShapeType.rect, { x: 0.5, y: yOff, w: 0.4, h: 0.4, fill: { color: C.blue }, rectRadius: 0.04 });
        s.addText(`${i + 1}`, { x: 0.5, y: yOff, w: 0.4, h: 0.4, fontSize: 9, color: C.white, bold: true, align: "center", valign: "middle" });
        s.addText(f, { x: 1.05, y: yOff, w: 11, h: 0.4, fontSize: 10, color: C.gray600, valign: "middle", wrap: true });
        yOff += 0.5;
      });
    }

    if (d.bottlenecks?.length) {
      yOff += 0.15;
      s.addText(pt ? "Gargalos" : "Bottlenecks", { x: 0.5, y: yOff, w: 5, fontSize: 13, color: C.red, bold: true });
      yOff += 0.35;
      d.bottlenecks.slice(0, 4).forEach((b: string) => {
        s.addText([
          { text: "● ", options: { color: C.red, fontSize: 10 } },
          { text: b, options: { color: C.gray600, fontSize: 10 } },
        ], { x: 0.7, y: yOff, w: 11.5, h: 0.4, valign: "top", wrap: true });
        yOff += 0.5;
      });
    }
    footer(s);
  }

  // ── Slide: Opportunities & Risks ──
  const ins = analysis.insights as any;
  if (ins) {
    const s = pptx.addSlide();
    s.background = { fill: C.white };
    slideTitle(s, pt ? "Análise de Oportunidades e Riscos" : "Opportunities & Risk Analysis");

    const columns = [
      { title: pt ? "Oportunidades" : "Opportunities", items: ins.opportunities || [], color: C.green },
      { title: pt ? "Riscos" : "Risks", items: ins.risks || [], color: C.red },
      { title: pt ? "Padrões" : "Patterns", items: ins.patterns || [], color: C.blue },
    ];

    columns.forEach((col, ci) => {
      const x = 0.5 + ci * 4;
      s.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3.7, h: 5.2, fill: { color: C.gray100 }, rectRadius: 0.1 });
      s.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3.7, h: 0.06, fill: { color: col.color } });
      s.addText(col.title, { x: x + 0.2, y: 1.35, w: 3.3, fontSize: 13, color: col.color, bold: true });
      col.items.slice(0, 6).forEach((item: string, ii: number) => {
        s.addText([
          { text: "● ", options: { color: col.color, fontSize: 9 } },
          { text: item, options: { color: C.gray600, fontSize: 9 } },
        ], { x: x + 0.3, y: 1.9 + ii * 0.7, w: 3.2, h: 0.6, valign: "top", wrap: true });
      });
    });
    footer(s);
  }

  // ── Slide: Strategic Recommendations ──
  const recs = (analysis.recommendations as string[]) || [];
  if (recs.length) {
    const s = pptx.addSlide();
    s.background = { fill: C.navy };
    s.addText(pt ? "Recomendações Estratégicas" : "Strategic Recommendations", {
      x: 0.5, y: 0.3, w: 10, fontSize: 24, color: C.white, bold: true,
    });
    s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 1.5, h: 0.06, fill: { color: C.blue } });

    const half = Math.ceil(recs.length / 2);
    const leftRecs = recs.slice(0, half);
    const rightRecs = recs.slice(half);

    [leftRecs, rightRecs].forEach((col, ci) => {
      const xBase = ci === 0 ? 0.5 : 6.5;
      col.forEach((r: string, i: number) => {
        const idx = ci === 0 ? i : i + half;
        const yPos = 1.2 + i * 0.9;
        s.addShape(pptx.ShapeType.rect, { x: xBase, y: yPos, w: 0.5, h: 0.5, fill: { color: C.blue }, rectRadius: 0.06 });
        s.addText(`${idx + 1}`, { x: xBase, y: yPos, w: 0.5, h: 0.5, fontSize: 13, color: C.white, bold: true, align: "center", valign: "middle" });
        s.addText(r, { x: xBase + 0.65, y: yPos, w: 5.2, h: 0.7, fontSize: 10.5, color: C.gray100, valign: "top", wrap: true });
      });
    });
  }

  // ── Slide: Strategic Action Plan ──
  const ap = analysis.action_plan as any;
  if (ap) {
    const s = pptx.addSlide();
    s.background = { fill: C.white };
    slideTitle(s, pt ? "Plano de Ação Estratégico" : "Strategic Action Plan");

    const terms = [
      { label: pt ? "Curto Prazo (1-3 meses)" : "Short Term (1-3 months)", items: ap.shortTerm || [], color: C.green },
      { label: pt ? "Médio Prazo (3-6 meses)" : "Medium Term (3-6 months)", items: ap.mediumTerm || [], color: C.blue },
      { label: pt ? "Longo Prazo (6-12 meses)" : "Long Term (6-12 months)", items: ap.longTerm || [], color: C.yellow },
    ];

    terms.forEach((term, ti) => {
      const x = 0.5 + ti * 4;
      s.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3.7, h: 0.5, fill: { color: term.color }, rectRadius: 0.08 });
      s.addText(term.label, { x, y: 1.2, w: 3.7, h: 0.5, fontSize: 11, color: C.white, bold: true, align: "center", valign: "middle" });
      term.items.slice(0, 6).forEach((item: string, ii: number) => {
        s.addText(`${ii + 1}. ${item}`, { x: x + 0.15, y: 1.9 + ii * 0.7, w: 3.4, h: 0.6, fontSize: 9, color: C.gray600, valign: "top", wrap: true });
      });
    });
    footer(s);
  }

  // ── Slide: Closing ──
  const closing = pptx.addSlide();
  closing.background = { fill: C.navy };
  closing.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: C.blue } });
  closing.addText("D A T A V I S I O N   P R O", { x: 1, y: 2.0, w: 10, fontSize: 16, color: C.blue, bold: true });
  closing.addText(pt ? "Obrigado" : "Thank You", { x: 1, y: 3.0, w: 10, fontSize: 40, color: C.white, bold: true });
  closing.addText(pt ? "Relatório gerado automaticamente pela plataforma Datavision Pro" : "Report automatically generated by Datavision Pro platform", {
    x: 1, y: 4.2, w: 10, fontSize: 14, color: C.gray400,
  });

  pptx.writeFile({ fileName: `Datavision_DeepAnalysis_${analysis.file_name.replace(/\.[^.]+$/, "")}.pptx` });
}
