import React from 'react';
import type { Team, Round } from '../../types.ts';
import { useTranslations } from '../../hooks/useTranslations.ts';

interface HorizontalScoreboardProps {
  teams: Team[];
  currentRound: Round;
}

const HorizontalScoreboard: React.FC<HorizontalScoreboardProps> = ({ teams, currentRound }) => {
  const t = useTranslations();
  return (
    <div className="w-full">
      <div className="flex flex-nowrap justify-center gap-3 [&[data-screen-profile=small]]:gap-2 items-stretch overflow-x-auto custom-scrollbar pb-2">
        {teams.map((team) => {
          const totalScore = Math.round(Object.values(team.scores).reduce((a, b) => a + b, 0));
          const roundScore = currentRound ? Math.round(team.scores[currentRound.id] || 0) : 0;
          
          return (
            <div key={team.id} className="flex flex-col flex-1 min-w-[200px] [&[data-screen-profile=small]]:min-w-[160px] max-w-[280px] bg-brand-dark/80 p-2 [&[data-screen-profile=small]]:p-1.5 rounded-lg border border-brand-gold/30 flex-shrink-0 shadow-[0_0_8px_rgba(212,175,55,0.15)] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-shadow duration-300">
              <div className="flex justify-between items-baseline gap-2">
                  <p className="text-base sm:text-lg [&[data-screen-profile=small]]:text-sm font-bold text-brand-light truncate" title={team.name}>
                      {team.name}
                  </p>
                  <div className="flex items-baseline gap-1 flex-shrink-0">
                      <p className="text-lg sm:text-xl [&[data-screen-profile=small]]:text-base font-bold text-brand-gold">
                          {totalScore}
                      </p>
                      {roundScore > 0 && (
                          <p className="text-sm sm:text-base [&[data-screen-profile=small]]:text-xs text-green-400 font-bold">
                              (+{roundScore})
                          </p>
                      )}
                  </div>
              </div>
              
              <div className="border-t border-brand-gold/20 my-1.5 [&[data-screen-profile=small]]:my-1"></div>

              <div className="flex-grow grid grid-cols-2 gap-x-2">
                {team.collectedPrizes.length > 0 ? (
                    team.collectedPrizes.map(prize => (
                        <div key={prize.id} className="text-sm sm:text-base [&[data-screen-profile=small]]:text-xs text-brand-light/80 truncate" title={prize.name}>
                            {prize.name}
                        </div>
                    ))
                ) : (
                    <p className="col-span-2 text-xs text-brand-light/50 italic">{t.noPrizesCollected}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
};

export default HorizontalScoreboard;