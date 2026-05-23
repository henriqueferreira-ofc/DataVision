import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, TrendingUp, BarChart3, Sparkles, Activity } from "lucide-react";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[140px] animate-float-slow" />
        <div className="absolute top-20 right-1/4 h-[440px] w-[440px] rounded-full bg-accent/20 blur-[140px] animate-float-slower" />
        <div className="absolute bottom-0 left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-purple-500/15 blur-[140px] animate-float-slow" />
      </div>
      <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-60" />

      <div className="container mx-auto px-4 text-center">
        <div className="animate-fade-up mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-70 animate-pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <Zap className="h-3.5 w-3.5" />
            {t.hero.badge}
          </div>

          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-gradient">{t.hero.title}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            {t.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="group gap-2 px-8 text-base glow-primary transition-transform hover:scale-[1.03] active:scale-[0.97]">
              <Link to="/signup">
                {t.hero.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="gap-2 px-8 text-base glass active:scale-[0.97]">
              <a href="#features">{t.hero.ctaSecondary}</a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-8 animate-fade-up" style={{ animationDelay: "300ms", opacity: 0 }}>
          {[
            { value: "12,847+", label: t.hero.stat1 },
            { value: "85%", label: t.hero.stat2 },
            { value: "97.3%", label: t.hero.stat3 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold tabular-nums md:text-3xl text-gradient">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard preview mockup */}
        <div className="mx-auto mt-20 max-w-5xl animate-fade-up" style={{ animationDelay: "450ms", opacity: 0 }}>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-primary/30 via-accent/20 to-purple-500/30 blur-2xl" />
            <div className="glass overflow-hidden rounded-2xl shadow-2xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
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
              <div className="grid gap-4 p-5 sm:grid-cols-4">
                {[
                  { icon: TrendingUp, label: "Revenue", value: "R$ 248.5K", delta: "+12.4%", color: "text-emerald-500" },
                  { icon: Activity, label: "Active Users", value: "8,492", delta: "+5.1%", color: "text-primary" },
                  { icon: Sparkles, label: "Conversions", value: "1,284", delta: "+8.7%", color: "text-accent" },
                  { icon: BarChart3, label: "AOV", value: "R$ 193", delta: "+2.3%", color: "text-purple-500" },
                ].map((k, i) => (
                  <div key={i} className="rounded-xl border bg-card/70 p-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
                      <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                    </div>
                    <div className="mt-1.5 text-lg font-bold tabular-nums">{k.value}</div>
                    <div className={`text-[11px] font-medium ${k.color}`}>{k.delta}</div>
                  </div>
                ))}

                {/* Chart area */}
                <div className="rounded-xl border bg-card/70 p-4 sm:col-span-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold">Performance</span>
                    <div className="flex gap-1">
                      {["7D", "30D", "90D"].map((p, i) => (
                        <span key={p} className={`rounded px-1.5 py-0.5 text-[10px] ${i === 1 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex h-32 items-end gap-1.5">
                    {[40, 65, 50, 78, 60, 92, 70, 88, 55, 95, 72, 84].map((h, i) => (
                      <div key={i} className="flex-1 origin-bottom rounded-t bg-gradient-to-t from-primary/80 to-accent/80 animate-bar-grow"
                        style={{ height: `${h}%`, animationDelay: `${i * 60 + 600}ms` }} />
                    ))}
                  </div>
                </div>

                {/* Side panel */}
                <div className="rounded-xl border bg-card/70 p-4">
                  <span className="text-xs font-semibold">Top Insights</span>
                  <ul className="mt-3 space-y-2.5">
                    {["Growth trending up", "Conversion +18% MoM", "Retention healthy"].map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent" />
                        {t}
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
