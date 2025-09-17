import React from 'react';

type Language = 'en' | 'fr';
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = React.useState<Language>(() => {
    const savedLang = localStorage.getItem('quiznight-lang');
    return (savedLang === 'en' || savedLang === 'fr') ? savedLang : 'en'; // Default to English
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('quiznight-lang', lang);
    setLanguageState(lang);
  };

  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
