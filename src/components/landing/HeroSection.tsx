import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Background grid */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[600px] w-[800px] rounded-full bg-primary/8 blur-[120px]" />

      <div className="container mx-auto px-4 text-center">
        <div className="animate-fade-up mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Zap className="h-3.5 w-3.5" />
            {t.hero.badge}
          </div>

          <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            {t.hero.title}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl" style={{ animationDelay: "100ms" }}>
            {t.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center" style={{ animationDelay: "200ms" }}>
            <Button size="lg" asChild className="gap-2 px-8 text-base active:scale-[0.97] shadow-lg shadow-primary/20">
              <Link to="/signup">
                {t.hero.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="gap-2 px-8 text-base active:scale-[0.97]">
              <a href="#features">{t.hero.ctaSecondary}</a>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-8 opacity-0 animate-fade-up" style={{ animationDelay: "400ms" }}>
          {[
            { value: "12,847+", label: t.hero.stat1 },
            { value: "85%", label: t.hero.stat2 },
            { value: "97.3%", label: t.hero.stat3 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold tabular-nums md:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
