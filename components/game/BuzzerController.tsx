import React from 'react';
import type { Question } from '../../types';
import { useBuzzer } from '../../contexts/BuzzerContext';
import { useTranslations } from '../../hooks/useTranslations';

interface BuzzerControllerProps {
  question: Question;
  onCorrect: (teamId: string) => void;
}

const BuzzerController: React.FC<BuzzerControllerProps> = ({ question, onCorrect }) => {
  const buzzerContext = useBuzzer();
  const t = useTranslations();

  if (!buzzerContext) {
    return <div>Error: Buzzer not available.</div>;
  }

  const { buzzerState, connectedTeams, handleIncorrect } = buzzerContext;
  const { status, buzzedTeamId, lockedOutTeamIds } = buzzerState;

  const buzzedTeam = buzzedTeamId ? connectedTeams.find(t => t.teamId === buzzedTeamId) : null;
  const buzzedTeamName = buzzedTeam?.teamName || 'Unknown Team';
  
  const handleCorrect = () => {
    if (buzzedTeamId) {
        onCorrect(buzzedTeamId);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
        case 'OPEN': return t.buzzerStatusWaiting;
        case 'BUZZED': return t.buzzerStatusBuzzed(buzzedTeamName);
        case 'LOCKED': return t.buzzerStatusAllLocked;
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="h-24 flex items-center justify-center bg-brand-dark/50 p-4 rounded-lg border border-brand-gold/30">
            <h3 className="font-display text-2xl sm:text-3xl text-brand-light tracking-wider animate-fade-in" key={status}>
               {getStatusMessage()}
            </h3>
        </div>
        
        {status === 'BUZZED' && (
            <div className="flex justify-center gap-4 animate-fade-in">
                <button onClick={handleCorrect} className="flex-1 font-display px-6 py-3 bg-green-700 hover:bg-green-600 rounded-lg font-bold text-lg tracking-widest uppercase transition-transform transform hover:scale-105">
                    {t.buzzerHostCorrect}
                </button>
                <button onClick={handleIncorrect} className="flex-1 font-display px-6 py-3 bg-red-700 hover:bg-red-600 rounded-lg font-bold text-lg tracking-widest uppercase transition-transform transform hover:scale-105">
                    {t.buzzerHostIncorrect}
                </button>
            </div>
        )}

        {lockedOutTeamIds.length > 0 && (
            <div className="pt-4 border-t border-brand-gold/20">
                <h4 className="font-semibold text-brand-light/70 mb-2">{t.buzzerLockedOut}</h4>
                <div className="flex flex-wrap justify-center gap-2">
                    {lockedOutTeamIds.map(teamId => {
                        const team = connectedTeams.find(t => t.teamId === teamId);
                        return (
                            <span key={teamId} className="px-3 py-1 bg-brand-dark/80 text-brand-light/50 rounded-full text-sm line-through">
                                {team?.teamName || '...'}
                            </span>
                        );
                    })}
                </div>
            </div>
        )}
    </div>
  );
};

export default BuzzerController;
