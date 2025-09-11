import React, { useState, useEffect, useRef } from 'react';
import type { Team, Round, Question, Prize, GameSettings } from '../types';
import { TieBreakerRule } from '../types';
import { TrophyIcon, PlayIcon, PauseIcon, UndoIcon, CocktailIcon } from './IconComponents';

interface GameScreenProps {
  initialTeams: Team[];
  initialRounds: Round[];
  settings: GameSettings;
}

const shouldCheckForTie = (
    tie: { teams: Team[]; rank: number } | null,
    tieBreakerRule: TieBreakerRule
): tie is { teams: Team[]; rank: number } => {
    if (!tie) return false;
    if (tieBreakerRule === TieBreakerRule.NONE) return false;
    if (tieBreakerRule === TieBreakerRule.ALL_TIES) return true;
    if (tieBreakerRule === TieBreakerRule.FIRST_PLACE_ONLY) {
        return tie.rank === 1;
    }
    return false;
};

// ===== HORIZONTAL SCOREBOARD =====
const HorizontalScoreboard: React.FC<{ teams: Team[] }> = ({ teams }) => (
  <div className="w-full bg-brand-dark/60 backdrop-blur-md p-2 [&[data-screen-profile=small]]:p-1 rounded-xl border-2 border-brand-gold/50">
    <div className="flex flex-wrap justify-center gap-3 [&[data-screen-profile=small]]:gap-2 items-stretch">
      {teams.map((team) => (
        <div key={team.id} className="flex flex-row items-start gap-4 flex-1 min-w-[250px] [&[data-screen-profile=small]]:min-w-[200px] max-w-md bg-brand-dark/80 p-3 [&[data-screen-profile=small]]:p-2 rounded-lg border border-brand-gold/30">
          <div className="flex-shrink-0 text-left">
            <p className="text-lg sm:text-xl [&[data-screen-profile=small]]:text-base font-bold text-brand-light break-words" title={team.name}>{team.name}</p>
            <p className="text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-bold text-brand-gold">{Math.round(Object.values(team.scores).reduce((a, b) => a + b, 0))}</p>
          </div>
          <div className="flex-grow pt-1">
            {team.collectedPrizes.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-brand-light/90">
                    {team.collectedPrizes.map(prize => (
                        <li key={prize.id} className="text-base sm:text-lg [&[data-screen-profile=small]]:text-sm" title={prize.name}>
                            {prize.name}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-brand-light/50 italic h-full flex items-center">Aucun ingrédient</p>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);


// ===== CUSTOM AUDIO PLAYER =====
const CustomAudioPlayer: React.FC<{ src: string, startTime?: number, endTime?: number }> = ({ src, startTime, endTime }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const stopChecking = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const startChecking = () => {
            stopChecking();
            intervalRef.current = window.setInterval(() => {
                if (audio && endTime !== undefined && audio.currentTime >= endTime) {
                    audio.pause();
                }
            }, 100);
        };

        const handlePlay = () => {
            setIsPlaying(true);
            startChecking();
        };
        const handlePause = () => {
            setIsPlaying(false);
            stopChecking();
        };
        const handleEnded = () => {
            setIsPlaying(false);
            stopChecking();
            if (audio && startTime !== undefined) {
                audio.currentTime = startTime;
            }
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        if (startTime !== undefined) {
            audio.currentTime = startTime;
        }

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            stopChecking();
        };
    }, [src, startTime, endTime]);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
             if (
                (startTime !== undefined && audio.currentTime < startTime) ||
                (endTime !== undefined && audio.currentTime >= endTime) ||
                audio.ended
            ) {
                audio.currentTime = startTime || 0;
            }

            if (endTime !== undefined && audio.currentTime >= endTime) {
                return;
            }

            const playPromise = audio.play();
             if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio play prevented:", error);
                    setIsPlaying(false);
                });
            }
        } else {
            audio.pause();
        }
    };

    return (
        <div className="flex justify-center">
            <audio ref={audioRef} src={src} preload="auto" style={{ display: 'none' }} />
            <button onClick={togglePlayPause} className="flex items-center justify-center w-20 h-20 [&[data-screen-profile=small]]:w-16 [&[data-screen-profile=small]]:h-16 rounded-full bg-brand-gold hover:bg-brand-light text-brand-dark transition-transform transform hover:scale-110 shadow-lg">
                {isPlaying ? <PauseIcon className="w-10 h-10 [&[data-screen-profile=small]]:w-8 [&[data-screen-profile=small]]:h-8"/> : <PlayIcon className="w-10 h-10 [&[data-screen-profile=small]]:w-8 [&[data-screen-profile=small]]:h-8 ml-1"/>}
            </button>
        </div>
    );
};

// ===== PRIZES FOR ROUND =====
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


// ===== QUESTION DISPLAY =====
const QuestionDisplay: React.FC<{ question: Question; round: Round; questionNumber: number; totalQuestions: number; teams: Team[]; onCorrect: (teamId: string, points: number) => void; }> = 
({ question, questionNumber, totalQuestions, teams, onCorrect }) => {
    const [isClueVisible, setIsClueVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(question.timer);

    useEffect(() => {
        setIsClueVisible(false);
        setTimeLeft(question.timer);

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
        onCorrect(teamId, pointsToAward);
    }

    return (
        <div className="bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 [&[data-screen-profile=small]]:p-2 rounded-b-xl shadow-2xl border-2 border-t-0 border-brand-gold/50 w-full max-w-7xl animate-fade-in text-center flex flex-col min-h-[550px] [&[data-screen-profile=small]]:min-h-0">
            <div className="flex justify-between items-start">
                <div className="text-left">
                    {(question.points && question.points > 1) &&
                        <div className="bg-brand-gold text-brand-dark font-bold px-3 py-1 sm:px-4 text-base sm:text-lg [&[data-screen-profile=small]]:px-2 [&[data-screen-profile=small]]:text-sm shadow-lg inline-block animate-pulse">
                            {question.points} POINTS !
                        </div>
                    }
                </div>
                <div className="text-right">
                    <span className="text-lg sm:text-2xl [&[data-screen-profile=small]]:text-base text-brand-light/60 font-display tracking-wider">Question {questionNumber} / {totalQuestions}</span>
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-center my-4">
                { timeLeft !== undefined &&
                    <div className={`text-4xl sm:text-5xl [&[data-screen-profile=small]]:text-3xl font-bold my-2 font-display ${timeLeft <= 5 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-brand-light'}`}>
                        {timeLeft}
                    </div>
                }
                <p className="font-display text-3xl sm:text-4xl lg:text-5xl [&[data-screen-profile=small]]:text-2xl mt-4 text-brand-light font-light tracking-wide">{question.questionText}</p>

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
            
            <div className="flex-shrink-0 h-[120px] [&[data-screen-profile=small]]:h-[80px] flex items-center justify-center">
                 {question.type === 'AUDIO' ? 
                    (question.audioUrl ? <CustomAudioPlayer src={question.audioUrl} startTime={question.audioStartTime} endTime={question.audioEndTime} /> : <p>Aucun fichier audio.</p>)
                    : <p className="font-display text-2xl text-brand-burgundy italic font-semibold text-center tracking-widest">PRESTATION LIVE !</p>
                }
            </div>

            <div className="mt-4 flex-shrink-0">
                <h3 className="font-display text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-semibold mb-3 text-brand-light/90 tracking-wider">Qui a répondu correctement ?</h3>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                    {teams.map(team => (
                        <button key={team.id} onClick={() => handleTeamClick(team.id)} className="px-5 py-3 bg-transparent border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark rounded-lg font-bold text-base sm:text-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md min-w-[160px] [&[data-screen-profile=small]]:px-3 [&[data-screen-profile=small]]:py-2 [&[data-screen-profile=small]]:text-sm [&[data-screen-profile=small]]:min-w-0 break-words">
                            {team.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ===== ANSWER DISPLAY =====
const AnswerDisplay: React.FC<{ question: Question; onNext: () => void; isLastQuestion: boolean; onUndo: () => void; canUndo: boolean; correctTeamName?: string; }> = ({ question, onNext, isLastQuestion, onUndo, canUndo, correctTeamName }) => {
    
    return (
        <div className="bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 [&[data-screen-profile=small]]:p-2 rounded-b-xl shadow-2xl border-2 border-t-0 border-brand-gold/50 w-full max-w-7xl animate-fade-in text-center flex flex-col min-h-[550px] [&[data-screen-profile=small]]:min-h-0">
            <div className="flex-grow flex flex-col justify-center">
                <p className="text-lg sm:text-2xl [&[data-screen-profile=small]]:text-base text-brand-light/70 font-display tracking-wider">{question.questionText}</p>
                
                {correctTeamName && (
                    <p className="mt-8 text-2xl sm:text-3xl [&[data-screen-profile=small]]:text-xl text-brand-gold animate-fade-in">
                        Bravo, <span className="font-bold">{correctTeamName}</span> !
                    </p>
                )}

                <h2 className="text-2xl sm:text-3xl [&[data-screen-profile=small]]:text-xl mt-6 font-semibold text-brand-light font-display tracking-widest">LA RÉPONSE EST...</h2>
                <p className="my-4 text-4xl sm:text-5xl [&[data-screen-profile=small]]:text-3xl font-bold text-brand-gold bg-black/30 py-4 [&[data-screen-profile=small]]:py-2 px-2 rounded-lg break-words font-display tracking-wide">
                    {question.answer}
                </p>
            </div>
            
            <div className="flex-shrink-0 h-[120px] [&[data-screen-profile=small]]:h-[80px] flex items-center justify-center">
                {question.type === 'AUDIO' && question.audioUrl && 
                    <CustomAudioPlayer src={question.audioUrl} startTime={question.audioStartTime} endTime={question.audioEndTime} />
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


// ===== ROUND SUMMARY =====
const RoundSummaryDisplay: React.FC<{ round: Round; teams: Team[]; onConfirmPrizes: (selections: Record<string, Prize>) => void; onBack: () => void; }> = ({ round, teams, onConfirmPrizes, onBack }) => {
    const rankedTeams = [...teams].sort((a, b) => (b.scores[round.id] || 0) - (a.scores[round.id] || 0));
    const [selections, setSelections] = useState<Record<string, string>>({}); // teamId -> prizeId

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
        const prizeMap = round.prizePool.reduce((acc, prize) => {
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
    const availablePrizesToDisplay = round.prizePool.filter(p => p.id && !selectedPrizeIds.has(p.id));

    return (
        <div className="bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 [&[data-screen-profile=small]]:p-2 rounded-xl shadow-2xl border-2 border-brand-gold/80 w-full max-w-7xl animate-fade-in text-center">
            <h2 className="font-display text-3xl sm:text-4xl [&[data-screen-profile=small]]:text-2xl font-bold text-brand-gold tracking-widest uppercase">Fin de la manche {round.name}</h2>

            {availablePrizesToDisplay.length > 0 && (
                <div className="mt-6 border-t-2 border-brand-gold/20 pt-4">
                    <h3 className="text-2xl [&[data-screen-profile=small]]:text-xl font-bold text-brand-gold/80 font-display tracking-widest mb-4">INGRÉDIENTS RESTANTS</h3>
                    <div className="flex justify-center flex-wrap gap-4">
                        {availablePrizesToDisplay.map((prize) => (
                            <div key={prize.id} className="flex flex-col items-center p-2 bg-brand-dark/50 rounded-lg animate-fade-in transition-all duration-300">
                                <img src={prize.imageUrl} alt={prize.name} className="h-32 w-32 [&[data-screen-profile=small]]:h-24 [&[data-screen-profile=small]]:w-24 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }}/>
                                <span className="mt-1 text-lg [&[data-screen-profile=small]]:text-base font-semibold text-brand-light/80 w-32 [&[data-screen-profile=small]]:w-24 text-center break-words">{prize.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <p className="text-lg sm:text-xl [&[data-screen-profile=small]]:text-base mt-6 text-brand-light/80">Attribuez un ingrédient à chaque équipe en fonction de leur classement.</p>
            <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {rankedTeams.map((team, index) => {
                    const availablePrizesForDropdown = round.prizePool.filter(p => !selectedPrizeIds.has(p.id!) || selections[team.id] === p.id);
                    const selectedPrize = round.prizePool.find(p => p.id === selections[team.id]);

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
                                    <option value="">-- Choisir --</option>
                                    {availablePrizesForDropdown.map(prize => (
                                        <option key={prize.id} value={prize.id!}>{prize.name}</option>
                                    ))}
                                </select>
                                {selectedPrize && (
                                    <img src={selectedPrize.imageUrl} alt={selectedPrize.name} title={selectedPrize.name} className="h-16 w-16 [&[data-screen-profile=small]]:h-12 [&[data-screen-profile=small]]:w-12 object-contain" style={{ maskImage: 'radial-gradient(circle, white 50%, transparent 75%)' }}/>
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
                    Retour
                </button>
                <button 
                    onClick={handleConfirm} 
                    disabled={!allTeamsSelected}
                    className="font-display w-full sm:w-auto px-8 py-3 [&[data-screen-profile=small]]:px-4 [&[data-screen-profile=small]]:py-2 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Confirmer & Prochaine Manche
                </button>
            </div>
        </div>
    )
}

// ===== CELEBRATION ANIMATION =====
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


// ===== FINAL SUMMARY DISPLAY =====
const FinalSummaryDisplay: React.FC<{ teams: Team[] }> = ({ teams }) => {
    const getTeamTotalScore = (team: Team) => Object.values(team.scores).reduce((a, b) => a + b, 0);

    const rankedTeams = [...teams].sort((a, b) => getTeamTotalScore(b) - getTeamTotalScore(a));
    
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
        </div>
    </div>
    )
}

// ===== TIE BREAKER DISPLAY =====
const TieBreakerDisplay: React.FC<{ teams: Team[], message: string, onResolve: (winnerId: string) => void }> = ({ teams, message, onResolve }) => {
    return (
        <div className="bg-brand-dark/80 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl border-2 border-brand-gold/80 w-full max-w-4xl animate-fade-in text-center">
            <h2 className="font-display text-3xl sm:text-4xl [&[data-screen-profile=small]]:text-2xl font-bold text-brand-gold tracking-widest uppercase">Égalité !</h2>
            <p className="text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg mt-4 text-brand-light/90">{message}</p>
            <p className="text-lg sm:text-xl [&[data-screen-profile=small]]:text-base mt-2 text-brand-light/70">Organisez un défi rapide pour les départager, puis sélectionnez le vainqueur.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
                {teams.map(team => (
                    <button
                        key={team.id}
                        onClick={() => onResolve(team.id)}
                        className="font-display px-6 py-3 [&[data-screen-profile=small]]:px-4 [&[data-screen-profile=small]]:py-2 bg-brand-burgundy text-brand-light hover:bg-brand-burgundy-dark rounded-lg font-bold text-lg sm:text-xl [&[data-screen-profile=small]]:text-base tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        {team.name}
                    </button>
                ))}
            </div>
        </div>
    );
};


// ===== CURRENT ROUND HEADER =====
const RoundHeader: React.FC<{ round: Round }> = ({ round }) => (
  <div className="w-full max-w-7xl bg-brand-dark/80 backdrop-blur-md p-4 [&[data-screen-profile=small]]:p-2 rounded-t-xl border-2 border-b-0 border-brand-gold/50 text-center animate-fade-in">
    <h2 className="font-display text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-bold text-brand-light/80 tracking-wider uppercase">
      Manche : <span className="text-brand-gold">{round.name}</span>
    </h2>
    <CurrentRoundPrizes prizes={round.prizePool} prizeCategory={round.prizeCategory} />
    <div className="border-t border-brand-gold/50 mt-4 mx-8"></div>
  </div>
);


// ===== TIE UTILITY FUNCTION =====
const findTie = (
    sortedTeams: Team[],
    scoreGetter: (team: Team) => number
): { teams: Team[]; rank: number } | null => {
    if (sortedTeams.length < 2) return null;

    let rank = 1;
    for (let i = 0; i < sortedTeams.length; i++) {
        // Update rank based on score change
        if (i > 0 && scoreGetter(sortedTeams[i]) < scoreGetter(sortedTeams[i - 1])) {
            rank = i + 1;
        }

        const currentScore = scoreGetter(sortedTeams[i]);
        const tieGroup = [sortedTeams[i]];
        
        // Check for subsequent teams with the same score
        let j = i + 1;
        while (j < sortedTeams.length && scoreGetter(sortedTeams[j]) === currentScore) {
            tieGroup.push(sortedTeams[j]);
            j++;
        }

        if (tieGroup.length > 1) {
            return { teams: tieGroup, rank };
        }
        
        // Skip ahead past the group we just checked
        i = j - 1;
    }

    return null;
};


// ===== MAIN GAME SCREEN COMPONENT =====
const GameScreen: React.FC<GameScreenProps> = ({ initialTeams, initialRounds, settings }) => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [rounds, setRounds] = useState<Round[]>(initialRounds);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [view, setView] = useState<'QUESTION' | 'ANSWER' | 'ROUND_SUMMARY'>('QUESTION');
  const [answerHistory, setAnswerHistory] = useState<{ teamId: string; roundId: string; points: number }[]>([]);
  const [lastCorrectTeamId, setLastCorrectTeamId] = useState<string | null>(null);

  const currentRound = rounds[currentRoundIndex];
  const currentQuestion = currentRound?.questions[currentQuestionIndex];
  const isGameOver = currentRoundIndex >= rounds.length;

  const handleCorrectAnswer = (teamId: string, points: number) => {
    setTeams(prevTeams => prevTeams.map(team => 
        team.id === teamId 
            ? { ...team, scores: { ...team.scores, [currentRound.id]: (team.scores[currentRound.id] || 0) + points } }
            : team
    ));
    setAnswerHistory(prev => [...prev, { teamId, roundId: currentRound.id, points }]);
    setLastCorrectTeamId(teamId);
    setView('ANSWER');
  };

  const proceedToNextQuestion = () => {
    setLastCorrectTeamId(null);
    const isLastQuestionInRound = currentQuestionIndex === currentRound.questions.length - 1;
    if (isLastQuestionInRound) {
        setView('ROUND_SUMMARY');
    } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setView('QUESTION');
    }
  }
  
  const handleUndo = () => {
      if (answerHistory.length === 0) return;

      const lastAnswer = answerHistory[answerHistory.length - 1];
      
      setTeams(prevTeams => prevTeams.map(team => 
        team.id === lastAnswer.teamId
            ? { ...team, scores: { ...team.scores, [lastAnswer.roundId]: (team.scores[lastAnswer.roundId] || lastAnswer.points) - lastAnswer.points } }
            : team
      ));

      setAnswerHistory(prev => prev.slice(0, -1));
      setLastCorrectTeamId(null);
      
      if (view === 'QUESTION') {
          // No change, allows re-assigning points
      } else if (view === 'ANSWER' || view === 'ROUND_SUMMARY') {
          setView('QUESTION');
      }
  };

  const handleBackToAnswer = () => {
      setView('ANSWER');
  }

  const handleConfirmPrizes = (selections: Record<string, Prize>) => {
    const updatedTeams = teams.map(team => {
        const prizeToAward = selections[team.id];
        return prizeToAward ? { ...team, collectedPrizes: [...team.collectedPrizes, prizeToAward] } : team;
    });

    setTeams(updatedTeams);
    setRounds(prevRounds => prevRounds.map((r, i) => i === currentRoundIndex ? {...r, isCompleted: true} : r));
    
    setCurrentRoundIndex(prev => prev + 1);
    setCurrentQuestionIndex(0);
    setView('QUESTION');
  }

  // --- TIE BREAKER LOGIC ---
  const getRoundScore = (team: Team) => currentRound ? (team.scores[currentRound.id] || 0) : 0;
  const getTotalScore = (team: Team) => Object.values(team.scores).reduce((a, b) => a + b, 0);

  const resolveTie = (winnerId: string, context: 'round' | 'final') => {
      setTeams(currentTeams => 
          currentTeams.map(t => {
              if (t.id === winnerId) {
                  const newScores = { ...t.scores };
                  const scoreToUpdate = context === 'round' ? currentRound.id : rounds[rounds.length - 1].id;
                  newScores[scoreToUpdate] = (newScores[scoreToUpdate] || 0) + 0.1; // Add small delta to break tie
                  return { ...t, scores: newScores };
              }
              return t;
          })
      );
  };
  
  const renderContent = () => {
    if (isGameOver) {
      const sortedByTotal = [...teams].sort((a, b) => getTotalScore(b) - getTotalScore(a));
      const finalTie = findTie(sortedByTotal, getTotalScore);
      if (shouldCheckForTie(finalTie, settings.tieBreakerRule)) {
          return <TieBreakerDisplay teams={finalTie.teams} message={`Égalité pour la ${finalTie.rank}e place !`} onResolve={(winnerId) => resolveTie(winnerId, 'final')} />;
      }
      return <FinalSummaryDisplay teams={teams} />;
    }

    if (!currentRound) return <p>Chargement...</p>;

    if (view === 'ROUND_SUMMARY') {
        const sortedByRound = [...teams].sort((a, b) => getRoundScore(b) - getRoundScore(a));
        const roundTie = findTie(sortedByRound, getRoundScore);
        if (shouldCheckForTie(roundTie, settings.tieBreakerRule)) {
            return <TieBreakerDisplay teams={roundTie.teams} message={`Égalité pour la ${roundTie.rank}e place !`} onResolve={(winnerId) => resolveTie(winnerId, 'round')} />;
        }
        return <RoundSummaryDisplay round={currentRound} teams={teams} onConfirmPrizes={handleConfirmPrizes} onBack={handleBackToAnswer} />;
    }

    // Default question/answer views
    return (
      <>
        <RoundHeader round={currentRound} />
        {view === 'QUESTION' && currentQuestion && (
          <QuestionDisplay
            question={currentQuestion}
            round={currentRound}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={currentRound.questions.length}
            teams={teams}
            onCorrect={handleCorrectAnswer}
          />
        )}
        {view === 'ANSWER' && currentQuestion && (
            <AnswerDisplay 
                question={currentQuestion} 
                onNext={proceedToNextQuestion}
                isLastQuestion={currentQuestionIndex === currentRound.questions.length - 1}
                onUndo={handleUndo}
                canUndo={answerHistory.length > 0}
                correctTeamName={teams.find(t => t.id === lastCorrectTeamId)?.name}
            />
        )}
      </>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-2 sm:p-4 gap-4">
      {!isGameOver && <HorizontalScoreboard teams={teams} />}
      
      <div className="flex-grow flex flex-col items-center justify-center w-full">
         {renderContent()}
      </div>
    </div>
  );
};

export default GameScreen;