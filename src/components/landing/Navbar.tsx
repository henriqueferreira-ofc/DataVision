import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

export function Navbar() {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="DataVision logo" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold tracking-tight">DataVision</span>
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
          <Button size="sm" asChild className="bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/25 transition-transform hover:scale-[1.03] active:scale-[0.97]">
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
