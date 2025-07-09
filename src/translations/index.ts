import { Language, Translations } from '@/types/translations';
import { en } from './en';
import { es } from './es';
import { zh } from './zh';
import { pt } from './pt';
import { ru } from './ru';

export const translations: Record<Language, Translations> = {
  en,
  es,
  zh,
  pt,
  ru
};

export * from '@/types/translations';