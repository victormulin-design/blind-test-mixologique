import React, { useMemo } from 'react';
import type { Team, Prize } from '../../types';
import { CocktailIcon } from '../IconComponents';
import CelebrationAnimation from './CelebrationAnimation';

interface FinalSummaryDisplayProps {
  teams: Team[];
}

const FinalSummaryDisplay: React.FC<FinalSummaryDisplayProps> = ({ teams }) => {
    const getTeamTotalScore = (team: Team) => Object.values(team.scores).reduce((a, b) => a + b, 0);

    const rankedTeams = useMemo(() => 
        [...teams].sort((a, b) => getTeamTotalScore(b) - getTeamTotalScore(a) || Math.random() - 0.5),
    [teams]);
    
    return (
    <div className="relative bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 [&[data-screen-profile=small]]:p-2 rounded-xl shadow-2xl border-2 border-brand-gold w-full max-w-7xl animate-fade-in text-center overflow-hidden">
        <CelebrationAnimation />
        <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl [&[data-screen-profile=small]]:text-2xl font-bold text-brand-gold tracking-widest uppercase">Résultats Finaux</h2>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {rankedTeams.map((team, index) => (
                    <div 
                        key={team.id} 
                        className={`p-4 [&[data-screen-profile=small]]:p-2 rounded-lg transition-all duration-500 ${index === 0 ? 'bg-brand-gold/20 border-2 border-brand-gold shadow-lg' : 'bg-brand-dark/80 border border-brand-gold/60'}`}
                        style={{ animation: 'slideInUp 0.5s ease-out forwards', animationDelay: `${index * 150}ms`, opacity: 0 }}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
                            <div>
                                <p className="text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-bold text-brand-light/60">#{index + 1}</p>
                                <p className={`text-lg sm:text-xl [&[data-screen-profile=small]]:text-base font-extrabold ${index === 0 ? 'text-brand-gold' : 'text-brand-light'}`}>{team.name}</p>
                            </div>
                            <p className={`text-2xl sm:text-3xl [&[data-screen-profile=small]]:text-xl font-bold ${index === 0 ? 'text-brand-gold' : 'text-brand-light/80'} mt-1 sm:mt-0`}>{Math.round(getTeamTotalScore(team))} pts</p>
                        </div>

                        <div className="mt-3 border-t pt-3 border-brand-gold/30">
                            <h4 className="flex items-center justify-center text-base sm:text-lg [&[data-screen-profile=small]]:text-sm font-semibold text-brand-light"><CocktailIcon className="h-5 w-5 mr-2"/> Votre Recette de Cocktail</h4>
                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                {team.collectedPrizes.length > 0 ? team.collectedPrizes.map((prize: Prize) => (
                                    <div key={prize.id} className="flex flex-col items-center">
                                        <img src={prize.imageUrl} alt={prize.name} className="h-24 w-24 [&[data-screen-profile=small]]:h-16 [&[data-screen-profile=small]]:w-16 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }}/>
                                        <span className="mt-1 text-lg [&[data-screen-profile=small]]:text-base font-semibold text-brand-light/90 w-24 [&[data-screen-profile=small]]:w-16 text-center break-words">{prize.name}</span>
                                    </div>
                                )) : <p className="text-brand-light/50 italic text-sm">Aucun ingrédient.</p>}
                            </div>
                        </div>

                        {index === 0 && <p className="mt-3 font-display text-lg sm:text-xl [&[data-screen-profile=small]]:text-base font-bold text-brand-gold tracking-widest">GAGNANT !</p>}
                    </div>
                ))}
            </div>
             <p className="mt-8 font-display text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-bold text-brand-gold tracking-widest animate-pulse">
                Et maintenant... que la dégustation commence pour désigner le VRAI gagnant ! 🥳
            </p>
        </div>
    </div>
    )
};

export default FinalSummaryDisplay;