import { createContext, useContext, useState, useCallback } from 'react';
import th from './th.json';
import en from './en.json';

const translations = { th, en };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('werewolf-lang') || 'th';
  });

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'th' ? 'en' : 'th';
      localStorage.setItem('werewolf-lang', next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((l) => {
    localStorage.setItem('werewolf-lang', l);
    setLang(l);
  }, []);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
