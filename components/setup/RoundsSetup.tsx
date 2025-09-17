import React, { useState } from 'react';
import { produce } from 'immer';
import type { Round, Question, Prize } from '../../types.ts';
// FIX: Import QuestionType enum to be used when creating a new question.
import { PrizeMode, QuestionType } from '../../types.ts';
import { PlusIcon, TrashIcon, SparklesIcon } from '../IconComponents.tsx';
import AiAssistant from './AiAssistant.tsx';
import BulkAudioImporter from './BulkAudioImporter.tsx';
import QuestionSetup from './QuestionSetup.tsx';
import PrizeSetup from './PrizeSetup.tsx';

interface RoundsSetupProps {
    rounds: Partial<Round>[];
    setRounds: React.Dispatch<React.SetStateAction<Partial<Round>[]>>;
    numTeams: number;
    prizeMode: PrizeMode;
}

const RoundsSetup: React.FC<RoundsSetupProps> = ({ rounds, setRounds, numTeams, prizeMode }) => {
    const [aiAssistantState, setAiAssistantState] = useState<{ isOpen: boolean; roundIndex: number | null }>({ isOpen: false, roundIndex: null });
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

    const handleAiQuestionsGenerated = (questions: Question[]) => {
        if (aiAssistantState.roundIndex === null) return;
        setRounds(
            produce(draft => {
                const round = draft[aiAssistantState.roundIndex!];
                round.questions = [...(round.questions || []), ...questions];
            })
        );
    };

    const handleAiPrizesGenerated = (prizes: Prize[]) => {
        if (aiAssistantState.roundIndex === null) return;
        setRounds(
            produce(draft => {
                const round = draft[aiAssistantState.roundIndex!];
                const finalPrizes: Prize[] = prizes.slice(0, numTeams).map(p => ({ ...p, id: p.id || crypto.randomUUID() }));
                while (finalPrizes.length < numTeams) {
                    finalPrizes.push({ name: '', imageUrl: '', id: crypto.randomUUID() });
                }
                round.prizePool = finalPrizes;
            })
        );
    };

    const addRound = () => {
        setRounds(
            produce(draft => {
                draft.push({ 
                    name: '', 
                    questions: [],
                    prizePool: Array(numTeams).fill({ name: '', imageUrl: '' }),
                });
            })
        );
    };

    const removeRound = (index: number) => {
        setRounds(
            produce(draft => {
                draft.splice(index, 1);
            })
        );
    };
    
    return (
        <div className="space-y-6">
            {aiAssistantState.isOpen && aiAssistantState.roundIndex !== null && (
                <AiAssistant
                    modes={prizeMode === PrizeMode.PER_ROUND ? ['questions', 'prizes'] : ['questions']}
                    onClose={() => setAiAssistantState({ isOpen: false, roundIndex: null })}
                    onGeneratedQuestions={handleAiQuestionsGenerated}
                    onGeneratedPrizes={prizeMode === PrizeMode.PER_ROUND ? handleAiPrizesGenerated : undefined}
                />
            )}
            {isBulkImportOpen && (
                <BulkAudioImporter 
                    rounds={rounds}
                    setRounds={setRounds}
                    onClose={() => setIsBulkImportOpen(false)}
                />
            )}
            <div className="flex justify-between items-center">
                <button onClick={() => setIsBulkImportOpen(true)} className="flex items-center px-4 py-2 bg-indigo-800 hover:bg-indigo-700 rounded-md text-white font-semibold transition-colors duration-200 text-sm sm:text-base">
                    Importer des audios en masse
                </button>
                <button onClick={addRound} className="flex items-center px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-md text-white font-semibold transition-colors duration-200 text-sm sm:text-base">
                    <PlusIcon className="h-5 w-5 mr-2"/>
                    Ajouter une Manche
                </button>
            </div>
            <div className="space-y-6">
                {rounds.map((round, roundIndex) => (
                    <div key={roundIndex} className="bg-brand-dark/40 p-4 rounded-lg border-2 border-brand-gold/30">
                        <div className="flex justify-between items-center mb-4">
                            <input
                                type="text"
                                value={round.name || ''}
                                onChange={e => setRounds(produce(draft => { draft[roundIndex].name = e.target.value; }))}
                                placeholder={`Nom de la Manche ${roundIndex + 1}`}
                                className="font-display text-xl sm:text-2xl font-semibold text-brand-gold/90 bg-transparent border-0 border-b-2 border-brand-gold/50 focus:ring-0 focus:border-brand-gold w-full tracking-wider"
                            />
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <button onClick={() => setAiAssistantState({ isOpen: true, roundIndex: roundIndex })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors duration-200 text-xs sm:text-sm">
                                    <SparklesIcon className="h-4 w-4"/>
                                    Assistant IA
                                </button>
                                <button onClick={() => removeRound(roundIndex)} className="ml-4 text-brand-burgundy hover:text-red-400">
                                    <TrashIcon className="h-6 w-6"/>
                                </button>
                            </div>
                        </div>
                        
                        <div className="my-4">
                            <h3 className="text-lg sm:text-xl font-medium text-brand-light/80">Questions</h3>
                            <div className="space-y-4 mt-2">
                                {round.questions?.map((question, questionIndex) => (
                                  <QuestionSetup 
                                    key={questionIndex}
                                    question={question}
                                    roundIndex={roundIndex}
                                    questionIndex={questionIndex}
                                    setRounds={setRounds}
                                  />
                                ))}
                            </div>
                        </div>

                        <button onClick={() => setRounds(produce(draft => {
                                const round = draft[roundIndex];
                                if (!round.questions) round.questions = [];
                                // FIX: Use QuestionType enum member instead of string literal.
                                round.questions.push({ questionText: 'Texte de la question...', answer: '', type: QuestionType.QUIZ, points: 1 });
                            }))} 
                            className="flex items-center text-sm sm:text-base px-3 py-1 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-white font-semibold transition-colors duration-200">
                            <PlusIcon className="h-4 w-4 mr-1"/>
                            Ajouter une Question
                        </button>
                        
                        {prizeMode === PrizeMode.PER_ROUND && (
                          <>
                            <div className="border-t border-brand-gold/30 my-6 mx-4"></div>
                            <h4 className="text-lg sm:text-xl font-medium mb-2 text-brand-light/80">Prix à gagner dans cette manche</h4>
                             <input
                                type="text"
                                value={round.prizeCategory || ''}
                                onChange={e => setRounds(produce(draft => { draft[roundIndex].prizeCategory = e.target.value; }))}
                                placeholder="Catégorie des prix (optionnel, ex: Alcools)"
                                className="text-base text-brand-light/80 bg-transparent border-0 border-b border-brand-gold/40 focus:ring-0 focus:border-brand-gold w-full mb-4"
                            />
                            <p className="text-brand-light/60 mb-4 text-sm">Le nombre de prix doit correspondre au nombre d'équipes.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {(round.prizePool || []).map((prize, prizeIndex) => (
                                    <PrizeSetup
                                        key={prizeIndex}
                                        prize={prize}
                                        roundIndex={roundIndex}
                                        prizeIndex={prizeIndex}
                                        setRounds={setRounds}
                                    />
                                ))}
                            </div>
                          </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RoundsSetup;