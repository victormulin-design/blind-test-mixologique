import React, { useRef } from 'react';
import { LogoIcon, FolderOpenIcon } from './IconComponents.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';

interface WelcomeScreenProps {
  onStart: () => void;
  onLoadGame: (file: File) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onLoadGame }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onLoadGame(file);
    }
    // Reset file input to allow loading the same file again
    if (event.target) {
        event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center animate-slide-in-up max-w-6xl text-center p-6 bg-brand-dark/50 border-2 border-brand-gold rounded-xl backdrop-blur-sm shadow-[0_0_20px_#D4AF37]">
      <LogoIcon className="h-28 w-28 text-brand-gold" />
      <h2 className="mt-8 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-wider uppercase text-brand-light" style={{textShadow: '0 0 10px #D4AF37'}}>
        {t.welcomeTitle}
      </h2>
      <p className="mt-6 max-w-2xl font-body text-lg sm:text-xl md:text-2xl text-brand-light/80">
        {t.welcomeSubtitle}
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-6">
        <button
          onClick={onStart}
          className="font-display px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-lg sm:text-xl md:text-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          {t.createGameButton}
        </button>
        <button
          onClick={handleLoadClick}
          className="flex items-center font-body px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 bg-transparent border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark rounded-lg font-bold text-lg sm:text-xl md:text-2xl tracking-wide uppercase transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <FolderOpenIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
          {t.loadGameButton}
        </button>
      </div>
      <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.zip"
          className="hidden"
        />
    </div>
  );
};

export default WelcomeScreen;