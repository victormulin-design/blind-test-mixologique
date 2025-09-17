import React from 'react';
import type { Team, GameSettings } from '../../types.ts';
import { LogoIcon } from '../IconComponents.tsx';
import { useTranslations } from '../../hooks/useTranslations.ts';
import BuzzerManager from './BuzzerManager.tsx';
import { useBuzzer } from '../../contexts/BuzzerContext.tsx';

interface WaitingRoomProps {
  teams: Team[];
  onStartGame: () => void;
  settings: GameSettings;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ teams, onStartGame, settings }) => {
  const t = useTranslations();
  const buzzerContext = useBuzzer();

  return (
    <div className="flex flex-col items-center animate-slide-in-up max-w-4xl text-center p-6 bg-brand-dark/50 border-2 border-brand-gold rounded-xl backdrop-blur-sm shadow-[0_0_20px_#D4AF37]">
      <LogoIcon className="h-24 w-24 text-brand-gold" />
      <h2 className="mt-6 font-display text-4xl sm:text-5xl font-bold tracking-wider uppercase text-brand-light">
        {t.waitingRoomTitle}
      </h2>
      <p className="mt-4 max-w-2xl font-body text-lg sm:text-xl text-brand-light/80">
        {t.waitingRoomSubtitle}
      </p>

      {settings.enableBuzzer ? (
        <BuzzerManager />
      ) : (
        <div className="my-8 w-full max-w-lg">
            <h3 className="font-display text-2xl text-brand-gold tracking-widest uppercase mb-4">{t.teamsReady}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {teams.map(team => (
                    <div key={team.id} className="bg-brand-dark/30 p-3 rounded-md border border-brand-gold/30">
                        <p className="text-xl font-semibold text-brand-light truncate">{team.name}</p>
                    </div>
                ))}
            </div>
        </div>
      )}

      <button
        onClick={onStartGame}
        disabled={settings.enableBuzzer && (buzzerContext?.connectedTeams.length || 0) < 2}
        className="font-display px-8 py-4 bg-brand-gold text-brand-dark hover:bg-brand-light rounded-lg font-bold text-xl sm:text-xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 shadow-lg animate-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none"
      >
        {t.startGameButton}
      </button>
    </div>
  );
};

export default WaitingRoom;