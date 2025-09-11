import React from 'react';
import type { Round, Prize } from '../../types';


const CurrentRoundPrizes: React.FC<{prizes: Prize[], prizeCategory?: string}> = ({ prizes, prizeCategory }) => (
    <div className="mt-4 text-center">
        <h4 className="text-lg sm:text-xl [&[data-screen-profile=small]]:text-base font-bold text-brand-gold/80 font-display tracking-widest">INGRÉDIENTS À GAGNER</h4>
        {prizeCategory && (
            <p className="text-base sm:text-lg [&[data-screen-profile=small]]:text-base text-brand-light/70 -mt-1">{prizeCategory}</p>
        )}
        <div className="flex justify-center flex-wrap gap-4 mt-2">
            {prizes.map((prize, index) => (
                <div key={prize.id || index} className="flex flex-col items-center p-2 bg-brand-dark/50 rounded-lg">
                    <img src={prize.imageUrl} alt={prize.name} className="h-28 w-28 [&[data-screen-profile=small]]:h-20 [&[data-screen-profile=small]]:w-20 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }}/>
                    <span className="mt-1 text-lg [&[data-screen-profile=small]]:text-base font-bold text-brand-light/90 w-28 [&[data-screen-profile=small]]:w-20 text-center break-words">{prize.name}</span>
                </div>
            ))}
        </div>
    </div>
);


const RoundHeader: React.FC<{ round: Round }> = ({ round }) => (
  <div className="w-full max-w-7xl bg-brand-dark/80 backdrop-blur-md p-4 [&[data-screen-profile=small]]:p-2 rounded-t-xl border-2 border-b-0 border-brand-gold/50 text-center animate-fade-in">
    <h2 className="font-display text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-bold text-brand-light/80 tracking-wider uppercase">
      Manche : <span className="text-brand-gold">{round.name}</span>
    </h2>
    <CurrentRoundPrizes prizes={round.prizePool} prizeCategory={round.prizeCategory} />
    <div className="border-t border-brand-gold/50 mt-4 mx-8"></div>
  </div>
);

export default RoundHeader;
