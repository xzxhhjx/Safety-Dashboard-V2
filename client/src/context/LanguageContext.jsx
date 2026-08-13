import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { resolveKey, interpolate, detectLang } from '../i18n/core';
import en from '../i18n/en';
import zh from '../i18n/zh';

const dicts = { en, zh };
const STORAGE_KEY = 'hse-lang';

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

function getInitial() {
  try {
    return detectLang((k) => localStorage.getItem(k));
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitial);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* noop */ }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const setLang = useCallback((l) => { if (l === 'zh' || l === 'en') setLangState(l); }, []);

  const t = useCallback((key, vars) => {
    const dict = dicts[lang] || en;
    const fallback = lang === 'en' ? null : en;
    return interpolate(resolveKey(dict, key, fallback), vars);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
