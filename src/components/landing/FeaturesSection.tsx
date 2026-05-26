import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Upload, LayoutDashboard, BrainCircuit, FileText, Sparkles, ShieldCheck } from "lucide-react";

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    { icon: Upload, gradient: "from-primary to-blue-400", ...t.features.upload },
    { icon: BrainCircuit, gradient: "from-purple-500 to-pink-500", ...t.features.analysis },
    { icon: LayoutDashboard, gradient: "from-accent to-emerald-400", ...t.features.dashboard },
    { icon: FileText, gradient: "from-amber-500 to-orange-500", ...t.features.reports },
    { icon: Sparkles, gradient: "from-fuchsia-500 to-violet-500", ...t.features.ai },
    { icon: ShieldCheck, gradient: "from-cyan-500 to-blue-500", ...t.features.security },
  ];

  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="container mx-auto px-4">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> {t.nav.features}
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-5xl">
            <span className="text-gradient">{t.features.title}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.features.subtitle}</p>
        </ScrollReveal>

        <div className="mx-auto mt-16 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 70}>
              <div className="group relative h-full overflow-hidden rounded-2xl border bg-card/70 p-6 card-hover backdrop-blur">
                {/* Decorative gradient blob */}
                <div className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${f.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30`} />

                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <f.icon className="h-5.5 w-5.5" strokeWidth={2.2} />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>

                {/* Bottom shimmer line */}
                <div className={`absolute inset-x-6 bottom-0 h-px bg-gradient-to-r ${f.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
