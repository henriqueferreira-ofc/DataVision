import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileUp, Lightbulb, Upload, ArrowRight, Clock, CheckCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

export default function DashboardHome() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { data: analyses, isLoading } = useAnalyses();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "";

  const totalAnalyses = analyses?.length || 0;
  const completedAnalyses = analyses?.filter((a) => a.status === "completed").length || 0;
  const totalInsights = analyses?.reduce((acc, a) => {
    const insights = a.insights as any;
    if (!insights) return acc;
    return acc + (insights.opportunities?.length || 0) + (insights.risks?.length || 0) + (insights.patterns?.length || 0);
  }, 0) || 0;

  const stats = [
    { label: t.dashboard.totalAnalyses, value: String(totalAnalyses), icon: BarChart3 },
    { label: t.dashboard.filesUploaded, value: String(totalAnalyses), icon: FileUp },
    { label: t.dashboard.insightsGenerated, value: String(totalInsights), icon: Lightbulb },
  ];

  const recentAnalyses = analyses?.slice(0, 5) || [];
  const locale = language === "pt-BR" ? ptBR : enUS;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.welcome}{firstName ? `, ${firstName}` : ""}</h1>
        <p className="mt-1 text-muted-foreground">{t.dashboard.quickStats}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{isLoading ? "—" : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recentAnalyses.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.dashboard.recentAnalyses}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/analyses" className="gap-1">
                {t.common.viewAll}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2">
            {recentAnalyses.map((analysis) => (
              <Link key={analysis.id} to={`/dashboard/analyses/${analysis.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-start gap-3 py-4 sm:items-center sm:gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{analysis.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale })}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={analysis.status} labels={t.dashboard} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{t.dashboard.noAnalyses}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.dashboard.noAnalysesDesc}</p>
            <Button className="mt-6 gap-2 active:scale-[0.97]" asChild>
              <Link to="/dashboard/upload">
                {t.dashboard.uploadFirst}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StatusBadge({ status, labels }: { status: string; labels: { statusCompleted: string; statusProcessing: string; statusPending: string } }) {
  if (status === "completed") {
    return (
      <Badge variant="outline" className="gap-1 border-accent/30 bg-accent/10 text-accent">
        <CheckCircle className="h-3 w-3" />
        {labels.statusCompleted}
      </Badge>
    );
  }
  if (status === "processing") {
    return (
      <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
        <Loader2 className="h-3 w-3 animate-spin" />
        {labels.statusProcessing}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      {labels.statusPending}
    </Badge>
  );
}
