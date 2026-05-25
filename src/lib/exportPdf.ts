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

export function exportAnalysisPdf(analysis: AnalysisData, language: string) {
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
  doc.text(isPt ? "Relatório Executivo" : "Executive Report", margin, 24);
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

  const bulletList = (items: string[], color = [59, 130, 246]) => {
    items.forEach((item) => {
      doc.setFillColor(color[0], color[1], color[2]);
      checkPage(10);
      doc.circle(margin + 2, y - 1, 1.2, "F");
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(9.5);
      const lines = doc.splitTextToSize(item, contentWidth - 8);
      doc.text(lines, margin + 6, y);
      y += lines.length * 4.5 + 3;
    });
  };

  // KPIs
  const kpis = analysis.kpis as any[];
  if (kpis?.length) {
    sectionTitle("KPIs");
    const tableData = kpis.map((k: any) => [k.name, k.value, k.change || "-", k.trend === "up" ? "↑" : k.trend === "down" ? "↓" : "→"]);
    (doc as any).autoTable({
      startY: y,
      head: [[isPt ? "Indicador" : "Indicator", isPt ? "Valor" : "Value", isPt ? "Variação" : "Change", "Trend"]],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Diagnosis
  const d = analysis.diagnosis as any;
  if (d) {
    sectionTitle(isPt ? "DIAGNÓSTICO" : "DIAGNOSIS");
    if (d.summary) bodyText(d.summary);
    if (d.findings?.length) {
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
      checkPage(8); doc.text(isPt ? "Descobertas:" : "Findings:", margin, y); y += 6;
      bulletList(d.findings);
    }
    if (d.bottlenecks?.length) {
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
      checkPage(8); doc.text(isPt ? "Gargalos:" : "Bottlenecks:", margin, y); y += 6;
      bulletList(d.bottlenecks, [220, 38, 38]);
    }
  }

  // Insights
  const ins = analysis.insights as any;
  if (ins) {
    sectionTitle("INSIGHTS");
    const sections = [
      { title: isPt ? "Oportunidades" : "Opportunities", items: ins.opportunities, color: [16, 185, 129] },
      { title: isPt ? "Riscos" : "Risks", items: ins.risks, color: [220, 38, 38] },
      { title: isPt ? "Padrões" : "Patterns", items: ins.patterns, color: [59, 130, 246] },
    ];
    sections.forEach(({ title, items, color }) => {
      if (items?.length) {
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
        checkPage(8); doc.text(title + ":", margin, y); y += 6;
        bulletList(items, color);
      }
    });
  }

  // Action Plan
  const ap = analysis.action_plan as any;
  if (ap) {
    sectionTitle(isPt ? "PLANO DE AÇÃO" : "ACTION PLAN");
    const terms = [
      { label: isPt ? "Curto Prazo" : "Short Term", items: ap.shortTerm },
      { label: isPt ? "Médio Prazo" : "Medium Term", items: ap.mediumTerm },
      { label: isPt ? "Longo Prazo" : "Long Term", items: ap.longTerm },
    ];
    terms.forEach(({ label, items }) => {
      if (items?.length) {
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
        checkPage(8); doc.text(label + ":", margin, y); y += 6;
        items.forEach((item: string, i: number) => {
          checkPage(10);
          doc.setTextColor(59, 130, 246); doc.setFontSize(9.5); doc.setFont("helvetica", "bold");
          doc.text(`${i + 1}.`, margin, y);
          doc.setTextColor(55, 65, 81); doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(item, contentWidth - 8);
          doc.text(lines, margin + 6, y);
          y += lines.length * 4.5 + 3;
        });
      }
    });
  }

  // Recommendations
  const recs = analysis.recommendations as any;
  if (recs?.length) {
    sectionTitle(isPt ? "RECOMENDAÇÕES" : "RECOMMENDATIONS");
    recs.forEach((r: string, i: number) => {
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

  // Footer on every page
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

  doc.save(`DataVision_Report_${analysis.file_name.replace(/\.[^.]+$/, "")}.pdf`);
}
