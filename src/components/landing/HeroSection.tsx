import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, TrendingUp, BarChart3, Sparkles, Activity } from "lucide-react";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden pb-16 pt-24 sm:pb-20 sm:pt-28 md:pb-32 md:pt-40">
      {/* Static background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary/25 blur-[100px] sm:h-[520px] sm:w-[520px] sm:blur-[140px]" />
        <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-accent/20 blur-[100px] sm:h-[440px] sm:w-[440px] sm:blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-56 w-[28rem] -translate-x-1/2 rounded-full bg-purple-500/15 blur-[100px] sm:h-[360px] sm:w-[720px] sm:blur-[140px]" />
      </div>
      <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-60" />

      <div className="container mx-auto px-4 text-center">
        <div className="animate-fade-up mx-auto max-w-3xl">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur sm:mb-6 sm:px-4 sm:text-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
            <Zap className="h-3.5 w-3.5" />
            {t.hero.badge}
          </div>

          <h1 className="text-balance text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl md:text-6xl lg:text-7xl">
            <span className="text-gradient">{t.hero.title}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg md:mt-6 md:text-xl">
            {t.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="group w-full gap-2 px-8 text-base glow-primary transition-transform hover:scale-[1.03] active:scale-[0.97] sm:w-auto">
              <Link to="/signup">
                {t.hero.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full gap-2 px-8 text-base glass active:scale-[0.97] sm:w-auto">
              <a href="#features">{t.hero.ctaSecondary}</a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-3 animate-fade-up sm:mt-16 sm:gap-8" style={{ animationDelay: "300ms", opacity: 0 }}>
          {[
            { value: "12,847+", label: t.hero.stat1 },
            { value: "85%", label: t.hero.stat2 },
            { value: "97.3%", label: t.hero.stat3 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl font-bold tabular-nums text-gradient sm:text-2xl md:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard preview mockup — static, with hover interactions only */}
        <div className="mx-auto mt-14 max-w-5xl animate-fade-up sm:mt-20" style={{ animationDelay: "450ms", opacity: 0 }}>
          <div className="relative group">
            <div className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-tr from-primary/30 via-accent/20 to-purple-500/30 blur-2xl opacity-70 transition-opacity duration-500 group-hover:opacity-100 sm:-inset-4" />
            <div className="glass overflow-hidden rounded-2xl shadow-2xl transition-transform duration-500 hover:-translate-y-1">
              {/* Window chrome */}
              <div className="relative flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                </div>
                <div className="mx-auto flex items-center gap-2 rounded-md bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  <BarChart3 className="h-3 w-3" /> datavision.app/dashboard
                </div>
              </div>

              {/* Mock dashboard */}
              <div className="grid gap-3 p-3 sm:grid-cols-4 sm:gap-4 sm:p-5">
                {[
                  { icon: TrendingUp, label: "Revenue", value: "R$ 248.5K", delta: "+12.4%", color: "text-emerald-500" },
                  { icon: Activity, label: "Active Users", value: "8,492", delta: "+5.1%", color: "text-primary" },
                  { icon: Sparkles, label: "Conversions", value: "1,284", delta: "+8.7%", color: "text-accent" },
                  { icon: BarChart3, label: "AOV", value: "R$ 193", delta: "+2.3%", color: "text-purple-500" },
                ].map((k, i) => (
                  <div key={i} className="group/card relative overflow-hidden rounded-xl border bg-card/70 p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
                      <k.icon className={`h-3.5 w-3.5 ${k.color} transition-transform group-hover/card:scale-110`} />
                    </div>
                    <div className="mt-1.5 text-lg font-bold tabular-nums">{k.value}</div>
                    <div className={`flex items-center gap-1 text-[11px] font-medium ${k.color}`}>
                      <span className="inline-block h-1 w-1 rounded-full bg-current" />
                      {k.delta}
                    </div>
                  </div>
                ))}

                {/* Chart area */}
                <div className="rounded-xl border bg-card/70 p-3 sm:col-span-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold">Performance</span>
                    <div className="flex gap-1">
                      {["7D", "30D", "90D"].map((p, i) => (
                        <span key={p} className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${i === 1 ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex h-32 items-end gap-1.5">
                    {[40, 65, 50, 78, 60, 92, 70, 88, 55, 95, 72, 84].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-primary/80 to-accent/80 transition-all duration-300 hover:from-primary hover:to-accent"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Side panel */}
                <div className="rounded-xl border bg-card/70 p-4">
                  <span className="text-xs font-semibold">Top Insights</span>
                  <ul className="mt-3 space-y-2.5">
                    {["Growth trending up", "Conversion +18% MoM", "Retention healthy"].map((txt, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent" />
                        {txt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
