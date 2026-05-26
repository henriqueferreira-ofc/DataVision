import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, isPro, PLANS } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Settings, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { plan, subscribed, subscriptionEnd, refresh } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      console.error("Customer portal error:", err);
      toast({ variant: "destructive", title: t.common.error, description: t.settings.portalError });
    } finally {
      setPortalLoading(false);
    }
  };

  const planLabel = plan === "pro" ? "Pro" : t.settings.free;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.dashboard.settings}</h1>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t.common.profile}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">{t.auth.name}:</span> {user?.user_metadata?.full_name || "—"}</div>
          <div><span className="text-muted-foreground">{t.auth.email}:</span> {user?.email}</div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t.common.subscription}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={plan === "pro" ? "default" : "outline"} className="text-sm px-3 py-1">
              {plan === "pro" && <Crown className="h-3 w-3 mr-1" />}
              {planLabel}
            </Badge>
            {subscriptionEnd && (
              <span className="text-xs text-muted-foreground">
                {t.common.validUntil} {new Date(subscriptionEnd).toLocaleDateString(language)}
              </span>
            )}
          </div>

          {plan === "free" && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <p className="text-sm font-medium">{t.settings.unlockTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.settings.unlockDescription}</p>
              <Button size="sm" className="mt-3 gap-1.5" onClick={() => setShowUpgrade(true)}>
                <Crown className="h-3.5 w-3.5" /> {t.settings.viewPlans}
              </Button>
            </div>
          )}

          {subscribed && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleManageSubscription} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-3.5 w-3.5" />}
              {t.settings.manageSubscription}
            </Button>
          )}

          {plan !== "free" && !isPro(plan) && (
            <Button size="sm" variant="outline" className="gap-1.5 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10" onClick={() => setShowUpgrade(true)}>
              <Crown className="h-3.5 w-3.5" /> {t.settings.upgradeToPro}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
