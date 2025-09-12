import React, { useState, useEffect } from 'react';
import type { Team, Round, Question, Prize, GameSettings } from './types';
import { TieBreakerRule } from './types';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import WelcomeScreen from './components/WelcomeScreen';
import { LogoIcon, CloseIcon } from './components/IconComponents';
import JSZip from 'jszip';

const processZipFile = async (file: File): Promise<any> => {
    const zip = await JSZip.loadAsync(file);

    const configFileEntry = zip.file(/config\.json$/i)[0];
    if (!configFileEntry) {
        throw new Error('Could not find config.json in the zip file.');
    }
    const configText = await configFileEntry.async('string');
    const config = JSON.parse(configText);

    if (!config.rounds || !Array.isArray(config.rounds)) {
        return config;
    }

    const audioPathPrefixes = ['audio/', 'audios/', ''];

    for (const round of config.rounds) {
        if (round.questions && Array.isArray(round.questions)) {
            for (const question of round.questions) {
                if (question.type === 'AUDIO' && question.audioFileName && !question.audioUrl) {
                    let audioFileEntry: any = null;
                    for (const prefix of audioPathPrefixes) {
                        const path = prefix + question.audioFileName;
                        const entry = zip.file(path);
                        if (entry) {
                            audioFileEntry = entry;
                            break;
                        }
                    }

                    if (audioFileEntry) {
                        const blob = await audioFileEntry.async('blob');
                        question.audioUrl = URL.createObjectURL(blob);
                    } else {
                        console.warn(`Audio file "${question.audioFileName}" not found in zip.`);
                    }
                }
            }
        }
    }
    return config;
};


const App: React.FC = () => {
  const [gameState, setGameState] = useState<'WELCOME' | 'SETUP' | 'GAME'>('WELCOME');
  const [teams, setTeams] = useState<Team[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [settings, setSettings] = useState<GameSettings>({ tieBreakerRule: TieBreakerRule.ALL_TIES, rules: '' });
  
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
    setSettings({ tieBreakerRule: TieBreakerRule.ALL_TIES, rules: '' });
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
        tieBreakerRule: config.tieBreakerRule || TieBreakerRule.ALL_TIES,
        rules: config.rules || ''
    };

    setTeams(finalTeams);
    setRounds(finalRounds);
    setSettings(finalSettings);
    setGameState('GAME');
  };

  const handleLoadGameFromFile = (file: File) => {
    if (file.name.endsWith('.zip')) {
        processZipFile(file)
            .then(config => {
                processAndStartGame(config);
            })
            .catch((err: any) => {
                console.error('Failed to load configuration from ZIP:', err);
                alert(`Error loading configuration file from ZIP: ${err.message}`);
            });
    } else {
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
    }
  };

  const isSetupOrWelcome = gameState === 'SETUP' || gameState === 'WELCOME';

  return (
  <div className="min-h-screen flex flex-col relative">
    {/* Always display the button in the top-right corner */}
    {(gameState === 'GAME' || gameState === 'SETUP') && (
      <button
        onClick={resetGame}
        className="absolute top-2 right-2 z-50 p-2 rounded-full text-brand-light/70 hover:bg-brand-burgundy hover:text-white transition-colors duration-300 border-none"
        aria-label="Réinitialiser le jeu"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    )}

    <div className={`flex-grow flex flex-col ${isSetupOrWelcome ? 'p-4 sm:p-6 lg:p-8' : 'h-screen'}`}>
      <header className={`flex justify-between items-center ${isSetupOrWelcome ? 'mb-4' : 'p-2'}`}></header>
      <main className={`flex-grow animate-fade-in ${gameState === 'GAME' ? 'flex items-center justify-center p-2 sm:p-4 [&[data-screen-profile=small]]:p-1' : ''} ${gameState === 'WELCOME' ? 'flex flex-col items-center justify-center text-center' : ''}`}>
        {gameState === 'WELCOME' && (
          <WelcomeScreen onStart={() => setGameState('SETUP')} onLoadGame={handleLoadGameFromFile} />
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