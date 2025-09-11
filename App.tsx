import React, { useState, useEffect } from 'react';
import type { Team, Round, Question, Prize, GameSettings } from './types';
import { TieBreakerRule } from './types';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import WelcomeScreen from './components/WelcomeScreen';
import { LogoIcon, CloseIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'WELCOME' | 'SETUP' | 'GAME'>('WELCOME');
  const [teams, setTeams] = useState<Team[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [settings, setSettings] = useState<GameSettings>({ tieBreakerRule: TieBreakerRule.ALL_TIES });
  
  useEffect(() => {
    const height = window.innerHeight;
    let profile = 'large'; // default
    if (height <= 800) {
      profile = 'small';
    }
    document.documentElement.setAttribute('data-screen-profile', profile);
  }, []);


  const handleSetupComplete = (configuredTeams: Team[], configuredRounds: Round[], configuredSettings: GameSettings) => {
    setTeams(configuredTeams);
    setRounds(configuredRounds);
    setSettings(configuredSettings);
    setGameState('GAME');
  };

  const resetGame = () => {
    setGameState('WELCOME');
    setTeams([]);
    setRounds([]);
    setSettings({ tieBreakerRule: TieBreakerRule.ALL_TIES });
  }

  const processAndStartGame = (config: any) => {
     // Basic validation
    if (!config.teams || !Array.isArray(config.teams) || !config.rounds || !Array.isArray(config.rounds) || typeof config.numTeams !== 'number') {
      throw new Error('Invalid configuration file structure.');
    }

    // Process data to create final game state
    const finalTeams: Team[] = config.teams.map((t: Partial<Team>) => ({
      id: crypto.randomUUID(),
      name: t.name!,
      collectedPrizes: [],
      scores: {}
    }));

    const finalRounds: Round[] = config.rounds.map((r: Partial<Round> & {prizesByRank?: Prize[]}) => ({
      id: crypto.randomUUID(),
      name: r.name!,
      questions: r.questions as Question[],
      prizePool: (r.prizePool || r.prizesByRank || []).map((p: Prize) => ({...p, id: p.id || crypto.randomUUID()})),
      isCompleted: false,
      prizeCategory: r.prizeCategory, // FIX: Ensure prizeCategory is carried over
    }));
    
    const finalSettings: GameSettings = {
        tieBreakerRule: config.tieBreakerRule || TieBreakerRule.ALL_TIES
    };

    setTeams(finalTeams);
    setRounds(finalRounds);
    setSettings(finalSettings);
    setGameState('GAME');
  };

  const handleLoadGameFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Could not read file.');
        }
        const config = JSON.parse(text);
        processAndStartGame(config);
      } catch (err: any) {
        console.error('Failed to load configuration:', err);
        alert(`Error loading configuration file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      alert('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleLoadPreset = async (presetName: string) => {
    if (presetName === 'Blind-test-50ans-full') {
      try {
        const response = await fetch(`/Preconfigured_games/${presetName}.json`);
        if (!response.ok) {
          throw new Error(`Le fichier de configuration '${presetName}.json' est introuvable ou n'a pas pu être chargé.`);
        }
        const config = await response.json();
        processAndStartGame(config);
      } catch (err: any) {
        console.error('Failed to load preset configuration from file:', err);
        alert(`Erreur lors du chargement du jeu préconfiguré: ${err.message}`);
      }
    } else {
      alert(`Preset non reconnu: ${presetName}`);
    }
  };

  const isSetupOrWelcome = gameState === 'SETUP' || gameState === 'WELCOME';

  return (
    <div className={`min-h-screen flex flex-col ${isSetupOrWelcome ? 'p-4 sm:p-6 lg:p-8' : ''}`}>
      <div className={`${isSetupOrWelcome ? 'max-w-7xl mx-auto w-full flex-grow flex flex-col' : 'h-screen flex flex-col'}`}>
        <header className={`flex justify-between items-center ${isSetupOrWelcome ? 'mb-4' : 'p-2 bg-brand-dark/80 backdrop-blur-sm border-b border-brand-gold/50'}`}>
          <div className="flex items-center space-x-3">
            <LogoIcon className="h-7 w-7 text-brand-gold" />
            <h1 className="font-display text-lg sm:text-2xl font-bold tracking-widest text-brand-gold uppercase">
              Soirée Blind Test
            </h1>
          </div>
          {(gameState === 'GAME' || gameState === 'SETUP') && (
             <button
                onClick={resetGame}
                className="p-2 rounded-full text-brand-light/70 hover:bg-brand-burgundy hover:text-white transition-colors duration-300"
                aria-label="Réinitialiser le jeu"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
          )}
        </header>
        <main className={`flex-grow animate-fade-in ${gameState === 'GAME' ? 'flex items-center justify-center p-2 sm:p-4 [&[data-screen-profile=small]]:p-1' : ''} ${gameState === 'WELCOME' ? 'flex flex-col items-center justify-center text-center' : ''}`}>
          {gameState === 'WELCOME' && (
            <WelcomeScreen onStart={() => setGameState('SETUP')} onLoadGame={handleLoadGameFromFile} onLoadPreset={handleLoadPreset} />
          )}
          {gameState === 'SETUP' && (
            <SetupScreen onSetupComplete={handleSetupComplete} />
          )}
          {gameState === 'GAME' && (
            <GameScreen initialTeams={teams} initialRounds={rounds} settings={settings} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;