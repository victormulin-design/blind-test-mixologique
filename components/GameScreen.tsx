import React, { useState, useMemo } from 'react';
import type { Team, Round, Question, Prize, GameSettings } from '../types.ts';
import { TieBreakerRule, PrizeMode } from '../types.ts';
import { produce } from 'immer';

import HorizontalScoreboard from './game/HorizontalScoreboard.tsx';
import RoundHeader from './game/RoundHeader.tsx';
import QuestionDisplay from './game/QuestionDisplay.tsx';
import AnswerDisplay from './game/AnswerDisplay.tsx';
import RoundSummaryDisplay from './game/RoundSummaryDisplay.tsx';
import FinalSummaryDisplay from './game/FinalSummaryDisplay.tsx';
import TieBreakerDisplay from './game/TieBreakerDisplay.tsx';
import RulesDisplay from './game/RulesDisplay.tsx';
import PrizeSelectionDisplay from './game/PrizeSelectionDisplay.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';


interface GameScreenProps {
  initialTeams: Team[];
  initialRounds: Round[];
  initialPrizeBank: Prize[];
  settings: GameSettings;
}

// ===== TYPES for state =====
type Award = { teamId: string; roundId: string; points: number; part: string };
export type AwardInfo = Omit<Award, 'roundId'>;


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

// Layout Wrappers
const CenteredView: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="flex-grow w-full flex flex-col justify-center items-center">
        {children}
    </div>
);


// ===== MAIN GAME SCREEN COMPONENT =====
const GameScreen: React.FC<GameScreenProps> = ({ initialTeams, initialRounds, initialPrizeBank, settings }) => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [rounds, setRounds] = useState<Round[]>(initialRounds);
  const [prizeBank, setPrizeBank] = useState<Prize[]>(initialPrizeBank);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [view, setView] = useState<'QUESTION' | 'ANSWER' | 'ROUND_SUMMARY' | 'PRIZE_SELECTION'>('QUESTION');
  const [answerHistory, setAnswerHistory] = useState<Award[][]>([]);
  const [lastCorrectAwards, setLastCorrectAwards] = useState<AwardInfo[] | null>(null);
  const [rulesShown, setRulesShown] = useState(!!settings.rules);
  const t = useTranslations();

  const currentRound = rounds[currentRoundIndex];
  const isGameOver = currentRoundIndex >= rounds.length;

  const currentQuestion = currentRound?.questions?.[currentQuestionIndex];

  const handleAwards = (awards: AwardInfo[]) => {
    if (awards.length === 0) {
      // Allow revealing answer without points
      setLastCorrectAwards([]);
      setView('ANSWER');
      return;
    }

    const fullAwards: Award[] = awards.map(a => ({ ...a, roundId: currentRound.id }));
    
    setTeams(
      produce(draft => {
        fullAwards.forEach(award => {
          const team = draft.find(t => t.id === award.teamId);
          if (team) {
            team.scores[currentRound.id] = (team.scores[currentRound.id] || 0) + award.points;
          }
        });
      })
    );

    setAnswerHistory(prev => [...prev, fullAwards]);
    setLastCorrectAwards(awards);
    setView('ANSWER');
  };


  const proceedToNextQuestion = () => {
    setLastCorrectAwards(null);
    const isLastQuestionInRound = currentQuestionIndex === currentRound.questions.length - 1;
    if (isLastQuestionInRound) {
        if (settings.prizeMode === PrizeMode.BANK) {
          setView('PRIZE_SELECTION');
        } else {
          setView('ROUND_SUMMARY');
        }
    } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setView('QUESTION');
    }
  }
  
  const handleUndo = () => {
      if (answerHistory.length === 0) return;

      const lastTurnAwards = answerHistory[answerHistory.length - 1];
      
      setTeams(
        produce(draft => {
          lastTurnAwards.forEach(award => {
            const team = draft.find(t => t.id === award.teamId);
            if (team) {
              team.scores[award.roundId] = (team.scores[award.roundId] || award.points) - award.points;
            }
          });
        })
      );

      setAnswerHistory(prev => prev.slice(0, -1));
      setLastCorrectAwards(null);
      
      if (view === 'QUESTION') {
          // No change, allows re-assigning points
      } else {
          setView('QUESTION');
      }
  };

  const handleBackToAnswer = () => {
      setView('ANSWER');
  }

  const proceedToNextRound = () => {
    setRounds(produce(draft => {
        draft[currentRoundIndex].isCompleted = true;
    }));
    setCurrentRoundIndex(prev => prev + 1);
    setCurrentQuestionIndex(0);
    setView('QUESTION');
  }

  const handleConfirmPrizes = (selections: Record<string, Prize>) => {
    setTeams(
      produce(draft => {
        draft.forEach(team => {
          const prizeToAward = selections[team.id];
          if (prizeToAward) {
            team.collectedPrizes.push(prizeToAward);
          }
        });
      })
    );

    if (settings.prizeMode === PrizeMode.BANK) {
      const selectedPrizeIds = new Set(Object.values(selections).map(p => p.id));
      setPrizeBank(prevBank => prevBank.filter(p => !selectedPrizeIds.has(p.id)));
    }
    
    proceedToNextRound();
  }

  // --- TIE BREAKER LOGIC ---
  const getRoundScore = (team: Team) => currentRound ? (team.scores[currentRound.id] || 0) : 0;
  const getTotalScore = (team: Team) => Object.values(team.scores).reduce((a, b) => a + b, 0);

  const resolveTie = (winnerId: string, context: 'round' | 'final') => {
    // Add a small, non-integer delta to the winner's score.
    // This breaks the tie for sorting purposes without affecting the displayed rounded score.
      setTeams(produce(draft => {
        const winner = draft.find(t => t.id === winnerId);
        if (winner) {
            const scoreToUpdate = context === 'round' ? currentRound.id : rounds[rounds.length - 1].id;
            winner.scores[scoreToUpdate] = (winner.scores[scoreToUpdate] || 0) + 0.1;
        }
      }));
  };
  
  const renderContent = () => {
    if (rulesShown && settings.rules) {
      return <CenteredView><RulesDisplay rules={settings.rules} onAcknowledge={() => setRulesShown(false)} /></CenteredView>;
    }
    
    if (isGameOver) {
      const allScoresAreZero = teams.every(team => getTotalScore(team) === 0);
      const sortedByTotal = useMemo(() => 
        [...teams].sort((a, b) => getTotalScore(b) - getTotalScore(a)),
      [teams]);

      const finalTie = allScoresAreZero ? null : findTie(sortedByTotal, getTotalScore);
      
      if (shouldCheckForTie(finalTie, settings.tieBreakerRule)) {
          return <CenteredView><TieBreakerDisplay teams={finalTie.teams} message={t.tieBreakerFinalTieFor(finalTie.rank)} onResolve={(winnerId) => resolveTie(winnerId, 'final')} /></CenteredView>;
      }
      return <CenteredView><FinalSummaryDisplay teams={teams} /></CenteredView>;
    }

    if (!currentRound) return <p>{t.loading}</p>;

    const allRoundScoresAreZero = teams.every(t => getRoundScore(t) === 0);
    const sortedByRound = useMemo(() =>
        [...teams].sort((a, b) => getRoundScore(b) - getRoundScore(a)),
    [teams, currentRound.id]);

    const roundTie = allRoundScoresAreZero ? null : findTie(sortedByRound, getRoundScore);

    if (shouldCheckForTie(roundTie, settings.tieBreakerRule)) {
        return <CenteredView><TieBreakerDisplay teams={roundTie.teams} message={t.tieBreakerTieFor(roundTie.rank)} onResolve={(winnerId) => resolveTie(winnerId, 'round')} /></CenteredView>;
    }

    if (view === 'ROUND_SUMMARY') {
        return <CenteredView><RoundSummaryDisplay round={currentRound} teams={teams} onConfirmPrizes={handleConfirmPrizes} onBack={handleBackToAnswer} /></CenteredView>;
    }

    if (view === 'PRIZE_SELECTION') {
      return <CenteredView><PrizeSelectionDisplay round={currentRound} teams={teams} prizeBank={prizeBank} onConfirmPrizes={handleConfirmPrizes} onBack={handleBackToAnswer} /></CenteredView>
    }


    // Default question/answer views
    return (
      <CenteredView>
        <div className="w-full flex flex-col items-center">
            <RoundHeader round={currentRound} prizeMode={settings.prizeMode} />
            {view === 'QUESTION' && currentQuestion && (
              <QuestionDisplay
                question={currentQuestion}
                round={currentRound}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={currentRound.questions.length}
                teams={teams}
                onAwards={handleAwards}
                enableBuzzer={!!settings.enableBuzzer}
              />
            )}
            {view === 'ANSWER' && currentQuestion && (
                <AnswerDisplay 
                    question={currentQuestion} 
                    onNext={proceedToNextQuestion}
                    isLastQuestion={currentQuestionIndex === currentRound.questions.length - 1}
                    onUndo={handleUndo}
                    canUndo={answerHistory.length > 0}
                    correctAwards={
                        lastCorrectAwards?.map(award => ({
                          part: award.part,
                          teamName: teams.find(t => t.id === award.teamId)?.name || '?'
                        })) || []
                    }
                />
            )}
        </div>
      </CenteredView>
    );
  };

  return (
    <div className="w-full flex-grow flex flex-col p-2 sm:p-4 gap-4">
      {!isGameOver && currentRound && <HorizontalScoreboard teams={teams} currentRound={currentRound} />}
      {renderContent()}
    </div>
  );
};

export default GameScreen;