import React, { useState, useMemo } from 'react';
import type { Team, Round, Question, Prize, GameSettings } from '../types';
import { TieBreakerRule } from '../types';

import HorizontalScoreboard from './game/HorizontalScoreboard';
import RoundHeader from './game/RoundHeader';
import QuestionDisplay from './game/QuestionDisplay';
import AnswerDisplay from './game/AnswerDisplay';
import RoundSummaryDisplay from './game/RoundSummaryDisplay';
import FinalSummaryDisplay from './game/FinalSummaryDisplay';
import TieBreakerDisplay from './game/TieBreakerDisplay';
import RulesDisplay from './game/RulesDisplay';


interface GameScreenProps {
  initialTeams: Team[];
  initialRounds: Round[];
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


// ===== MAIN GAME SCREEN COMPONENT =====
const GameScreen: React.FC<GameScreenProps> = ({ initialTeams, initialRounds, settings }) => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [rounds, setRounds] = useState<Round[]>(initialRounds);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [view, setView] = useState<'QUESTION' | 'ANSWER' | 'ROUND_SUMMARY'>('QUESTION');
  const [answerHistory, setAnswerHistory] = useState<Award[][]>([]);
  const [lastCorrectAwards, setLastCorrectAwards] = useState<AwardInfo[] | null>(null);
  const [rulesShown, setRulesShown] = useState(!settings.rules);

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
    
    setTeams(prevTeams => {
      const newTeams = JSON.parse(JSON.stringify(prevTeams));
      fullAwards.forEach(award => {
        const teamIndex = newTeams.findIndex((t: Team) => t.id === award.teamId);
        if (teamIndex > -1) {
          const teamToUpdate = newTeams[teamIndex];
          teamToUpdate.scores[currentRound.id] = (teamToUpdate.scores[currentRound.id] || 0) + award.points;
        }
      });
      return newTeams;
    });

    setAnswerHistory(prev => [...prev, fullAwards]);
    setLastCorrectAwards(awards);
    setView('ANSWER');
  };


  const proceedToNextQuestion = () => {
    setLastCorrectAwards(null);
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

      const lastTurnAwards = answerHistory[answerHistory.length - 1];
      
      setTeams(prevTeams => {
        const newTeams = JSON.parse(JSON.stringify(prevTeams));
        lastTurnAwards.forEach(award => {
            const teamIndex = newTeams.findIndex((t: Team) => t.id === award.teamId);
            if (teamIndex > -1) {
                const teamToUpdate = newTeams[teamIndex];
                teamToUpdate.scores[award.roundId] = (teamToUpdate.scores[award.roundId] || award.points) - award.points;
            }
        });
        return newTeams;
      });

      setAnswerHistory(prev => prev.slice(0, -1));
      setLastCorrectAwards(null);
      
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
    if (!rulesShown && settings.rules) {
      return <RulesDisplay rules={settings.rules} onAcknowledge={() => setRulesShown(true)} />;
    }
    
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
            onAwards={handleAwards}
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
      </>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-2 sm:p-4 gap-4">
      {!isGameOver && currentRound && <HorizontalScoreboard teams={teams} currentRound={currentRound} />}
      
      <div className="flex-grow flex flex-col items-center justify-center w-full">
         {renderContent()}
      </div>
    </div>
  );
};

export default GameScreen;
