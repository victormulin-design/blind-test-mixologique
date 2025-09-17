import React from 'react';
import { CocktailIcon } from '../IconComponents.tsx';

const CelebrationAnimation: React.FC = () => {
  const bubbles = Array.from({ length: 30 });
  const colors = ['#D4AF37', '#F5EFE6', '#FFFFFF'];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {bubbles.map((_, i) => {
        const color = colors[i % colors.length];
        const size = Math.random() * 15 + 5;
        return (
          <div
            key={i}
            className="absolute rounded-full animate-bubbles"
            style={{
              bottom: '-20px',
              left: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              background: color,
              opacity: Math.random() * 0.5 + 0.2,
              boxShadow: `0 0 5px ${color}`,
            }}
          />
        );
      })}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <CocktailIcon 
          className="absolute h-48 w-48 text-brand-gold opacity-0 animate-clink-left"
          style={{ animationDelay: '0.5s' }}
        />
        <CocktailIcon 
          className="absolute h-48 w-48 text-brand-light opacity-0 animate-clink-right"
          style={{ animationDelay: '0.5s' }}
        />
      </div>
    </div>
  );
};

export default CelebrationAnimation;