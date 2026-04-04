import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalysis } from "@/hooks/useAnalyses";
import { useSubscription, isPro } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { exportDeepAnalysisPdf } from "@/lib/exportDeepAnalysisPdf";
import { exportDeepAnalysisPptx } from "@/lib/exportDeepAnalysisPptx";
import {
  ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus, Crown, Lock, FileText, Presentation,
  Shield, Target, Zap, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
  Database, Link2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { useState } from "react";
import { deriveStrategicSections, clampScore, parseMetricValue, formatCurrency } from "@/lib/deriveStrategicSections";

const COLORS = [
  "hsl(217,91%,60%)", "hsl(168,72%,43%)", "hsl(280,65%,60%)",
  "hsl(30,90%,55%)", "hsl(340,75%,55%)", "hsl(190,80%,45%)",
  "hsl(45,85%,50%)", "hsl(120,55%,45%)",
];

const SWOT_CONFIG = {
  strengths: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30", fill: "bg-emerald-500" },
  weaknesses: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", fill: "bg-red-500" },
  opportunities: { icon: ArrowUpRight, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", fill: "bg-blue-500" },
  threats: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", fill: "bg-amber-500" },
};

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}



export default function DeepAnalysisPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const { data: analysis, isLoading } = useAnalysis(id);
  const { plan } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const pt = language === "pt-BR";

  if (!isPro(plan)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
          <Lock className="h-8 w-8 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold">{pt ? "Recurso Exclusivo PRO" : "PRO Exclusive Feature"}</h2>
        <p className="text-muted-foreground max-w-md">{pt ? "A Análise Profunda oferece gráficos avançados, SWOT, scoring executivo, correlações e recomendações estratégicas. Faça upgrade para desbloquear." : "Deep Analysis offers advanced charts, SWOT, executive scoring, correlations and strategic recommendations. Upgrade to unlock."}</p>
        <Button onClick={() => setShowUpgrade(true)} className="gap-2">
          <Crown className="h-4 w-4" /> {pt ? "Fazer Upgrade para PRO" : "Upgrade to PRO"}
        </Button>
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature={pt ? "Análise Profunda" : "Deep Analysis"} />
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!analysis || analysis.status !== "completed") return <div className="py-20 text-center text-muted-foreground">{pt ? "Análise não encontrada ou ainda em processamento" : "Analysis not found or still processing"}</div>;

  const kpis = (analysis.kpis as any[]) || [];
  const chartsRaw = analysis.charts_data as any;
  const charts: any[] = Array.isArray(chartsRaw) ? chartsRaw : [];
  const diagnosis = analysis.diagnosis as any;
  const insights = analysis.insights as any;
  const actionPlan = analysis.action_plan as any;
  const recommendations = (analysis.recommendations as string[]) || [];
  const derivedSections = deriveStrategicSections({ diagnosis, insights, kpis, charts, recommendations, pt });

  const swot = diagnosis?.swot || derivedSections.swot;
  const executiveScore = diagnosis?.executiveScore || derivedSections.executiveScore;
  const correlations = diagnosis?.correlations || derivedSections.correlations;
  const dataQuality = diagnosis?.dataQuality || derivedSections.dataQuality;

  const radarData = executiveScore?.categories?.map((c: any) => ({
    subject: c.name, A: c.score, fullMark: c.maxScore || 100,
  })) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to={`/dashboard/analyses/${id}`}><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{pt ? "Análise Profunda" : "Deep Analysis"}</h1>
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Crown className="h-3 w-3 mr-1" />PRO</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.file_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportDeepAnalysisPdf(analysis as any, language)}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportDeepAnalysisPptx(analysis as any, language)}>
            <Presentation className="h-4 w-4" /> PPTX
          </Button>
        </div>
      </div>

      {/* Executive Score + Data Quality */}
      {(executiveScore || dataQuality) && (
        <div className="grid gap-6 md:grid-cols-2">
          {executiveScore && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-primary" />
                  {pt ? "Score Executivo" : "Executive Score"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ScoreRing score={executiveScore.overall || 0} />
                  <div className="flex-1 space-y-3">
                    {executiveScore.categories?.map((cat: any, i: number) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium">{cat.name}</span>
                          <span className="tabular-nums text-muted-foreground">{cat.score}/{cat.maxScore || 100}</span>
                        </div>
                        <Progress value={(cat.score / (cat.maxScore || 100)) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
                {executiveScore.verdict && (
                  <p className="mt-4 text-sm text-muted-foreground border-t pt-3">{executiveScore.verdict}</p>
                )}
              </CardContent>
            </Card>
          )}

          {dataQuality && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-primary" />
                  {pt ? "Qualidade dos Dados" : "Data Quality"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ScoreRing score={dataQuality.score || 0} size={100} />
                  <div className="flex-1 space-y-3">
                    {[
                      { label: pt ? "Completude" : "Completeness", value: dataQuality.completeness },
                      { label: pt ? "Consistência" : "Consistency", value: dataQuality.consistency },
                    ].map((m, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium">{m.label}</span>
                          <span className="tabular-nums text-muted-foreground">{m.value}%</span>
                        </div>
                        <Progress value={m.value || 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
                {dataQuality.observations?.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t pt-3">
                    {dataQuality.observations.map((obs: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />{obs}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* KPIs */}
      {kpis.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{pt ? "Indicadores-Chave de Performance" : "Key Performance Indicators"}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.name}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">{kpi.value}</span>
                    {kpi.change && (
                      <span className={`flex items-center gap-0.5 text-sm font-medium ${kpi.trend === "up" ? "text-emerald-600" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                        {kpi.trend === "up" ? <TrendingUp className="h-4 w-4" /> : kpi.trend === "down" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        {kpi.change}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      {charts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{pt ? "Visualizações Avançadas" : "Advanced Visualizations"}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {charts.map((chart: any, i: number) => (
              <Card key={i} className={charts.length === 1 ? "md:col-span-2" : ""}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{chart.title}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    {chart.type === "pie" ? (
                      <PieChart><Pie data={chart.data} cx="50%" cy="50%" outerRadius={110} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>{chart.data.map((_: any, j: number) => <Cell key={j} fill={COLORS[j % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
                    ) : chart.type === "line" ? (
                      <LineChart data={chart.data}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2.5} dot={{ r: 4 }} />{chart.data[0]?.value2 !== undefined && <Line type="monotone" dataKey="value2" stroke={COLORS[1]} strokeWidth={2} />}<Legend /></LineChart>
                    ) : chart.type === "area" ? (
                      <AreaChart data={chart.data}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Area type="monotone" dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />{chart.data[0]?.value2 !== undefined && <Area type="monotone" dataKey="value2" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.15} />}<Legend /></AreaChart>
                    ) : (
                      <BarChart data={chart.data}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />{chart.data[0]?.value2 !== undefined && <Bar dataKey="value2" fill={COLORS[(i + 1) % COLORS.length]} radius={[4, 4, 0, 0]} />}<Legend /></BarChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Executive Score Radar */}
      {radarData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{pt ? "Radar de Performance" : "Performance Radar"}</h2>
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Score" dataKey="A" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SWOT Matrix */}
      {swot && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{pt ? "Análise SWOT" : "SWOT Analysis"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.entries(SWOT_CONFIG) as [keyof typeof SWOT_CONFIG, typeof SWOT_CONFIG[keyof typeof SWOT_CONFIG]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const items = swot[key] || [];
              const titles: Record<string, string> = {
                strengths: pt ? "Forças" : "Strengths",
                weaknesses: pt ? "Fraquezas" : "Weaknesses",
                opportunities: pt ? "Oportunidades" : "Opportunities",
                threats: pt ? "Ameaças" : "Threats",
              };
              return (
                <Card key={key} className={cfg.border}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`flex items-center gap-2 text-sm ${cfg.color}`}>
                      <Icon className="h-4 w-4" /> {titles[key]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {items.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${cfg.fill}`} />{item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Correlations */}
      {correlations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {pt ? "Correlações Identificadas" : "Identified Correlations"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {correlations.map((cor: any, i: number) => (
              <Card key={i}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{cor.factor1}</Badge>
                    <span className={`text-sm font-bold ${cor.relationship === "positive" ? "text-emerald-600" : cor.relationship === "negative" ? "text-destructive" : "text-muted-foreground"}`}>
                      {cor.relationship === "positive" ? "↗" : cor.relationship === "negative" ? "↘" : "→"}
                    </span>
                    <Badge variant="outline" className="text-xs">{cor.factor2}</Badge>
                    <Badge className={`ml-auto text-[10px] ${cor.strength === "strong" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : cor.strength === "moderate" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-muted text-muted-foreground"}`}>
                      {cor.strength === "strong" ? (pt ? "Forte" : "Strong") : cor.strength === "moderate" ? (pt ? "Moderada" : "Moderate") : (pt ? "Fraca" : "Weak")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{cor.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Diagnosis */}
      {diagnosis && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{pt ? "Diagnóstico Estratégico" : "Strategic Diagnosis"}</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm leading-relaxed">{diagnosis.summary}</p>
              {diagnosis.findings?.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                  {diagnosis.findings.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm rounded-lg border p-3">
                      <span className="mt-0.5 text-xs font-bold text-primary">{i + 1}.</span>
                      <span className="text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Grid */}
      {insights && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{pt ? "Análise de Oportunidades e Riscos" : "Opportunities & Risk Analysis"}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-emerald-500/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">{pt ? "Oportunidades" : "Opportunities"}</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2">{(insights.opportunities || []).map((item: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{item}</li>)}</ul></CardContent>
            </Card>
            <Card className="border-destructive/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive">{pt ? "Riscos" : "Risks"}</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2">{(insights.risks || []).map((item: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />{item}</li>)}</ul></CardContent>
            </Card>
            <Card className="border-primary/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">{pt ? "Padrões" : "Patterns"}</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2">{(insights.patterns || []).map((item: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{pt ? "Recomendações Estratégicas" : "Strategic Recommendations"}</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-3 md:grid-cols-2">
                {recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm rounded-lg border p-4">
                    <Badge variant="outline" className="mt-0.5 shrink-0 tabular-nums">{i + 1}</Badge>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Plan */}
      {actionPlan && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{pt ? "Plano de Ação Estratégico" : "Strategic Action Plan"}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: pt ? "Curto Prazo (1-3 meses)" : "Short Term (1-3 months)", items: actionPlan.shortTerm || [], color: "border-emerald-500/30" },
              { title: pt ? "Médio Prazo (3-6 meses)" : "Medium Term (3-6 months)", items: actionPlan.mediumTerm || [], color: "border-primary/30" },
              { title: pt ? "Longo Prazo (6-12 meses)" : "Long Term (6-12 months)", items: actionPlan.longTerm || [], color: "border-yellow-500/30" },
            ].map((section) => (
              <Card key={section.title} className={section.color}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{section.title}</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.items.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 text-xs font-bold text-primary">{i + 1}.</span>{item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
