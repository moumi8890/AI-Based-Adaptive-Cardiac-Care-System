import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { en, type TranslationKeys } from './en';
import { kn } from './kn';
import { hi } from './hi';
import { ta } from './ta';
import { te } from './te';
import { ml } from './ml';

export type LangCode = 'en' | 'kn' | 'hi' | 'ta' | 'te' | 'ml';

export const LANGUAGES: { code: LangCode; name: string; nativeName: string; flag: string; speechLocale: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: 'EN', speechLocale: 'en-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: 'KN', speechLocale: 'kn-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: 'HI', speechLocale: 'hi-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: 'TA', speechLocale: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: 'TE', speechLocale: 'te-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: 'ML', speechLocale: 'ml-IN' },
];

const translations: Record<LangCode, Partial<TranslationKeys>> = {
  en,
  kn,
  hi,
  ta,
  te,
  ml,
};

const STORAGE_KEY = 'mediconnect_lang';

function detectBrowserLang(): LangCode {
  const browser = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || 'en';
  const lower = browser.toLowerCase();
  if (lower.startsWith('kn')) return 'kn';
  if (lower.startsWith('hi')) return 'hi';
  if (lower.startsWith('ta')) return 'ta';
  if (lower.startsWith('te')) return 'te';
  if (lower.startsWith('ml')) return 'ml';
  return 'en';
}

type I18nContextType = {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (stored && translations[stored]) {
      setLangState(stored);
    } else {
      setLangState(detectBrowserLang());
    }
  }, []);

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const dict = translations[lang] as Record<string, string>;
    const fallback = en as Record<string, string>;
    let value = dict[key] ?? fallback[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return value;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function getSpeechLocale(lang: LangCode): string {
  const entry = LANGUAGES.find(l => l.code === lang);
  return entry?.speechLocale || 'en-IN';
}
