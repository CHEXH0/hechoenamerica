import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, Language } from '@/contexts/TranslationContext';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

const LanguageSelector = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300">
        <Globe className="h-4 w-4 text-white" />
        <span className="text-white text-sm">
          {languages.find(lang => lang.code === language)?.flag}
        </span>
      </button>
      
      <div className="absolute top-full left-0 mt-2 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 min-w-[150px]">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors duration-200 flex items-center space-x-2 ${
              language === lang.code ? 'bg-white/20 text-white' : 'text-gray-300'
            }`}
          >
            <span>{lang.flag}</span>
            <span className="text-sm">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;