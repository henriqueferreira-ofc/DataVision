import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileUp, Lightbulb, Upload, ArrowRight } from "lucide-react";

export default function DashboardHome() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "";

  const stats = [
    { label: t.dashboard.totalAnalyses, value: "0", icon: BarChart3 },
    { label: t.dashboard.filesUploaded, value: "0", icon: FileUp },
    { label: t.dashboard.insightsGenerated, value: "0", icon: Lightbulb },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.welcome}{firstName ? `, ${firstName}` : ""}</h1>
        <p className="mt-1 text-muted-foreground">{t.dashboard.quickStats}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
}
