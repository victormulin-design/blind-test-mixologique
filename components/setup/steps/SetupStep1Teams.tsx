import React from 'react';
import type { Team, Round, Prize } from '../../../types.ts';
import SetupStepWrapper from '../SetupStepWrapper.tsx';
import { useTranslations } from '../../../hooks/useTranslations.ts';

interface SetupStep1TeamsProps {
  numTeams: number;
  setNumTeams: (count: number) => void;
  teams: Partial<Team>[];
  setTeams: React.Dispatch<React.SetStateAction<Partial<Team>[]>>;
  setRounds: React.Dispatch<React.SetStateAction<Partial<Round>[]>>;
}

const SetupStep1Teams: React.FC<SetupStep1TeamsProps> = ({ numTeams, setNumTeams, teams, setTeams, setRounds }) => {
  const t = useTranslations();
  
  const handleNumTeamsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(2, parseInt(e.target.value, 10) || 2);
    setNumTeams(count);
    
    setTeams(currentTeams => {
        const newTeams = Array.from({ length: count });
        for (let i = 0; i < count; i++) {
            newTeams[i] = currentTeams[i] || { name: '' };
        }
        return newTeams;
    });

    setRounds(currentRounds => currentRounds.map(r => {
        const currentPrizes = r.prizePool || [];
        const newPrizes: Prize[] = Array.from(
            { length: count },
            (_, i) => currentPrizes[i] || { name: '', imageUrl: '' }
        );
        return { ...r, prizePool: newPrizes };
    }));
  };

  const handleTeamNameChange = (index: number, name: string) => {
    const newTeams = [...teams];
    newTeams[index] = { ...newTeams[index], name };
    setTeams(newTeams);
  };
  
  return (
    <SetupStepWrapper title={t.step1}>
      <div className="mb-6">
        <label htmlFor="numTeams" className="block text-lg sm:text-xl font-medium text-brand-light/80">{t.teamCount}</label>
        <input
          type="number"
          id="numTeams"
          value={numTeams}
          min="2"
          onChange={handleNumTeamsChange}
          className="mt-1 block w-24 bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teams.map((team, index) => (
          <div key={index}>
            <label htmlFor={`teamName-${index}`} className="block text-base font-medium text-brand-light/80">{t.teamName(index + 1)}</label>
            <input
              type="text"
              id={`teamName-${index}`}
              value={team.name || ''}
              onChange={e => handleTeamNameChange(index, e.target.value)}
              className="mt-1 block w-full bg-brand-dark/50 border border-brand-gold/70 rounded-md p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition text-base"
            />
          </div>
        ))}
      </div>
    </SetupStepWrapper>
  );
};

export default SetupStep1Teams;