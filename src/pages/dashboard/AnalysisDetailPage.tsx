import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalysis } from "@/hooks/useAnalyses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus,
  Stethoscope, Lightbulb, Target, Star, BarChart3,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(168, 72%, 43%)",
  "hsl(280, 65%, 60%)",
  "hsl(30, 90%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(190, 80%, 45%)",
];

export default function AnalysisDetailPage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { data: analysis, isLoading, refetch } = useAnalysis(id);
  const queryClient = useQueryClient();

  // Auto-refresh while processing
  useEffect(() => {
    if (!analysis || analysis.status === "completed" || analysis.status === "error") return;
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [analysis?.status, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{language === "pt-BR" ? "Análise não encontrada" : "Analysis not found"}</p>
      </div>
    );
  }

  const isProcessing = analysis.status === "processing" || analysis.status === "pending";
  const diagnosis = analysis.diagnosis as any;
  const insights = analysis.insights as any;
  const actionPlan = analysis.action_plan as any;
  const recommendations = analysis.recommendations as any;
  const kpis = analysis.kpis as any[];
  const chartsData = analysis.charts_data as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
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

      {analysis.status === "completed" && (
        <>
          {/* KPIs */}
          {kpis && kpis.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{kpi.name}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums">{kpi.value}</span>
                      {kpi.change && (
                        <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.trend === "up" ? "text-accent" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
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

          {/* Chart */}
          {chartsData && chartsData.categories && (
            <Card>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  {chartsData.chartType === "pie" ? (
                    <PieChart>
                      <Pie
                        data={chartsData.categories.map((cat: string, i: number) => ({ name: cat, value: chartsData.values[i] }))}
                        cx="50%" cy="50%" outerRadius={100} dataKey="value" label
                      >
                        {chartsData.categories.map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : chartsData.chartType === "line" ? (
                    <LineChart data={chartsData.categories.map((cat: string, i: number) => ({ name: cat, value: chartsData.values[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartsData.categories.map((cat: string, i: number) => ({ name: cat, value: chartsData.values[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tabs: Diagnosis / Insights / Action Plan / Recommendations */}
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
                  <InsightCard
                    title={language === "pt-BR" ? "Oportunidades" : "Opportunities"}
                    items={insights.opportunities || []}
                    color="accent"
                  />
                  <InsightCard
                    title={language === "pt-BR" ? "Riscos" : "Risks"}
                    items={insights.risks || []}
                    color="destructive"
                  />
                  <InsightCard
                    title={language === "pt-BR" ? "Padrões" : "Patterns"}
                    items={insights.patterns || []}
                    color="primary"
                  />
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

function InsightCard({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-${color}`} />
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
