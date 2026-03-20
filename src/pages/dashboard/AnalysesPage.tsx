import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalyses } from "@/hooks/useAnalyses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileSpreadsheet, FileText, Presentation, ArrowRight, CheckCircle, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

function getFileIcon(type: string) {
  if (type.includes("spreadsheet") || type.includes("csv")) return FileSpreadsheet;
  if (type.includes("pdf")) return FileText;
  if (type.includes("presentation")) return Presentation;
  return FileText;
}

export default function AnalysesPage() {
  const { t, language } = useLanguage();
  const { data: analyses, isLoading } = useAnalyses();
  const locale = language === "pt-BR" ? ptBR : enUS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t.dashboard.analyses}</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{t.dashboard.noAnalyses}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.dashboard.noAnalysesDesc}</p>
            <Button className="mt-6 active:scale-[0.97]" asChild>
              <Link to="/dashboard/upload">{t.dashboard.uploadFirst}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.dashboard.analyses}</h1>
        <Button size="sm" asChild className="gap-1.5 active:scale-[0.97]">
          <Link to="/dashboard/upload">
            {language === "pt-BR" ? "Nova Análise" : "New Analysis"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {analyses.map((analysis) => {
          const Icon = getFileIcon(analysis.file_type);
          return (
            <Link key={analysis.id} to={`/dashboard/analyses/${analysis.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{analysis.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale })}
                    </p>
                  </div>
                  <StatusBadge status={analysis.status} language={language} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status, language }: { status: string; language: string }) {
  if (status === "completed") {
    return (
      <Badge variant="outline" className="gap-1 border-accent/30 bg-accent/10 text-accent">
        <CheckCircle className="h-3 w-3" />
        {language === "pt-BR" ? "Concluída" : "Completed"}
      </Badge>
    );
  }
  if (status === "processing") {
    return (
      <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
        <Loader2 className="h-3 w-3 animate-spin" />
        {language === "pt-BR" ? "Processando" : "Processing"}
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
        <Clock className="h-3 w-3" />
        {language === "pt-BR" ? "Erro" : "Error"}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      {language === "pt-BR" ? "Pendente" : "Pending"}
    </Badge>
  );
}
