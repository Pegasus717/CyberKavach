"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dict, type DictKey, type Lang } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey) => string;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [largeText, setLargeText] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("kavach-lang") as Lang | null;
    if (stored === "hi" || stored === "en") setLangState(stored);
    setLargeText(localStorage.getItem("kavach-large") === "1");
    setSoundOn(localStorage.getItem("kavach-sound") === "1");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.large = largeText ? "true" : "false";
  }, [lang, largeText]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem("kavach-lang", next);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: (key: DictKey) => dict[lang][key],
      largeText,
      setLargeText: (v) => {
        setLargeText(v);
        localStorage.setItem("kavach-large", v ? "1" : "0");
      },
      soundOn,
      setSoundOn: (v) => {
        setSoundOn(v);
        localStorage.setItem("kavach-sound", v ? "1" : "0");
      },
    }),
    [lang, setLang, largeText, soundOn],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
