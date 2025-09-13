import React, { useState, useEffect } from 'react';
import type { Team, Round, Question } from '../../types';
import type { AwardInfo } from '../GameScreen';
import CustomAudioPlayer from '../common/CustomAudioPlayer';

interface QuestionDisplayProps {
  question: Question;
  round: Round;
  questionNumber: number;
  totalQuestions: number;
  teams: Team[];
  onAwards: (awards: AwardInfo[]) => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = 
({ question, questionNumber, totalQuestions, teams, onAwards }) => {
    const [isClueVisible, setIsClueVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(question.timer);
    const [artistAward, setArtistAward] = useState<string | null>(null);
    const [titleAward, setTitleAward] = useState<string | null>(null);

    useEffect(() => {
        setIsClueVisible(false);
        setTimeLeft(question.timer);
        setArtistAward(null);
        setTitleAward(null);

        if (question.timer) {
            const interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev !== undefined && prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev !== undefined ? prev - 1 : undefined;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [question]);

    const handleTeamClick = (teamId: string) => {
        const pointsToAward = (question.timer && timeLeft === 0) ? 1 : (question.points || 1);
        onAwards([{ teamId, points: pointsToAward, part: 'answer' }]);
    };
    
    const handleSubmitSplit = () => {
        const awards: AwardInfo[] = [];
        if (artistAward) awards.push({ teamId: artistAward, part: 'Artiste', points: 1 });
        if (titleAward) awards.push({ teamId: titleAward, part: 'Titre', points: 1 });
        onAwards(awards);
    };

    const renderPointsBanner = () => {
        if (question.splitAnswer) {
            return (
                <div className="bg-brand-gold text-brand-dark font-bold px-3 py-1 sm:px-4 text-base sm:text-lg [&[data-screen-profile=small]]:px-2 [&[data-screen-profile=small]]:text-sm shadow-lg inline-block">
                    2 POINTS (1+1)
                </div>
            )
        }
        if (question.points && question.points > 1) {
            return (
                <div className="bg-brand-gold text-brand-dark font-bold px-3 py-1 sm:px-4 text-base sm:text-lg [&[data-screen-profile=small]]:px-2 [&[data-screen-profile=small]]:text-sm shadow-lg inline-block animate-pulse">
                    {question.points} POINTS !
                </div>
            )
        }
        return null;
    }
    
    const numTeams = teams.length;
    const getTeamButtonClasses = () => {
        const base = "py-3 bg-transparent border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark rounded-lg font-bold text-base sm:text-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md break-words [&[data-screen-profile=small]]:px-3 [&[data-screen-profile=small]]:py-2 [&[data-screen-profile=small]]:text-sm [&[data-screen-profile=small]]:min-w-0";
        if (numTeams >= 5 && numTeams <= 6) {
            return `${base} flex-1 px-4 min-w-[150px]`;
        }
        return `${base} px-5 min-w-[160px]`;
    };

    const getSplitTeamBoxClasses = () => {
        const base = "bg-brand-dark/50 p-1 rounded-xl border border-brand-gold/50 text-center flex flex-col";
        if (numTeams >= 5 && numTeams <= 6) {
            return `${base} flex-1 min-w-[180px]`;
        }
        return `${base} w-48 [&[data-screen-profile=small]]:w-48`;
    }

    return (
        <div className="bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 [&[data-screen-profile=small]]:p-2 rounded-b-xl shadow-2xl border-2 border-t-0 border-brand-gold/50 w-full max-w-screen-2xl animate-fade-in text-center flex flex-col min-h-[550px] [&[data-screen-profile=small]]:min-h-0">
            <div className="flex justify-between items-start">
                <div className="text-left">
                    {renderPointsBanner()}
                </div>
                <div className="text-right">
                    <span className="text-lg sm:text-2xl [&[data-screen-profile=small]]:text-base text-brand-light/60 font-display tracking-wider">Question {questionNumber} / {totalQuestions}</span>
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-center my-2">
                { timeLeft !== undefined &&
                    <div className={`text-4xl sm:text-5xl [&[data-screen-profile=small]]:text-3xl font-bold my-2 font-display ${timeLeft <= 5 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-brand-light'}`}>
                        {timeLeft}
                    </div>
                }
                <p className="grow-0 font-display text-3xl sm:text-4xl lg:text-5xl [&[data-screen-profile=small]]:text-2xl mt-2 text-brand-light font-light tracking-wide">{question.questionText}</p>

                { question.clue && (
                    <div className="mt-4">
                        {isClueVisible ? (
                            <p className="p-3 bg-black/30 rounded-md text-brand-gold/80 italic animate-fade-in text-lg sm:text-2xl [&[data-screen-profile=small]]:text-base">{question.clue}</p>
                        ) : (
                            <button onClick={() => setIsClueVisible(true)} className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-md font-semibold transition-transform transform hover:scale-105 text-base sm:text-lg [&[data-screen-profile=small]]:text-sm [&[data-screen-profile=small]]:py-1">
                                Révéler l'indice
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            <div className="flex-shrink-0 h-[100px] [&[data-screen-profile=small]]:h-[80px] flex items-center justify-center">
                 {question.type === 'AUDIO' ? 
                    (question.audioUrl ? <CustomAudioPlayer src={question.audioUrl} startTime={question.audioStartTime} endTime={question.audioEndTime} /> : <p>Aucun fichier audio.</p>)
                    : <p className="font-display text-2xl text-brand-burgundy italic font-semibold text-center tracking-widest">PRESTATION LIVE !</p>
                }
            </div>

            <div className="mt-4 flex-shrink-0">
                {!question.splitAnswer ? (
                     <div>
                        <h3 className="font-display text-base sm:text-sm [&[data-screen-profile=small]]:text-lg font-semibold mb-3 text-brand-light/90 tracking-wider">Qui a répondu correctement ?</h3>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                            {teams.map(team => (
                                <button key={team.id} onClick={() => handleTeamClick(team.id)} className={getTeamButtonClasses()}>
                                    {team.name}
                                </button>
                            ))}
                        </div>
                        <div className="text-center mt-4">
                            <button onClick={() => onAwards([])} className="text-brand-light/70 hover:text-brand-light underline transition-colors text-sm sm:text-base [&[data-screen-profile=small]]:text-xs">
                                Personne n'a trouvé ? Révéler la réponse
                            </button>
                        </div>
                    </div>
                ) : (
                     <div className="space-y-6">
                        <h3 className="font-display text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-semibold mb-3 text-brand-light/90 tracking-wider">Qui a répondu correctement ?</h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            {teams.map(team => (
                                <div key={team.id} className={getSplitTeamBoxClasses()}>
                                    <p className="text-base sm:text-lg [&[data-screen-profile=small]]:text-base font-bold text-brand-light mb-2 truncate" title={team.name}>
                                        {team.name}
                                    </p>
                                    <div className="flex justify-center gap-1">
                                        <button 
                                            onClick={() => setArtistAward(prev => prev === team.id ? null : team.id)}
                                            className={`flex-1 px-1 py-1 rounded-lg font-semibold text-xs sm:text-xs transition-colors duration-200 transform hover:scale-105 ${artistAward === team.id ? 'bg-brand-gold text-brand-dark' : 'bg-transparent border border-brand-gold/70 text-brand-gold hover:bg-brand-gold/20'}`}
                                        >
                                            Artiste
                                        </button>
                                        <button 
                                            onClick={() => setTitleAward(prev => prev === team.id ? null : team.id)}
                                            className={`flex-1 px-1 py-1 rounded-lg font-semibold text-xs sm:text-xs transition-colors duration-200 transform hover:scale-105 ${titleAward === team.id ? 'bg-brand-gold text-brand-dark' : 'bg-transparent border border-brand-gold/70 text-brand-gold hover:bg-brand-gold/20'}`}
                                        >
                                            Titre
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2">
                            <button 
                                onClick={handleSubmitSplit} 
                                disabled={!artistAward && !titleAward}
                                className="font-display w-full max-w-md mx-auto py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark rounded-lg font-bold text-xl sm:text-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Valider & Révéler
                            </button>
                            <div className="text-center mt-4">
                                <button onClick={() => onAwards([])} className="text-brand-light/70 hover:text-brand-light underline transition-colors text-sm sm:text-base [&[data-screen-profile=small]]:text-xs">
                                    Personne n'a trouvé ? Révéler la réponse
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
};

export default QuestionDisplay;