import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { translations, Language, TranslationKeys } from "./translations";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("datavision-lang");
    if (stored === "pt-BR" || stored === "en") return stored;
    return navigator.language.startsWith("pt") ? "pt-BR" : "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("datavision-lang", lang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", translations[language].meta.description);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", translations[language].meta.description);
    document
      .querySelector('meta[name="twitter:description"]')
      ?.setAttribute("content", translations[language].meta.description);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
