import React from 'react';
import type { Round, Prize } from '../../types.ts';
import { PrizeMode } from '../../types.ts';
import { useTranslations } from '../../hooks/useTranslations.ts';
import { generateColorFromName } from '../../utils/helpers.ts';


const CurrentRoundPrizes: React.FC<{prizes: Prize[], prizeCategory?: string}> = ({ prizes, prizeCategory }) => {
  const t = useTranslations();
  return (
    <div className="mt-4 text-center">
        <h4 className="text-base sm:text-base [&[data-screen-profile=small]]:text-base font-bold text-brand-gold/80 font-display tracking-widest">{t.prizesToWinHeader}</h4>
        {prizeCategory && (
            <p className="text-base sm:text-lg [&[data-screen-profile=small]]:text-base text-brand-light/70 -mt-1">{prizeCategory}</p>
        )}
        <div className="flex justify-center flex-wrap gap-2 mt-2">
            {(prizes || []).map((prize, index) => (
                <div key={prize.id || index} className="flex flex-col items-center p-2 bg-brand-dark/50 rounded-lg">
                    {prize.imageUrl ? (
                        <img src={prize.imageUrl} alt={prize.name} className="h-28 w-28 [&[data-screen-profile=small]]:h-20 [&[data-screen-profile=small]]:w-20 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }}/>
                    ) : (
                        <div style={{ backgroundColor: generateColorFromName(prize.name) }} className="h-28 w-28 [&[data-screen-profile=small]]:h-20 [&[data-screen-profile=small]]:w-20 flex items-center justify-center rounded-lg text-white font-bold text-5xl [&[data-screen-profile=small]]:text-4xl">
                            {prize.name ? prize.name.charAt(0).toUpperCase() : '?'}
                        </div>
                    )}
                    <span className="mt-1 text-lg [&[data-screen-profile=small]]:text-base font-bold text-brand-light/90 w-28 [&[data-screen-profile=small]]:w-20 text-center break-words">{prize.name}</span>
                </div>
            ))}
        </div>
    </div>
  );
}


const RoundHeader: React.FC<{ round: Round, prizeMode: PrizeMode }> = ({ round, prizeMode }) => {
  const t = useTranslations();
  return (
    <div className="w-full max-w-screen-2xl bg-brand-dark/80 backdrop-blur-md p-4 [&[data-screen-profile=small]]:p-2 rounded-t-xl border-2 border-b-0 border-brand-gold/50 text-center animate-fade-in">
      <h2 className="font-display text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-bold text-brand-light/80 tracking-wider uppercase">
        {t.roundLabel} <span className="text-brand-gold">{round.name}</span>
      </h2>
      {prizeMode === PrizeMode.PER_ROUND && round.prizePool && round.prizePool.length > 0 && (
        <>
          <CurrentRoundPrizes prizes={round.prizePool} prizeCategory={round.prizeCategory} />
          <div className="border-t border-brand-gold/50 mt-4 mx-8"></div>
        </>
      )}
    </div>
  );
}

export default RoundHeader;