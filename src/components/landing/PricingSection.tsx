import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getProCheckoutUrl } from "@/lib/checkout";

export function PricingSection() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [yearly, setYearly] = useState(false);
  const [loadingPro, setLoadingPro] = useState(false);
  const pt = language === "pt-BR";

  const handleProCheckout = async () => {
    if (loadingPro) return;

    setLoadingPro(true);
    try {
      window.location.href = await getProCheckoutUrl(yearly ? "yearly" : "monthly");
    } catch (err) {
      console.error("Checkout error:", err);
      toast({ variant: "destructive", title: "Erro", description: pt ? "Não foi possível iniciar o checkout. Tente novamente." : "Could not start checkout. Please try again." });
    } finally {
      setLoadingPro(false);
    }
  };

  const plans = [
    {
      name: pt ? "Gratuito" : "Free",
      price: pt ? "Grátis" : "Free",
      period: "",
      description: pt ? "Comece agora sem pagar nada" : "Get started for free",
      features: [
        { text: pt ? "Pesquisa padrão" : "Standard search", included: true },
        { text: pt ? "Visualização de dados simples" : "Simple data visualization", included: true },
        { text: pt ? "Insights limitados" : "Limited insights", included: true },
        { text: pt ? "Dashboard básico" : "Basic dashboard", included: true },
        { text: pt ? "Exportar PDF / PPTX" : "Export PDF / PPTX", included: false },
        { text: pt ? "Análise Profunda" : "Deep Analysis", included: false },
        { text: pt ? "Gráficos avançados" : "Advanced charts", included: false },
      ],
      popular: false,
      cta: pt ? "Comece agora" : "Get started",
      isPro: false,
    },
    {
      name: "Pro",
      price: yearly ? "R$99,90" : "R$19,90",
      period: yearly ? (pt ? "/ano" : "/yr") : (pt ? "/mês" : "/mo"),
      description: pt ? "Para equipes que precisam de insights profundos e poder total" : "For teams needing deep insights and full power",
      features: [
        { text: pt ? "Pesquisa completa" : "Full search", included: true },
        { text: pt ? "Insights avançados ilimitados" : "Unlimited advanced insights", included: true },
        { text: pt ? "Gráficos completos e métricas" : "Full charts and metrics", included: true },
        { text: pt ? "Exportar PDF e PPTX" : "Export PDF & PPTX", included: true },
        { text: pt ? "Análise Profunda exclusiva" : "Exclusive Deep Analysis", included: true },
        { text: pt ? "Planos de ação estratégicos" : "Strategic action plans", included: true },
        { text: pt ? "Suporte prioritário" : "Priority support", included: true },
      ],
      popular: true,
      cta: pt ? "Assinar Pro" : "Subscribe Pro",
      isPro: true,
    },
  ];

  return (
    <section id="pricing" className="relative overflow-hidden py-16 sm:py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px] sm:h-[500px] sm:w-[500px] sm:blur-[120px]" />

      <div className="container mx-auto px-4">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">{t.nav.pricing}</span>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-5xl">
            <span className="text-gradient">{t.pricing.title}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.pricing.subtitle}</p>

          <div className="mt-8 inline-flex items-center rounded-full border bg-card/80 p-1 backdrop-blur">
            <button onClick={() => setYearly(false)} className={cn("rounded-full px-5 py-2 text-sm font-medium transition-all", !yearly ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}>
              {t.pricing.monthly}
            </button>
            <button onClick={() => setYearly(true)} className={cn("rounded-full px-5 py-2 text-sm font-medium transition-all", yearly ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}>
              {t.pricing.yearly}
              <span className="ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">-58%</span>
            </button>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:mt-12 lg:grid-cols-2">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 100}>
              <div className={cn(
                "group relative h-full",
                plan.popular && "lg:-mt-4"
              )}>
                {plan.popular && (
                  <div className="pointer-events-none absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] opacity-70 blur-md animate-gradient-x" />
                )}
                {plan.popular && (
                  <div className="pointer-events-none absolute -top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1.5 text-xs font-semibold text-white shadow-lg ring-2 ring-background">
                    ★ {t.pricing.popular}
                  </div>
                )}
              <div className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/80 p-6 backdrop-blur card-hover transition-transform duration-500 group-hover:-translate-y-1 sm:p-8",
                plan.popular && "border-primary/40"
              )}>
                {plan.popular && (
                  <>
                    <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 blur-3xl animate-float-slow" />
                    <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-gradient-to-tr from-accent/30 to-primary/20 blur-3xl animate-float-slow" style={{ animationDelay: '1.5s' }} />
                    <div className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                  </>
                )}
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className={cn("text-4xl font-extrabold tabular-nums sm:text-5xl", plan.popular && "text-gradient")}>{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm">
                      {f.included ? (
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/50">
                          <X className="h-3 w-3" />
                        </span>
                      )}
                      <span className={cn(!f.included && "text-muted-foreground/60")}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {plan.isPro ? (
                    <Button
                      type="button"
                      className={cn("w-full cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.97] glow-primary", loadingPro && "opacity-50")}
                      onClick={handleProCheckout}
                      aria-disabled={loadingPro}
                    >
                      {loadingPro ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.cta}
                    </Button>
                  ) : (
                    <Button className="w-full transition-transform hover:scale-[1.02] active:scale-[0.97]" variant="outline" asChild>
                      <Link to="/signup">{plan.cta}</Link>
                    </Button>
                  )}
                </div>
              </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
