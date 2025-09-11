import React from 'react';
import type { Team, Round } from '../../types';

interface HorizontalScoreboardProps {
  teams: Team[];
  currentRound: Round;
}

const HorizontalScoreboard: React.FC<HorizontalScoreboardProps> = ({ teams, currentRound }) => (
  <div className="w-full bg-brand-dark/60 backdrop-blur-md p-2 [&[data-screen-profile=small]]:p-1 rounded-xl border-2 border-brand-gold/50">
    <div className="flex flex-wrap justify-center gap-3 [&[data-screen-profile=small]]:gap-2 items-stretch">
      {teams.map((team) => {
        const totalScore = Math.round(Object.values(team.scores).reduce((a, b) => a + b, 0));
        const roundScore = currentRound ? Math.round(team.scores[currentRound.id] || 0) : 0;
        
        return (
          <div key={team.id} className="flex flex-row items-start gap-4 flex-1 min-w-[250px] [&[data-screen-profile=small]]:min-w-[200px] max-w-md bg-brand-dark/80 p-3 [&[data-screen-profile=small]]:p-2 rounded-lg border border-brand-gold/30">
            <div className="flex-shrink-0 text-left">
              <p className="text-lg sm:text-xl [&[data-screen-profile=small]]:text-base font-bold text-brand-light break-words" title={team.name}>{team.name}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl sm:text-2xl [&[data-screen-profile=small]]:text-lg font-bold text-brand-gold">{totalScore}</p>
                {roundScore > 0 && (
                  <p className="text-base sm:text-lg [&[data-screen-profile=small]]:text-sm text-green-400 font-semibold">
                    (+{roundScore})
                  </p>
                )}
              </div>
            </div>
            <div className="flex-grow pt-1 text-right">
              {team.collectedPrizes.length > 0 ? (
                  <div className="space-y-1 text-brand-light/90 text-right">
                      {team.collectedPrizes.map(prize => (
                          <div key={prize.id} className="text-base sm:text-lg [&[data-screen-profile=small]]:text-sm" title={prize.name}>
                              {prize.name}
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-sm text-brand-light/50 italic h-full flex items-center justify-end">Aucun ingrédient</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  </div>
);

export default HorizontalScoreboard;
