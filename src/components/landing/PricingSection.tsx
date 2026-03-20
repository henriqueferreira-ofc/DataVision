import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const { t } = useLanguage();
  const [yearly, setYearly] = useState(false);

  const plans = [
    { ...t.pricing.basic, popular: false, enterprise: false },
    { ...t.pricing.pro, popular: true, enterprise: false },
    { ...t.pricing.enterprise, popular: false, enterprise: true },
  ];

  return (
    <section id="pricing" className="bg-muted/30 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.pricing.title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.pricing.subtitle}</p>

          <div className="mt-8 inline-flex items-center rounded-full border bg-card p-1">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                !yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.pricing.monthly}
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.pricing.yearly}
            </button>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 100}>
              <div
                className={cn(
                  "relative flex flex-col rounded-xl border bg-card p-8 shadow-sm transition-shadow duration-300 hover:shadow-md",
                  plan.popular && "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
                )}
              >
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
                  <span className="text-4xl font-extrabold tabular-nums">{yearly ? plan.priceYear : plan.price}</span>
                  {!plan.enterprise && <span className="text-muted-foreground">/{yearly ? (t.pricing.yearly === "Anual" ? "ano" : "year") : (t.pricing.monthly === "Mensal" ? "mês" : "month")}</span>}
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button
                    className={cn("w-full active:scale-[0.97]", plan.popular && "shadow-lg shadow-primary/20")}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to={plan.enterprise ? "/contact" : "/signup"}>
                      {plan.enterprise ? t.pricing.ctaEnterprise : t.pricing.cta}
                    </Link>
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
