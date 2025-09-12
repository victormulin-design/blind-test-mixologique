

import React from 'react';
import type { Round, Question, Prize } from '../../types';
import { QuestionType } from '../../types';
import { PlusIcon, TrashIcon, UploadIcon } from '../IconComponents';
import AudioTrimmer from '../AudioTrimmer';

interface RoundsSetupProps {
    rounds: Partial<Round>[];
    setRounds: React.Dispatch<React.SetStateAction<Partial<Round>[]>>;
    numTeams: number;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const RoundsSetup: React.FC<RoundsSetupProps> = ({ rounds, setRounds, numTeams }) => {

    const addRound = () => {
        setRounds(prev => [
            ...prev, 
            { 
                name: '', 
                questions: [],
                prizePool: Array(numTeams).fill({ name: '', imageUrl: '' }),
            }
        ]);
    };

    const removeRound = (index: number) => {
        setRounds(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleRoundChange = <K extends keyof Round>(index: number, field: K, value: Round[K]) => {
        const newRounds = [...rounds];
        newRounds[index] = { ...newRounds[index], [field]: value };
        setRounds(newRounds);
    };

    const addQuestion = (roundIndex: number) => {
        const newRounds = [...rounds];
        const round = newRounds[roundIndex];
        round.questions = [...(round.questions || []), { questionText: 'Devinez la chanson et l\'artiste', answer: '', type: QuestionType.AUDIO, points: 1 }];
        setRounds(newRounds);
    };

    const removeQuestion = (roundIndex: number, questionIndex: number) => {
        const newRounds = [...rounds];
        const round = newRounds[roundIndex];
        round.questions = round.questions?.filter((_, i) => i !== questionIndex);
        setRounds(newRounds);
    };

    const handleQuestionChange = <K extends keyof Question>(roundIndex: number, questionIndex: number, field: K, value: Question[K]) => {
        const newRounds = [...rounds];
        const round = newRounds[roundIndex];
        const newQuestions = [...(round.questions || [])];
        
        let processedValue = value;
        if (field === 'timer' || field === 'points') {
        const numValue = parseInt(value as string, 10);
        processedValue = isNaN(numValue) || numValue <= 0 ? undefined : numValue as Question[K];
        }

        newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: processedValue };
        
        if (field === 'splitAnswer' && value === true) {
            newQuestions[questionIndex].points = 2;
        }

        round.questions = newQuestions;
        setRounds(newRounds);
    };

    const handleQuestionTrimmerChange = (roundIndex: number, questionIndex: number, times: { start?: number, end?: number, answerStart?: number }) => {
        const newRounds = [...rounds];
        const round = newRounds[roundIndex];
        const newQuestions = [...(round.questions || [])];
        
        newQuestions[questionIndex] = { 
            ...newQuestions[questionIndex], 
            audioStartTime: times.start, 
            audioEndTime: times.end,
            answerStartTime: times.answerStart,
        };
        round.questions = newQuestions;
        setRounds(newRounds);
    };

    const handlePrizeChange = (roundIndex: number, prizeIndex: number, field: keyof Prize, value: string) => {
        const newRounds = [...rounds];
        const round = { ...newRounds[roundIndex] };
        const prizePool = [...(round.prizePool || [])];
        prizePool[prizeIndex] = { ...prizePool[prizeIndex], [field]: value };
        round.prizePool = prizePool;
        newRounds[roundIndex] = round;
        setRounds(newRounds);
    };

    const handlePrizeImageUpload = async (roundIndex: number, prizeIndex: number, file: File | null) => {
        if (!file) return;
        const base64 = await fileToBase64(file);
        handlePrizeChange(roundIndex, prizeIndex, 'imageUrl', base64);
    };

    const handleAudioUpload = async (roundIndex: number, questionIndex: number, file: File | null) => {
        if (!file) return;

        const currentAnswer = rounds[roundIndex]?.questions?.[questionIndex]?.answer;
        if (!currentAnswer || currentAnswer.trim() === '') {
            const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const cleanAnswer = fileName.replace(/[_-]/g, ' ');
            handleQuestionChange(roundIndex, questionIndex, 'answer', cleanAnswer);
        }
        
        handleQuestionChange(roundIndex, questionIndex, 'audioFileName', file.name);

        const base64 = await fileToBase64(file);
        handleQuestionChange(roundIndex, questionIndex, 'audioUrl', base64);
    };

    const renderQuestionInput = (roundIndex: number, questionIndex: number) => {
      const question = rounds[roundIndex]?.questions?.[questionIndex];
      if (!question) return null;

      return (
        <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-gold/30 space-y-3">
            <div className='flex justify-between items-center'>
                <h4 className="text-lg font-bold text-brand-light/80">Question {questionIndex + 1}</h4>
                <button onClick={() => removeQuestion(roundIndex, questionIndex)} className="text-brand-burgundy hover:text-red-400">
                    <TrashIcon className="h-5 w-5"/>
                </button>
            </div>
             <input
                type="text"
                value={question.questionText}
                onChange={(e) => handleQuestionChange(roundIndex, questionIndex, 'questionText', e.target.value)}
                placeholder="Question (ex: 'Quelle est cette chanson ?')"
                className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
            />
             <input
                type="text"
                value={question.clue || ''}
                onChange={(e) => handleQuestionChange(roundIndex, questionIndex, 'clue', e.target.value)}
                placeholder="Indice (optionnel, caché pendant le jeu)"
                className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
            />
             <input
                type="text"
                value={question.answer}
                onChange={(e) => handleQuestionChange(roundIndex, questionIndex, 'answer', e.target.value)}
                placeholder="Réponse (pour votre référence)"
                className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-base font-medium text-brand-light/70">Points</label>
                <input type="number" value={question.points || ''} min="1" onChange={e => handleQuestionChange(roundIndex, questionIndex, 'points', e.target.value as any)} placeholder="1" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base disabled:bg-brand-dark/30 disabled:cursor-not-allowed" disabled={!!question.splitAnswer}/>
              </div>
              <div className="flex-1">
                <label className="block text-base font-medium text-brand-light/70">Chrono (sec)</label>
                <input type="number" value={question.timer || ''} min="1" onChange={e => handleQuestionChange(roundIndex, questionIndex, 'timer', e.target.value as any)} placeholder="Optionnel" className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"/>
              </div>
            </div>
            
            {(question.type === QuestionType.AUDIO || question.type === QuestionType.LIVE) && (
                <div className="flex items-center space-x-3 pt-2">
                    <input
                        type="checkbox"
                        id={`split-${roundIndex}-${questionIndex}`}
                        checked={!!question.splitAnswer}
                        onChange={(e) => handleQuestionChange(roundIndex, questionIndex, 'splitAnswer', e.target.checked)}
                        className="h-5 w-5 rounded border-brand-gold/70 bg-brand-dark/50 text-brand-gold focus:ring-2 focus:ring-brand-gold"
                    />
                    <label htmlFor={`split-${roundIndex}-${questionIndex}`} className="text-base font-medium text-brand-light/90">
                        Séparer les points Artiste / Titre (1pt + 1pt)
                    </label>
                </div>
            )}

            <div className="flex space-x-2 pt-2">
                {[QuestionType.LIVE, QuestionType.AUDIO].map(type => (
                    <button
                        key={type}
                        onClick={() => handleQuestionChange(roundIndex, questionIndex, 'type', type)}
                        className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors uppercase tracking-wider ${question.type === type ? 'bg-brand-gold text-brand-dark' : 'bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20'}`}
                    >
                        {type === 'LIVE' ? 'Prestation Live' : type}
                    </button>
                ))}
            </div>
            {question.type === QuestionType.AUDIO && (
                <div className="mt-2">
                    <label className="block text-base font-medium text-brand-light/90 mb-1">Charger un fichier audio</label>
                    <input type="file" accept="audio/*" onChange={e => handleAudioUpload(roundIndex, questionIndex, e.target.files?.[0] || null)} className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-brand-light file:text-brand-dark hover:file:bg-brand-gold"/>
                    {question.audioFileName && (
                        <div className="flex items-center justify-between mt-2 p-2 bg-brand-dark/20 rounded-md border border-brand-gold/20">
                            <span className="text-brand-light/80 text-sm truncate" title={question.audioFileName}>
                                {question.audioFileName}
                            </span>
                            <button 
                                onClick={() => {
                                    handleQuestionChange(roundIndex, questionIndex, 'audioUrl', undefined);
                                    handleQuestionChange(roundIndex, questionIndex, 'audioFileName', undefined);
                                    handleQuestionTrimmerChange(roundIndex, questionIndex, { start: undefined, end: undefined, answerStart: undefined });
                                }} 
                                className="text-brand-burgundy hover:text-red-400 ml-2"
                                aria-label="Supprimer le fichier audio"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                    {question.audioUrl && (
                      <AudioTrimmer
                        src={question.audioUrl}
                        startTime={question.audioStartTime}
                        endTime={question.audioEndTime}
                        answerStartTime={question.answerStartTime}
                        onTimesChange={(times) => handleQuestionTrimmerChange(roundIndex, questionIndex, times)}
                      />
                    )}
                </div>
            )}
        </div>
      )
    }


    return (
        <div className="bg-brand-dark/50 p-6 rounded-lg border-2 border-brand-gold/50 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-gold tracking-widest uppercase">3. Les Manches</h2>
                <button onClick={addRound} className="flex items-center px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-md text-white font-semibold transition-colors duration-200 text-sm sm:text-base">
                    <PlusIcon className="h-5 w-5 mr-2"/>
                    Ajouter une Manche
                </button>
            </div>
            <div className="space-y-6">
                {rounds.map((round, roundIndex) => (
                    <div key={roundIndex} className="bg-brand-dark/40 p-4 rounded-lg border-2 border-brand-gold/30">
                        <div className="flex justify-between items-center mb-2">
                            <input
                                type="text"
                                value={round.name || ''}
                                onChange={e => handleRoundChange(roundIndex, 'name', e.target.value)}
                                placeholder={`Nom de la Manche ${roundIndex + 1}`}
                                className="font-display text-xl sm:text-2xl font-semibold text-brand-gold/90 bg-transparent border-0 border-b-2 border-brand-gold/50 focus:ring-0 focus:border-brand-gold w-full tracking-wider"
                            />
                            <button onClick={() => removeRound(roundIndex)} className="ml-4 text-brand-burgundy hover:text-red-400">
                                <TrashIcon className="h-6 w-6"/>
                            </button>
                        </div>
                        <input
                            type="text"
                            value={round.prizeCategory || ''}
                            onChange={e => handleRoundChange(roundIndex, 'prizeCategory', e.target.value)}
                            placeholder="Catégorie d'ingrédient (optionnel, ex: Alcools)"
                            className="text-base text-brand-light/80 bg-transparent border-0 border-b border-brand-gold/40 focus:ring-0 focus:border-brand-gold w-full mb-4"
                        />

                        <div className="space-y-4 my-4">
                            {round.questions?.map((_, questionIndex) => renderQuestionInput(roundIndex, questionIndex))}
                        </div>

                        <button onClick={() => addQuestion(roundIndex)} className="flex items-center text-sm sm:text-base px-3 py-1 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-white font-semibold transition-colors duration-200">
                            <PlusIcon className="h-4 w-4 mr-1"/>
                            Ajouter une Question
                        </button>

                        <div className="border-t border-brand-gold/30 my-6 mx-4"></div>

                        <h4 className="text-lg sm:text-xl font-medium mb-2 text-brand-light/80">Ingrédients à gagner pour cette manche</h4>
                        <p className="text-brand-light/60 mb-4 text-sm">Le classement déterminera l'ordre de sélection. Le nombre d'ingrédients doit correspondre au nombre d'équipes.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(round.prizePool || []).map((prize, prizeIndex) => {
                                return (
                                    <div key={prizeIndex} className="bg-brand-dark/50 p-3 rounded-md space-y-2 border border-brand-gold/30">
                                        <label className="block text-base font-semibold text-brand-light/70">Ingrédient {prizeIndex + 1}</label>
                                        <input
                                            type="text"
                                            value={prize.name}
                                            onChange={(e) => handlePrizeChange(roundIndex, prizeIndex, 'name', e.target.value)}
                                            placeholder="Nom de l'ingrédient"
                                            className="w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 text-base"
                                        />
                                        <div className="flex items-center space-x-3 min-h-[80px]">
                                            <div className="flex items-center gap-2">
                                                <label htmlFor={`prize-img-${roundIndex}-${prizeIndex}`} className="cursor-pointer flex items-center px-3 py-2 bg-brand-dark/50 border border-brand-gold/50 hover:bg-brand-gold/20 rounded-md text-sm">
                                                    <UploadIcon className="h-4 w-4 mr-2" />
                                                    Charger
                                                </label>
                                            </div>
                                            <input id={`prize-img-${roundIndex}-${prizeIndex}`} type="file" accept="image/*" className="hidden" onChange={(e) => handlePrizeImageUpload(roundIndex, prizeIndex, e.target.files?.[0] || null)} />
                                            {prize.imageUrl && <img src={prize.imageUrl} alt={prize.name} className="h-20 w-20 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RoundsSetup;