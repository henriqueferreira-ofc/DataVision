import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalysis } from "@/hooks/useAnalyses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus,
  Stethoscope, Lightbulb, Target, Star, AlertCircle,
  Download, FileText, Presentation,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { exportAnalysisPdf } from "@/lib/exportPdf";
import { exportAnalysisPptx } from "@/lib/exportPptx";

const CHART_COLORS = [
  "hsl(217, 91%, 60%)", "hsl(168, 72%, 43%)", "hsl(280, 65%, 60%)",
  "hsl(30, 90%, 55%)", "hsl(340, 75%, 55%)", "hsl(190, 80%, 45%)",
  "hsl(45, 85%, 50%)", "hsl(120, 55%, 45%)",
];

function ChartCard({ chart, index }: { chart: any; index: number }) {
  if (!chart || !chart.data || !Array.isArray(chart.data) || chart.data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{chart.title || `Chart ${index + 1}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          {chart.type === "pie" ? (
            <PieChart>
              <Pie data={chart.data} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {chart.data.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Legend />
            </PieChart>
          ) : chart.type === "line" ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 4 }} />
              {chart.data[0]?.value2 !== undefined && (
                <Line type="monotone" dataKey="value2" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
              )}
              <Legend />
            </LineChart>
          ) : chart.type === "area" ? (
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Area type="monotone" dataKey="value" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.2} strokeWidth={2} />
              {chart.data[0]?.value2 !== undefined && (
                <Area type="monotone" dataKey="value2" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.15} strokeWidth={2} />
              )}
              <Legend />
            </AreaChart>
          ) : (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="value" fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
              {chart.data[0]?.value2 !== undefined && (
                <Bar dataKey="value2" fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
              )}
              <Legend />
            </BarChart>
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
  const { toast } = useToast();

  const handleExportPDF = () => {
    if (!analysis) return;
    exportAnalysisPdf(analysis as any, language);
    toast({ title: language === "pt-BR" ? "PDF exportado!" : "PDF exported!" });
  };

  const handleExportPPTX = () => {
    if (!analysis) return;
    exportAnalysisPptx(analysis as any, language);
    toast({ title: language === "pt-BR" ? "PowerPoint exportado!" : "PowerPoint exported!" });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!analysis) {
    return <div className="py-20 text-center"><p className="text-muted-foreground">{language === "pt-BR" ? "Análise não encontrada" : "Analysis not found"}</p></div>;
  }

  const isProcessing = analysis.status === "processing" || analysis.status === "pending";
  const diagnosis = analysis.diagnosis as any;
  const insights = analysis.insights as any;
  const actionPlan = analysis.action_plan as any;
  const recommendations = analysis.recommendations as any;
  const kpis = analysis.kpis as any[];
  const chartsRaw = analysis.charts_data as any;

  // Support both old format (single chart object) and new (array of charts)
  let charts: any[] = [];
  if (Array.isArray(chartsRaw)) {
    charts = chartsRaw;
  } else if (chartsRaw && chartsRaw.categories) {
    charts = [{
      title: "Overview",
      type: chartsRaw.chartType || "bar",
      data: chartsRaw.categories.map((cat: string, i: number) => ({ name: cat, value: chartsRaw.values[i] })),
    }];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/dashboard/analyses"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{analysis.file_name}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(analysis.created_at).toLocaleDateString(language, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        {analysis.status === "completed" && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPDF}>
              <FileText className="h-3.5 w-3.5" />
              {language === "pt-BR" ? "Exportar Relatório" : "Export Report"}
            </Button>
          </div>
        )}
      </div>

      {isProcessing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div>
              <p className="font-medium">{t.dashboard.analyzing}</p>
              <p className="text-sm text-muted-foreground">
                {language === "pt-BR" ? "A IA está analisando seu arquivo..." : "AI is analyzing your file..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.status === "error" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-medium">{language === "pt-BR" ? "Falha na análise" : "Analysis failed"}</p>
              <p className="text-sm text-muted-foreground">
                {language === "pt-BR" ? "Houve um erro ao processar este arquivo. Tente novamente." : "There was an error processing this file. Please try again."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.status === "completed" && (
        <>
          {/* KPIs */}
          {kpis && kpis.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {kpis.map((kpi, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.name}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums">{kpi.value}</span>
                      {kpi.change && (
                        <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.trend === "up" ? "text-emerald-600" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                          {kpi.trend === "up" ? <TrendingUp className="h-3 w-3" /> : kpi.trend === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          {kpi.change}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Multiple Charts */}
          {charts.length > 0 && (
            <div className={`grid gap-4 ${charts.length === 1 ? "" : "md:grid-cols-2"}`}>
              {charts.map((chart: any, i: number) => (
                <ChartCard key={i} chart={chart} index={i} />
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="diagnosis" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="diagnosis" className="gap-1.5 text-xs sm:text-sm">
                <Stethoscope className="h-3.5 w-3.5 hidden sm:block" />
                {t.dashboard.diagnosis}
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-1.5 text-xs sm:text-sm">
                <Lightbulb className="h-3.5 w-3.5 hidden sm:block" />
                {t.dashboard.insights}
              </TabsTrigger>
              <TabsTrigger value="actionPlan" className="gap-1.5 text-xs sm:text-sm">
                <Target className="h-3.5 w-3.5 hidden sm:block" />
                {t.dashboard.actionPlan}
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="gap-1.5 text-xs sm:text-sm">
                <Star className="h-3.5 w-3.5 hidden sm:block" />
                {t.dashboard.recommendations}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diagnosis">
              {diagnosis && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-sm leading-relaxed">{diagnosis.summary}</p>
                    {diagnosis.findings?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">{language === "pt-BR" ? "Descobertas" : "Findings"}</h4>
                        <ul className="space-y-1.5">
                          {diagnosis.findings.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {diagnosis.bottlenecks?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">{language === "pt-BR" ? "Gargalos" : "Bottlenecks"}</h4>
                        <ul className="space-y-1.5">
                          {diagnosis.bottlenecks.map((b: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights">
              {insights && (
                <div className="grid gap-4 md:grid-cols-3">
                  <InsightCard title={language === "pt-BR" ? "Oportunidades" : "Opportunities"} items={insights.opportunities || []} colorClass="bg-emerald-500" />
                  <InsightCard title={language === "pt-BR" ? "Riscos" : "Risks"} items={insights.risks || []} colorClass="bg-destructive" />
                  <InsightCard title={language === "pt-BR" ? "Padrões" : "Patterns"} items={insights.patterns || []} colorClass="bg-primary" />
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
                <Card>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {recommendations.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Badge variant="outline" className="mt-0.5 shrink-0 tabular-nums">{i + 1}</Badge>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colorClass}`} />
              {item}
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-muted-foreground">—</li>}
        </ul>
      </CardContent>
    </Card>
  );
}

function ActionCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 text-xs font-bold text-primary tabular-nums">{i + 1}.</span>
              {item}
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-muted-foreground">—</li>}
        </ul>
      </CardContent>
    </Card>
  );
}
