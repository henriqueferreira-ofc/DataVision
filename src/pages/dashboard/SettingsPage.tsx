import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.dashboard.settings}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">{t.auth.name}:</span> {user?.user_metadata?.full_name || "—"}</div>
          <div><span className="text-muted-foreground">{t.auth.email}:</span> {user?.email}</div>
        </CardContent>
      </Card>
    </div>
  );
}
