import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight, Loader2, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

function exportAnalysisReport(analysis: any, language: string) {
  const d = analysis.diagnosis as any;
  const ins = analysis.insights as any;
  const ap = analysis.action_plan as any;
  const recs = analysis.recommendations as any;
  const kpis = analysis.kpis as any[];

  let content = `DATAVISION PRO - ${language === "pt-BR" ? "RELATÓRIO EXECUTIVO" : "EXECUTIVE REPORT"}\n`;
  content += `${"=".repeat(60)}\n`;
  content += `${language === "pt-BR" ? "Arquivo" : "File"}: ${analysis.file_name}\n`;
  content += `${language === "pt-BR" ? "Data" : "Date"}: ${new Date(analysis.created_at).toLocaleDateString(language)}\n\n`;

  if (kpis?.length) {
    content += `--- KPIs ---\n`;
    kpis.forEach((k: any) => { content += `• ${k.name}: ${k.value} (${k.change || ""})\n`; });
    content += "\n";
  }
  if (d) {
    content += `--- ${language === "pt-BR" ? "DIAGNÓSTICO" : "DIAGNOSIS"} ---\n${d.summary}\n\n`;
    if (d.findings?.length) { content += `${language === "pt-BR" ? "Descobertas" : "Findings"}:\n`; d.findings.forEach((f: string) => { content += `• ${f}\n`; }); content += "\n"; }
    if (d.bottlenecks?.length) { content += `${language === "pt-BR" ? "Gargalos" : "Bottlenecks"}:\n`; d.bottlenecks.forEach((b: string) => { content += `• ${b}\n`; }); content += "\n"; }
  }
  if (ins) {
    content += `--- INSIGHTS ---\n`;
    if (ins.opportunities?.length) { ins.opportunities.forEach((o: string) => { content += `• ${o}\n`; }); content += "\n"; }
    if (ins.risks?.length) { content += `${language === "pt-BR" ? "Riscos" : "Risks"}:\n`; ins.risks.forEach((r: string) => { content += `• ${r}\n`; }); content += "\n"; }
  }
  if (ap) {
    content += `--- ${language === "pt-BR" ? "PLANO DE AÇÃO" : "ACTION PLAN"} ---\n`;
    if (ap.shortTerm?.length) { content += `${language === "pt-BR" ? "Curto Prazo" : "Short Term"}:\n`; ap.shortTerm.forEach((a: string) => { content += `• ${a}\n`; }); content += "\n"; }
    if (ap.mediumTerm?.length) { content += `${language === "pt-BR" ? "Médio Prazo" : "Medium Term"}:\n`; ap.mediumTerm.forEach((a: string) => { content += `• ${a}\n`; }); content += "\n"; }
    if (ap.longTerm?.length) { content += `${language === "pt-BR" ? "Longo Prazo" : "Long Term"}:\n`; ap.longTerm.forEach((a: string) => { content += `• ${a}\n`; }); content += "\n"; }
  }
  if (recs?.length) {
    content += `--- ${language === "pt-BR" ? "RECOMENDAÇÕES" : "RECOMMENDATIONS"} ---\n`;
    recs.forEach((r: string, i: number) => { content += `${i + 1}. ${r}\n`; });
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Datavision_Report_${analysis.file_name.replace(/\.[^.]+$/, "")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const { data: analyses, isLoading } = useAnalyses();
  const { toast } = useToast();
  const locale = language === "pt-BR" ? ptBR : enUS;
  const completedAnalyses = analyses?.filter((a) => a.status === "completed") || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.reports}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {language === "pt-BR" ? "Exporte relatórios executivos das suas análises concluídas" : "Export executive reports from your completed analyses"}
        </p>
      </div>

      {completedAnalyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{t.dashboard.noAnalyses}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.dashboard.noAnalysesDesc}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {completedAnalyses.map((analysis) => (
            <Card key={analysis.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{analysis.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={(e) => {
                      e.preventDefault();
                      exportAnalysisReport(analysis, language);
                      toast({ title: language === "pt-BR" ? "Relatório exportado!" : "Report exported!" });
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {language === "pt-BR" ? "Exportar" : "Export"}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
                    <Link to={`/dashboard/analyses/${analysis.id}`}>
                      {t.dashboard.viewResults}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
