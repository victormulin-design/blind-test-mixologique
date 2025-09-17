import { useLanguage } from '../contexts/LanguageContext.tsx';
import { translations } from '../translations.ts';

export const useTranslations = () => {
  const { language } = useLanguage();
  return translations[language];
};