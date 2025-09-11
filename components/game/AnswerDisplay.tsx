import React, { useMemo } from 'react';
import type { Question } from '../../types';
import { UndoIcon } from '../IconComponents';
import CustomAudioPlayer from '../common/CustomAudioPlayer';

interface AnswerDisplayProps {
  question: Question;
  onNext: () => void;
  isLastQuestion: boolean;
  onUndo: () => void;
  canUndo: boolean;
  correctAwards: { part: string; teamName: string }[];
}

const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ question, onNext, isLastQuestion, onUndo, canUndo, correctAwards }) => {
    
    const congratulationsMessage = useMemo(() => {
        if (!correctAwards || correctAwards.length === 0) {
            return null;
        }
        
        // Check if both parts awarded to the same team for a special message
        if (correctAwards.length === 2 && correctAwards[0].teamName === correctAwards[1].teamName) {
            return `Bravo, <span class="font-bold">${correctAwards[0].teamName}</span> (Artiste et Titre) !`;
        }
        
        // For all other cases (single winner, split winners)
        const parts = correctAwards
            .map(award => {
                const teamNameHTML = `<span class="font-bold">${award.teamName}</span>`;
                // Only add the part in parentheses if it's not the default 'answer'
                if (award.part === 'answer') {
                    return teamNameHTML;
                }
                return `${teamNameHTML} (${award.part})`;
            })
            .join(' et ');

        return `Bravo, ${parts} !`;
    }, [correctAwards]);
    
    return (
        <div className="bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 [&[data-screen-profile=small]]:p-2 rounded-b-xl shadow-2xl border-2 border-t-0 border-brand-gold/50 w-full max-w-7xl animate-fade-in text-center flex flex-col min-h-[550px] [&[data-screen-profile=small]]:min-h-0">
            <div className="flex-grow flex flex-col justify-center">
                <p className="text-lg sm:text-2xl [&[data-screen-profile=small]]:text-base text-brand-light/70 font-display tracking-wider">{question.questionText}</p>
                
                {congratulationsMessage && (
                    <p className="mt-8 text-2xl sm:text-3xl [&[data-screen-profile=small]]:text-xl text-brand-gold animate-fade-in"
                       dangerouslySetInnerHTML={{ __html: congratulationsMessage }} />
                )}

                <h2 className="text-2xl sm:text-3xl [&[data-screen-profile=small]]:text-xl mt-6 font-semibold text-brand-light font-display tracking-widest">LA RÉPONSE EST...</h2>
                <p className="my-4 text-4xl sm:text-5xl [&[data-screen-profile=small]]:text-3xl font-bold text-brand-gold bg-black/30 py-4 [&[data-screen-profile=small]]:py-2 px-2 rounded-lg break-words font-display tracking-wide">
                    {question.answer}
                </p>
            </div>
            
            <div className="flex-shrink-0 h-[120px] [&[data-screen-profile=small]]:h-[80px] flex items-center justify-center">
                {question.type === 'AUDIO' && question.audioUrl && 
                    <CustomAudioPlayer src={question.audioUrl} startTime={question.answerStartTime} />
                }
            </div>

            <div className="flex-shrink-0">
                <button 
                    onClick={onNext} 
                    className="font-display w-full max-w-md mx-auto mt-4 py-3 [&[data-screen-profile=small]]:py-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                    {isLastQuestion ? 'Voir le résumé de la manche' : 'Question Suivante'}
                </button>
                <div className="mt-4 flex justify-end">
                    <button onClick={onUndo} disabled={!canUndo} className="flex items-center px-4 py-2 [&[data-screen-profile=small]]:px-3 [&[data-screen-profile=small]]:py-1 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base [&[data-screen-profile=small]]:text-sm">
                        <UndoIcon className="h-5 w-5 mr-2" />
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnswerDisplay;
