import jsPDF from "jspdf";
import "jspdf-autotable";
import { deriveStrategicSections } from "./deriveStrategicSections";

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

const CHART_COLORS = [
  [59, 130, 246], [16, 185, 129], [139, 92, 246],
  [245, 158, 11], [220, 38, 38], [6, 182, 212],
  [249, 115, 22], [99, 102, 241],
];

function drawBarChart(doc: jsPDF, data: any[], x: number, y: number, w: number, h: number) {
  const maxVal = Math.max(...data.map(d => Math.max(Number(d.value) || 0, Number(d.value2) || 0)), 1);
  const hasValue2 = data[0]?.value2 !== undefined;
  const barAreaW = w - 10;
  const barAreaH = h - 15;
  const barGroupW = barAreaW / data.length;
  const barW = hasValue2 ? barGroupW * 0.35 : barGroupW * 0.6;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(x + 8, y, x + 8, y + barAreaH);
  doc.line(x + 8, y + barAreaH, x + w, y + barAreaH);

  for (let i = 0; i <= 4; i++) {
    const gy = y + barAreaH - (barAreaH * i / 4);
    doc.setDrawColor(230, 230, 230);
    doc.line(x + 8, gy, x + w, gy);
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(String(Math.round(maxVal * i / 4)), x, gy + 1.5);
  }

  data.forEach((d, i) => {
    const bx = x + 10 + i * barGroupW + (barGroupW - (hasValue2 ? barW * 2 + 1 : barW)) / 2;
    const val = Number(d.value) || 0;
    const barH = (val / maxVal) * barAreaH;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(bx, y + barAreaH - barH, barW, barH, 0.5, 0.5, "F");

    if (hasValue2) {
      const val2 = Number(d.value2) || 0;
      const barH2 = (val2 / maxVal) * barAreaH;
      const color2 = CHART_COLORS[(i + 1) % CHART_COLORS.length];
      doc.setFillColor(color2[0], color2[1], color2[2]);
      doc.roundedRect(bx + barW + 1, y + barAreaH - barH2, barW, barH2, 0.5, 0.5, "F");
    }

    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(d.name || "").substring(0, 12), bx + barW / 2, y + barAreaH + 4, { align: "center" });
  });
}

function drawLineChart(doc: jsPDF, data: any[], x: number, y: number, w: number, h: number) {
  const maxVal = Math.max(...data.map(d => Math.max(Number(d.value) || 0, Number(d.value2) || 0)), 1);
  const hasValue2 = data[0]?.value2 !== undefined;
  const chartX = x + 10;
  const chartW = w - 12;
  const chartH = h - 15;

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 4; i++) {
    const gy = y + chartH - (chartH * i / 4);
    doc.line(chartX, gy, chartX + chartW, gy);
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(String(Math.round(maxVal * i / 4)), x, gy + 1.5);
  }

  const drawLine = (values: number[], color: number[]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.8);
    const points = values.map((v, i) => ({
      px: chartX + (i / (values.length - 1)) * chartW,
      py: y + chartH - (v / maxVal) * chartH,
    }));
    for (let i = 1; i < points.length; i++) {
      doc.line(points[i - 1].px, points[i - 1].py, points[i].px, points[i].py);
    }
    points.forEach(p => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.circle(p.px, p.py, 1.2, "F");
    });
  };

  drawLine(data.map(d => Number(d.value) || 0), CHART_COLORS[0]);
  if (hasValue2) drawLine(data.map(d => Number(d.value2) || 0), CHART_COLORS[1]);

  data.forEach((d, i) => {
    const lx = chartX + (i / (data.length - 1)) * chartW;
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(d.name || "").substring(0, 10), lx, y + chartH + 4, { align: "center" });
  });
}

function drawPieChart(doc: jsPDF, data: any[], x: number, y: number, w: number, h: number) {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  if (total === 0) return;
  const cx = x + w * 0.35;
  const cy = y + h * 0.45;
  const r = Math.min(w * 0.3, h * 0.4);

  let startAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const val = Number(d.value) || 0;
    const sliceAngle = (val / total) * 2 * Math.PI;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    doc.setFillColor(color[0], color[1], color[2]);
    const steps = Math.max(Math.ceil(sliceAngle / 0.05), 2);
    for (let s = 0; s < steps; s++) {
      const a1 = startAngle + (sliceAngle * s / steps);
      const a2 = startAngle + (sliceAngle * (s + 1) / steps);
      doc.triangle(cx, cy, cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2), "F");
    }
    startAngle += sliceAngle;
  });

  const legendX = x + w * 0.65;
  data.forEach((d, i) => {
    const ly = y + 5 + i * 6;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(legendX, ly - 2, 3, 3, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const pct = total > 0 ? Math.round((Number(d.value) / total) * 100) : 0;
    doc.text(`${d.name} (${pct}%)`, legendX + 5, ly + 0.5);
  });
}

function drawAreaChart(doc: jsPDF, data: any[], x: number, y: number, w: number, h: number) {
  const maxVal = Math.max(...data.map(d => Math.max(Number(d.value) || 0, Number(d.value2) || 0)), 1);
  const hasValue2 = data[0]?.value2 !== undefined;
  const chartX = x + 10;
  const chartW = w - 12;
  const chartH = h - 15;
  const baseline = y + chartH;

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 4; i++) {
    const gy = y + chartH - (chartH * i / 4);
    doc.line(chartX, gy, chartX + chartW, gy);
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(String(Math.round(maxVal * i / 4)), x, gy + 1.5);
  }

  const drawArea = (values: number[], color: number[], opacity: number) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.setGState(new (doc as any).GState({ opacity }));
    const points = values.map((v, i) => ({
      px: chartX + (i / (values.length - 1)) * chartW,
      py: y + chartH - (v / maxVal) * chartH,
    }));
    for (let i = 1; i < points.length; i++) {
      doc.triangle(points[i - 1].px, points[i - 1].py, points[i].px, points[i].py, points[i].px, baseline, "F");
      doc.triangle(points[i - 1].px, points[i - 1].py, points[i].px, baseline, points[i - 1].px, baseline, "F");
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.7);
    for (let i = 1; i < points.length; i++) {
      doc.line(points[i - 1].px, points[i - 1].py, points[i].px, points[i].py);
    }
  };

  drawArea(data.map(d => Number(d.value) || 0), CHART_COLORS[0], 0.2);
  if (hasValue2) drawArea(data.map(d => Number(d.value2) || 0), CHART_COLORS[1], 0.15);

  data.forEach((d, i) => {
    const lx = chartX + (i / (data.length - 1)) * chartW;
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(d.name || "").substring(0, 10), lx, y + chartH + 4, { align: "center" });
  });
}

function drawScoreGauge(doc: jsPDF, score: number, x: number, y: number, r: number) {
  // Background circle
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(2);
  for (let angle = -Math.PI; angle <= 0; angle += 0.05) {
    const x1 = x + r * Math.cos(angle);
    const y1 = y + r * Math.sin(angle);
    const x2 = x + r * Math.cos(angle + 0.05);
    const y2 = y + r * Math.sin(angle + 0.05);
    doc.line(x1, y1, x2, y2);
  }
  // Score arc
  const color = score >= 75 ? [16, 185, 129] : score >= 50 ? [245, 158, 11] : [220, 38, 38];
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(3);
  const endAngle = -Math.PI + (score / 100) * Math.PI;
  for (let angle = -Math.PI; angle <= endAngle; angle += 0.05) {
    const x1 = x + r * Math.cos(angle);
    const y1 = y + r * Math.sin(angle);
    const x2 = x + r * Math.cos(Math.min(angle + 0.05, endAngle));
    const y2 = y + r * Math.sin(Math.min(angle + 0.05, endAngle));
    doc.line(x1, y1, x2, y2);
  }
  // Score text
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${score}`, x, y - 2, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("/100", x, y + 4, { align: "center" });
}

export function exportDeepAnalysisPdf(analysis: AnalysisData, language: string) {
  const pt = language === "pt-BR";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkPage = (needed: number) => { if (y + needed > 270) addPage(); };

  // ── Header ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("DATAVISION PRO", margin, 16);
  doc.setFontSize(14);
  doc.text(pt ? "Análise Profunda" : "Deep Analysis", margin, 26);
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(margin, 29, 16, 6, 1.5, 1.5, "F");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("PRO", margin + 5, 33);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${analysis.file_name}  •  ${new Date(analysis.created_at).toLocaleDateString(language)}`, margin + 20, 33);
  y = 52;

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

  const bulletList = (items: string[], color = [59, 130, 246]) => {
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

  // ── Executive Score + Data Quality ──
  const diag = analysis.diagnosis as any;
  const executiveScore = diag?.executiveScore;
  const dataQuality = diag?.dataQuality;

  if (executiveScore || dataQuality) {
    sectionTitle(pt ? "VISÃO EXECUTIVA" : "EXECUTIVE OVERVIEW");

    if (executiveScore) {
      drawScoreGauge(doc, executiveScore.overall || 0, margin + 20, y + 12, 14);

      const catX = margin + 45;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(pt ? "Score Executivo" : "Executive Score", catX, y);
      y += 2;

      (executiveScore.categories || []).forEach((cat: any, i: number) => {
        const cy = y + 3 + i * 7;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`${cat.name}: ${cat.score}/${cat.maxScore || 100}`, catX, cy);
        // Progress bar
        const barW = 60;
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(catX, cy + 1, barW, 2.5, 0.5, 0.5, "F");
        const pct = (cat.score / (cat.maxScore || 100)) * barW;
        const c = cat.score >= 75 ? [16, 185, 129] : cat.score >= 50 ? [245, 158, 11] : [220, 38, 38];
        doc.setFillColor(c[0], c[1], c[2]);
        doc.roundedRect(catX, cy + 1, pct, 2.5, 0.5, 0.5, "F");
      });

      y += 5 + (executiveScore.categories?.length || 0) * 7;
      if (executiveScore.verdict) {
        bodyText(executiveScore.verdict);
      }
    }

    if (dataQuality) {
      checkPage(25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(pt ? "Qualidade dos Dados" : "Data Quality", margin, y);
      y += 6;

      const metrics = [
        { label: "Score", value: dataQuality.score },
        { label: pt ? "Completude" : "Completeness", value: dataQuality.completeness },
        { label: pt ? "Consistência" : "Consistency", value: dataQuality.consistency },
      ];
      metrics.forEach((m, i) => {
        const mx = margin + i * 55;
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`${m.label}: ${m.value}%`, mx, y);
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(mx, y + 1, 45, 2.5, 0.5, 0.5, "F");
        const c = m.value >= 75 ? [16, 185, 129] : m.value >= 50 ? [245, 158, 11] : [220, 38, 38];
        doc.setFillColor(c[0], c[1], c[2]);
        doc.roundedRect(mx, y + 1, (m.value / 100) * 45, 2.5, 0.5, 0.5, "F");
      });
      y += 8;

      if (dataQuality.observations?.length) {
        bulletList(dataQuality.observations, [99, 102, 241]);
      }
    }
  }

  // ── KPIs ──
  const kpis = (analysis.kpis as any[]) || [];
  if (kpis.length) {
    sectionTitle(pt ? "INDICADORES-CHAVE DE PERFORMANCE" : "KEY PERFORMANCE INDICATORS");
    const tableData = kpis.map((k: any) => [
      k.name, String(k.value), k.change || "-",
      k.trend === "up" ? "↑" : k.trend === "down" ? "↓" : "→",
    ]);
    (doc as any).autoTable({
      startY: y,
      head: [[pt ? "Indicador" : "Indicator", pt ? "Valor" : "Value", pt ? "Variação" : "Change", "Trend"]],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Charts ──
  const chartsRaw = analysis.charts_data as any;
  const charts: any[] = Array.isArray(chartsRaw) ? chartsRaw : [];
  if (charts.length) {
    charts.forEach((chart: any) => {
      if (!chart.data?.length) return;
      checkPage(75);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(chart.title || "Chart", margin, y);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "italic");
      doc.text(`(${chart.type || "bar"})`, margin + doc.getTextWidth((chart.title || "Chart") + "  "), y);
      y += 5;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 55, 2, 2, "F");
      const chartType = chart.type || "bar";
      if (chartType === "pie") drawPieChart(doc, chart.data.slice(0, 8), margin + 2, y + 2, contentWidth - 4, 50);
      else if (chartType === "line") drawLineChart(doc, chart.data.slice(0, 12), margin + 2, y + 2, contentWidth - 4, 50);
      else if (chartType === "area") drawAreaChart(doc, chart.data.slice(0, 12), margin + 2, y + 2, contentWidth - 4, 50);
      else drawBarChart(doc, chart.data.slice(0, 10), margin + 2, y + 2, contentWidth - 4, 50);
      y += 60;
    });
  }

  // ── SWOT Analysis ──
  const swot = diag?.swot;
  if (swot) {
    sectionTitle(pt ? "ANÁLISE SWOT" : "SWOT ANALYSIS");
    const swotSections = [
      { title: pt ? "Forças" : "Strengths", items: swot.strengths || [], color: [16, 185, 129] },
      { title: pt ? "Fraquezas" : "Weaknesses", items: swot.weaknesses || [], color: [220, 38, 38] },
      { title: pt ? "Oportunidades" : "Opportunities", items: swot.opportunities || [], color: [59, 130, 246] },
      { title: pt ? "Ameaças" : "Threats", items: swot.threats || [], color: [245, 158, 11] },
    ];

    // 2x2 grid layout
    const halfW = (contentWidth - 4) / 2;
    swotSections.forEach((s, i) => {
      const col = i % 2;
      if (i % 2 === 0 && i > 0) y += 2;
      if (i % 2 === 0) checkPage(40);
      const sx = margin + col * (halfW + 4);

      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      doc.roundedRect(sx, y, halfW, 5, 1, 1, "F");
      doc.setTextColor(255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(s.title, sx + 3, y + 3.5);

      let itemY = y + 7;
      s.items.forEach((item: string) => {
        doc.setFillColor(s.color[0], s.color[1], s.color[2]);
        doc.circle(sx + 2, itemY - 1, 0.8, "F");
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(item, halfW - 8);
        doc.text(lines, sx + 5, itemY);
        itemY += lines.length * 3.5 + 2;
      });

      if (col === 1) y = Math.max(y + 7 + s.items.length * 6, y);
    });
    y += 30;
  }

  // ── Correlations ──
  const correlations = diag?.correlations || [];
  if (correlations.length) {
    sectionTitle(pt ? "CORRELAÇÕES IDENTIFICADAS" : "IDENTIFIED CORRELATIONS");
    const tableData = correlations.map((c: any) => [
      c.factor1,
      c.relationship === "positive" ? "↗ Positiva" : c.relationship === "negative" ? "↘ Negativa" : "→ Neutra",
      c.factor2,
      c.strength === "strong" ? (pt ? "Forte" : "Strong") : c.strength === "moderate" ? (pt ? "Moderada" : "Moderate") : (pt ? "Fraca" : "Weak"),
      c.description || "",
    ]);
    (doc as any).autoTable({
      startY: y,
      head: [[pt ? "Fator 1" : "Factor 1", pt ? "Relação" : "Relation", pt ? "Fator 2" : "Factor 2", pt ? "Força" : "Strength", pt ? "Descrição" : "Description"]],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 4: { cellWidth: 55 } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Strategic Diagnosis ──
  const d = analysis.diagnosis as any;
  if (d) {
    sectionTitle(pt ? "DIAGNÓSTICO ESTRATÉGICO" : "STRATEGIC DIAGNOSIS");
    if (d.summary) bodyText(d.summary);
    if (d.findings?.length) {
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
      checkPage(8); doc.text(pt ? "Descobertas:" : "Findings:", margin, y); y += 6;
      d.findings.forEach((f: string, i: number) => {
        checkPage(10);
        doc.setFillColor(59, 130, 246);
        doc.roundedRect(margin, y - 4, 5, 5, 1, 1, "F");
        doc.setTextColor(255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
        doc.text(`${i + 1}`, margin + 1.5, y - 0.5);
        doc.setTextColor(55, 65, 81); doc.setFontSize(9.5); doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(f, contentWidth - 10);
        doc.text(lines, margin + 8, y);
        y += lines.length * 4.5 + 4;
      });
    }
    if (d.bottlenecks?.length) {
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38);
      checkPage(8); doc.text(pt ? "Gargalos:" : "Bottlenecks:", margin, y); y += 6;
      bulletList(d.bottlenecks, [220, 38, 38]);
    }
  }

  // ── Opportunities & Risks ──
  const ins = analysis.insights as any;
  if (ins) {
    sectionTitle(pt ? "ANÁLISE DE OPORTUNIDADES E RISCOS" : "OPPORTUNITIES & RISK ANALYSIS");
    const sections = [
      { title: pt ? "Oportunidades" : "Opportunities", items: ins.opportunities, color: [16, 185, 129] },
      { title: pt ? "Riscos" : "Risks", items: ins.risks, color: [220, 38, 38] },
      { title: pt ? "Padrões" : "Patterns", items: ins.patterns, color: [59, 130, 246] },
    ];
    sections.forEach(({ title, items, color }) => {
      if (items?.length) {
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
        checkPage(8); doc.text(title + ":", margin, y); y += 6;
        bulletList(items, color);
      }
    });
  }

  // ── Strategic Recommendations ──
  const recs = (analysis.recommendations as string[]) || [];
  if (recs.length) {
    sectionTitle(pt ? "RECOMENDAÇÕES ESTRATÉGICAS" : "STRATEGIC RECOMMENDATIONS");
    recs.forEach((r: string, i: number) => {
      checkPage(12);
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(margin, y - 4, 6, 6, 1, 1, "F");
      doc.setTextColor(255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}`, margin + 1.8, y);
      doc.setTextColor(55, 65, 81); doc.setFontSize(9.5); doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(r, contentWidth - 10);
      doc.text(lines, margin + 9, y);
      y += lines.length * 4.5 + 5;
    });
  }

  // ── Strategic Action Plan ──
  const ap = analysis.action_plan as any;
  if (ap) {
    sectionTitle(pt ? "PLANO DE AÇÃO ESTRATÉGICO" : "STRATEGIC ACTION PLAN");
    const terms = [
      { label: pt ? "Curto Prazo (1-3 meses)" : "Short Term (1-3 months)", items: ap.shortTerm, color: [16, 185, 129] },
      { label: pt ? "Médio Prazo (3-6 meses)" : "Medium Term (3-6 months)", items: ap.mediumTerm, color: [59, 130, 246] },
      { label: pt ? "Longo Prazo (6-12 meses)" : "Long Term (6-12 months)", items: ap.longTerm, color: [245, 158, 11] },
    ];
    terms.forEach(({ label, items, color }) => {
      if (items?.length) {
        checkPage(10);
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(margin, y - 4, contentWidth, 7, 1.5, 1.5, "F");
        doc.setTextColor(255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
        doc.text(label, margin + 3, y + 0.5);
        y += 8;
        items.forEach((item: string, i: number) => {
          checkPage(10);
          doc.setTextColor(59, 130, 246); doc.setFontSize(9.5); doc.setFont("helvetica", "bold");
          doc.text(`${i + 1}.`, margin, y);
          doc.setTextColor(55, 65, 81); doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(item, contentWidth - 8);
          doc.text(lines, margin + 6, y);
          y += lines.length * 4.5 + 3;
        });
        y += 3;
      }
    });
  }

  // ── Footer ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 282, pageWidth, 15, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`Datavision Pro  •  ${pt ? "Análise Profunda" : "Deep Analysis"}  •  ${pt ? "Página" : "Page"} ${i}/${pages}`, margin, 289);
    doc.text(new Date().toLocaleDateString(language), pageWidth - margin - 20, 289);
  }

  doc.save(`Datavision_DeepAnalysis_${analysis.file_name.replace(/\.[^.]+$/, "")}.pdf`);
}
