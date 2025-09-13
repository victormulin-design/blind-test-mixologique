import React from 'react';

interface RulesDisplayProps {
  rules: string;
  onAcknowledge: () => void;
}

const RulesDisplay: React.FC<RulesDisplayProps> = ({ rules, onAcknowledge }) => (
  <div className="bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl border-2 border-brand-gold/80 w-full max-w-6xl animate-fade-in text-center">
    <h2 className="font-display text-3xl sm:text-4xl [&[data-screen-profile=small]]:text-2xl font-bold text-brand-gold tracking-widest uppercase">Règles du Jeu</h2>
    <p className="whitespace-pre-wrap text-3xl sm:text-3xl [&[data-screen-profile=small]]:text-3xl my-6 text-brand-light/90 text-center">
      {rules}
    </p>
    <button
      onClick={onAcknowledge}
      className="font-display w-full sm:w-auto px-8 py-3 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-xl sm:text-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg"
    >
      Compris !
    </button>
  </div>
);

export default RulesDisplay;
