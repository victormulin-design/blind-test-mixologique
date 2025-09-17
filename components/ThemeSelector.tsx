import React, { useState, useEffect } from 'react';
import { CheckIcon } from './IconComponents.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';

const themes = [
  {
    id: 'speakeasy-gold',
    name: 'Speakeasy Gold',
    colors: ['#D4AF37', '#800020', '#F5EFE6', '#1a1a1a']
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    colors: ['#ffd60a', '#0466c8', '#ffffff', '#031d44']
  },
  {
    id: 'cosmic-reef',
    name: 'Cosmic Reef',
    colors: ['#d9cb48', '#278aa7', '#fdfbf0', '#092833']
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    colors: ['#ff00ff', '#00A9E0', '#f0f0ff', '#101018']
  },
];

const ThemeSelector: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('blindtest-theme') || 'speakeasy-gold';
    }
    return 'speakeasy-gold';
  });
  const t = useTranslations();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('blindtest-theme', activeTheme);
  }, [activeTheme]);

  return (
    <div>
      <h3 className="font-display text-xl text-brand-gold tracking-widest text-center mb-4">{t.themeSelectorTitle}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themes.map(theme => (
          <button
            key={theme.id}
            onClick={() => setActiveTheme(theme.id)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left bg-brand-dark/30 hover:bg-brand-dark/50 ${activeTheme === theme.id ? 'border-brand-gold scale-105 shadow-lg' : 'border-transparent hover:border-brand-gold/50'}`}
          >
            <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-light text-lg">{theme.name}</span>
                {activeTheme === theme.id && <CheckIcon className="h-6 w-6 text-brand-gold" />}
            </div>
            <div className="flex mt-2 rounded-md overflow-hidden h-8">
              {theme.colors.map((color, index) => (
                <div key={index} style={{ backgroundColor: color }} className="flex-1"></div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;