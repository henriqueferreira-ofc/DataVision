import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Menu, X, BarChart3 } from "lucide-react";

export function Navbar() {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Datavision Pro</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t.nav.features}
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t.nav.pricing}
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">{t.nav.login}</Link>
          </Button>
          <Button size="sm" asChild className="active:scale-[0.97]">
            <Link to="/signup">{t.nav.signup}</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#features" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.nav.features}</a>
            <a href="#pricing" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.nav.pricing}</a>
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" asChild><Link to="/login">{t.nav.login}</Link></Button>
              <Button size="sm" asChild><Link to="/signup">{t.nav.signup}</Link></Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
