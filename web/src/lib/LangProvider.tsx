"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { t, type Lang, type Translations } from "./i18n";

interface LangCtx {
  lang: Lang;
  isAr: boolean;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  i: Translations;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = localStorage.getItem("palier_lang") as Lang | null;
    if (stored === "ar" || stored === "fr") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("palier_lang", l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "fr" ? "ar" : "fr");
  }, [lang, setLang]);

  const isAr = lang === "ar";
  const i = t[lang] as Translations;

  return (
    <Ctx.Provider value={{ lang, isAr, setLang, toggleLang, i }}>
      <div dir={isAr ? "rtl" : "ltr"} className="flex h-full flex-col">
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback for pages outside LangProvider (e.g. syndic)
    return { lang: "fr", isAr: false, setLang: () => {}, toggleLang: () => {}, i: t.fr as Translations };
  }
  return ctx;
}
