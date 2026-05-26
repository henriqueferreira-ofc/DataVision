import { useLanguage } from "@/i18n/LanguageContext";
import logo from "@/assets/logo.png";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="DataVision logo" className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-bold">DataVision</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.footer.description}</p>
          </div>

          {[
            { title: t.footer.product, links: [t.nav.features, t.nav.pricing, "API"] },
            { title: t.footer.company, links: [t.footer.about, t.footer.blog, t.footer.careers] },
            { title: t.footer.legal, links: [t.footer.privacy, t.footer.terms] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DataVision. {t.common.allRightsReserved}
        </div>
      </div>
    </footer>
  );
}
