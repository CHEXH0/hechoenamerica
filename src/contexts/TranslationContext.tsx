import React, { createContext, useContext, ReactNode } from 'react';
import { Language, Translations, translations } from '@/translations';
import { useGeoLanguage } from '@/hooks/useGeoLanguage';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isDetecting: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const { language, setLanguage, isDetecting } = useGeoLanguage();

  const value = {
    language,
    setLanguage,
    t: translations[language],
    isDetecting,
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

export type { Language };
