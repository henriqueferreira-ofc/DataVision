import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Upload, LayoutDashboard, BrainCircuit, FileText, Sparkles, ShieldCheck } from "lucide-react";

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    { icon: Upload, ...t.features.upload },
    { icon: LayoutDashboard, ...t.features.dashboard },
    { icon: BrainCircuit, ...t.features.analysis },
    { icon: FileText, ...t.features.reports },
    { icon: Sparkles, ...t.features.ai },
    { icon: ShieldCheck, ...t.features.security },
  ];

  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.features.title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.features.subtitle}</p>
        </ScrollReveal>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <div className="group relative rounded-xl border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
