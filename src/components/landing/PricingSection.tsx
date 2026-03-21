import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const { t, language } = useLanguage();
  const [yearly, setYearly] = useState(false);
  const pt = language === "pt-BR";

  const plans = [
    {
      name: "Básico",
      price: yearly ? "R$99,90" : "R$19,90",
      period: yearly ? (pt ? "/ano" : "/yr") : (pt ? "/mês" : "/mo"),
      description: pt ? "Para profissionais começando com análise de dados" : "For professionals getting started with data analysis",
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
    },
    {
      name: "Pro",
      price: yearly ? "R$129,90" : "R$29,90",
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
    },
  ];

  return (
    <section id="pricing" className="bg-muted/30 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.pricing.title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.pricing.subtitle}</p>

          <div className="mt-8 inline-flex items-center rounded-full border bg-card p-1">
            <button onClick={() => setYearly(false)} className={cn("rounded-full px-5 py-2 text-sm font-medium transition-all", !yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {t.pricing.monthly}
            </button>
            <button onClick={() => setYearly(true)} className={cn("rounded-full px-5 py-2 text-sm font-medium transition-all", yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {t.pricing.yearly}
              <span className="ml-1.5 text-xs opacity-75">{pt ? "(-58%)" : "(-58%)"}</span>
            </button>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 lg:grid-cols-2">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 100}>
              <div className={cn(
                "relative flex flex-col rounded-xl border bg-card p-8 shadow-sm transition-shadow duration-300 hover:shadow-md",
                plan.popular && "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
              )}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    {t.pricing.popular}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mt-6">
                  <span className="text-4xl font-extrabold tabular-nums">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm">
                      {f.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={cn(!f.included && "text-muted-foreground/60")}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button className={cn("w-full active:scale-[0.97]", plan.popular && "shadow-lg shadow-primary/20")} variant={plan.popular ? "default" : "outline"} asChild>
                    <Link to="/signup">{t.pricing.cta}</Link>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
