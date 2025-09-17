import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';

// FIX: Completed the component to return JSX, resolving the error "Type '() => void' is not assignable to type 'FC<{}>'".
const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();

  return (
    <div className="mt-4">
      <h3 className="font-display text-xl text-brand-gold tracking-widest text-center mb-4">{t.languageSelectorTitle}</h3>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setLanguage('en')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${language === 'en' ? 'bg-brand-gold text-brand-dark' : 'bg-brand-dark/50 hover:bg-brand-dark/70 text-brand-light'}`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('fr')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${language === 'fr' ? 'bg-brand-gold text-brand-dark' : 'bg-brand-dark/50 hover:bg-brand-dark/70 text-brand-light'}`}
        >
          Français
        </button>
      </div>
    </div>
  );
};

// FIX: Added a default export to resolve the module import error in App.tsx.
export default LanguageSelector;
