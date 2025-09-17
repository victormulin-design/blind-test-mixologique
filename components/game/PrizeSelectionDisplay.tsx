import React, { useState, useMemo } from 'react';
import type { Team, Round, Prize } from '../../types.ts';
import { CheckIcon } from '../IconComponents.tsx';
import { useTranslations } from '../../hooks/useTranslations.ts';
import { generateColorFromName } from '../../utils/helpers.ts';

interface PrizeSelectionDisplayProps {
  round: Round;
  teams: Team[];
  prizeBank: Prize[];
  onConfirmPrizes: (selections: Record<string, Prize>) => void;
  onBack: () => void;
}

const PrizeSelectionDisplay: React.FC<PrizeSelectionDisplayProps> = ({ round, teams, prizeBank, onConfirmPrizes, onBack }) => {
    const rankedTeams = useMemo(() => {
        const getRoundScore = (team: Team) => team.scores[round.id] || 0;
        return [...teams].sort((a, b) => getRoundScore(b) - getRoundScore(a) || Math.random() - 0.5);
    }, [teams, round.id]);
    
    // Determine how many teams get to pick a prize (e.g., all teams with score > 0)
    const pickingTeams = useMemo(() => rankedTeams.filter(t => (t.scores[round.id] || 0) > 0), [rankedTeams, round.id]);
    const numPickingTeams = pickingTeams.length;

    const [currentPickerIndex, setCurrentPickerIndex] = useState(0);
    const [selections, setSelections] = useState<Record<string, Prize>>({}); // teamId -> Prize object
    const t = useTranslations();

    const currentPicker = pickingTeams[currentPickerIndex];
    const isSelectionFinished = currentPickerIndex >= numPickingTeams || prizeBank.length === Object.keys(selections).length;

    const handleSelectPrize = (prize: Prize) => {
        if (!currentPicker) return;
        setSelections(prev => ({ ...prev, [currentPicker.id]: prize }));
        setCurrentPickerIndex(prev => prev + 1);
    };
    
    const handleUndoLastSelection = () => {
      if (currentPickerIndex === 0) return;
      const lastPicker = pickingTeams[currentPickerIndex - 1];
      const newSelections = { ...selections };
      delete newSelections[lastPicker.id];
      setSelections(newSelections);
      setCurrentPickerIndex(prev => prev - 1);
    };
    
    const selectedPrizeIds = new Set(Object.values(selections).map(p => p.id));
    const availablePrizes = prizeBank.filter(p => !selectedPrizeIds.has(p.id));

    return (
        <div className="bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 [&[data-screen-profile=small]]:p-2 rounded-xl shadow-2xl border-2 border-brand-gold/80 w-full max-w-7xl animate-fade-in text-center">
            <h2 className="font-display text-3xl sm:text-4xl [&[data-screen-profile=small]]:text-2xl font-bold text-brand-gold tracking-widest uppercase">{t.prizeSelectionTitle}</h2>
            
            <div className="my-6">
                {isSelectionFinished ? (
                    <div className="animate-fade-in">
                        <h3 className="text-2xl sm:text-3xl text-green-400 font-bold">{t.selectionFinished}</h3>
                        <p className="text-lg mt-2 text-brand-light/80">{t.prizeSummary}</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                            {pickingTeams.map(team => {
                                const prize = selections[team.id];
                                if (!prize) return null;
                                return (
                                    <div key={team.id} className="bg-brand-dark/50 p-3 rounded-lg flex items-center justify-between shadow-md border border-brand-gold/50">
                                        <span className="text-lg font-semibold">{team.name}</span>
                                        <span className="text-lg font-bold text-brand-gold">{prize.name}</span>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <h3 className="text-2xl sm:text-3xl [&[data-screen-profile=small]]:text-xl text-brand-light">
                            {t.turnToPick(currentPicker?.name)}
                        </h3>
                        <p className="text-lg mt-1 text-brand-light/70">{t.prizesRemaining(availablePrizes.length)}</p>

                        <div className="mt-6 flex justify-center flex-wrap gap-4">
                            {availablePrizes.map(prize => (
                                <button key={prize.id} onClick={() => handleSelectPrize(prize)} className="flex flex-col items-center p-2 bg-brand-dark/50 rounded-lg transition-transform transform hover:scale-105 hover:bg-brand-gold/20 border-2 border-transparent hover:border-brand-gold">
                                    {prize.imageUrl ? (
                                        <img src={prize.imageUrl} alt={prize.name} className="h-32 w-32 [&[data-screen-profile=small]]:h-24 [&[data-screen-profile=small]]:w-24 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }}/>
                                    ) : (
                                        <div style={{ backgroundColor: generateColorFromName(prize.name) }} className="h-32 w-32 [&[data-screen-profile=small]]:h-24 [&[data-screen-profile=small]]:w-24 flex items-center justify-center rounded-lg text-white font-bold text-6xl [&[data-screen-profile=small]]:text-5xl">
                                            {prize.name ? prize.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                    <span className="mt-1 text-lg [&[data-screen-profile=small]]:text-base font-semibold text-brand-light/80 w-32 [&[data-screen-profile=small]]:w-24 text-center break-words">{prize.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                    onClick={isSelectionFinished ? handleUndoLastSelection : onBack}
                    className="font-display w-full sm:w-auto px-8 py-3 [&[data-screen-profile=small]]:px-4 [&[data-screen-profile=small]]:py-2 bg-transparent border-2 border-brand-burgundy text-brand-light hover:bg-brand-burgundy rounded-lg font-bold text-lg sm:text-xl [&[data-screen-profile=small]]:text-base tracking-widest uppercase transition-all duration-300 transform hover:scale-105"
                >
                    {isSelectionFinished ? t.undoLastChoice : t.backButton}
                </button>
                 {isSelectionFinished && (
                    <button 
                        onClick={() => onConfirmPrizes(selections)} 
                        className="font-display w-full sm:w-auto px-8 py-3 [&[data-screen-profile=small]]:px-4 [&[data-screen-profile=small]]:py-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                        <CheckIcon className="h-7 w-7"/>
                        {t.confirmPrizesAndNextRound}
                    </button>
                 )}
            </div>
        </div>
    );
};

export default PrizeSelectionDisplay;