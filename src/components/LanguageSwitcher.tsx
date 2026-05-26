import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "pt-BR" : "en")}
      aria-label={language === "en" ? "Current language: English" : "Idioma atual: Português"}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">{language === "en" ? "EN" : "PT"}</span>
    </Button>
  );
}
