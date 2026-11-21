"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { Lang } from "@/lib/types";
import { translate } from "@/lib/i18n/ui";
import type { UiKey, UiVars } from "@/lib/i18n/ui";

const STORAGE_KEY = "astra-lang";

// A tiny external store so the language can be read from localStorage without
// setting state inside an effect, and so server and first client render agree
// (both start in English).
let current: Lang | null = null;
const listeners = new Set<() => void>();

function readStored(): Lang {
  if (current) return current;
  let value: Lang = "en";
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "hi") value = "hi";
  } catch {
    // Storage can be blocked. The app still works for this visit.
  }
  current = value;
  return value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function writeLang(next: Lang) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore: the choice just will not be remembered.
  }
  listeners.forEach((listener) => listener());
}

export type TFunction = (key: UiKey, vars?: UiVars) => string;

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunction;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readStored, () => "en" as Lang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => writeLang(next), []);
  const t = useCallback<TFunction>((key, vars) => translate(lang, key, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
