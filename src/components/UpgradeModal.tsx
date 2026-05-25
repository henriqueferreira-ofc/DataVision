import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PLANS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);
  const pt = language === "pt-BR";

  const handleCheckout = async () => {
    const billing = yearly ? "yearly" : "monthly";
    const priceId = PLANS.pro[billing].priceId;
    setLoading(`pro-${billing}`);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setLoading(null);
    }
  };

  const proFeatures = pt
    ? ["Análise Profunda exclusiva", "Gráficos avançados completos", "Exportar PDF e PPTX", "Insights estratégicos ilimitados", "Suporte prioritário"]
    : ["Exclusive Deep Analysis", "Full advanced charts", "Export PDF & PPTX", "Unlimited strategic insights", "Priority support"];

  const basicFeatures = pt
    ? ["Pesquisa padrão", "Visualização de dados simples", "Insights limitados"]
    : ["Standard search", "Simple data visualization", "Limited insights"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-yellow-500" />
            {pt ? "Faça Upgrade" : "Upgrade Your Plan"}
          </DialogTitle>
          <DialogDescription>
            {feature
              ? (pt ? `"${feature}" é exclusivo do Plano PRO. Faça upgrade para desbloquear.` : `"${feature}" is exclusive to the PRO plan. Upgrade to unlock.`)
              : (pt ? "Escolha o plano ideal para você." : "Choose the best plan for you.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center my-2">
          <div className="inline-flex items-center rounded-full border bg-muted p-1">
            <button onClick={() => setYearly(false)} className={cn("rounded-full px-4 py-1.5 text-xs font-medium transition-all", !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {pt ? "Mensal" : "Monthly"}
            </button>
            <button onClick={() => setYearly(true)} className={cn("rounded-full px-4 py-1.5 text-xs font-medium transition-all", yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {pt ? "Anual" : "Yearly"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Free / Basic (Gratuito) */}
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <h3 className="font-bold text-muted-foreground">{pt ? "Plano Gratuito" : "Free Plan"}</h3>
            <p className="text-2xl font-extrabold text-muted-foreground">{pt ? "Grátis" : "Free"}</p>
            <ul className="space-y-1.5">
              {basicFeatures.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground"><Check className="h-3 w-3 mt-0.5 text-primary shrink-0" />{f}</li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="w-full" disabled>
              {pt ? "Seu Plano Atual" : "Your Current Plan"}
            </Button>
          </div>

          {/* Pro */}
          <div className="rounded-lg border border-primary p-4 space-y-3 relative bg-card shadow-sm">
            <Badge className="absolute -top-2.5 right-3 text-[10px] bg-gradient-to-r from-primary to-accent">{pt ? "Recomendado" : "Recommended"}</Badge>
            <h3 className="font-bold flex items-center gap-1.5 text-foreground">Pro <Crown className="h-3.5 w-3.5 text-yellow-500" /></h3>
            <p className="text-2xl font-extrabold">{yearly ? PLANS.pro.yearlyPrice : PLANS.pro.monthlyPrice}<span className="text-sm font-normal text-muted-foreground">/{yearly ? (pt ? "ano" : "yr") : (pt ? "mês" : "mo")}</span></p>
            <ul className="space-y-1.5">
              {proFeatures.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground"><Check className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />{f}</li>
              ))}
            </ul>
            <Button size="sm" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 border-0" disabled={!!loading} onClick={handleCheckout}>
              {loading?.startsWith("pro") ? <Loader2 className="h-4 w-4 animate-spin" /> : (pt ? "Assinar Pro" : "Subscribe Pro")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
