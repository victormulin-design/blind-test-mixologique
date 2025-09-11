import React from 'react';
import type { Team } from '../../types';

interface TieBreakerDisplayProps {
  teams: Team[];
  message: string;
  onResolve: (winnerId: string) => void;
}

const TieBreakerDisplay: React.FC<TieBreakerDisplayProps> = ({ teams, message, onResolve }) => {
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

export default TieBreakerDisplay;
