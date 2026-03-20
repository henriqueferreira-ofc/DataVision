import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const { data: analyses, isLoading } = useAnalyses();
  const locale = language === "pt-BR" ? ptBR : enUS;
  const completedAnalyses = analyses?.filter((a) => a.status === "completed") || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.dashboard.reports}</h1>

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
            <Link key={analysis.id} to={`/dashboard/analyses/${analysis.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{analysis.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    {t.dashboard.viewResults}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
