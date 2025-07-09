import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'zh' | 'pt' | 'ru';

interface Translations {
  hero: {
    title: string;
    subtitle: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    hero: {
      title: "HECHO EN AMÉRICA",
      subtitle: "LA MUSIC ES MEDICINE"
    }
  },
  es: {
    hero: {
      title: "HECHO EN AMÉRICA",
      subtitle: "LA MÚSICA ES MEDICINA"
    }
  },
  zh: {
    hero: {
      title: "美国制造",
      subtitle: "音乐是良药"
    }
  },
  pt: {
    hero: {
      title: "FEITO NA AMÉRICA",
      subtitle: "A MÚSICA É MEDICINA"
    }
  },
  ru: {
    hero: {
      title: "СДЕЛАНО В АМЕРИКЕ",
      subtitle: "МУЗЫКА - ЭТО ЛЕКАРСТВО"
    }
  }
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};