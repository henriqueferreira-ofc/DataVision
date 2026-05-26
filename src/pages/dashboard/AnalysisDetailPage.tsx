import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalysis } from "@/hooks/useAnalyses";
import { useSubscription, isPro } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus,
  Stethoscope, Lightbulb, Target, Star, AlertCircle,
  FileText, Presentation, Crown, Lock, Microscope,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { downloadPdf, downloadPptx } from "@/lib/serverExports";

const CHART_COLORS = [
  "hsl(217, 91%, 60%)", "hsl(168, 72%, 43%)", "hsl(280, 65%, 60%)",
  "hsl(30, 90%, 55%)", "hsl(340, 75%, 55%)", "hsl(190, 80%, 45%)",
];

function ChartCard({ chart, index }: { chart: any; index: number }) {
  if (!chart?.data?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{chart.title || `Chart ${index + 1}`}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          {chart.type === "pie" ? (
            <PieChart><Pie data={chart.data} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>{chart.data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
          ) : chart.type === "line" ? (
            <LineChart data={chart.data}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 4 }} />{chart.data[0]?.value2 !== undefined && <Line type="monotone" dataKey="value2" stroke={CHART_COLORS[1]} strokeWidth={2} />}<Legend /></LineChart>
          ) : chart.type === "area" ? (
            <AreaChart data={chart.data}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Area type="monotone" dataKey="value" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.2} />{chart.data[0]?.value2 !== undefined && <Area type="monotone" dataKey="value2" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.15} />}<Legend /></AreaChart>
          ) : (
            <BarChart data={chart.data}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />{chart.data[0]?.value2 !== undefined && <Bar dataKey="value2" fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />}<Legend /></BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function AnalysisDetailPage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { data: analysis, isLoading } = useAnalysis(id);
  const { plan } = useSubscription();
  const { toast } = useToast();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const pt = language === "pt-BR";
  const userIsPro = isPro(plan);

  const [exporting, setExporting] = useState<"pdf" | "pptx" | null>(null);

  const runExport = async (kind: "pdf" | "pptx") => {
    if (!analysis || !id) return;
    setExporting(kind);
    try {
      if (kind === "pdf") await downloadPdf(id, language, false);
      else await downloadPptx(id, language, false);
      toast({ title: pt ? (kind === "pdf" ? "PDF exportado!" : "PowerPoint exportado!") : (kind === "pdf" ? "PDF exported!" : "PowerPoint exported!") });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "PRO_REQUIRED") {
        setShowUpgrade(true);
      } else {
        toast({ variant: "destructive", title: pt ? "Erro" : "Error", description: msg });
      }
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = () => runExport("pdf");
  const handleExportPPTX = () => runExport("pptx");

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!analysis) return <div className="py-20 text-center"><p className="text-muted-foreground">{pt ? "Análise não encontrada" : "Analysis not found"}</p></div>;

  const isProcessing = analysis.status === "processing" || analysis.status === "pending";
  const diagnosis = analysis.diagnosis as any;
  const insights = analysis.insights as any;
  const actionPlan = analysis.action_plan as any;
  const recommendations = analysis.recommendations as any;
  const kpis = analysis.kpis as any[];
  const chartsRaw = analysis.charts_data as any;
  let charts: any[] = Array.isArray(chartsRaw) ? chartsRaw : [];
  if (charts.length === 0 && chartsRaw?.categories) {
    charts = [{ title: "Overview", type: chartsRaw.chartType || "bar", data: chartsRaw.categories.map((cat: string, i: number) => ({ name: cat, value: chartsRaw.values[i] })) }];
  }

  // Basic users see only first 2 charts
  const visibleCharts = userIsPro ? charts : charts.slice(0, 2);

  return (
    <div className="space-y-6">
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature={pt ? "Exportação de Relatórios" : "Report Export"} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0"><Link to="/dashboard/analyses"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{analysis.file_name}</h1>
            <p className="text-sm text-muted-foreground">{new Date(analysis.created_at).toLocaleDateString(language, { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
        {analysis.status === "completed" && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPDF} disabled={exporting === "pdf"}>
              {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>{!userIsPro && <Lock className="h-3 w-3" />}<FileText className="h-3.5 w-3.5" /></>} <span>PDF</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPPTX} disabled={exporting === "pptx"}>
              {exporting === "pptx" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>{!userIsPro && <Lock className="h-3 w-3" />}<Presentation className="h-3.5 w-3.5" /></>} <span>PPTX</span>
            </Button>
            {userIsPro && (
              <Button size="sm" className="col-span-2 gap-1.5 sm:col-span-1" asChild>
                <Link to={`/dashboard/analyses/${id}/deep`}><Microscope className="h-3.5 w-3.5" />{pt ? "Análise Profunda" : "Deep Analysis"}</Link>
              </Button>
            )}
            {!userIsPro && (
              <Button size="sm" variant="outline" className="col-span-2 gap-1.5 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10 sm:col-span-1" onClick={() => setShowUpgrade(true)}>
                <Crown className="h-3.5 w-3.5" />{pt ? "Análise Profunda" : "Deep Analysis"}
              </Button>
            )}
          </div>
        )}
      </div>

      {isProcessing && (
        <Card className="border-primary/30 bg-primary/5"><CardContent className="flex items-center gap-4 py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /><div><p className="font-medium">{t.dashboard.analyzing}</p><p className="text-sm text-muted-foreground">{pt ? "A IA está analisando seu arquivo..." : "AI is analyzing your file..."}</p></div></CardContent></Card>
      )}

      {analysis.status === "error" && (
        <Card className="border-destructive/30 bg-destructive/5"><CardContent className="flex items-center gap-4 py-6"><AlertCircle className="h-6 w-6 text-destructive" /><div><p className="font-medium">{pt ? "Falha na análise" : "Analysis failed"}</p><p className="text-sm text-muted-foreground">{pt ? "Houve um erro ao processar este arquivo." : "There was an error processing this file."}</p></div></CardContent></Card>
      )}

      {analysis.status === "completed" && (
        <>
          {kpis?.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {kpis.map((kpi, i) => (
                <Card key={i}><CardContent className="pt-6"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.name}</p><div className="mt-2 flex items-baseline gap-2"><span className="text-2xl font-bold tabular-nums">{kpi.value}</span>{kpi.change && <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.trend === "up" ? "text-emerald-600" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>{kpi.trend === "up" ? <TrendingUp className="h-3 w-3" /> : kpi.trend === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}{kpi.change}</span>}</div></CardContent></Card>
              ))}
            </div>
          )}

          {visibleCharts.length > 0 && (
            <div>
              <div className={`grid gap-4 ${visibleCharts.length === 1 ? "" : "md:grid-cols-2"}`}>
                {visibleCharts.map((chart: any, i: number) => <ChartCard key={i} chart={chart} index={i} />)}
              </div>
              {!userIsPro && charts.length > 2 && (
                <div className="mt-4 flex items-center justify-center">
                  <Button variant="outline" className="gap-2 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10" onClick={() => setShowUpgrade(true)}>
                    <Crown className="h-4 w-4" /> {pt ? `Ver todos os ${charts.length} gráficos (PRO)` : `View all ${charts.length} charts (PRO)`}
                  </Button>
                </div>
              )}
            </div>
          )}

          <Tabs defaultValue="diagnosis" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
              <TabsTrigger value="diagnosis" className="min-h-9 gap-1.5 whitespace-normal px-2 text-xs sm:text-sm"><Stethoscope className="hidden h-3.5 w-3.5 sm:block" />{t.dashboard.diagnosis}</TabsTrigger>
              <TabsTrigger value="insights" className="min-h-9 gap-1.5 whitespace-normal px-2 text-xs sm:text-sm"><Lightbulb className="hidden h-3.5 w-3.5 sm:block" />{t.dashboard.insights}</TabsTrigger>
              <TabsTrigger value="actionPlan" className="min-h-9 gap-1.5 whitespace-normal px-2 text-xs sm:text-sm"><Target className="hidden h-3.5 w-3.5 sm:block" />{t.dashboard.actionPlan}</TabsTrigger>
              <TabsTrigger value="recommendations" className="min-h-9 gap-1.5 whitespace-normal px-2 text-xs sm:text-sm"><Star className="hidden h-3.5 w-3.5 sm:block" />{t.dashboard.recommendations}</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnosis">
              {diagnosis && (
                <Card><CardContent className="pt-6 space-y-4">
                  <p className="text-sm leading-relaxed">{diagnosis.summary}</p>
                  {diagnosis.findings?.length > 0 && <div><h4 className="text-sm font-semibold mb-2">{pt ? "Descobertas" : "Findings"}</h4><ul className="space-y-1.5">{diagnosis.findings.map((f: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{f}</li>)}</ul></div>}
                  {diagnosis.bottlenecks?.length > 0 && <div><h4 className="text-sm font-semibold mb-2">{pt ? "Gargalos" : "Bottlenecks"}</h4><ul className="space-y-1.5">{diagnosis.bottlenecks.map((b: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />{b}</li>)}</ul></div>}
                </CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="insights">
              {insights && (
                <div className="grid gap-4 md:grid-cols-3">
                  <InsightCard title={pt ? "Oportunidades" : "Opportunities"} items={insights.opportunities || []} colorClass="bg-emerald-500" />
                  <InsightCard title={pt ? "Riscos" : "Risks"} items={insights.risks || []} colorClass="bg-destructive" />
                  <InsightCard title={pt ? "Padrões" : "Patterns"} items={insights.patterns || []} colorClass="bg-primary" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="actionPlan">
              {actionPlan && (
                <div className="grid gap-4 md:grid-cols-3">
                  <ActionCard title={t.dashboard.shortTerm} items={actionPlan.shortTerm || []} />
                  <ActionCard title={t.dashboard.mediumTerm} items={actionPlan.mediumTerm || []} />
                  <ActionCard title={t.dashboard.longTerm} items={actionPlan.longTerm || []} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations">
              {recommendations && Array.isArray(recommendations) && (
                <Card><CardContent className="pt-6"><ul className="space-y-3">{recommendations.map((r: string, i: number) => <li key={i} className="flex items-start gap-3 text-sm"><Badge variant="outline" className="mt-0.5 shrink-0 tabular-nums">{i + 1}</Badge><span>{r}</span></li>)}</ul></CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function InsightCard({ title, items, colorClass }: { title: string; items: string[]; colorClass: string }) {
  return (
    <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader><CardContent><ul className="space-y-2">{items.map((item, i) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colorClass}`} />{item}</li>)}{items.length === 0 && <li className="text-sm text-muted-foreground">—</li>}</ul></CardContent></Card>
  );
}

function ActionCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader><CardContent><ul className="space-y-2">{items.map((item, i) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-0.5 text-xs font-bold text-primary tabular-nums">{i + 1}.</span>{item}</li>)}{items.length === 0 && <li className="text-sm text-muted-foreground">—</li>}</ul></CardContent></Card>
  );
}
