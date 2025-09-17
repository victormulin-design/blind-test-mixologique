import React, { useState, useMemo } from 'react';
import type { Team, Round, Prize } from '../../types.ts';
import { useTranslations } from '../../hooks/useTranslations.ts';
import { generateColorFromName } from '../../utils/helpers.ts';

interface RoundSummaryDisplayProps {
  round: Round;
  teams: Team[];
  onConfirmPrizes: (selections: Record<string, Prize>) => void;
  onBack: () => void;
}

const RoundSummaryDisplay: React.FC<RoundSummaryDisplayProps> = ({ round, teams, onConfirmPrizes, onBack }) => {
    const rankedTeams = useMemo(() => {
        const getRoundScore = (team: Team) => team.scores[round.id] || 0;
        return [...teams].sort((a, b) => getRoundScore(b) - getRoundScore(a) || Math.random() - 0.5);
    }, [teams, round.id]);

    const [selections, setSelections] = useState<Record<string, string>>({}); // teamId -> prizeId
    const t = useTranslations();

    const handleSelectPrize = (teamId: string, prizeId: string) => {
        setSelections(prev => {
            const newSelections = { ...prev };
            
            if (prizeId) {
                 // Un-assign from any other team that might have had this prize selected
                Object.keys(newSelections).forEach(key => {
                    if (newSelections[key] === prizeId && key !== teamId) {
                        delete newSelections[key];
                    }
                });
                newSelections[teamId] = prizeId;
            } else {
                delete newSelections[teamId];
            }

            return newSelections;
        });
    };

    const handleConfirm = () => {
        const prizePool = round.prizePool || [];
        const prizeMap = prizePool.reduce((acc, prize) => {
            if (prize.id) acc[prize.id] = prize;
            return acc;
        }, {} as Record<string, Prize>);

        const finalSelections: Record<string, Prize> = {};
        for (const teamId in selections) {
            finalSelections[teamId] = prizeMap[selections[teamId]];
        }
        onConfirmPrizes(finalSelections);
    };

    const selectedPrizeIds = new Set(Object.values(selections));
    const allTeamsSelected = rankedTeams.every(team => selections[team.id]);
    const prizePool = round.prizePool || [];
    const availablePrizesToDisplay = prizePool.filter(p => p.id && !selectedPrizeIds.has(p.id));

    return (
        <div className="bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 [&[data-screen-profile=small]]:p-2 rounded-xl shadow-2xl border-2 border-brand-gold/80 w-full max-w-7xl animate-fade-in text-center">
            <h2 className="font-display text-3xl sm:text-4xl [&[data-screen-profile=small]]:text-2xl font-bold text-brand-gold tracking-widest uppercase">{t.endOfRound(round.name)}</h2>

            {availablePrizesToDisplay.length > 0 && (
                <div className="mt-6 border-t-2 border-brand-gold/20 pt-4">
                    <h3 className="text-2xl [&[data-screen-profile=small]]:text-xl font-bold text-brand-gold/80 font-display tracking-widest mb-4">{t.remainingPrizes}</h3>
                    <div className="flex justify-center flex-wrap gap-4">
                        {availablePrizesToDisplay.map((prize) => (
                            <div key={prize.id} className="flex flex-col items-center p-2 bg-brand-dark/50 rounded-lg animate-fade-in transition-all duration-300">
                                {prize.imageUrl ? (
                                    <img src={prize.imageUrl} alt={prize.name} className="h-32 w-32 [&[data-screen-profile=small]]:h-24 [&[data-screen-profile=small]]:w-24 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }}/>
                                ) : (
                                    <div style={{ backgroundColor: generateColorFromName(prize.name) }} className="h-32 w-32 [&[data-screen-profile=small]]:h-24 [&[data-screen-profile=small]]:w-24 flex items-center justify-center rounded-lg text-white font-bold text-6xl [&[data-screen-profile=small]]:text-5xl">
                                        {prize.name ? prize.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                                <span className="mt-1 text-lg [&[data-screen-profile=small]]:text-base font-semibold text-brand-light/80 w-32 [&[data-screen-profile=small]]:w-24 text-center break-words">{prize.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <p className="text-lg sm:text-xl [&[data-screen-profile=small]]:text-base mt-6 text-brand-light/80">{t.assignPrizes}</p>
            <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {rankedTeams.map((team, index) => {
                    const availablePrizesForDropdown = prizePool.filter(p => !selectedPrizeIds.has(p.id!) || selections[team.id] === p.id);
                    const selectedPrize = prizePool.find(p => p.id === selections[team.id]);

                    return (
                         <div key={team.id} className="bg-brand-dark/50 p-3 [&[data-screen-profile=small]]:p-2 rounded-lg flex items-center justify-between animate-slide-in-up shadow-md border border-brand-gold/50" style={{ animationDelay: `${index * 100}ms`}}>
                             <div className="flex items-center text-left">
                                <span className="text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-bold w-12 text-brand-light/60">{index + 1}.</span>
                                <div className="flex flex-col">
                                    <span className="text-lg sm:text-xl [&[data-screen-profile=small]]:text-base font-semibold">{team.name}</span>
                                    <span className="text-base sm:text-lg [&[data-screen-profile=small]]:text-sm text-brand-gold">({Math.round(team.scores[round.id] || 0)} pts)</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <select
                                    value={selections[team.id] || ''}
                                    onChange={(e) => handleSelectPrize(team.id, e.target.value)}
                                    className="bg-brand-dark border border-brand-gold/70 text-brand-light text-base [&[data-screen-profile=small]]:text-sm rounded-lg focus:ring-brand-gold focus:border-brand-gold block w-full p-2.5 [&[data-screen-profile=small]]:p-1.5"
                                >
                                    <option value="">{t.choosePrize}</option>
                                    {availablePrizesForDropdown.map(prize => (
                                        <option key={prize.id} value={prize.id!}>{prize.name}</option>
                                    ))}
                                </select>
                                {selectedPrize && (
                                    selectedPrize.imageUrl ? (
                                        <img src={selectedPrize.imageUrl} alt={selectedPrize.name} title={selectedPrize.name} className="h-16 w-16 [&[data-screen-profile=small]]:h-12 [&[data-screen-profile=small]]:w-12 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }} />
                                    ) : (
                                        <div style={{ backgroundColor: generateColorFromName(selectedPrize.name) }} className="h-16 w-16 [&[data-screen-profile=small]]:h-12 [&[data-screen-profile=small]]:w-12 flex items-center justify-center rounded-lg text-white font-bold text-3xl [&[data-screen-profile=small]]:text-2xl flex-shrink-0">
                                            {selectedPrize.name ? selectedPrize.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )
                                )}
                            </div>
                         </div>
                    )
                })}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                    onClick={onBack}
                    className="font-display w-full sm:w-auto px-8 py-3 [&[data-screen-profile=small]]:px-4 [&[data-screen-profile=small]]:py-2 bg-transparent border-2 border-brand-burgundy text-brand-light hover:bg-brand-burgundy rounded-lg font-bold text-lg sm:text-xl [&[data-screen-profile=small]]:text-base tracking-widest uppercase transition-all duration-300 transform hover:scale-105"
                >
                    {t.backButton}
                </button>
                <button 
                    onClick={handleConfirm} 
                    disabled={!allTeamsSelected}
                    className="font-display w-full sm:w-auto px-8 py-3 [&[data-screen-profile=small]]:px-4 [&[data-screen-profile=small]]:py-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t.confirmAndNext}
                </button>
            </div>
        </div>
    )
};

export default RoundSummaryDisplay;