import jsPDF from "jspdf";
import "jspdf-autotable";

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
  [59, 130, 246],   // blue
  [16, 185, 129],   // green
  [139, 92, 246],   // purple
  [245, 158, 11],   // yellow
  [220, 38, 38],    // red
  [6, 182, 212],    // cyan
  [249, 115, 22],   // orange
  [99, 102, 241],   // indigo
];

function drawBarChart(doc: jsPDF, data: any[], x: number, y: number, w: number, h: number) {
  const maxVal = Math.max(...data.map(d => Math.max(Number(d.value) || 0, Number(d.value2) || 0)), 1);
  const hasValue2 = data[0]?.value2 !== undefined;
  const barAreaW = w - 10;
  const barAreaH = h - 15;
  const barGroupW = barAreaW / data.length;
  const barW = hasValue2 ? barGroupW * 0.35 : barGroupW * 0.6;

  // Y-axis line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(x + 8, y, x + 8, y + barAreaH);
  doc.line(x + 8, y + barAreaH, x + w, y + barAreaH);

  // Grid lines
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

    // Label
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    const label = String(d.name || "").substring(0, 12);
    doc.text(label, bx + barW / 2, y + barAreaH + 4, { align: "center" });
  });
}

function drawLineChart(doc: jsPDF, data: any[], x: number, y: number, w: number, h: number) {
  const maxVal = Math.max(...data.map(d => Math.max(Number(d.value) || 0, Number(d.value2) || 0)), 1);
  const hasValue2 = data[0]?.value2 !== undefined;
  const chartX = x + 10;
  const chartW = w - 12;
  const chartH = h - 15;

  // Grid
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 4; i++) {
    const gy = y + chartH - (chartH * i / 4);
    doc.line(chartX, gy, chartX + chartW, gy);
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(String(Math.round(maxVal * i / 4)), x, gy + 1.5);
  }

  // Draw lines
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
    // Dots
    points.forEach(p => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.circle(p.px, p.py, 1.2, "F");
    });
  };

  drawLine(data.map(d => Number(d.value) || 0), CHART_COLORS[0]);
  if (hasValue2) drawLine(data.map(d => Number(d.value2) || 0), CHART_COLORS[1]);

  // Labels
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

    // Draw pie slice using filled triangles (approximation)
    doc.setFillColor(color[0], color[1], color[2]);
    const steps = Math.max(Math.ceil(sliceAngle / 0.05), 2);
    for (let s = 0; s < steps; s++) {
      const a1 = startAngle + (sliceAngle * s / steps);
      const a2 = startAngle + (sliceAngle * (s + 1) / steps);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      doc.triangle(cx, cy, x1, y1, x2, y2, "F");
    }
    startAngle += sliceAngle;
  });

  // Legend
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

  // Grid
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
    // Fill area with semi-transparent color
    doc.setFillColor(color[0], color[1], color[2]);
    doc.setGState(new (doc as any).GState({ opacity }));
    const points = values.map((v, i) => ({
      px: chartX + (i / (values.length - 1)) * chartW,
      py: y + chartH - (v / maxVal) * chartH,
    }));
    // Draw filled area using triangles
    for (let i = 1; i < points.length; i++) {
      doc.triangle(points[i - 1].px, points[i - 1].py, points[i].px, points[i].py, points[i].px, baseline, "F");
      doc.triangle(points[i - 1].px, points[i - 1].py, points[i].px, baseline, points[i - 1].px, baseline, "F");
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Line on top
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.7);
    for (let i = 1; i < points.length; i++) {
      doc.line(points[i - 1].px, points[i - 1].py, points[i].px, points[i].py);
    }
  };

  drawArea(data.map(d => Number(d.value) || 0), CHART_COLORS[0], 0.2);
  if (hasValue2) drawArea(data.map(d => Number(d.value2) || 0), CHART_COLORS[1], 0.15);

  // Labels
  data.forEach((d, i) => {
    const lx = chartX + (i / (data.length - 1)) * chartW;
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(d.name || "").substring(0, 10), lx, y + chartH + 4, { align: "center" });
  });
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

  // ── KPIs ──
  const kpis = (analysis.kpis as any[]) || [];
  if (kpis.length) {
    sectionTitle(pt ? "INDICADORES-CHAVE DE PERFORMANCE" : "KEY PERFORMANCE INDICATORS");
    const tableData = kpis.map((k: any) => [
      k.name,
      String(k.value),
      k.change || "-",
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

      // Chart title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(chart.title || "Chart", margin, y);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "italic");
      doc.text(`(${chart.type || "bar"})`, margin + doc.getTextWidth((chart.title || "Chart") + "  "), y);
      y += 5;

      // Draw chart background
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 55, 2, 2, "F");

      const chartType = chart.type || "bar";
      if (chartType === "pie") {
        drawPieChart(doc, chart.data.slice(0, 8), margin + 2, y + 2, contentWidth - 4, 50);
      } else if (chartType === "line") {
        drawLineChart(doc, chart.data.slice(0, 12), margin + 2, y + 2, contentWidth - 4, 50);
      } else if (chartType === "area") {
        drawAreaChart(doc, chart.data.slice(0, 12), margin + 2, y + 2, contentWidth - 4, 50);
      } else {
        drawBarChart(doc, chart.data.slice(0, 10), margin + 2, y + 2, contentWidth - 4, 50);
      }

      y += 60;
    });
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

  // ── Footer on every page ──
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
