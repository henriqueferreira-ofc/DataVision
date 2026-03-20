import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function AnalysesPage() {
  const { t } = useLanguage();

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
