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

  // ── Charts data as tables ──
  const chartsRaw = analysis.charts_data as any;
  const charts: any[] = Array.isArray(chartsRaw) ? chartsRaw : [];
  if (charts.length) {
    sectionTitle(pt ? "VISUALIZAÇÕES AVANÇADAS" : "ADVANCED VISUALIZATIONS");
    charts.forEach((chart: any) => {
      if (!chart.data?.length) return;
      checkPage(30);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${chart.title || "Chart"} (${chart.type || "bar"})`, margin, y);
      y += 5;

      const hasValue2 = chart.data[0]?.value2 !== undefined;
      const head = hasValue2
        ? [["Name", "Value", "Value 2"]]
        : [["Name", "Value"]];
      const body = chart.data.map((d: any) =>
        hasValue2
          ? [String(d.name || ""), String(d.value ?? ""), String(d.value2 ?? "")]
          : [String(d.name || ""), String(d.value ?? "")]
      );

      (doc as any).autoTable({
        startY: y,
        head,
        body,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
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
